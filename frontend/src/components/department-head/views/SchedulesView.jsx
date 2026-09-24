import React, { useState } from 'react';

export function SchedulesView({
  schedules = [],
  doctors = [],
  onUpdateScheduleStatus,
}) {
  const [selectedDay, setSelectedDay] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');

  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredSchedules = schedules.filter((sch) => {
    const matchDay = selectedDay === 'All' || sch.day === selectedDay;
    const matchDoctor = doctorFilter === 'All' || sch.doctorId === doctorFilter;
    return matchDay && matchDoctor;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Department Shift Rosters & Room Allocations
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Coordinate OPD consultation hours, on-call trauma emergency shifts, and room assignments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="dh-badge dh-badge-completed" style={{ padding: '6px 12px' }}>
              Level-1 Trauma Emergency: 24/7 Coverage Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="dh-card" style={{ padding: '16px 20px' }}>
        <div className="dh-filter-bar" style={{ margin: 0 }}>
          <div className="dh-filter-left">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {days.map((d) => (
                <button
                  key={d}
                  className={`dh-btn dh-btn-sm ${selectedDay === d ? 'dh-btn-primary' : 'dh-btn-outline'}`}
                  onClick={() => setSelectedDay(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <select
              className="dh-select"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              style={{ marginLeft: '8px' }}
            >
              <option value="All">All Department Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>
            Showing <strong>{filteredSchedules.length}</strong> roster shifts
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="dh-card">
        <div className="dh-table-container">
          <table className="dh-table">
            <thead>
              <tr>
                <th>Day & Shift</th>
                <th>Doctor</th>
                <th>OPD Room</th>
                <th>Timings</th>
                <th>On-Call Trauma Duty</th>
                <th>Roster Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--dh-text-muted)' }}>
                    No roster entries found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((sch) => (
                  <tr key={sch.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--dh-text-primary)' }}>{sch.day}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>{sch.shift}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sch.doctorName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>Orthopedics</div>
                    </td>
                    <td>
                      <span className="dh-badge dh-badge-draft" style={{ fontWeight: 600 }}>
                        {sch.room}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{sch.startTime} - {sch.endTime}</td>
                    <td>
                      {sch.onCall ? (
                        <span className="dh-badge dh-badge-on-leave" style={{ color: '#b45309', fontWeight: 700 }}>
                          ● Emergency On-Call
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>Regular OPD</span>
                      )}
                    </td>
                    <td>
                      <span className={`dh-badge dh-badge-${sch.status.toLowerCase().replace(' ', '-')}`}>
                        {sch.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="dh-btn dh-btn-outline dh-btn-sm"
                          onClick={() =>
                            onUpdateScheduleStatus(
                              sch.id,
                              sch.status === 'Active' ? 'Completed' : sch.status === 'Completed' ? 'Scheduled' : 'Active'
                            )
                          }
                        >
                          Toggle Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SchedulesView;
