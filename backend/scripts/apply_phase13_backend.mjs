import fs from 'fs';

console.log('Applying Phase 13 backend changes...');

// 1. Update Appointment.js
const apptModelPath = 'backend/appointment-service/src/models/Appointment.js';
let apptModelContent = fs.readFileSync(apptModelPath, 'utf8');

if (!apptModelContent.includes('rescheduling_history: [')) {
  const target = `    replacement_appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
      index: true,
    },`;
  const replacement = `    replacement_appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
      index: true,
    },

    rescheduling_history: [
      {
        previous_appointment_date: { type: Date },
        previous_start_time: { type: String, trim: true },
        previous_end_time: { type: String, trim: true },
        new_appointment_date: { type: Date },
        new_start_time: { type: String, trim: true },
        new_end_time: { type: String, trim: true },
        rescheduled_at: { type: Date, default: Date.now },
        rescheduled_by: { type: String, default: null },
        reason: { type: String, default: null, trim: true },
      },
    ],`;

  apptModelContent = apptModelContent.replace(target, replacement);

  // In toPublicJSON
  const jsonTarget = `    replacementAppointmentId: this.replacement_appointment_id,
    replacement_appointment_id: this.replacement_appointment_id,`;
  const jsonReplacement = `    replacementAppointmentId: this.replacement_appointment_id,
    replacement_appointment_id: this.replacement_appointment_id,
    reschedulingHistory: this.rescheduling_history || [],
    rescheduling_history: this.rescheduling_history || [],`;

  apptModelContent = apptModelContent.replace(jsonTarget, jsonReplacement);

  fs.writeFileSync(apptModelPath, apptModelContent, 'utf8');
  console.log('✓ Updated Appointment.js schema with rescheduling_history');
} else {
  console.log('• Appointment.js already contains rescheduling_history');
}

// 2. Update appointmentService.js
const apptServicePath = 'backend/appointment-service/src/services/appointmentService.js';
let apptServiceContent = fs.readFileSync(apptServicePath, 'utf8');

// In rescheduleAppointment: record history
if (!apptServiceContent.includes('appointment.rescheduling_history.push')) {
  const saveTarget = `    appointment.appointment_date = newAppointmentDate;

    appointment.start_time = newStartTime;

    appointment.end_time = newEndTime;

    appointment.status = 'RESCHEDULED';`;

  const saveReplacement = `    if (!appointment.rescheduling_history) {
      appointment.rescheduling_history = [];
    }
    appointment.rescheduling_history.push({
      previous_appointment_date: appointment.appointment_date,
      previous_start_time: appointment.start_time,
      previous_end_time: appointment.end_time,
      new_appointment_date: newAppointmentDate,
      new_start_time: newStartTime,
      new_end_time: newEndTime,
      rescheduled_at: new Date(),
      rescheduled_by: (user?.id || user?.userId || user?.email || 'USER').toString(),
      reason: payload?.reason || payload?.cancellationReason || 'Patient requested reschedule',
    });

    appointment.appointment_date = newAppointmentDate;

    appointment.start_time = newStartTime;

    appointment.end_time = newEndTime;

    appointment.status = 'RESCHEDULED';`;

  apptServiceContent = apptServiceContent.replace(saveTarget, saveReplacement);
  console.log('✓ Added rescheduling_history audit logging to rescheduleAppointment');
}

// In getStats facet: add byHospitalRescheduled, byHospitalWalkIn, byHospitalMonthlyRescheduled, byHospitalMonthlyWalkIn, etc.
if (!apptServiceContent.includes('byHospitalRescheduled: [')) {
  const facetTarget = `          byHospitalNoShow: [
            {
              $match: {
                status: { $in: ['NO_SHOW', 'NOSHOW'] },
                ...(dateFilter ? { appointment_date: dateFilter } : {})
              }
            },
            { $group: { _id: '$hospital_id', count: { $sum: 1 } } },
          ],`;

  const facetReplacement = `          byHospitalNoShow: [
            {
              $match: {
                status: { $in: ['NO_SHOW', 'NOSHOW'] },
                ...(dateFilter ? { appointment_date: dateFilter } : {})
              }
            },
            { $group: { _id: '$hospital_id', count: { $sum: 1 } } },
          ],

          byHospitalRescheduled: [
            {
              $match: {
                status: 'RESCHEDULED',
                ...(dateFilter ? { appointment_date: dateFilter } : {})
              }
            },
            { $group: { _id: '$hospital_id', count: { $sum: 1 } } },
          ],

          byHospitalWalkIn: [
            {
              $match: {
                appointment_type: 'WALK_IN',
                ...(dateFilter ? { appointment_date: dateFilter } : {})
              }
            },
            { $group: { _id: '$hospital_id', count: { $sum: 1 } } },
          ],

          byHospitalMonthlyRescheduled: [
            {
              $match: {
                status: 'RESCHEDULED',
                appointment_date: { $lte: new Date() }
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],

          byHospitalMonthlyWalkIn: [
            {
              $match: {
                appointment_type: 'WALK_IN',
                appointment_date: { $lte: new Date() }
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],

          byHospitalMonthlyScheduled: [
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],

          byHospitalMonthlyCancelled: [
            {
              $match: {
                status: { $in: ['CANCELLED', 'CANCELED'] }
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],

          byHospitalMonthlyNoShow: [
            {
              $match: {
                status: { $in: ['NO_SHOW', 'NOSHOW'] }
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$appointment_date' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],`;

  apptServiceContent = apptServiceContent.replace(facetTarget, facetReplacement);
  console.log('✓ Added byHospitalRescheduled, byHospitalWalkIn & monthly facets');
}

// In getStats: maps and monthlyTrends
if (!apptServiceContent.includes('byHospitalRescheduledMap')) {
  const mapsTarget = `    const byHospitalNoShowMap = {};
    (stats?.byHospitalNoShow || []).forEach(h => {
      if (h._id) byHospitalNoShowMap[h._id.toString()] = h.count;
    });`;

  const mapsReplacement = `    const byHospitalNoShowMap = {};
    (stats?.byHospitalNoShow || []).forEach(h => {
      if (h._id) byHospitalNoShowMap[h._id.toString()] = h.count;
    });

    const byHospitalRescheduledMap = {};
    (stats?.byHospitalRescheduled || []).forEach(h => {
      if (h._id) byHospitalRescheduledMap[h._id.toString()] = h.count;
    });

    const byHospitalWalkInMap = {};
    (stats?.byHospitalWalkIn || []).forEach(h => {
      if (h._id) byHospitalWalkInMap[h._id.toString()] = h.count;
    });`;

  apptServiceContent = apptServiceContent.replace(mapsTarget, mapsReplacement);

  const monthlyTarget = `    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const targetHospId = match.hospital_id ? match.hospital_id.toString() : null;

    const intakeItems = byHospitalMonthlyIntake.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const completedItems = byHospitalMonthlyCompleted.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const predItems = byHospitalMonthlyPreds.filter(m => !targetHospId || m.hospitalId === targetHospId);

    const distinctTrendMonths = [...new Set([
      ...intakeItems.map(m => m.bucket),
      ...completedItems.map(m => m.bucket),
      ...predItems.map(m => m.bucket)
    ])].filter(b => b && b <= currentMonthKey).sort();

    const monthlyTrends = distinctTrendMonths.map(mKey => {
      const parts = mKey.split('-');
      const year = parts[0];
      const monthNum = parts[1];
      const mIdx = parseInt(monthNum, 10) - 1;
      const monthLabel = mIdx >= 0 && mIdx < 12 ? \`\${monthNames[mIdx]} \${year}\` : mKey;

      const intakeCount = intakeItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const completedCount = completedItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const aiCount = predItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      return {
        month: monthLabel,
        monthKey: mKey,
        appointments: intakeCount,
        volume: intakeCount,
        total: intakeCount,
        completed: completedCount,
        scheduled: Math.max(0, intakeCount - completedCount),
        cancelled: 0,
        aiUsage: aiCount,
      };
    });`;

  const monthlyReplacement = `    const byHospitalMonthlyRescheduled = (stats?.byHospitalMonthlyRescheduled || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyWalkIn = (stats?.byHospitalMonthlyWalkIn || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyScheduled = (stats?.byHospitalMonthlyScheduled || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyCancelled = (stats?.byHospitalMonthlyCancelled || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyNoShow = (stats?.byHospitalMonthlyNoShow || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const targetHospId = match.hospital_id ? match.hospital_id.toString() : null;

    const intakeItems = byHospitalMonthlyIntake.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const completedItems = byHospitalMonthlyCompleted.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const predItems = byHospitalMonthlyPreds.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const reschedItems = byHospitalMonthlyRescheduled.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const walkInItems = byHospitalMonthlyWalkIn.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const schedItems = byHospitalMonthlyScheduled.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const cancItems = byHospitalMonthlyCancelled.filter(m => !targetHospId || m.hospitalId === targetHospId);
    const noShowItems = byHospitalMonthlyNoShow.filter(m => !targetHospId || m.hospitalId === targetHospId);

    // Include all historical months plus November 2026 (booked advance slots)
    const distinctTrendMonths = [...new Set([
      ...intakeItems.map(m => m.bucket),
      ...completedItems.map(m => m.bucket),
      ...predItems.map(m => m.bucket),
      ...schedItems.map(m => m.bucket)
    ])].filter(Boolean).sort();

    const monthlyTrends = distinctTrendMonths.map(mKey => {
      const parts = mKey.split('-');
      const year = parts[0];
      const monthNum = parts[1];
      const mIdx = parseInt(monthNum, 10) - 1;
      const monthLabel = mIdx >= 0 && mIdx < 12 ? \`\${monthNames[mIdx]} \${year}\` : mKey;

      const intakeCount = intakeItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const scheduledCount = schedItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const completedCount = completedItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const cancelledCount = cancItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const rescheduledCount = reschedItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const noShowCount = noShowItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const walkInCount = walkInItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const aiCount = predItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const isFuture = mKey > currentMonthKey;
      const isCurrentMonth = mKey === currentMonthKey;
      const statusLabel = isFuture ? 'Future Workload' : (isCurrentMonth ? 'MTD In Progress' : 'Closed Cycle');

      // Scheduled workload is the effective appointments scheduled in this month
      const effectiveWorkload = scheduledCount || intakeCount;

      return {
        month: monthLabel,
        monthKey: mKey,
        intake: intakeCount,
        appointments: effectiveWorkload,
        volume: effectiveWorkload,
        total: effectiveWorkload,
        completed: completedCount,
        cancelled: cancelledCount,
        rescheduled: rescheduledCount,
        noShow: noShowCount,
        walkIns: walkInCount,
        scheduled: Math.max(0, effectiveWorkload - completedCount - cancelledCount - rescheduledCount),
        aiUsage: aiCount,
        isFuture,
        isCurrentMonth,
        status: statusLabel,
      };
    });`;

  apptServiceContent = apptServiceContent.replace(monthlyTarget, monthlyReplacement);

  const retTarget = `      byHospitalCancelled: byHospitalCancelledMap,
      byHospitalNoShow: byHospitalNoShowMap,`;

  const retReplacement = `      byHospitalCancelled: byHospitalCancelledMap,
      byHospitalNoShow: byHospitalNoShowMap,
      byHospitalRescheduled: byHospitalRescheduledMap,
      byHospitalWalkIn: byHospitalWalkInMap,
      byHospitalMonthlyRescheduled,
      byHospitalMonthlyWalkIn,
      byHospitalMonthlyScheduled,`;

  apptServiceContent = apptServiceContent.replace(retTarget, retReplacement);
  console.log('✓ Updated monthlyTrends calculation and return object with rescheduled/walkIn/status');
}

fs.writeFileSync(apptServicePath, apptServiceContent, 'utf8');
console.log('✓ Successfully applied backend updates to appointmentService.js');
