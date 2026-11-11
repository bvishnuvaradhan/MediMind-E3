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

await mongoose.connect(process.env.MONGODB_URI);
const apptDb = mongoose.connection.useDb('medimind_appointment');
const hospDb = mongoose.connection.useDb('medimind_hospital');
const aiDb = mongoose.connection.useDb('medimind_ai');

const activeHospitals = await hospDb.collection('hospitals').find({ status: 'ACTIVE' }).toArray();
const activeHospIds = activeHospitals.map(h => h._id);
const hospMap = Object.fromEntries(activeHospitals.map(h => [h._id.toString(), h.name]));

console.log('Active hospitals:', hospMap);

const novStart = new Date('2026-11-01T00:00:00.000Z');
const novEnd = new Date('2026-11-30T23:59:59.999Z');

const novAppts = await apptDb.collection('appointments').find({
  hospital_id: { $in: activeHospIds },
  appointment_date: { $gte: novStart, $lte: novEnd }
}).sort({ hospital_id: 1, appointment_date: 1, start_time: 1 }).toArray();

console.log(`Total November appointments for active facilities: ${novAppts.length}`);

// Group by hospital
const byHosp = {};
for (const hId of activeHospIds) {
  byHosp[hId.toString()] = [];
}

for (const a of novAppts) {
  byHosp[a.hospital_id.toString()].push(a);
}

for (const [hId, list] of Object.entries(byHosp)) {
  console.log(`${hospMap[hId]} (${hId}): ${list.length} appointments`);
}

// Analyze symptom texts
const symptomCategories = {
  validSpecific: [],
  shortOrGeneric: [],
  missingOrNull: [],
  placeholders: []
};

const placeholderPatterns = [
  /^regular check-?up$/i,
  /^routine check-?up$/i,
  /^consultation$/i,
  /^follow-?up$/i,
  /^general consultation$/i,
  /^routine visit$/i,
  /^checkup$/i,
  /^medical checkup$/i,
  /^n\/a$/i,
  /^none$/i,
  /^test$/i
];

const reasonsSample = {};

for (const a of novAppts) {
  const r = (a.reason || '').trim();
  reasonsSample[r] = (reasonsSample[r] || 0) + 1;

  if (!r) {
    symptomCategories.missingOrNull.push(a);
  } else if (placeholderPatterns.some(p => p.test(r))) {
    symptomCategories.placeholders.push({ appt: a, reason: r });
  } else if (r.length < 5) {
    symptomCategories.shortOrGeneric.push({ appt: a, reason: r });
  } else {
    symptomCategories.validSpecific.push({ appt: a, reason: r });
  }
}

console.log('\n--- Symptom Source Classification ---');
console.log(`Valid Specific Symptom Descriptions: ${symptomCategories.validSpecific.length}`);
console.log(`Placeholders / Generic Labels: ${symptomCategories.placeholders.length}`);
console.log(`Short Text (<5 chars): ${symptomCategories.shortOrGeneric.length}`);
console.log(`Missing / Null: ${symptomCategories.missingOrNull.length}`);

console.log('\n--- Distinct Reasons Distribution (Top 25) ---');
const sortedReasons = Object.entries(reasonsSample).sort((a, b) => b[1] - a[1]);
console.table(sortedReasons.slice(0, 25).map(([reason, count]) => ({ reason, count })));

// Check existing AI predictions
const withAiPred = novAppts.filter(a => a.ai_prediction_id);
console.log(`\nAppointments with existing ai_prediction_id: ${withAiPred.length}`);

// Check statuses
const statusCounts = {};
for (const a of novAppts) {
  statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
}
console.log('Status breakdown:', statusCounts);

// Check appointment types
const typeCounts = {};
for (const a of novAppts) {
  typeCounts[a.appointment_type || 'NONE'] = (typeCounts[a.appointment_type || 'NONE'] || 0) + 1;
}
console.log('Appointment type breakdown:', typeCounts);

await mongoose.disconnect();
