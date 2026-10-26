/**
 * MediMind Platform - Dynamic Relative Date & Period Utilities
 * Enforces standardized relative date calculations across all platform analytics,
 * reports, charts, and filter dropdowns.
 */

export const STANDARDIZED_ANALYTICS_PERIODS = [
  'This Month',
  'Previous Month',
  'This Quarter',
  'Previous Quarter',
  'Last 3 Months',
  'This Half Year',
  'This Year',
  'All Time',
];

export const HOSPITAL_ADMIN_PERIOD_OPTIONS = STANDARDIZED_ANALYTICS_PERIODS;
export const RELATIVE_PERIOD_OPTIONS = STANDARDIZED_ANALYTICS_PERIODS;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDateUTC(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function getRelativeDateRange(period, refDate = new Date()) {
  const p = (period || 'All Time').trim();
  const d = refDate instanceof Date ? refDate : new Date(refDate);

  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-indexed (0 = Jan, ..., 11 = Dec)
  const day = d.getUTCDate();

  if (p === 'This Month' || p === 'Current Month') {
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
    const fullEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    const label = start.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    return { startDate, endDate, fullEndDate: formatDateUTC(fullEnd), label, periodName: 'This Month' };
  } else if (p === 'Previous Month' || p === 'Last Month') {
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    const label = start.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    return { startDate, endDate, label, periodName: 'Previous Month' };
  } else if (p === 'This Quarter' || p === 'Current Quarter') {
    const q = Math.floor(m / 3) + 1;
    const qStartMonth = (q - 1) * 3;
    const start = new Date(Date.UTC(y, qStartMonth, 1, 0, 0, 0, 0));
    const fullQuarterEnd = new Date(Date.UTC(y, qStartMonth + 3, 0, 23, 59, 59, 999));
    const end = d > fullQuarterEnd ? fullQuarterEnd : new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    const fullEndDate = formatDateUTC(fullQuarterEnd);
    return {
      startDate,
      endDate,
      fullEndDate,
      quarterStartDate: startDate,
      quarterEndDate: fullEndDate,
      label: `Q${q} ${y}`,
      periodName: 'This Quarter',
    };
  } else if (p === 'Previous Quarter' || p === 'Last Quarter') {
    const q = Math.floor(m / 3) + 1;
    const prevQ = q === 1 ? 4 : q - 1;
    const prevY = q === 1 ? y - 1 : y;
    const qStartMonth = (prevQ - 1) * 3;
    const start = new Date(Date.UTC(prevY, qStartMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(prevY, qStartMonth + 3, 0, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    return {
      startDate,
      endDate,
      quarterStartDate: startDate,
      quarterEndDate: endDate,
      label: `Q${prevQ} ${prevY}`,
      periodName: 'Previous Quarter',
    };
  } else if (p === 'Last 3 Months') {
    const targetY = m >= 3 ? y : y - 1;
    const targetM = (m - 3 + 12) % 12;
    const daysInTargetMonth = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
    const targetDay = Math.min(day, daysInTargetMonth);
    const start = new Date(Date.UTC(targetY, targetM, targetDay, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    const startMonthStr = start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const endMonthStr = end.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    return {
      startDate,
      endDate,
      label: `${startMonthStr} – ${endMonthStr}`,
      periodName: 'Last 3 Months',
    };
  } else if (p === 'This Half Year' || p === 'Current Half Year' || p === 'Last 6 Months') {
    const h = m < 6 ? 1 : 2;
    const hStartMonth = h === 1 ? 0 : 6;
    const start = new Date(Date.UTC(y, hStartMonth, 1, 0, 0, 0, 0));
    const fullEnd = new Date(Date.UTC(y, hStartMonth + 6, 0, 23, 59, 59, 999));
    const end = d > fullEnd ? fullEnd : new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    return {
      startDate,
      endDate,
      fullEndDate: formatDateUTC(fullEnd),
      label: `H${h} ${y} (${h === 1 ? 'Jan–Jun' : 'Jul–Dec'})`,
      periodName: 'This Half Year',
    };
  } else if (p === 'This Year' || p === 'Current Year') {
    const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
    const fullEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    const end = d > fullEnd ? fullEnd : new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    return {
      startDate,
      endDate,
      fullEndDate: formatDateUTC(fullEnd),
      label: `${y}`,
      periodName: 'This Year',
    };
  } else if (p === 'Previous Year' || p === 'Last Year' || p === 'Last 1 Year') {
    const start = new Date(Date.UTC(y - 1, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59, 999));
    const startDate = formatDateUTC(start);
    const endDate = formatDateUTC(end);
    return { startDate, endDate, label: `${y - 1}`, periodName: 'Previous Year' };
  }

  return { startDate: null, endDate: null, label: 'All Time', periodName: 'All Time' };
}

export function getCurrentMonthLabel(refDate = new Date()) {
  return refDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function getPreviousMonthLabel(refDate = new Date()) {
  const d = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function getCurrentCycleText(refDate = new Date()) {
  return `Current Cycle: ${getCurrentMonthLabel(refDate)}`;
}
