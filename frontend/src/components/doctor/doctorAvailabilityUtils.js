// MediMind Platform - Doctor Availability & Slot Computation Utility
// Programmatic sequential slot generator with fixed 1:00 PM - 2:00 PM lunch exclusion

// Helper: Convert "09:00" to minutes from midnight (e.g., 540)
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

// Helper: Convert minutes from midnight to "09:00 AM"
export function minutesToTimeString(minutes) {
  if (minutes == null || isNaN(minutes) || minutes < 0) return '';
  const totalMin = Math.floor(minutes) % (24 * 60);
  const h24 = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h12)}:${pad(m)} ${period}`;
}

// Helper: Convert "09:00" -> "09:00 AM"
export function format24To12(timeStr) {
  const min = timeStringToMinutes(timeStr);
  return min !== null ? minutesToTimeString(min) : timeStr;
}

// Programmatic sequential slot generator with fixed 1:00 PM - 2:00 PM lunch exclusion
export function calculateDaySlots({
  isWorking,
  startTime,
  endTime,
  slotDuration = 20,
  bufferMinutes = 3,
  lunchStart = '13:00',
  lunchEnd = '14:00',
}) {
  if (!isWorking) return [];
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);
  const lunchStartMin = timeStringToMinutes(lunchStart) ?? 780; // 13:00
  const lunchEndMin = timeStringToMinutes(lunchEnd) ?? 840;   // 14:00
  const duration = parseInt(slotDuration, 10);
  const buffer = parseInt(bufferMinutes, 10);

  if (startMin === null || endMin === null || startMin >= endMin) return [];
  if (isNaN(duration) || duration <= 0) return [];
  if (isNaN(buffer) || (buffer !== 2 && buffer !== 3)) return [];

  const slots = [];
  let currentTime = startMin;
  let iterations = 0;

  while (currentTime + duration <= endMin && iterations < 200) {
    iterations++;
    const slotStart = currentTime;
    const slotEnd = currentTime + duration;

    // Check lunch overlap: slot starts before lunchEnd and ends after lunchStart
    const overlapsLunch = slotStart < lunchEndMin && slotEnd > lunchStartMin;

    if (overlapsLunch) {
      // Advance to after lunch if lunch is before OPD end time
      if (lunchEndMin < endMin) {
        currentTime = lunchEndMin;
        continue;
      } else {
        break;
      }
    }

    // Valid slot
    slots.push({
      slotNumber: slots.length + 1,
      startTime: minutesToTimeString(slotStart),
      endTime: minutesToTimeString(slotEnd),
      startMin: slotStart,
      endMin: slotEnd,
      label: `${minutesToTimeString(slotStart)} – ${minutesToTimeString(slotEnd)}`,
    });

    // Advance time by slot duration + buffer
    currentTime = slotEnd + buffer;

    // If next start time cannot fit before lunch, advance to after lunch
    if (currentTime < lunchStartMin && currentTime + duration > lunchStartMin) {
      if (lunchEndMin < endMin) {
        currentTime = lunchEndMin;
      }
    } else if (currentTime >= lunchStartMin && currentTime < lunchEndMin) {
      if (lunchEndMin < endMin) {
        currentTime = lunchEndMin;
      }
    }
  }

  return slots;
}
