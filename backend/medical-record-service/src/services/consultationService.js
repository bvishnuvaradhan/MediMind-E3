import mongoose from 'mongoose';
import Consultation from '../models/Consultation.js';
import { internalServices } from '../utils/internalServices.js';
import { recordAccessService } from './recordAccessService.js';

export const consultationService = {
  /**
   * Create a new consultation in DRAFT state (Doctor only)
   */
  async createConsultation(user, payload) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can create consultations');
      err.statusCode = 403;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (!doctorId) {
      const err = new Error('Doctor profile not linked to user account');
      err.statusCode = 403;
      throw err;
    }

    const familyMemberId = payload.familyMemberId || payload.family_member_id;
    const appointmentId = payload.appointmentId || payload.appointment_id;

    if (!familyMemberId || !appointmentId) {
      const err = new Error('familyMemberId and appointmentId are required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
      const err = new Error('Invalid familyMemberId format');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      const err = new Error('Invalid appointmentId format');
      err.statusCode = 400;
      throw err;
    }

    // Validate appointment and assigned doctor
    const appointment = await internalServices.getAppointment(appointmentId);
    if (appointment) {
      const apptDoctorId = appointment.doctorId || appointment.doctor_id?._id || appointment.doctor_id;
      if (apptDoctorId && apptDoctorId.toString() !== doctorId.toString()) {
        const err = new Error('Access forbidden: cannot create consultation for another doctor\'s appointment');
        err.statusCode = 403;
        throw err;
      }
    }

    const consultation = await Consultation.create({
      family_member_id: familyMemberId,
      doctor_id: doctorId,
      appointment_id: appointmentId,
      symptoms: payload.symptoms || null,
      observations: payload.observations || null,
      clinical_assessment: payload.clinicalAssessment || payload.clinical_assessment || null,
      treatment_plan: payload.treatmentPlan || payload.treatment_plan || null,
      notes: payload.notes || null,
      ai_prediction_ids: payload.aiPredictionIds || payload.ai_prediction_ids || [],
      status: 'DRAFT',
    });

    return consultation.toPublicJSON();
  },

  /**
   * Retrieve consultations for a family member
   */
  async getConsultationsByMember(user, memberId) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId });
      if (!memberCheck.valid) {
        const err = new Error(memberCheck.message || 'Access forbidden: member does not belong to your family');
        err.statusCode = memberCheck.statusCode || 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      // Doctor must either be assigned to appointments for this member or have active RecordAccess
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, memberId);
      const hasConsultation = await Consultation.exists({ doctor_id: doctorId, family_member_id: memberId });
      if (!hasAccess && !hasConsultation) {
        const err = new Error('Access forbidden: active doctor record access authorization required');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot access private patient consultations');
      err.statusCode = 403;
      throw err;
    }

    const consultations = await Consultation.find({
      family_member_id: memberId,
    }).sort({ created_at: -1 });

    return consultations.map((c) => c.toPublicJSON());
  },

  /**
   * Retrieve single consultation by ID
   */
  async getConsultationById(user, consultationId) {
    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      const err = new Error('Invalid consultation ID format');
      err.statusCode = 400;
      throw err;
    }

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      const err = new Error('Consultation not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: consultation.family_member_id });
      if (!memberCheck.valid) {
        const err = new Error('Access forbidden: consultation belongs to a member outside your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      const isAssignedDoctor = consultation.doctor_id.toString() === doctorId.toString();
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, consultation.family_member_id);
      if (!isAssignedDoctor && !hasAccess) {
        const err = new Error('Access forbidden: you are not authorized to view this consultation');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot access private patient consultations');
      err.statusCode = 403;
      throw err;
    }

    return consultation.toPublicJSON();
  },

  /**
   * Update DRAFT consultation
   */
  async updateDraft(user, consultationId, payload) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can update consultations');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      const err = new Error('Invalid consultation ID format');
      err.statusCode = 400;
      throw err;
    }

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      const err = new Error('Consultation not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (consultation.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the assigned doctor can update this consultation');
      err.statusCode = 403;
      throw err;
    }

    // Lifecycle check
    if (consultation.status !== 'DRAFT') {
      const err = new Error(`Cannot edit a consultation that is ${consultation.status.toLowerCase()}`);
      err.statusCode = 400;
      throw err;
    }

    if (payload.symptoms !== undefined) consultation.symptoms = payload.symptoms;
    if (payload.observations !== undefined) consultation.observations = payload.observations;
    if (payload.clinicalAssessment !== undefined || payload.clinical_assessment !== undefined) {
      consultation.clinical_assessment = payload.clinicalAssessment || payload.clinical_assessment;
    }
    if (payload.treatmentPlan !== undefined || payload.treatment_plan !== undefined) {
      consultation.treatment_plan = payload.treatmentPlan || payload.treatment_plan;
    }
    if (payload.notes !== undefined) consultation.notes = payload.notes;
    if (payload.aiPredictionIds || payload.ai_prediction_ids) {
      consultation.ai_prediction_ids = payload.aiPredictionIds || payload.ai_prediction_ids;
    }

    await consultation.save();
    return consultation.toPublicJSON();
  },

  /**
   * Finalize consultation (Transitions DRAFT -> FINAL)
   */
  async finalizeConsultation(user, consultationId) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can finalize consultations');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      const err = new Error('Invalid consultation ID format');
      err.statusCode = 400;
      throw err;
    }

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      const err = new Error('Consultation not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (consultation.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the assigned doctor can finalize this consultation');
      err.statusCode = 403;
      throw err;
    }

    if (consultation.status !== 'DRAFT') {
      const err = new Error(`Consultation is already ${consultation.status.toLowerCase()}`);
      err.statusCode = 400;
      throw err;
    }

    consultation.status = 'FINAL';
    consultation.finalized_at = new Date();
    await consultation.save();

    return consultation.toPublicJSON();
  },

  /**
   * Amend consultation (Creates new linked AMENDED consultation from FINAL/AMENDED)
   */
  async amendConsultation(user, consultationId, payload = {}) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can amend consultations');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      const err = new Error('Invalid consultation ID format');
      err.statusCode = 400;
      throw err;
    }

    const original = await Consultation.findById(consultationId);
    if (!original) {
      const err = new Error('Consultation not found');
      err.statusCode = 404;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (original.doctor_id.toString() !== doctorId.toString()) {
      const err = new Error('Access forbidden: only the assigned doctor can amend this consultation');
      err.statusCode = 403;
      throw err;
    }

    if (original.status === 'DRAFT') {
      const err = new Error('Cannot amend a draft consultation; finalize it first');
      err.statusCode = 400;
      throw err;
    }

    const amendedConsultation = await Consultation.create({
      family_member_id: original.family_member_id,
      doctor_id: original.doctor_id,
      appointment_id: original.appointment_id,
      symptoms: payload.symptoms !== undefined ? payload.symptoms : original.symptoms,
      observations: payload.observations !== undefined ? payload.observations : original.observations,
      clinical_assessment: payload.clinicalAssessment || payload.clinical_assessment || original.clinical_assessment,
      treatment_plan: payload.treatmentPlan || payload.treatment_plan || original.treatment_plan,
      notes: payload.notes !== undefined ? payload.notes : original.notes,
      ai_prediction_ids: payload.aiPredictionIds || payload.ai_prediction_ids || original.ai_prediction_ids,
      status: 'AMENDED',
      finalized_at: new Date(),
      amendment_of: original._id,
    });

    return amendedConsultation.toPublicJSON();
  },
};
