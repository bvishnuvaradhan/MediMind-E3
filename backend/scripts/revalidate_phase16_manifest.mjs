import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'medimind_appointment' });
const client = mongoose.connection.client;

const apptCol = client.db('medimind_appointment').collection('appointments');
const hospCol = client.db('medimind_hospital').collection('hospitals');

const manifestPath = path.resolve('backend/scripts/phase16_missing_ai_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

console.log(`Loaded Phase 16 Missing AI Manifest: ${manifest.length} records`);

const activeHosps = await hospCol.find({ status: { $regex: '^active$', $options: 'i' } }).toArray();
const activeHospIds = new Set(activeHosps.map(h => h._id.toString()));

const audit = {
  total: manifest.length,
  activeHospMatches: 0,
  existsInDB: 0,
  alreadyHasAIInDB: 0,
  symptomLengthValid: 0,
  symptomLengthShort: 0,
  statusBreakdown: {},
  hospitalBreakdown: {},
  monthBreakdown: {}
};

const apptIds = manifest.map(m => new mongoose.Types.ObjectId(m.appointment_id));
const dbAppts = await apptCol.find({ _id: { $in: apptIds } }).toArray();
const dbApptMap = new Map(dbAppts.map(a => [a._id.toString(), a]));

for (const m of manifest) {
  const dbAppt = dbApptMap.get(m.appointment_id);
  if (dbAppt) {
    audit.existsInDB++;
    if (activeHospIds.has(dbAppt.hospital_id.toString())) {
      audit.activeHospMatches++;
    }
    if (dbAppt.ai_prediction_id) {
      audit.alreadyHasAIInDB++;
    }
    const symptoms = dbAppt.reason || m.patient_symptoms;
    if (symptoms && symptoms.trim().length >= 3) {
      audit.symptomLengthValid++;
    } else {
      audit.symptomLengthShort++;
    }

    audit.statusBreakdown[dbAppt.status] = (audit.statusBreakdown[dbAppt.status] || 0) + 1;
    audit.hospitalBreakdown[m.hospital_name] = (audit.hospitalBreakdown[m.hospital_name] || 0) + 1;
    audit.monthBreakdown[m.intake_month] = (audit.monthBreakdown[m.intake_month] || 0) + 1;
  }
}

console.log('Revalidation Results:');
console.log(`- Total Records in Manifest: ${audit.total}`);
console.log(`- Exists in Database: ${audit.existsInDB}`);
console.log(`- Active Hospital Matches: ${audit.activeHospMatches}`);
console.log(`- Already Linked to AI in DB: ${audit.alreadyHasAIInDB}`);
console.log(`- Valid Symptom Text (>= 3 chars): ${audit.symptomLengthValid}`);
console.log(`- Short/Empty Symptoms (< 3 chars): ${audit.symptomLengthShort}`);
console.log('\nHospital Breakdown:', audit.hospitalBreakdown);
console.log('Creation Month Breakdown:', audit.monthBreakdown);
console.log('Status Breakdown:', audit.statusBreakdown);

// Sample symptom texts
console.log('\nSample Symptom Texts from Manifest:');
manifest.slice(0, 10).forEach((m, idx) => {
  console.log(`[${idx + 1}] ID: ${m.appointment_id} | Hosp: ${m.hospital_name} | Month: ${m.intake_month} | Symptoms: "${m.patient_symptoms}"`);
});

await mongoose.disconnect();
