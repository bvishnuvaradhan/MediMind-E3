import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';

async function exportLocalManifest() {
  const connLocal = await mongoose.createConnection('mongodb://127.0.0.1:27017').asPromise();
  const apptDb = connLocal.useDb('medimind_appointment');
  const aiDb = connLocal.useDb('medimind_ai');
  const hospDb = connLocal.useDb('medimind_hospital');

  const activeHospitals = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
  const hospMap = Object.fromEntries(activeHospitals.map(h => [h._id.toString(), h.name]));

  const novStart = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-11-30T23:59:59.999Z');

  const novAppts = await apptDb.collection('appointments').find({
    appointment_date: { $gte: novStart, $lte: novEnd }
  }).sort({ hospital_id: 1, appointment_date: 1, start_time: 1 }).toArray();

  const manifestData = novAppts.map(a => {
    return {
      appointment_id: a._id.toString(),
      facility_id: a.hospital_id ? a.hospital_id.toString() : 'N/A',
      facility_name: hospMap[a.hospital_id?.toString()] || 'Unapproved / Inactive',
      patient_family_member_id: a.family_member_id ? a.family_member_id.toString() : 'N/A',
      doctor_id: a.doctor_id ? a.doctor_id.toString() : 'N/A',
      appointment_date: a.appointment_date.toISOString().slice(0, 10),
      start_time: a.start_time,
      end_time: a.end_time,
      status: a.status,
      appointment_type: a.appointment_type || 'BOOKED',
      reason_symptom_text: a.reason || '',
      ai_prediction_id: a.ai_prediction_id || null,
      is_active_facility: !!hospMap[a.hospital_id?.toString()],
      symptom_classification: (a.reason || '').toLowerCase().includes('routine') ? 'PLACEHOLDER_GENERIC' : 'SPECIALTY_DERIVED',
    };
  });

  fs.writeFileSync('./backend/scripts/november_manifest_local_513.json', JSON.stringify(manifestData, null, 2), 'utf8');
  console.log(`Exported ${manifestData.length} Local appointments to november_manifest_local_513.json`);

  await connLocal.close();
}

exportLocalManifest().catch(console.error);
