import fs from 'fs';

const apptServicePath = 'backend/appointment-service/src/services/appointmentService.js';
let apptServiceContent = fs.readFileSync(apptServicePath, 'utf8');

const oldTarget = `const targetHospId = match.hospital_id ? match.hospital_id.toString() : null;`;
const newTarget = `const targetHospId = (match.hospital_id && mongoose.Types.ObjectId.isValid(match.hospital_id) && !match.hospital_id['$in'])
      ? match.hospital_id.toString()
      : ((query.hospitalId || query.hospital_id) ? (query.hospitalId || query.hospital_id).toString() : null);`;

if (apptServiceContent.includes(oldTarget)) {
  apptServiceContent = apptServiceContent.replace(oldTarget, newTarget);
  fs.writeFileSync(apptServicePath, apptServiceContent, 'utf8');
  console.log('✓ Fixed targetHospId evaluation in appointmentService.js');
} else {
  console.log('Target string not found or already replaced.');
}
