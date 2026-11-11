import fs from 'fs';

let content = fs.readFileSync('./backend/appointment-service/src/services/appointmentService.js', 'utf8');

// 1. Add byHospitalMonthlyCancellationEvents & byHospitalMonthlyReschedulingEvents
const targetCancelledBlock = `          byHospitalMonthlyCancelled: [
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

const replacementCancelledBlock = `          byHospitalMonthlyCancelled: [
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
                'rescheduling_history.0': { $exists: true }
              }
            },
            { $unwind: '$rescheduling_history' },
            {
              $group: {
                _id: {
                  hospital_id: '$hospital_id',
                  bucket: { $dateToString: { format: '%Y-%m', date: '$rescheduling_history.rescheduled_at' } }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],`;

if (!content.includes('byHospitalMonthlyCancellationEvents')) {
  content = content.replace(targetCancelledBlock, replacementCancelledBlock);
}

// 2. Add pendingCount and reconciliation in monthlyTrends
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
  content = content.replace(targetTrendsReturn, replacementTrendsReturn);
}

// 3. Add monthlyIntakeTrends and event arrays to return object
const targetStatsReturn = `    return {
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
    };`;

const replacementStatsReturn = `    const byHospitalMonthlyCancellationEvents = (stats?.byHospitalMonthlyCancellationEvents || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const byHospitalMonthlyReschedulingEvents = (stats?.byHospitalMonthlyReschedulingEvents || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      count: m.count || 0,
    }));

    const distinctIntakeMonths = [...new Set(intakeItems.map(m => m.bucket))].filter(Boolean).sort();
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

      const isFuture = mKey > currentMonthKey;
      const isCurrentMonth = mKey === currentMonthKey;
      const statusLabel = isFuture ? 'Future Intake' : (isCurrentMonth ? 'MTD Intake' : 'Intake Closed');

      return {
        month: monthLabel,
        monthKey: mKey,
        intakeVolume,
        intake: intakeVolume,
        appointments: intakeVolume,
        aiUsage: aiCount,
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
    };`;

if (!content.includes('monthlyScheduledTrends: monthlyTrends')) {
  content = content.replace(targetStatsReturn, replacementStatsReturn);
}

fs.writeFileSync('./backend/appointment-service/src/services/appointmentService.js', content, 'utf8');
console.log('appointmentService.js successfully updated with Phase 15 event-time analytics and reconciled views!');
