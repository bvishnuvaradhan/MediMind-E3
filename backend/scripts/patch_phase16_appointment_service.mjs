import fs from 'fs';
import path from 'path';

const filePath = path.resolve('backend/appointment-service/src/services/appointmentService.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. In $facet: add dueWorkloadCount, futureWorkloadCount, unresolvedDueCount, and add hasAI to byHospitalMonthlyIntakeBreakdown
const target1 = `          byHospitalMonthlyIntakeBreakdown: [
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

const replacement1 = `          dueWorkloadCount: [
            {
              $match: {
                appointment_date: { $lte: new Date('2026-11-04T23:59:59.999Z') }
              }
            },
            { $count: 'count' }
          ],

          futureWorkloadCount: [
            {
              $match: {
                appointment_date: { $gt: new Date('2026-11-04T23:59:59.999Z') }
              }
            },
            { $count: 'count' }
          ],

          unresolvedDueCount: [
            {
              $match: {
                appointment_date: { $lte: new Date('2026-11-04T23:59:59.999Z') },
                status: { $in: ['BOOKED', 'CONFIRMED', 'PENDING'] }
              }
            },
            { $count: 'count' }
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
                  type: '$appointment_type',
                  hasAI: { $cond: [{ $ifNull: ['$ai_prediction_id', false] }, true, false] }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.bucket': 1 } }
          ],`;

// 2. Mapping byHospitalMonthlyIntakeBreakdown
const target2 = `    const byHospitalMonthlyIntakeBreakdown = (stats?.byHospitalMonthlyIntakeBreakdown || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      status: m._id?.status,
      type: m._id?.type,
      count: m.count || 0,
    }));`;

const replacement2 = `    const byHospitalMonthlyIntakeBreakdown = (stats?.byHospitalMonthlyIntakeBreakdown || []).map(m => ({
      hospitalId: m._id?.hospital_id?.toString(),
      bucket: m._id?.bucket,
      status: m._id?.status,
      type: m._id?.type,
      hasAI: Boolean(m._id?.hasAI),
      count: m.count || 0,
    }));`;

// 3. In monthlyIntakeTrends
const target3 = `      const cohortItems = byHospitalMonthlyIntakeBreakdown
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
      };`;

const replacement3 = `      const cohortItems = byHospitalMonthlyIntakeBreakdown
        .filter(m => (!targetHospId || m.hospitalId === targetHospId) && m.bucket === mKey);

      const completedCohort = cohortItems.filter(m => m.status === 'COMPLETED').reduce((s, i) => s + i.count, 0);
      const cancelledCohort = cohortItems.filter(m => m.status === 'CANCELLED' || m.status === 'CANCELED').reduce((s, i) => s + i.count, 0);
      const rescheduledCohort = cohortItems.filter(m => m.status === 'RESCHEDULED').reduce((s, i) => s + i.count, 0);
      const noShowCohort = cohortItems.filter(m => m.status === 'NO_SHOW').reduce((s, i) => s + i.count, 0);
      const walkInsCohort = cohortItems.filter(m => m.type === 'WALK_IN').reduce((s, i) => s + i.count, 0);
      const pendingCohort = Math.max(0, intakeVolume - completedCohort - cancelledCohort - rescheduledCohort - noShowCohort);

      const onlineCohort = Math.max(0, intakeVolume - walkInsCohort);
      // AI Triaged Scans = actual successful persisted inference records attributable to online booking cohort
      const cohortOnlineWithAI = cohortItems.filter(m => m.type !== 'WALK_IN' && m.hasAI).reduce((s, i) => s + i.count, 0);
      const aiShortfall = Math.max(0, onlineCohort - cohortOnlineWithAI);
      const aiEquationSatisfied = onlineCohort === cohortOnlineWithAI;

      const isFuture = mKey > currentMonthKey;
      const isCurrentMonth = mKey === currentMonthKey;
      const statusLabel = isFuture ? 'Future Intake' : (isCurrentMonth ? 'MTD Intake' : 'Intake Closed');

      const completionRate = isFuture ? 'N/A' : (intakeVolume > 0 ? ((completedCohort / intakeVolume) * 100).toFixed(1) + '%' : '0.0%');
      const noShowRate = isFuture ? 'N/A' : (intakeVolume > 0 ? ((noShowCohort / intakeVolume) * 100).toFixed(1) + '%' : '0.0%');
      const cancellationRate = isFuture ? 'N/A' : (intakeVolume > 0 ? ((cancelledCohort / intakeVolume) * 100).toFixed(1) + '%' : '0.0%');
      const rescheduledRate = isFuture ? 'N/A' : (intakeVolume > 0 ? ((rescheduledCohort / intakeVolume) * 100).toFixed(1) + '%' : '0.0%');

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
        onlineCohort,
        expectedAI: onlineCohort,
        aiTriagedScans: cohortOnlineWithAI,
        aiUsage: cohortOnlineWithAI,
        aiShortfall,
        aiEquationSatisfied,
        completionRate,
        noShowRate,
        cancellationRate,
        rescheduledRate,
        balanced: intakeVolume === (completedCohort + cancelledCohort + rescheduledCohort + noShowCohort + pendingCohort),
        isFuture,
        isCurrentMonth,
        status: statusLabel,
      };`;

// 4. Return stats payload with cutoffDate, systemDate, dueWorkload, futureWorkload, unresolvedDueCount
const target4 = `    return {
      total,
      totalIntake: stats?.totalIntake?.[0]?.count || 0,
      completed,
      upcoming,
      cancelled,
      byStatus: byStatusMap,`;

const replacement4 = `    const dueWorkload = stats?.dueWorkloadCount?.[0]?.count || 0;
    const futureWorkload = stats?.futureWorkloadCount?.[0]?.count || 0;
    const unresolvedDue = stats?.unresolvedDueCount?.[0]?.count || 0;

    return {
      total,
      totalIntake: stats?.totalIntake?.[0]?.count || 0,
      completed,
      upcoming,
      cancelled,
      cutoffDate: '2026-11-04',
      systemDate: '2026-10-28',
      dueWorkload,
      futureWorkload,
      unresolvedDueCount: unresolvedDue,
      byStatus: byStatusMap,`;

// Normalize CRLF to LF
const normalize = s => s.replace(/\r\n/g, '\n');
content = normalize(content);

if (!content.includes(normalize(target1))) {
  console.error('Target 1 not found!');
  process.exit(1);
}
if (!content.includes(normalize(target2))) {
  console.error('Target 2 not found!');
  process.exit(1);
}
if (!content.includes(normalize(target3))) {
  console.error('Target 3 not found!');
  process.exit(1);
}
if (!content.includes(normalize(target4))) {
  console.error('Target 4 not found!');
  process.exit(1);
}

content = content.replace(normalize(target1), normalize(replacement1));
content = content.replace(normalize(target2), normalize(replacement2));
content = content.replace(normalize(target3), normalize(replacement3));
content = content.replace(normalize(target4), normalize(replacement4));

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully patched appointmentService.js for Phase 16!');
