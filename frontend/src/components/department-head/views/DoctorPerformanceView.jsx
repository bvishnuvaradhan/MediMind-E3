import React, { useState } from 'react';
import StatCard from '../components/StatCard';

export function DoctorPerformanceView({
  performanceData = [],
  doctors = [],
  onSelectDoctor,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('consultations');

  const combinedData = doctors.map((doc) => {
    const perf = performanceData.find((p) => p.doctorId === doc.id) || {};
    
    // Parse numeric on-time rate safely
    const rawOnTime = perf.onTimeRate ?? doc.onTimeRate ?? 95;
    const numOnTime = typeof rawOnTime === 'string' ? parseFloat(rawOnTime.replace(/%/g, '')) : Number(rawOnTime);

    // Scheduled and completed consultations
    const monthlyScheduled = perf.monthlyAppointments || 20;
    const completedConsultations = perf.completedConsultations || doc.consultationsCompleted || 0;
    const calculatedRate = monthlyScheduled > 0 ? Math.round((completedConsultations / monthlyScheduled) * 100) : 85;

    return {
      ...doc,
      consultations: completedConsultations,
      monthlyScheduled,
      completionRate: calculatedRate,
      ratingScore: perf.patientRating || doc.rating || 5.0,
      onTimeRate: isNaN(numOnTime) ? 95 : numOnTime,
      workload: Number(doc.workload) || 0,
    };
  });

  // Get list of unique specializations
  const specializations = ['All', ...new Set(combinedData.map((d) => d.specialization).filter(Boolean))];

  // Filtering
  const filteredData = combinedData.filter((doc) => {
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    const matchesSpecialty = specialtyFilter === 'All' || doc.specialization === specialtyFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      doc.name.toLowerCase().includes(q) ||
      doc.specialization.toLowerCase().includes(q) ||
      doc.email.toLowerCase().includes(q) ||
      (doc.room && doc.room.toLowerCase().includes(q));
    return matchesStatus && matchesSpecialty && matchesSearch;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'rating') return (b.ratingScore || 0) - (a.ratingScore || 0);
    if (sortBy === 'consultations') return (b.consultations || 0) - (a.consultations || 0);
    if (sortBy === 'onTime') return (b.onTimeRate || 0) - (a.onTimeRate || 0);
    if (sortBy === 'completion') return (b.completionRate || 0) - (a.completionRate || 0);
    if (sortBy === 'workload') return (b.workload || 0) - (a.workload || 0);
    return 0;
  });

  // KPI Calculations
  const activeDoctorsCount = combinedData.filter((d) => d.status === 'Active').length;
  const totalConsultations = combinedData.reduce((sum, d) => sum + d.consultations, 0);
  const totalScheduled = combinedData.reduce((sum, d) => sum + d.monthlyScheduled, 0);
  const totalCaseload = combinedData.reduce((sum, d) => sum + d.workload, 0);
  const avgOnTime = combinedData.length > 0
    ? Math.round(combinedData.reduce((sum, d) => sum + d.onTimeRate, 0) / combinedData.length)
    : 95;
  const avgSatisfaction = combinedData.length > 0
    ? (combinedData.reduce((sum, d) => sum + d.ratingScore, 0) / combinedData.length).toFixed(1)
    : '4.8';
  const overallCompletionRate = totalScheduled > 0
    ? Math.round((totalConsultations / totalScheduled) * 100)
    : 85;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Faculty Doctors Operational Analytics
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Department-wide consultation volume, appointment completion, on-time punctuality, and caseload distribution
            </p>
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '6px', fontSize: '12px', color: 'var(--dh-primary-light)', fontWeight: 600 }}>
            Operational Performance Oversight
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="dh-stat-grid">
        <StatCard
          label="Active Doctors"
          value={`${activeDoctorsCount} / ${combinedData.length}`}
          tone="indigo"
          change="Full department roster"
          changeType="neutral"
          subtext="Active clinical faculty"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Completed Consultations"
          value={totalConsultations}
          tone="teal"
          change="Total department throughput"
          changeType="positive"
          subtext="Closed clinical cases"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="On-Time Start Rate"
          value={`${avgOnTime}%`}
          tone="blue"
          change="Department average"
          changeType="positive"
          subtext="Consultation punctuality"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Patient Satisfaction"
          value={`★ ${avgSatisfaction}`}
          tone="coral"
          change={`${overallCompletionRate}% completion rate`}
          changeType="positive"
          subtext={`${totalCaseload} active bookings`}
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* Analytics Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Card 1: Consultation Volume & Completion */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Consultation Volume & Completion</h3>
              <div className="dh-card-description">Scheduled vs completed consultations by doctor</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            {combinedData.map((doc) => {
              const scheduled = doc.monthlyScheduled || 20;
              const completed = doc.consultations || 0;
              const rate = doc.completionRate || 0;
              const maxVal = Math.max(...combinedData.map((d) => d.monthlyScheduled || 20), 20);
              const schedPct = Math.round((scheduled / maxVal) * 100);
              const compPct = Math.round((completed / maxVal) * 100);

              return (
                <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--dh-border-subtle, rgba(0,0,0,0.05))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="dh-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {doc.avatarInitials}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--dh-text-primary)' }}>
                        {doc.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--dh-text-muted)' }}>
                        Scheduled: <strong style={{ color: 'var(--dh-text-primary)' }}>{scheduled}</strong>
                      </span>
                      <span style={{ color: 'var(--dh-text-muted)' }}>
                        Completed: <strong style={{ color: 'var(--dh-teal)' }}>{completed}</strong>
                      </span>
                      <span className="dh-badge dh-badge-completed" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {rate}% Completion
                      </span>
                    </div>
                  </div>

                  {/* Paired Visual Comparison Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <span style={{ width: '65px', color: 'var(--dh-text-muted)' }}>Scheduled</span>
                      <div className="dh-progress-container" style={{ height: '6px', flex: 1 }}>
                        <div className="dh-progress-fill" style={{ width: `${schedPct}%`, backgroundColor: 'var(--dh-primary-light)' }} />
                      </div>
                      <span style={{ width: '24px', textAlign: 'right', fontWeight: 600, color: 'var(--dh-text-secondary)' }}>{scheduled}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                      <span style={{ width: '65px', color: 'var(--dh-text-muted)' }}>Completed</span>
                      <div className="dh-progress-container" style={{ height: '6px', flex: 1 }}>
                        <div className="dh-progress-fill teal" style={{ width: `${compPct}%` }} />
                      </div>
                      <span style={{ width: '24px', textAlign: 'right', fontWeight: 600, color: 'var(--dh-teal)' }}>{completed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: On-Time Start Rate & Satisfaction */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Punctuality & Patient Satisfaction</h3>
              <div className="dh-card-description">On-time consultation starts and patient ratings</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            {combinedData.map((doc) => {
              return (
                <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="dh-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {doc.avatarInitials}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--dh-text-primary)' }}>
                        {doc.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--dh-success)', fontWeight: 700 }}>
                        {doc.onTimeRate}% On-Time
                      </span>
                      <span style={{ color: 'var(--dh-warning)', fontWeight: 700 }}>
                        ★ {doc.ratingScore}
                      </span>
                    </div>
                  </div>
                  <div className="dh-progress-container" style={{ height: '8px' }}>
                    <div className="dh-progress-fill" style={{ width: `${doc.onTimeRate}%`, backgroundColor: 'var(--dh-blue)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dh-card" style={{ padding: '16px 20px' }}>
        <div className="dh-filter-bar" style={{ margin: 0 }}>
          <div className="dh-filter-left">
            <div className="dh-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search faculty doctor, specialty, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="dh-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Doctor Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              className="dh-select"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec === 'All' ? 'All Specializations' : spec}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--dh-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort:</span>
              <select
                className="dh-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="consultations">Consultations Completed</option>
                <option value="onTime">On-Time Start Rate</option>
                <option value="rating">Patient Satisfaction</option>
                <option value="completion">Completion Rate</option>
                <option value="workload">Active Caseload</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>
            Showing <strong>{sortedData.length}</strong> of {combinedData.length} doctors
          </div>
        </div>
      </div>

      {/* Doctor Performance Analytics Table */}
      <div className="dh-card">
        <div className="dh-table-container">
          <table className="dh-table">
            <thead>
              <tr>
                <th>Faculty Doctor</th>
                <th>Specialization</th>
                <th>Allocated Room</th>
                <th>Consultations</th>
                <th>Completion Rate</th>
                <th>On-Time Rate</th>
                <th>Patient Satisfaction</th>
                <th>Active Caseload</th>
                <th>Status</th>
                {onSelectDoctor && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={onSelectDoctor ? 10 : 9} style={{ textAlign: 'center', padding: '32px', color: 'var(--dh-text-muted)' }}>
                    No faculty doctors found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                sortedData.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="dh-avatar-circle" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                          {doc.avatarInitials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--dh-text-primary)' }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>{doc.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--dh-text-secondary)', fontWeight: 500 }}>{doc.specialization}</td>
                    <td>
                      <span className="dh-badge dh-badge-draft" style={{ fontWeight: 600 }}>
                        {doc.room}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{doc.consultations} completed</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--dh-teal)' }}>{doc.completionRate}%</span>
                    </td>
                    <td>
                      <span className="dh-badge dh-badge-active">{doc.onTimeRate}%</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--dh-warning)' }}>
                        <span>★</span> {doc.ratingScore} / 5.0
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{doc.workload} active</div>
                    </td>
                    <td>
                      <span className={`dh-badge dh-badge-${doc.status.toLowerCase().replace(' ', '-')}`}>
                        {doc.status}
                      </span>
                    </td>
                    {onSelectDoctor && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="dh-btn dh-btn-outline dh-btn-sm"
                          onClick={() => onSelectDoctor(doc.id)}
                          title="View Doctor Details"
                        >
                          Profile &rarr;
                        </button>
                      </td>
                    )}
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

export default DoctorPerformanceView;
