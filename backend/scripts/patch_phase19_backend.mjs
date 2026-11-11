import fs from 'fs';

// 1. Update appointmentRoutes.js
let routes = fs.readFileSync('backend/appointment-service/src/routes/appointmentRoutes.js', 'utf8');
if (!routes.includes('getReviewQueue')) {
  routes = routes.replace(
    "router.get('/stats', authenticate, appointmentController.getStats);",
    "router.get('/stats', authenticate, appointmentController.getStats);\r\nrouter.get('/review-queue', authenticate, appointmentController.getReviewQueue);\r\nrouter.post('/:appointmentId/review', authenticate, appointmentController.submitReviewDecision);"
  );
  fs.writeFileSync('backend/appointment-service/src/routes/appointmentRoutes.js', routes, 'utf8');
  console.log('✓ Updated appointmentRoutes.js');
}

// 2. Update appointmentController.js
let ctrl = fs.readFileSync('backend/appointment-service/src/controllers/appointmentController.js', 'utf8');
if (!ctrl.includes('getReviewQueue')) {
  const insertIndex = ctrl.lastIndexOf('};');
  const methods = `  async getReviewQueue(req, res, next) {
    try {
      const data = await appointmentService.getReviewQueue(req.user, req.query);
      return successResponse(res, 200, 'Review queue retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  async submitReviewDecision(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const data = await appointmentService.submitReviewDecision(req.user, appointmentId, req.body);
      return successResponse(res, 200, 'Review decision recorded successfully', data);
    } catch (error) {
      next(error);
    }
  },
`;
  ctrl = ctrl.slice(0, insertIndex) + methods + ctrl.slice(insertIndex);
  fs.writeFileSync('backend/appointment-service/src/controllers/appointmentController.js', ctrl, 'utf8');
  console.log('✓ Updated appointmentController.js');
}

// 3. Update appointmentService.js
let svc = fs.readFileSync('backend/appointment-service/src/services/appointmentService.js', 'utf8');
if (!svc.includes('getReviewQueue(')) {
  const insertIndex = svc.lastIndexOf('};');
  const methods = `  /**
   * Phase 19: Clinician & Operations Review Queue
   * Recalculates live unclosed appointments needing clinical or operational review
   */
  async getReviewQueue(user, query = {}) {
    const client = mongoose.connection.client;
    const hospCol = client.db('medimind_hospital').collection('hospitals');
    const consultCol = client.db('medimind_records').collection('consultations');

    const activeHosps = await hospCol.find(
      { status: { $regex: '^active$', $options: 'i' } }
    ).toArray();
    const activeHospIds = activeHosps.map(h => h._id);
    const hospMap = new Map(activeHosps.map(h => [h._id.toString(), h.name]));

    const systemCutoff = new Date('2026-10-29T23:59:59.999Z');
    const match = {
      hospital_id: { $in: activeHospIds },
      appointment_date: { $lte: systemCutoff },
      status: { $in: ['BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'PENDING'] }
    };

    if (user.role === 'HOSPITAL_ADMIN') {
      const hid = user.hospitalId || user.referenceId;
      if (!hid) {
        const err = new Error('Access forbidden: hospital ID missing');
        err.statusCode = 403;
        throw err;
      }
      match.hospital_id = new mongoose.Types.ObjectId(hid);
    } else if (user.role === 'DOCTOR') {
      const did = user.doctorId || user.referenceId;
      if (did) {
        match.doctor_id = new mongoose.Types.ObjectId(did);
      }
      if (user.hospitalId) {
        match.hospital_id = new mongoose.Types.ObjectId(user.hospitalId);
      }
    } else if (user.role === 'CHAIRMAN') {
      if (query.hospitalId && query.hospitalId !== 'ALL') {
        match.hospital_id = new mongoose.Types.ObjectId(query.hospitalId);
      }
    } else {
      const err = new Error('Access forbidden: review queue restricted to clinical and administrative roles');
      err.statusCode = 403;
      throw err;
    }

    const unclosed = await Appointment.find(match).sort({ appointment_date: 1 });
    const apptIds = unclosed.map(a => a._id);
    const consults = await consultCol.find({ appointment_id: { $in: apptIds } }).toArray();
    const consultApptIdSet = new Set(consults.map(c => c.appointment_id.toString()));

    const items = [];
    const countsByHospital = {};
    const countsByClassification = {
      INSUFFICIENT_EVIDENCE: 0,
      VERIFIED_ATTENDED: 0,
      VERIFIED_CANCELLED: 0,
      VERIFIED_NO_SHOW: 0,
    };

    for (const a of unclosed) {
      const hName = hospMap.get(a.hospital_id.toString()) || 'Unknown Hospital';
      countsByHospital[hName] = (countsByHospital[hName] || 0) + 1;

      let classification = 'INSUFFICIENT_EVIDENCE';
      let evidenceReference = 'No physical check-in timestamp, signed consultation, or cancellation record on file.';

      if (consultApptIdSet.has(a._id.toString()) || a.check_in_time) {
        classification = 'VERIFIED_ATTENDED';
        evidenceReference = 'Clinical consultation or check-in record verified.';
      } else if (a.cancelled_at || a.cancellation_reason) {
        classification = 'VERIFIED_CANCELLED';
        evidenceReference = \`Cancellation recorded: \${a.cancellation_reason || 'Administrative cancellation'}\`;
      } else if (a.no_show_at) {
        classification = 'VERIFIED_NO_SHOW';
        evidenceReference = 'No-show event recorded in audit logs.';
      }

      countsByClassification[classification] = (countsByClassification[classification] || 0) + 1;

      items.push({
        id: a._id.toString(),
        appointmentId: a._id.toString(),
        token: a.token || \`OPD-\${a._id.toString().slice(-4).toUpperCase()}\`,
        appointmentDate: a.appointment_date,
        startTime: a.start_time,
        endTime: a.end_time,
        status: a.status,
        hospitalId: a.hospital_id.toString(),
        hospitalName: hName,
        doctorId: a.doctor_id.toString(),
        patientId: a.family_member_id.toString(),
        classification,
        evidenceReference,
        requiresClinicianReview: true,
        clinicalReviewHistory: a.clinical_review_history || [],
        updatedAt: a.updated_at
      });
    }

    return {
      total: items.length,
      countsByHospital,
      countsByClassification,
      items
    };
  },

  /**
   * Phase 19: Submit Clinician or Operations Review Decision
   */
  async submitReviewDecision(user, appointmentId, payload = {}) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointment ID format');
      err.statusCode = 400;
      throw err;
    }

    const { decision, reason, evidenceReference, expectedUpdatedAt } = payload;
    const validDecisions = ['ESCALATE', 'CONFIRM_NO_SHOW', 'CANCEL_UNSERVICED', 'CLINICAL_COMPLETION'];
    if (!validDecisions.includes(decision)) {
      const err = new Error(\`Invalid review decision: must be one of [\${validDecisions.join(', ')}]\`);
      err.statusCode = 400;
      throw err;
    }

    if (!reason || !reason.trim()) {
      const err = new Error('A documented clinical or operational reason is required');
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      const err = new Error('Appointment not found');
      err.statusCode = 404;
      throw err;
    }

    // Role and tenant isolation
    if (user.role === 'HOSPITAL_ADMIN') {
      const hid = user.hospitalId || user.referenceId;
      if (!hid || appointment.hospital_id.toString() !== hid.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another facility');
        err.statusCode = 403;
        throw err;
      }
      if (decision === 'CLINICAL_COMPLETION') {
        const err = new Error('Access forbidden: only authorized clinicians can make clinical completion decisions');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const did = user.doctorId || user.referenceId;
      if (user.hospitalId && appointment.hospital_id.toString() !== user.hospitalId.toString()) {
        const err = new Error('Access forbidden: appointment belongs to another facility');
        err.statusCode = 403;
        throw err;
      }
      if (decision === 'CLINICAL_COMPLETION' && did && appointment.doctor_id.toString() !== did.toString()) {
        const err = new Error('Access forbidden: only assigned doctor can mark clinical completion');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'CHAIRMAN') {
      // Chairman escalation allowed
    } else {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      throw err;
    }

    // Optimistic concurrency check
    if (expectedUpdatedAt) {
      const currentUpdated = appointment.updated_at ? new Date(appointment.updated_at).getTime() : 0;
      const expected = new Date(expectedUpdatedAt).getTime();
      if (Math.abs(currentUpdated - expected) > 1000) {
        const err = new Error('Concurrent modification detected: appointment was updated by another user');
        err.statusCode = 409;
        throw err;
      }
    }

    const previousStatus = appointment.status;
    let newStatus = previousStatus;

    if (decision === 'CLINICAL_COMPLETION') {
      newStatus = 'COMPLETED';
    } else if (decision === 'CONFIRM_NO_SHOW') {
      newStatus = 'NO_SHOW';
    } else if (decision === 'CANCEL_UNSERVICED') {
      newStatus = 'CANCELLED';
      appointment.cancelled_at = new Date();
      appointment.cancellation_reason = reason;
      appointment.cancelled_by = \`\${user.role}:\${user.email || user.userId}\`;
    } else if (decision === 'ESCALATE') {
      // Status remains unchanged
    }

    appointment.status = newStatus;
    if (!appointment.clinical_review_history) {
      appointment.clinical_review_history = [];
    }

    appointment.clinical_review_history.push({
      decision,
      reviewer_id: user.userId || user.id || user.referenceId,
      reviewer_role: user.role,
      reviewer_name: user.name || user.email || user.role,
      reason: reason.trim(),
      evidence_reference: (evidenceReference || 'Clinician manual review').trim(),
      previous_status: previousStatus,
      new_status: newStatus,
      reviewed_at: new Date()
    });

    await appointment.save();
    invalidateApptCache();

    return await this._enrichAppointment(appointment);
  },
`;
  svc = svc.slice(0, insertIndex) + methods + svc.slice(insertIndex);
  fs.writeFileSync('backend/appointment-service/src/services/appointmentService.js', svc, 'utf8');
  console.log('✓ Updated appointmentService.js');
}
