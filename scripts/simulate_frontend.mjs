import fs from 'fs';
import { chairmen, hospitalAdmins, departmentHeads, doctors, families } from '../frontend/src/data/medimindData.js';

const accounts = JSON.parse(fs.readFileSync('scripts/full_59_accounts_audit.json', 'utf8'));

let mismatches = 0;
for (const acc of accounts) {
  const cleanEmail = acc.email.trim().toLowerCase();
  const role = acc.role;
  let resolvedName = '';
  let resolvedHospital = '';
  
  if (role === 'CHAIRMAN') {
    const matched = chairmen.find(c => c.email.toLowerCase() === cleanEmail) ||
      (cleanEmail.includes('menon') ? chairmen[1] : chairmen[0]);
    resolvedName = matched.name;
  } else if (role === 'HOSPITAL_ADMIN') {
    const matched = hospitalAdmins.find(ha => ha.email.toLowerCase() === cleanEmail) ||
      (cleanEmail.includes('apexmetro') ? hospitalAdmins[1] : cleanEmail.includes('stjude') ? hospitalAdmins[2] : hospitalAdmins[0]);
    resolvedName = matched.name;
    resolvedHospital = matched.hospitalName;
  } else if (role === 'DEPARTMENT_HEAD') {
    const matched = departmentHeads.find(dh => dh.email.toLowerCase() === cleanEmail) || departmentHeads[0];
    resolvedName = matched.name;
    resolvedHospital = matched.hospitalName;
  } else if (role === 'DOCTOR') {
    const matched = doctors.find(doc => doc.email.toLowerCase() === cleanEmail) || doctors[0];
    resolvedName = matched.name;
    resolvedHospital = matched.hospitalName;
  } else if (role === 'FAMILY') {
    const matched = families.find(f => f.email?.toLowerCase() === cleanEmail) || families[0];
    resolvedName = matched.primaryContact || matched.name;
  }
  
  const isMatch = resolvedName.toLowerCase() === acc.excel_name.toLowerCase();
  if (!isMatch) {
    mismatches++;
    console.log(`MISMATCH [${role}] ${cleanEmail}: Expected '${acc.excel_name}', Frontend shows '${resolvedName}' (Hospital: '${resolvedHospital}')`);
  }
}

console.log(`Total Frontend Mismatches: ${mismatches} / ${accounts.length}`);
