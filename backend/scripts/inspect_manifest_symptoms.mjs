import fs from 'fs';

const manifest = JSON.parse(fs.readFileSync('./backend/scripts/phase16_missing_ai_manifest.json', 'utf8'));

let validSymptoms = 0;
let shortOrEmptySymptoms = 0;

for (const item of manifest) {
  const sym = (item.patient_symptoms || '').trim();
  if (sym.length >= 3 && !['none', 'n/a', 'null', 'undefined'].includes(sym.toLowerCase())) {
    validSymptoms++;
  } else {
    shortOrEmptySymptoms++;
  }
}

console.log({
  totalItems: manifest.length,
  validSymptoms,
  shortOrEmptySymptoms
});
