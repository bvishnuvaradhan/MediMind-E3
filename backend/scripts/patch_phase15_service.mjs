import fs from 'fs';

let content = fs.readFileSync('./backend/appointment-service/src/services/appointmentService.js', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add byHospitalMonthlyCancellationEvents & byHospitalMonthlyReschedulingEvents after byHospitalMonthlyCancelled
const targetCancelled = `          byHospitalMonthlyCancelled: [
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
          ],`;

const replacementCancelled = `          byHospitalMonthlyCancelled: [
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

          byHospitalMonthlyCancellationEvents: [
            {
              $match: {
                status: { $in: ['CANCELLED', 'CANCELED'] },
                cancelled_at: { $ne: null }
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$cancelled_at' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],

          byHospitalMonthlyReschedulingEvents: [
            {
              $match: {
                $or: [
                  { status: 'RESCHEDULED' },
                  { 'rescheduling_history.0': { $exists: true } }
                ]
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: { $ifNull: ['$rescheduled_at', { $ifNull: ['$updated_at', '$appointment_date'] }] }
                    }
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],`;

if (!content.includes('byHospitalMonthlyCancellationEvents')) {
  if (!content.includes(targetCancelled)) {
    throw new Error('targetCancelled not found in appointmentService.js');
  }
  content = content.replace(targetCancelled, replacementCancelled);
}

// 2. Add byHospitalMonthlyIntakeBreakdown right after byHospitalMonthlyIntake
const targetIntake = `          byHospitalMonthlyIntake: [
            {
              $match: {
                $or: [
                  { created_at: { $lte: new Date() } },
                  { created_at: { $exists: false }, appointment_date: { $lte: new Date() } }
                ]
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: {
                        $cond: [
                          { $eq: [{ $type: '$created_at' }, 'date'] },
                          '$created_at',
                          { $ifNull: [{ $dateFromString: { dateString: '$created_at', onError: null } }, '$appointment_date'] }
                        ]
                      }
                    }
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],`;

const replacementIntake = `          byHospitalMonthlyIntake: [
            {
              $match: {
                $or: [
                  { created_at: { $lte: new Date() } },
                  { created_at: { $exists: false }, appointment_date: { $lte: new Date() } }
                ]
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: {
                        $cond: [
                          { $eq: [{ $type: '$created_at' }, 'date'] },
                          '$created_at',
                          { $ifNull: [{ $dateFromString: { dateString: '$created_at', onError: null } }, '$appointment_date'] }
                        ]
                      }
                    }
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],

          byHospitalMonthlyIntakeBreakdown: [
            {
              $match: {
                $or: [
                  { created_at: { $lte: new Date() } },
                  { created_at: { $exists: false }, appointment_date: { $lte: new Date() } }
                ]
              }
            },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: {
                        $cond: [
                          { $eq: [{ $type: '$created_at' }, 'date'] },
                          '$created_at',
                          { $ifNull: [{ $dateFromString: { dateString: '$created_at', onError: null } }, '$appointment_date'] }
                        ]
                      }
                    }
                  },
                  status: '$status',
                  type: '$appointment_type'
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],`;

if (!content.includes('byHospitalMonthlyIntakeBreakdown')) {
  if (!content.includes(targetIntake)) {
    throw new Error('targetIntake not found in appointmentService.js');
  }
  content = content.replace(targetIntake, replacementIntake);
}

// 3. Map events and breakdown in processing
const targetProcessingMaps = `    const byHospitalMonthlyNoShow = (stats?.byHospitalMonthlyNoShow || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));`;

const replacementProcessingMaps = `    const byHospitalMonthlyNoShow = (stats?.byHospitalMonthlyNoShow || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyCancellationEvents = (stats?.byHospitalMonthlyCancellationEvents || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyReschedulingEvents = (stats?.byHospitalMonthlyReschedulingEvents || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyIntakeBreakdown = (stats?.byHospitalMonthlyIntakeBreakdown || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      status: m._id?.status,
      type: m._id?.type,
      count: m.count || 0,
    }));`;

if (!content.includes('byHospitalMonthlyIntakeBreakdown = (stats?.byHospitalMonthlyIntakeBreakdown')) {
  if (!content.includes(targetProcessingMaps)) {
    throw new Error('targetProcessingMaps not found in appointmentService.js');
  }
  content = content.replace(targetProcessingMaps, replacementProcessingMaps);
}

// 4. Update monthlyTrends return block
const targetTrendsReturn = `      // Scheduled workload is the effective appointments scheduled in this month
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
      };`;

const replacementTrendsReturn = `      // Scheduled workload is the effective appointments scheduled in this month
      const effectiveWorkload = scheduledCount || intakeCount;

      const pendingCount = Math.max(0, effectiveWorkload - completedCount - cancelledCount - rescheduledCount - noShowCount);

      const completionRate = isFuture ? 'N/A' : (effectiveWorkload > 0 ? ((completedCount / effectiveWorkload) * 100).toFixed(1) + '%' : '0.0%');
      const noShowRate = isFuture ? 'N/A' : (effectiveWorkload > 0 ? ((noShowCount / effectiveWorkload) * 100).toFixed(1) + '%' : '0.0%');
      const cancellationRate = isFuture ? 'N/A' : (effectiveWorkload > 0 ? ((cancelledCount / effectiveWorkload) * 100).toFixed(1) + '%' : '0.0%');

      return {
        month: monthLabel,
        monthKey: mKey,
        intake: intakeCount,
        intakeVolume: intakeCount,
        appointments: effectiveWorkload,
        scheduledWorkload: effectiveWorkload,
        volume: effectiveWorkload,
        total: effectiveWorkload,
        completed: completedCount,
        cancelled: cancelledCount,
        rescheduled: rescheduledCount,
        noShow: noShowCount,
        pending: pendingCount,
        walkIns: walkInCount,
        scheduled: pendingCount,
        aiUsage: aiCount,
        completionRate,
        noShowRate,
        cancellationRate,
        balanced: effectiveWorkload === (completedCount + cancelledCount + rescheduledCount + noShowCount + pendingCount),
        isFuture,
        isCurrentMonth,
        status: statusLabel,
      };`;

if (!content.includes('pendingCount = Math.max(0, effectiveWorkload')) {
  if (!content.includes(targetTrendsReturn)) {
    throw new Error('targetTrendsReturn not found in appointmentService.js');
  }
  content = content.replace(targetTrendsReturn, replacementTrendsReturn);
}

// 5. Update stats return to include monthlyIntakeTrends with full breakdown and return properties
const targetReturnObject = `    return {
      total,
      totalIntake: stats?.totalIntake?.[0]?.count || 0,
      completed,
      upcoming,
      cancelled,
      byStatus: byStatusMap,
      byHospital: byHospitalMap,
      byHospitalIntake: byHospitalIntakeMap,
      byHospitalCompleted: byHospitalCompletedMap,
      byHospitalPreds: byHospitalPredsMap,
      byHospitalCancelled: byHospitalCancelledMap,
      byHospitalNoShow: byHospitalNoShowMap,
      byHospitalRescheduled: byHospitalRescheduledMap,
      byHospitalWalkIn: byHospitalWalkInMap,
      byHospitalMonthlyRescheduled,
      byHospitalMonthlyWalkIn,
      byHospitalMonthlyScheduled,
      byDepartment: byDepartmentMap,
      byDepartmentPreds: byDepartmentPredsMap,
      monthlyTrends,
      byHospitalMonthlyCompleted,
      byHospitalMonthlyPreds,
      byHospitalMonthlyIntake,
      byHospitalDailyCompleted,
      byHospitalDailyPreds,
      byHospitalDailyIntake,
      byDayOfWeek,
    };`;

const replacementReturnObject = `    const distinctIntakeMonths = [...new Set(intakeItems.map(m => m.bucket))].filter(Boolean).sort();
    const monthlyIntakeTrends = distinctIntakeMonths.map(mKey => {
      const parts = mKey.split('-');
      const year = parts[0];
      const monthNum = parts[1];
      const mIdx = parseInt(monthNum, 10) - 1;
      const monthLabel = mIdx >= 0 && mIdx < 12 ? \`\${monthNames[mIdx]} \${year}\` : mKey;

      const intakeVolume = intakeItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const aiCount = predItems
        .filter(m => m.bucket === mKey)
        .reduce((sum, item) => sum + (item.count || 0), 0);

      const cohortItems = byHospitalMonthlyIntakeBreakdown
        .filter(m => (!targetHospId || m.hospitalId === targetHospId) && m.bucket === mKey);

      const completedCohort = cohortItems.filter(m => m.status === 'COMPLETED').reduce((s, i) => s + i.count, 0);
      const cancelledCohort = cohortItems.filter(m => m.status === 'CANCELLED' || m.status === 'CANCELED').reduce((s, i) => s + i.count, 0);
      const rescheduledCohort = cohortItems.filter(m => m.status === 'RESCHEDULED').reduce((s, i) => s + i.count, 0);
      const noShowCohort = cohortItems.filter(m => m.status === 'NO_SHOW').reduce((s, i) => s + i.count, 0);
      const walkInsCohort = cohortItems.filter(m => m.type === 'WALK_IN').reduce((s, i) => s + i.count, 0);
      const pendingCohort = Math.max(0, intakeVolume - completedCohort - cancelledCohort - rescheduledCohort - noShowCohort);

      const isFuture = mKey > currentMonthKey;
      const isCurrentMonth = mKey === currentMonthKey;
      const statusLabel = isFuture ? 'Future Intake' : (isCurrentMonth ? 'MTD Intake' : 'Intake Closed');

      const completionRate = isFuture ? 'N/A' : (intakeVolume > 0 ? ((completedCohort / intakeVolume) * 100).toFixed(1) + '%' : '0.0%');
      const noShowRate = isFuture ? 'N/A' : (intakeVolume > 0 ? ((noShowCohort / intakeVolume) * 100).toFixed(1) + '%' : '0.0%');

      return {
        month: monthLabel,
        monthKey: mKey,
        intakeVolume,
        intake: intakeVolume,
        appointments: intakeVolume,
        total: intakeVolume,
        volume: intakeVolume,
        completed: completedCohort,
        cancelled: cancelledCohort,
        rescheduled: rescheduledCohort,
        noShow: noShowCohort,
        pending: pendingCohort,
        walkIns: walkInsCohort,
        aiUsage: aiCount,
        completionRate,
        noShowRate,
        balanced: intakeVolume === (completedCohort + cancelledCohort + rescheduledCohort + noShowCohort + pendingCohort),
        isFuture,
        isCurrentMonth,
        status: statusLabel,
      };
    });

    return {
      total,
      totalIntake: stats?.totalIntake?.[0]?.count || 0,
      completed,
      upcoming,
      cancelled,
      byStatus: byStatusMap,
      byHospital: byHospitalMap,
      byHospitalIntake: byHospitalIntakeMap,
      byHospitalCompleted: byHospitalCompletedMap,
      byHospitalPreds: byHospitalPredsMap,
      byHospitalCancelled: byHospitalCancelledMap,
      byHospitalNoShow: byHospitalNoShowMap,
      byHospitalRescheduled: byHospitalRescheduledMap,
      byHospitalWalkIn: byHospitalWalkInMap,
      byHospitalMonthlyRescheduled,
      byHospitalMonthlyWalkIn,
      byHospitalMonthlyScheduled,
      byHospitalMonthlyCancellationEvents,
      byHospitalMonthlyReschedulingEvents,
      byDepartment: byDepartmentMap,
      byDepartmentPreds: byDepartmentPredsMap,
      monthlyTrends,
      monthlyScheduledTrends: monthlyTrends,
      monthlyIntakeTrends,
      byHospitalMonthlyCompleted,
      byHospitalMonthlyPreds,
      byHospitalMonthlyIntake,
      byHospitalDailyCompleted,
      byHospitalDailyPreds,
      byHospitalDailyIntake,
      byDayOfWeek,
    };`;

if (!content.includes('monthlyScheduledTrends: monthlyTrends')) {
  if (!content.includes(targetReturnObject)) {
    throw new Error('targetReturnObject not found in appointmentService.js');
  }
  content = content.replace(targetReturnObject, replacementReturnObject);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('./backend/appointment-service/src/services/appointmentService.js', content, 'utf8');
console.log('appointmentService.js successfully patched with complete Phase 15 event-time and intake breakdown!');
