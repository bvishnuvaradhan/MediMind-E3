import fs from 'fs';

let content = fs.readFileSync('./backend/appointment-service/src/models/Appointment.js', 'utf8');

if (!content.includes('idempotency_key:')) {
  content = content.replace(
    'replacement_appointment_id: {',
    `idempotency_key: {\n      type: String,\n      default: null,\n      index: true,\n    },\n\n    replacement_appointment_id: {`
  );

  content = content.replace(
    'replacement_appointment_id: this.replacement_appointment_id,',
    `replacement_appointment_id: this.replacement_appointment_id,\n    idempotencyKey: this.idempotency_key,\n    idempotency_key: this.idempotency_key,`
  );

  fs.writeFileSync('./backend/appointment-service/src/models/Appointment.js', content, 'utf8');
  console.log('Appointment.js updated with idempotency_key');
} else {
  console.log('idempotency_key already present in Appointment.js');
}
