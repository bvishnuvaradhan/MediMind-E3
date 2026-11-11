import mongoose from '../node_modules/mongoose/index.js';
import fs from 'fs';

const envContent = fs.readFileSync('./backend/.env', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

async function exportManifest() {
  const connAtlas = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
  const apptDb = connAtlas.useDb('medimind_appointment');
  const aiDb = connAtlas.useDb('medimind_ai');
  const hospDb = connAtlas.useDb('medimind_hospital');

  const activeHospitals = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
  const activeIds = activeHospitals.map(h => h._id);
  const hospMap = Object.fromEntries(activeHospitals.map(h => [h._id.toString(), h.name]));

  const novStart = new Date('2026-11-01T00:00:00.000Z');
  const novEnd = new Date('2026-11-30T23:59:59.999Z');

  const novAppts = await apptDb.collection('appointments').find({
    hospital_id: { $in: activeIds },
    appointment_date: { $gte: novStart, $lte: novEnd }
  }).sort({ hospital_id: 1, appointment_date: 1, start_time: 1 }).toArray();

  const predIds = novAppts.map(a => a.ai_prediction_id).filter(Boolean);
  const preds = await aiDb.collection('predictions').find({ prediction_id: { $in: predIds } }).toArray();
  const predMap = Object.fromEntries(preds.map(p => [p.prediction_id, p]));

  // Write detailed JSON manifest
  const manifestData = novAppts.map(a => {
    const pred = a.ai_prediction_id ? predMap[a.ai_prediction_id] : null;
    return {
      appointment_id: a._id.toString(),
      facility_id: a.hospital_id.toString(),
      facility_name: hospMap[a.hospital_id.toString()],
      patient_family_member_id: a.family_member_id ? a.family_member_id.toString() : 'N/A',
      doctor_id: a.doctor_id ? a.doctor_id.toString() : 'N/A',
      appointment_date: a.appointment_date.toISOString().slice(0, 10),
      start_time: a.start_time,
      end_time: a.end_time,
      status: a.status,
      appointment_type: a.appointment_type || 'BOOKED',
      reason_symptom_text: a.reason || '',
      ai_prediction_id: a.ai_prediction_id || null,
      ai_prediction_exists_in_db: !!pred,
      ai_model: pred ? `${pred.model_name} (v${pred.model_version})` : null,
      ai_risk_level: pred ? (pred.risk_level || pred.result?.risk_category || 'N/A') : null,
    };
  });

  fs.writeFileSync('./backend/scripts/november_manifest_atlas_330.json', JSON.stringify(manifestData, null, 2), 'utf8');
  console.log(`Exported ${manifestData.length} Atlas appointments to november_manifest_atlas_330.json`);

  await connAtlas.close();
}

exportManifest().catch(console.error);
