import React, { useState } from 'react';

export function AvailabilityView({
  doctorProfile,
  onSaveAvailability,
}) {
  const [schedule, setSchedule] = useState(
    doctorProfile?.availabilitySchedule || [
      { day: 'Monday', time: '09:00 AM – 03:00 PM', slots: 12, status: 'Active' },
      { day: 'Tuesday', time: '09:00 AM – 01:00 PM', slots: 8, status: 'Active' },
      { day: 'Wednesday', time: '09:00 AM – 03:00 PM', slots: 12, status: 'Active' },
      { day: 'Thursday', time: '09:00 AM – 01:00 PM', slots: 8, status: 'Active' },
      { day: 'Friday', time: '09:00 AM – 03:00 PM', slots: 12, status: 'Active' },
      { day: 'Saturday', time: '09:00 AM – 12:00 PM', slots: 6, status: 'Active' },
      { day: 'Sunday', time: 'Off Duty', slots: 0, status: 'Off' },
    ]
  );
  const [slotDuration, setSlotDuration] = useState(doctorProfile?.slotDurationMinutes || 15);
  const [saving, setSaving] = useState(false);

  const handleToggleDay = (dayName) => {
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.day === dayName) {
          const isCurrentlyActive = item.status === 'Active';
          return {
            ...item,
            status: isCurrentlyActive ? 'Off' : 'Active',
            time: isCurrentlyActive ? 'Off Duty' : '09:00 AM – 01:00 PM',
            slots: isCurrentlyActive ? 0 : 8,
          };
        }
        return item;
      })
    );
  };

  const handleTimeChange = (dayName, newTime) => {
    setSchedule((prev) =>
      prev.map((item) => (item.day === dayName ? { ...item, time: newTime } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveAvailability(schedule, slotDuration);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Consultation Availability & OPD Shift Management
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Configure your weekly outpatient consultation hours, slot duration, and off-duty periods
            </p>
          </div>
          <button className="doctor-btn doctor-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability Schedule'}
          </button>
        </div>
      </div>

      {/* Global Config Card */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)' }}>
              Standard Consultation Slot Duration
            </strong>
            <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
              Determines the automated interval for family online booking slots
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                className={`doctor-btn doctor-btn-sm ${slotDuration === mins ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                onClick={() => setSlotDuration(mins)}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Days Table */}
      <div className="doctor-card">
        <div className="doctor-table-container">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>Day of Week</th>
                <th>OPD Timings</th>
                <th>Bookable Slot Capacity</th>
                <th>Shift Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr key={item.day}>
                  <td>
                    <strong style={{ fontSize: '14px', color: 'var(--doctor-text-primary)' }}>{item.day}</strong>
                  </td>
                  <td>
                    {item.status === 'Active' ? (
                      <input
                        className="doctor-input"
                        value={item.time}
                        onChange={(e) => handleTimeChange(item.day, e.target.value)}
                        style={{ maxWidth: '240px', padding: '6px 10px', fontSize: '13px' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--doctor-text-muted)', fontSize: '13px' }}>Off Duty (No OPD)</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{item.status === 'Active' ? `${item.slots} Slots` : '0 Slots'}</span>
                  </td>
                  <td>
                    <span className={`doctor-badge doctor-badge-${item.status.toLowerCase()}`}>
                      ● {item.status === 'Active' ? 'Available' : 'Off Duty'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className={`doctor-btn doctor-btn-sm ${item.status === 'Active' ? 'doctor-btn-outline' : 'doctor-btn-primary'}`}
                        onClick={() => handleToggleDay(item.day)}
                      >
                        {item.status === 'Active' ? 'Mark Off-Duty' : 'Set Available'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityView;
