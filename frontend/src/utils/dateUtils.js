/**
 * MediMind Platform - Dynamic Relative Date & Period Utilities
 * Enforces standardized relative date calculations across all platform analytics,
 * reports, charts, and filter dropdowns.
 */

export const STANDARDIZED_ANALYTICS_PERIODS = [
  'This Month',
  'Previous Month',
  'This Quarter',
  'This Half Year',
  'This Year',
  'All Time',
];

export const RELATIVE_PERIOD_OPTIONS = STANDARDIZED_ANALYTICS_PERIODS;

export function getRelativeDateRange(period, refDate = new Date()) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

  const p = (period || 'All Time').trim();

  if (p === 'This Month' || p === 'Current Month') {
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const label = refDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return { startDate, endDate, label, periodName: 'This Month' };
  } else if (p === 'Previous Month' || p === 'Last Month') {
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    const label = start.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return { startDate, endDate, label, periodName: 'Previous Month' };
  } else if (p === 'This Quarter' || p === 'Current Quarter') {
    const q = Math.floor(m / 3) + 1;
    const qStartMonth = (q - 1) * 3;
    const start = new Date(Date.UTC(y, qStartMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, qStartMonth + 3, 0, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    return { startDate, endDate, label: `Q${q} ${y}`, periodName: 'This Quarter' };
  } else if (p === 'Previous Quarter' || p === 'Last Quarter') {
    const q = Math.floor(m / 3) + 1;
    const prevQ = q === 1 ? 4 : q - 1;
    const prevY = q === 1 ? y - 1 : y;
    const qStartMonth = (prevQ - 1) * 3;
    const start = new Date(Date.UTC(prevY, qStartMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(prevY, qStartMonth + 3, 0, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    return { startDate, endDate, label: `Q${prevQ} ${prevY}`, periodName: 'Previous Quarter' };
  } else if (p === 'This Half Year' || p === 'Current Half Year' || p === 'Last 6 Months') {
    const h = m < 6 ? 1 : 2;
    const hStartMonth = h === 1 ? 0 : 6;
    const start = new Date(Date.UTC(y, hStartMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, hStartMonth + 6, 0, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    return { startDate, endDate, label: `H${h} ${y} (${h === 1 ? 'Jan–Jun' : 'Jul–Dec'})`, periodName: 'This Half Year' };
  } else if (p === 'This Year' || p === 'Current Year') {
    const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    return { startDate, endDate, label: `${y}`, periodName: 'This Year' };
  } else if (p === 'Previous Year' || p === 'Last Year' || p === 'Last 1 Year') {
    const start = new Date(Date.UTC(y - 1, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59, 999));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    return { startDate, endDate, label: `${y - 1}`, periodName: 'Previous Year' };
  } else if (p === 'Last 3 Months') {
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    const start = new Date(Date.UTC(y, m - 2, 1, 0, 0, 0, 0));
    const startDate = start.toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10);
    return { startDate, endDate, label: `${start.toLocaleString('en-US', { month: 'short' })} – ${end.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`, periodName: 'Last 3 Months' };
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
