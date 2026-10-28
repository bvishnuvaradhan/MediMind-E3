import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function auditLinks() {
  const connAppt = await mongoose.createConnection(uri, { dbName: 'medimind_appointment' }).asPromise();
  const connRec = await mongoose.createConnection(uri, { dbName: 'medimind_records' }).asPromise();
  const connDoc = await mongoose.createConnection(uri, { dbName: 'medimind_doctor' }).asPromise();
  const connFam = await mongoose.createConnection(uri, { dbName: 'medimind_family' }).asPromise();
  const connHosp = await mongoose.createConnection(uri, { dbName: 'medimind_hospital' }).asPromise();

  console.log('========================================================================');
  console.log('CLINICAL CONSULTATION, PRESCRIPTION & ENTITY LINKAGE AUDIT');
  console.log('========================================================================\n');

  const activeHospitals = await connHosp.collection('hospitals').find({
    status: { $regex: '^active$', $options: 'i' }
  }).toArray();

  for (const h of activeHospitals) {
    const hid = h._id;
    console.log(`\n--- Facility: ${h.name} (${hid}) ---`);

    // Fetch all completed appointments for this hospital
    const completedAppts = await connAppt.collection('appointments').find(
      { hospital_id: hid, status: 'COMPLETED' },
      { projection: { _id: 1, family_member_id: 1, doctor_id: 1, department_id: 1, appointment_date: 1 } }
    ).toArray();

    const completedApptIds = completedAppts.map(a => a._id);
    const completedApptIdStrs = completedAppts.map(a => a._id.toString());

    // Check consultations referencing these appointment IDs (both ObjectId and String)
    const linkedCons = await connRec.collection('consultations').countDocuments({
      $or: [
        { appointment_id: { $in: completedApptIds } },
        { appointment_id: { $in: completedApptIdStrs } }
      ]
    });

    console.log(`Completed Appointments: ${completedAppts.length}`);
    console.log(`Linked Consultations:  ${linkedCons}`);

    // If there are consultations, check prescriptions linked to them
    const consDocs = await connRec.collection('consultations').find(
      {
        $or: [
          { appointment_id: { $in: completedApptIds } },
          { appointment_id: { $in: completedApptIdStrs } }
        ]
      },
      { projection: { _id: 1 } }
    ).toArray();

    const consIds = consDocs.map(c => c._id);
    const consIdStrs = consDocs.map(c => c._id.toString());

    const linkedRx = await connRec.collection('prescriptions').countDocuments({
      $or: [
        { consultation_id: { $in: consIds } },
        { consultation_id: { $in: consIdStrs } }
      ]
    });

    console.log(`Linked Prescriptions:  ${linkedRx}`);
  }

  // Network wide consultations and prescriptions
  const totalCons = await connRec.collection('consultations').countDocuments({});
  const totalRx = await connRec.collection('prescriptions').countDocuments({});
  console.log(`\nNetwork Total Consultations: ${totalCons}`);
  console.log(`Network Total Prescriptions: ${totalRx}`);

  // Check sample consultations to see why or where they are linked
  const sampleCons = await connRec.collection('consultations').find({}).limit(5).toArray();
  console.log('\nSample Consultations appointment_id types and values:');
  for (const c of sampleCons) {
    console.log(`  Cons ID: ${c._id}, appt_id type: ${typeof c.appointment_id}, appt_id: ${c.appointment_id}, doctor_id: ${c.doctor_id}`);
    // Check if appointment exists
    const appt = await connAppt.collection('appointments').findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(c.appointment_id) },
        { _id: c.appointment_id }
      ]
    });
    console.log(`    Referenced appointment exists in DB: ${Boolean(appt)}, hospital_id: ${appt?.hospital_id}`);
  }

  // Check orphaned consultations
  const allCons = await connRec.collection('consultations').find({}, { projection: { appointment_id: 1, doctor_id: 1 } }).toArray();
  let orphanedCons = 0;
  for (const c of allCons) {
    if (!c.appointment_id) {
      orphanedCons++;
    }
  }
  console.log(`\nConsultations without appointment_id: ${orphanedCons} / ${allCons.length}`);

  // Check doctor linkage across appointments
  const missingDoctorAppts = await connAppt.collection('appointments').countDocuments({
    $or: [{ doctor_id: null }, { doctor_id: { $exists: false } }]
  });
  const missingFamilyAppts = await connAppt.collection('appointments').countDocuments({
    $or: [{ family_member_id: null }, { family_member_id: { $exists: false } }]
  });
  console.log(`Appointments with missing doctor_id: ${missingDoctorAppts}`);
  console.log(`Appointments with missing family_member_id: ${missingFamilyAppts}`);

  await connAppt.close();
  await connRec.close();
  await connDoc.close();
  await connFam.close();
  await connHosp.close();
}

auditLinks().catch(console.error);
