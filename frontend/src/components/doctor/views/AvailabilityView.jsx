import React, { useState, useMemo } from 'react';
import {
  timeStringToMinutes,
  format24To12,
  calculateDaySlots,
} from '../doctorAvailabilityUtils';

const DEFAULT_SCHEDULE = [
  { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '15:00', lunchStart: '13:00', lunchEnd: '14:00' },
  { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '13:00', lunchStart: '13:00', lunchEnd: '14:00' },
  { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '15:00', lunchStart: '13:00', lunchEnd: '14:00' },
  { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '13:00', lunchStart: '13:00', lunchEnd: '14:00' },
  { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '15:00', lunchStart: '13:00', lunchEnd: '14:00' },
  { day: 'Saturday', isWorking: true, startTime: '09:00', endTime: '12:00', lunchStart: '13:00', lunchEnd: '14:00' },
  { day: 'Sunday', isWorking: false, startTime: '09:00', endTime: '13:00', lunchStart: '13:00', lunchEnd: '14:00' },
];

function normalizeSchedule(rawSchedule) {
  if (!Array.isArray(rawSchedule) || rawSchedule.length === 0) {
    return DEFAULT_SCHEDULE;
  }
  return DEFAULT_SCHEDULE.map((defaultItem) => {
    const found = rawSchedule.find((item) => item.day === defaultItem.day);
    if (!found) return defaultItem;
    // Handle migration from legacy { time: '09:00 AM – 03:00 PM', status: 'Active' } if present
    if (typeof found.isWorking === 'boolean') {
      return {
        ...defaultItem,
        ...found,
        startTime: found.startTime || defaultItem.startTime,
        endTime: found.endTime || defaultItem.endTime,
        lunchStart: '13:00',
        lunchEnd: '14:00',
      };
    }
    const isWorking = found.status === 'Active' && found.time !== 'Off Duty';
    let startTime = defaultItem.startTime;
    let endTime = defaultItem.endTime;
    if (found.time && found.time.includes('–')) {
      const parts = found.time.split('–').map((p) => p.trim());
      if (parts.length === 2) {
        // Convert '09:00 AM' -> '09:00'
        const parse12To24 = (str) => {
          const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (!match) return null;
          let h = parseInt(match[1], 10);
          const m = match[2];
          const ampm = (match[3] || '').toUpperCase();
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return `${h < 10 ? '0' + h : h}:${m}`;
        };
        startTime = parse12To24(parts[0]) || startTime;
        endTime = parse12To24(parts[1]) || endTime;
      }
    }
    return {
      day: defaultItem.day,
      isWorking,
      startTime,
      endTime,
      lunchStart: '13:00',
      lunchEnd: '14:00',
    };
  });
}

export function AvailabilityView({
  doctorProfile,
  onSaveAvailability,
}) {
  const [schedule, setSchedule] = useState(() =>
    normalizeSchedule(doctorProfile?.availabilitySchedule)
  );
  const [slotDuration, setSlotDuration] = useState(
    doctorProfile?.slotDurationMinutes || 20
  );
  const [bufferMinutes, setBufferMinutes] = useState(
    doctorProfile?.bufferMinutes || 3
  );
  const [saving, setSaving] = useState(false);
  const [previewDay, setPreviewDay] = useState('Monday');

  // Calculate slots map for each day
  const slotsMap = useMemo(() => {
    const map = {};
    schedule.forEach((dayConfig) => {
      map[dayConfig.day] = calculateDaySlots({
        isWorking: dayConfig.isWorking,
        startTime: dayConfig.startTime,
        endTime: dayConfig.endTime,
        slotDuration,
        bufferMinutes,
        lunchStart: '13:00',
        lunchEnd: '14:00',
      });
    });
    return map;
  }, [schedule, slotDuration, bufferMinutes]);

  const handleToggleDay = (dayName) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.day === dayName) {
          const nextWorking = !item.isWorking;
          return {
            ...item,
            isWorking: nextWorking,
            // Reset to reasonable defaults if turning on
            startTime: item.startTime || '09:00',
            endTime: item.endTime || (dayName === 'Saturday' ? '12:00' : '15:00'),
          };
        }
        return item;
      })
    );
  };

  const handleStartTimeChange = (dayName, newStartTime) => {
    setSchedule((prev) =>
      prev.map((item) => (item.day === dayName ? { ...item, startTime: newStartTime } : item))
    );
  };

  const handleEndTimeChange = (dayName, newEndTime) => {
    setSchedule((prev) =>
      prev.map((item) => (item.day === dayName ? { ...item, endTime: newEndTime } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveAvailability(schedule, slotDuration, bufferMinutes);
    } finally {
      setSaving(false);
    }
  };

  const activePreviewSlots = slotsMap[previewDay] || [];
  const activePreviewDayConfig = schedule.find((s) => s.day === previewDay);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Card */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Consultation Availability & OPD Shift Management
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Configure your weekly outpatient consultation hours, slot duration, buffer, and off-duty periods
            </p>
          </div>
          <button className="doctor-btn doctor-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability Schedule'}
          </button>
        </div>
      </div>

      {/* Global Parameters & Lunch Break Rules Card */}
      <div className="doctor-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Consultation Slot Duration */}
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)', display: 'block', marginBottom: '4px' }}>
              Standard Consultation Slot Duration
            </strong>
            <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginBottom: '10px' }}>
              Actual doctor-patient consultation time allocated per booking
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`doctor-btn doctor-btn-sm ${slotDuration === mins ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                  onClick={() => setSlotDuration(mins)}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          </div>

          {/* Consultation Buffer Gap */}
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)', display: 'block', marginBottom: '4px' }}>
              Turnaround Buffer Gap Between Slots
            </strong>
            <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginBottom: '10px' }}>
              Buffer between sequential appointments (sanitization / notes)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[2, 3].map((gap) => (
                <button
                  key={gap}
                  type="button"
                  className={`doctor-btn doctor-btn-sm ${bufferMinutes === gap ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                  onClick={() => setBufferMinutes(gap)}
                >
                  {gap} Minutes {gap === 3 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Protected Lunch Break Policy */}
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', border: '1px solid var(--doctor-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px' }}>🍽️</span>
              <strong style={{ fontSize: '13px', color: 'var(--doctor-text-primary)' }}>
                Protected Lunch Break (Fixed)
              </strong>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--doctor-coral)', marginTop: '2px' }}>
              01:00 PM – 02:00 PM (13:00 – 14:00)
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)', marginTop: '4px' }}>
              No bookable consultations may overlap this period. Sequential slot generation automatically pauses and resumes at 02:00 PM.
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Configuration Table */}
      <div className="doctor-card">
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
            Weekly OPD Duty Schedule & Computed Capacity
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
            Set accurate OPD Start and End times using the time pickers. Bookable capacity is computed automatically based on slot duration, buffer, and lunch break exclusion.
          </p>
        </div>

        <div className="doctor-table-container">
          <table className="doctor-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Day of Week</th>
                <th style={{ minWidth: '300px' }}>OPD Timings (Time Pickers)</th>
                <th style={{ width: '180px' }}>Bookable Slot Capacity</th>
                <th style={{ width: '140px' }}>Shift Status</th>
                <th style={{ textAlign: 'right', minWidth: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => {
                const slots = slotsMap[item.day] || [];
                const startMin = timeStringToMinutes(item.startTime);
                const endMin = timeStringToMinutes(item.endTime);
                const isInvalidRange = item.isWorking && (startMin === null || endMin === null || startMin >= endMin);
                const isSelectedForPreview = previewDay === item.day;

                return (
                  <tr key={item.day} style={{ backgroundColor: isSelectedForPreview ? 'var(--doctor-card-hover)' : 'transparent' }}>
                    <td>
                      <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)' }}>{item.day}</strong>
                    </td>
                    <td>
                      {item.isWorking ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="time"
                              className="doctor-input"
                              value={item.startTime}
                              onChange={(e) => handleStartTimeChange(item.day, e.target.value)}
                              style={{ width: '120px', padding: '6px 8px', fontSize: '13px' }}
                              aria-label={`${item.day} OPD Start Time`}
                            />
                            <span style={{ color: 'var(--doctor-text-muted)', fontWeight: 600 }}>–</span>
                            <input
                              type="time"
                              className="doctor-input"
                              value={item.endTime}
                              onChange={(e) => handleEndTimeChange(item.day, e.target.value)}
                              style={{ width: '120px', padding: '6px 8px', fontSize: '13px' }}
                              aria-label={`${item.day} OPD End Time`}
                            />
                          </div>
                          {isInvalidRange ? (
                            <span style={{ fontSize: '11.5px', color: 'var(--doctor-coral)', fontWeight: 600 }}>
                              ⚠️ Invalid Range (Start must precede End)
                            </span>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>
                              Selected: <strong>{format24To12(item.startTime)} – {format24To12(item.endTime)}</strong>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--doctor-text-muted)', fontSize: '13px', fontWeight: 500 }}>
                          Off Duty (No OPD)
                        </span>
                      )}
                    </td>
                    <td>
                      {item.isWorking && !isInvalidRange ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="doctor-badge doctor-badge-completed" style={{ fontSize: '12px' }}>
                            {slots.length} Bookable Slots
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--doctor-text-muted)', fontSize: '12.5px' }}>
                          0 Slots (Read-only)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`doctor-badge ${item.isWorking ? 'doctor-badge-active' : 'doctor-badge-off'}`}>
                        ● {item.isWorking ? 'Available' : 'Off Duty'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                        {item.isWorking && (
                          <button
                            type="button"
                            className={`doctor-btn doctor-btn-sm ${isSelectedForPreview ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                            onClick={() => setPreviewDay(item.day)}
                            style={{ fontSize: '11.5px', padding: '4px 8px' }}
                          >
                            {isSelectedForPreview ? 'Viewing Slots' : 'Preview Slots'}
                          </button>
                        )}
                        <button
                          type="button"
                          className={`doctor-btn doctor-btn-sm ${item.isWorking ? 'doctor-btn-outline' : 'doctor-btn-primary'}`}
                          onClick={() => handleToggleDay(item.day)}
                          style={{ minWidth: '110px' }}
                        >
                          {item.isWorking ? 'Mark Off-Duty' : 'Set Available'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Slot Breakdown / Calculation Inspection Card */}
      <div className="doctor-card" style={{ borderLeft: '4px solid var(--doctor-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: 'var(--doctor-text-primary)' }}>
              Live Slot Calculation Breakdown: {previewDay}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
              {activePreviewDayConfig?.isWorking ? (
                <>
                  OPD Hours: <strong>{format24To12(activePreviewDayConfig.startTime)} – {format24To12(activePreviewDayConfig.endTime)}</strong> • Slot Duration: <strong>{slotDuration} mins</strong> • Buffer: <strong>{bufferMinutes} mins</strong> • Lunch: <strong>01:00 PM – 02:00 PM</strong>
                </>
              ) : (
                'Doctor is marked off-duty on this day.'
              )}
            </div>
          </div>
          {activePreviewDayConfig?.isWorking && (
            <div style={{ textAlign: 'right' }}>
              <span className="doctor-badge doctor-badge-completed" style={{ fontSize: '13px', padding: '4px 10px' }}>
                Total Bookable Capacity: {activePreviewSlots.length} Slots
              </span>
            </div>
          )}
        </div>

        {activePreviewDayConfig?.isWorking ? (
          activePreviewSlots.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', color: 'var(--doctor-text-muted)', fontSize: '13px' }}>
              No slots can fit in the selected time window with the current {slotDuration}-minute slot duration and lunch hours.
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {activePreviewSlots.map((s) => (
                  <div
                    key={s.slotNumber}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--doctor-bg)',
                      border: '1px solid var(--doctor-border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--doctor-text-muted)', fontSize: '11px' }}>
                      #{s.slotNumber}
                    </span>
                    <strong style={{ color: 'var(--doctor-text-primary)' }}>{s.label}</strong>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--doctor-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>ℹ️</span>
                <span>
                  Slots are generated sequentially ({slotDuration}m consultation + {bufferMinutes}m buffer). 01:00 PM – 02:00 PM lunch window is fully protected and skipped. Slots that would exceed OPD end time ({format24To12(activePreviewDayConfig.endTime)}) are not generated.
                </span>
              </div>
            </div>
          )
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', color: 'var(--doctor-text-muted)', fontSize: '13px' }}>
            Doctor is marked off-duty on {previewDay}. Click "Set Available" in the table above to configure OPD hours.
          </div>
        )}
      </div>
    </div>
  );
}

export default AvailabilityView;
