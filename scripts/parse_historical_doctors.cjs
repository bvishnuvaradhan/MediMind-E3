const { execSync } = require('child_process');
const fs = require('fs');

const raw = execSync('git show a079b5b:frontend/src/data/medimindData.js', { maxBuffer: 15 * 1024 * 1024, encoding: 'utf-8' });
const startIdx = raw.indexOf('export const doctors = [');
const endIdx = raw.indexOf('export const families = [', startIdx);
const slice = raw.substring(startIdx, endIdx);

// Count doctors by finding lines that have id: 'doc_' or id: 'DOC-
const lines = slice.split('\n');
const doctorItems = [];
let currentDoc = null;

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed === '{') {
    currentDoc = {};
  } else if (trimmed.startsWith('},') || trimmed === '}') {
    if (currentDoc && currentDoc.id) {
      doctorItems.push(currentDoc);
    }
    currentDoc = null;
  } else if (currentDoc) {
    const m = trimmed.match(/^([a-zA-Z0-9_]+):\s*(.*?),?$/);
    if (m) {
      const key = m[1];
      let val = m[2];
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      currentDoc[key] = val;
    }
  }
}

console.log('Total parsed doctors in commit a079b5b:', doctorItems.length);
fs.writeFileSync('scripts/historical_66_doctors.json', JSON.stringify(doctorItems, null, 2), 'utf-8');
console.log('Saved to scripts/historical_66_doctors.json');

// Group by hospital and status
const byHosp = {};
const byStatus = {};
for (const d of doctorItems) {
  byHosp[d.hospitalId] = (byHosp[d.hospitalId] || 0) + 1;
  byStatus[d.status] = (byStatus[d.status] || 0) + 1;
}
console.log('By Hospital:', byHosp);
console.log('By Status:', byStatus);
