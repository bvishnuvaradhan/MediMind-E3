import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function reconcileEquation() {
  const conn = await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const apptDb = conn.connection.useDb('medimind_appointment');
  const aiDb = conn.connection.useDb('medimind_ai');
  const hospDb = conn.connection.useDb('medimind_hospital');
  const recDb = conn.connection.useDb('medimind_records');

  const apptsCol = apptDb.collection('appointments');
  const aiCol = aiDb.collection('predictions');
  const hospsCol = hospDb.collection('hospitals');
  const consultsCol = recDb.collection('consultations');

  const hosps = await hospsCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
  const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

  console.log('\n========================================================================================');
  console.log('COMPREHENSIVE BOOKING EQUATION & MUTUALLY EXCLUSIVE STATUS RECONCILIATION');
  console.log('========================================================================================\n');

  const fullReport = [];

  for (const h of hosps) {
    const hid = h._id;
    console.log(`\n----------------------------------------------------------------------------------------`);
    console.log(`Hospital: ${h.name} (${hid})`);
    console.log(`----------------------------------------------------------------------------------------`);

    for (const m of months) {
      const [y, mo] = m.split('-').map(Number);
      const start = new Date(Date.UTC(y, mo - 1, 1));
      const end = new Date(Date.UTC(y, mo, 1));

      // Intake created in this month
      const intakeCreated = await apptsCol.countDocuments({
        hospital_id: hid,
        created_at: { $gte: start, $lt: end }
      });

      // Scheduled in this month
      const totalScheduled = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end }
      });

      if (intakeCreated === 0 && totalScheduled === 0) continue;

      const completed = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: 'COMPLETED'
      });

      const cancelled = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: { $in: ['CANCELLED', 'CANCELED'] }
      });

      const rescheduled = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: 'RESCHEDULED'
      });

      const noShow = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: { $in: ['NO_SHOW', 'NOSHOW'] }
      });

      const pending = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: { $in: ['BOOKED', 'CONFIRMED', 'SCHEDULED', 'PENDING'] }
      });

      const walkIns = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        appointment_type: 'WALK_IN'
      });

      const aiLinked = await apptsCol.countDocuments({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        ai_prediction_id: { $type: 'string', $ne: '' }
      });

      const sumStatuses = completed + cancelled + rescheduled + noShow + pending;
      const equationBalanced = sumStatuses === totalScheduled;

      // Check consultation evidence for completed appointments
      const completedApptDocs = await apptsCol.find({
        hospital_id: hid,
        appointment_date: { $gte: start, $lt: end },
        status: 'COMPLETED'
      }, { projection: { _id: 1 } }).toArray();

      const apptIds = completedApptDocs.map(a => a._id);
      const consultCount = await consultsCol.countDocuments({
        appointment_id: { $in: apptIds }
      });

      const missingConsultEvidence = completed - consultCount;

      fullReport.push({
        hospital: h.name,
        month: m,
        intakeCreated,
        totalScheduled,
        completed,
        cancelled,
        rescheduled,
        noShow,
        pending,
        sumStatuses,
        balanced: equationBalanced,
        walkIns,
        aiLinked,
        consultEvidence: consultCount,
        missingEvidence: missingConsultEvidence
      });

      console.log(`Month ${m}: Sched=${totalScheduled} | Completed=${completed} | Canc=${cancelled} | Resched=${rescheduled} | NoShow=${noShow} | Pending=${pending} | Sum=${sumStatuses} (Match=${equationBalanced}) | Consultations=${consultCount} (Missing=${missingConsultEvidence})`);
    }
  }

  // Standalone AI assessments
  const totalPreds = await aiCol.countDocuments({});
  const standalonePreds = await aiCol.countDocuments({
    $or: [
      { appointment_id: null },
      { appointment_id: '' },
      { appointment_id: { $exists: false } }
    ]
  });
  const linkedPreds = await aiCol.countDocuments({
    appointment_id: { $type: 'string', $ne: '' }
  });

  console.log('\n========================================================================================');
  console.log(`AI PREDICTIONS RECONCILIATION:`);
  console.log(`Total Predictions in medimind_ai: ${totalPreds}`);
  console.log(`Appointment-Linked Screenings:    ${linkedPreds}`);
  console.log(`Genuine Standalone Assessments:  ${standalonePreds}`);
  console.log('========================================================================================\n');

  await conn.disconnect();
}

reconcileEquation().catch(console.error);
