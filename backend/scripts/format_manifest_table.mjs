import fs from 'fs';
const m = JSON.parse(fs.readFileSync('backend/scripts/backups/phase12_final_prepared_manifest_20261028.json', 'utf8'));
const recs = m.decisions.decision_2_booked_no_show.records;
console.log('| # | Appointment ID | Hospital | Date (UTC) | Created At | Doctor ID | Current | Proposed | Consultation? |');
console.log('|---|---|---|---|---|---|---|---|:---:|');
recs.forEach((r, idx) => {
  console.log(`| ${idx+1} | \`${r._id}\` | ${r.hospital_name} | ${r.appointment_date.slice(0, 16)} | ${r.created_at.slice(0, 10)} | \`${r.doctor_id}\` | \`${r.current_status}\` | **\`${r.proposed_status}\`** | ${r.has_consultation ? 'Yes' : 'No (None)'} |`);
});
