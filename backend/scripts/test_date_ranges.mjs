import assert from 'node:assert';
import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS, HOSPITAL_ADMIN_PERIOD_OPTIONS } from '../../frontend/src/utils/dateUtils.js';

console.log('=== Running Date Ranges & Calendar Quarter Unit Tests ===\n');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    failedCount++;
  }
}

// 1. Period Options Checklist
runTest('Hospital Admin has exactly 8 period options in correct order', () => {
  const expected = [
    'This Month',
    'Previous Month',
    'This Quarter',
    'Previous Quarter',
    'Last 3 Months',
    'This Half Year',
    'This Year',
    'All Time',
  ];
  assert.deepStrictEqual(HOSPITAL_ADMIN_PERIOD_OPTIONS, expected);
  assert.deepStrictEqual(STANDARDIZED_ANALYTICS_PERIODS, expected);
});

// 2. Calendar Quarters Start & End Boundaries
runTest('January 1 -> Q1 starts January 1', () => {
  const clock = new Date('2026-01-01T00:00:00Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-01-01');
  assert.strictEqual(res.quarterStartDate, '2026-01-01');
  assert.strictEqual(res.quarterEndDate, '2026-03-31');
});

runTest('March 31 -> Q1 ends at the correct boundary (March 31)', () => {
  const clock = new Date('2026-03-31T23:59:59Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-01-01');
  assert.strictEqual(res.endDate, '2026-03-31');
  assert.strictEqual(res.quarterEndDate, '2026-03-31');
});

runTest('April 1 -> Q2 starts April 1', () => {
  const clock = new Date('2026-04-01T00:00:00Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-04-01');
  assert.strictEqual(res.quarterStartDate, '2026-04-01');
  assert.strictEqual(res.quarterEndDate, '2026-06-30');
});

runTest('June 30 -> Q2 ends at the correct boundary (June 30)', () => {
  const clock = new Date('2026-06-30T23:59:59Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-04-01');
  assert.strictEqual(res.endDate, '2026-06-30');
  assert.strictEqual(res.quarterEndDate, '2026-06-30');
});

runTest('July 1 -> Q3 starts July 1', () => {
  const clock = new Date('2026-07-01T00:00:00Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-07-01');
  assert.strictEqual(res.quarterStartDate, '2026-07-01');
  assert.strictEqual(res.quarterEndDate, '2026-09-30');
});

runTest('September 30 -> Q3 ends at the correct boundary (September 30)', () => {
  const clock = new Date('2026-09-30T23:59:59Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-07-01');
  assert.strictEqual(res.endDate, '2026-09-30');
  assert.strictEqual(res.quarterEndDate, '2026-09-30');
});

runTest('October 1 -> Q4 starts October 1', () => {
  const clock = new Date('2026-10-01T00:00:00Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-10-01');
  assert.strictEqual(res.quarterStartDate, '2026-10-01');
  assert.strictEqual(res.quarterEndDate, '2026-12-31');
});

runTest('December 31 -> Q4 ends at the correct boundary (December 31)', () => {
  const clock = new Date('2026-12-31T23:59:59Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-10-01');
  assert.strictEqual(res.endDate, '2026-12-31');
  assert.strictEqual(res.quarterEndDate, '2026-12-31');
});

// 3. Quarter Rollover & Preceding Quarter
runTest('Q1 Previous Quarter correctly rolls back into Q4 of the preceding year', () => {
  const clock = new Date('2026-01-15T12:00:00Z');
  const res = getRelativeDateRange('Previous Quarter', clock);
  assert.strictEqual(res.startDate, '2025-10-01');
  assert.strictEqual(res.endDate, '2025-12-31');
  assert.strictEqual(res.label, 'Q4 2025');
});

runTest('Q4 ends in the correct calendar year', () => {
  const clock = new Date('2026-10-26T12:00:00Z');
  const res = getRelativeDateRange('This Quarter', clock);
  assert.strictEqual(res.startDate, '2026-10-01');
  assert.strictEqual(res.quarterEndDate, '2026-12-31');
  assert.ok(res.endDate.startsWith('2026-'));
  assert.strictEqual(res.label, 'Q4 2026');
});

runTest('Previous Quarter is exactly the immediately preceding calendar quarter', () => {
  const clock = new Date('2026-10-26T12:00:00Z'); // In Q4
  const res = getRelativeDateRange('Previous Quarter', clock);
  assert.strictEqual(res.startDate, '2026-07-01');
  assert.strictEqual(res.endDate, '2026-09-30');
  assert.strictEqual(res.label, 'Q3 2026');
});

// 4. Distinction between Previous Quarter and Last 3 Months
runTest('Last 3 Months is a rolling three-calendar-month window, not a calendar quarter', () => {
  const clock = new Date('2026-10-26T12:00:00Z');
  const last3 = getRelativeDateRange('Last 3 Months', clock);
  const prevQ = getRelativeDateRange('Previous Quarter', clock);

  assert.strictEqual(last3.startDate, '2026-07-26');
  assert.strictEqual(last3.endDate, '2026-10-26');
  assert.strictEqual(prevQ.startDate, '2026-07-01');
  assert.strictEqual(prevQ.endDate, '2026-09-30');
  assert.notStrictEqual(last3.startDate, prevQ.startDate);
  assert.notStrictEqual(last3.endDate, prevQ.endDate);
});

// 5. Month Rollover
runTest('Previous Month works across January/December year rollover', () => {
  const clock = new Date('2026-01-10T08:30:00Z');
  const res = getRelativeDateRange('Previous Month', clock);
  assert.strictEqual(res.startDate, '2025-12-01');
  assert.strictEqual(res.endDate, '2025-12-31');
  assert.ok(res.label.includes('Dec 2025'));
});

// 6. Leap-Year & Month-End Arithmetic
runTest('Leap-year February is handled correctly in Last 3 Months', () => {
  const clockLeap = new Date('2024-05-31T00:00:00Z'); // 2024 is leap year
  const resLeap = getRelativeDateRange('Last 3 Months', clockLeap);
  assert.strictEqual(resLeap.startDate, '2024-02-29');
  assert.strictEqual(resLeap.endDate, '2024-05-31');

  const clockNonLeap = new Date('2026-05-31T00:00:00Z'); // 2026 is non-leap year
  const resNonLeap = getRelativeDateRange('Last 3 Months', clockNonLeap);
  assert.strictEqual(resNonLeap.startDate, '2026-02-28');
  assert.strictEqual(resNonLeap.endDate, '2026-05-31');
});

runTest('Month-end date arithmetic handles the 28th, 29th, 30th, and 31st correctly', () => {
  // 31st: March 31 -> 3 months back is Dec 31
  const clock31 = new Date('2026-03-31T00:00:00Z');
  assert.strictEqual(getRelativeDateRange('Last 3 Months', clock31).startDate, '2025-12-31');

  // 30th: Nov 30 -> 3 months back is Aug 30
  const clock30 = new Date('2026-11-30T00:00:00Z');
  assert.strictEqual(getRelativeDateRange('Last 3 Months', clock30).startDate, '2026-08-30');

  // 29th: March 29 in leap year -> Dec 29
  const clock29 = new Date('2024-03-29T00:00:00Z');
  assert.strictEqual(getRelativeDateRange('Last 3 Months', clock29).startDate, '2023-12-29');

  // 28th: May 28 -> Feb 28
  const clock28 = new Date('2026-05-28T00:00:00Z');
  assert.strictEqual(getRelativeDateRange('Last 3 Months', clock28).startDate, '2026-02-28');
});

// 7. Timezone and Non-overlapping Boundaries
runTest('Timezone boundaries do not include or exclude adjacent-day records incorrectly', () => {
  const clock = new Date('2026-10-26T23:59:59.999Z');
  const res = getRelativeDateRange('This Month', clock);
  assert.strictEqual(res.startDate, '2026-10-01');
  assert.strictEqual(res.endDate, '2026-10-26');
});

runTest('Start-inclusive and end-exclusive / end-of-day boundaries do not double-count records', () => {
  // Previous quarter ends on 2026-09-30; This quarter starts on 2026-10-01
  const clock = new Date('2026-10-26T12:00:00Z');
  const prevQ = getRelativeDateRange('Previous Quarter', clock);
  const thisQ = getRelativeDateRange('This Quarter', clock);

  assert.strictEqual(prevQ.endDate, '2026-09-30');
  assert.strictEqual(thisQ.startDate, '2026-10-01');

  const prevQEnd = new Date(prevQ.endDate);
  const thisQStart = new Date(thisQ.startDate);
  assert.ok(thisQStart > prevQEnd, 'Start of This Quarter is strictly after end of Previous Quarter');
});

console.log(`\nTests Completed: ${passedCount} passed, ${failedCount} failed.`);
if (failedCount > 0) {
  process.exit(1);
}
