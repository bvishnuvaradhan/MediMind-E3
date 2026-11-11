import fs from 'fs';
import path from 'path';

const testPath = path.resolve('frontend/e2e/test_phase16_intake_equality_and_cutoff.mjs');
let content = fs.readFileSync(testPath, 'utf-8').replace(/\r\n/g, '\n');

// 1. Table 3 check
const t3Target = `  // Check badges in Table 3: "Equality Verified" and "unscreened legacy"
  const table3Content = await (await table3Card.$('table.data-table')).textContent();
  if (!table3Content.includes('Equality Verified') || !table3Content.includes('unscreened legacy')) {
    throw new Error('Table 3 does not display expected Equality Verified and unscreened legacy indicators');
  }
  console.log('✓ PASS: Table 3 displays Equality Verified badges and unscreened legacy indicators.');`;

const t3Replacement = `  // Check badges in Table 3: "Equality Verified"
  const table3Content = await (await table3Card.$('table.data-table')).textContent();
  if (!table3Content.includes('Equality Verified')) {
    throw new Error('Table 3 does not display expected Equality Verified indicators');
  }
  console.log('✓ PASS: Table 3 displays Equality Verified badges across all cohort months.');`;

// 2. HA table check
const haTarget = `  const haTableText = await adminPage.textContent('table.ha-table');
  if (!haTableText.includes('Equality Verified') || !haTableText.includes('unscreened legacy')) {
    throw new Error('Hospital Admin table does not show Equality Verified / unscreened legacy badges');
  }
  console.log('✓ PASS: Hospital Admin table displays Equality Verified and unscreened legacy badges.');`;

const haReplacement = `  const haTableText = await adminPage.textContent('table.ha-table');
  if (!haTableText.includes('Equality Verified')) {
    throw new Error('Hospital Admin table does not show Equality Verified badges');
  }
  console.log('✓ PASS: Hospital Admin table displays Equality Verified badges across all cohort months.');`;

if (!content.includes(t3Target)) {
  console.error('Target 1 not found');
  process.exit(1);
}
if (!content.includes(haTarget)) {
  console.error('Target 2 not found');
  process.exit(1);
}

content = content.replace(t3Target, t3Replacement).replace(haTarget, haReplacement);
fs.writeFileSync(testPath, content, 'utf-8');
console.log('Patched test_phase16_intake_equality_and_cutoff.mjs successfully!');
