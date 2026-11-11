import fs from 'fs';

const p = 'backend/appointment-service/src/models/Appointment.js';
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('rescheduling_history')) {
  // Replace replacement_appointment_id block
  content = content.replace(
    /replacement_appointment_id:\s*\{[\s\S]*?index:\s*true,\s*\},/m,
    (match) => `${match}\r\n\r\n    rescheduling_history: [\r\n      {\r\n        previous_appointment_date: { type: Date },\r\n        previous_start_time: { type: String, trim: true },\r\n        previous_end_time: { type: String, trim: true },\r\n        new_appointment_date: { type: Date },\r\n        new_start_time: { type: String, trim: true },\r\n        new_end_time: { type: String, trim: true },\r\n        rescheduled_at: { type: Date, default: Date.now },\r\n        rescheduled_by: { type: String, default: null },\r\n        reason: { type: String, default: null, trim: true },\r\n      },\r\n    ],`
  );

  // Replace in toPublicJSON
  content = content.replace(
    /replacement_appointment_id:\s*this\.replacement_appointment_id,/m,
    (match) => `${match}\r\n    reschedulingHistory: this.rescheduling_history || [],\r\n    rescheduling_history: this.rescheduling_history || [],`
  );

  fs.writeFileSync(p, content, 'utf8');
  console.log('✓ Successfully updated Appointment.js with rescheduling_history');
} else {
  console.log('rescheduling_history already present in Appointment.js');
}
