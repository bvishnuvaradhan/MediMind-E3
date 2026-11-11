import fs from 'fs';

// 1. Update DoctorLayout.jsx
let layout = fs.readFileSync('frontend/src/components/doctor/DoctorLayout.jsx', 'utf8');

// Update handleOpenNewConsultation
const oldHandler = `  // Consultation handlers
  const handleOpenNewConsultation = (patient = null, initialCons = null) => {
    setConsultationModalData(
      initialCons
        ? initialCons
        : patient
        ? { patientId: patient.id }
        : null
    );
    setIsConsultationModalOpen(true);
  };`;

const newHandler = `  // Consultation handlers
  const handleOpenNewConsultation = (patient = null, initialCons = null) => {
    let modalData = null;
    if (initialCons) {
      modalData = initialCons;
    } else if (patient && (patient.appointmentId || patient.id)) {
      modalData = patient.appointmentId ? patient : { patientId: patient.id };
    }
    setConsultationModalData(modalData);
    setIsConsultationModalOpen(true);
  };`;

if (layout.includes(oldHandler.replace(/\n/g, '\r\n'))) {
  layout = layout.replace(oldHandler.replace(/\n/g, '\r\n'), newHandler.replace(/\n/g, '\r\n'));
} else if (layout.includes(oldHandler)) {
  layout = layout.replace(oldHandler, newHandler);
}

// Pass appointments to ConsultationsView
const oldConsView = `          {activeTab === 'consultations' && (
            <ConsultationsView
              consultations={consultations}
              patients={patients}
              onOpenNewConsultation={handleOpenNewConsultation}
              onAmendConsultation={handleAmendConsultation}
            />
          )}`;

const newConsView = `          {activeTab === 'consultations' && (
            <ConsultationsView
              consultations={consultations}
              patients={patients}
              appointments={appointments}
              onOpenNewConsultation={handleOpenNewConsultation}
              onAmendConsultation={handleAmendConsultation}
            />
          )}`;

if (layout.includes(oldConsView.replace(/\n/g, '\r\n'))) {
  layout = layout.replace(oldConsView.replace(/\n/g, '\r\n'), newConsView.replace(/\n/g, '\r\n'));
} else if (layout.includes(oldConsView)) {
  layout = layout.replace(oldConsView, newConsView);
}

fs.writeFileSync('frontend/src/components/doctor/DoctorLayout.jsx', layout, 'utf8');
console.log('✓ Updated DoctorLayout.jsx');

// 2. Update ConsultationsView.jsx
let consView = fs.readFileSync('frontend/src/components/doctor/views/ConsultationsView.jsx', 'utf8');

// Accept appointments prop
if (!consView.includes('appointments = [],')) {
  consView = consView.replace(
    'export function ConsultationsView({\r\n  consultations = [],\r\n  patients = [],',
    'export function ConsultationsView({\r\n  consultations = [],\r\n  patients = [],\r\n  appointments = [],'
  );
}

// Add Outstanding Documentation Queue Banner
const bannerPlaceholder = `{/* Header */}`;
const bannerCode = `{/* Outstanding Documentation Review Queue (Phase 19) */}
      {(() => {
        const missingCons = appointments.filter((a) => {
          const isCompleted = (a.status || '').toUpperCase() === 'COMPLETED';
          if (!isCompleted) return false;
          const aId = a.id || a._id;
          return !consultations.some((c) => c.appointmentId === aId || c.appointment_id === aId);
        });

        if (missingCons.length === 0) return null;

        return (
          <div
            className="doctor-card"
            style={{
              borderLeft: '4px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.04)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#dc2626' }}>
                    Outstanding Clinical Documentation Required ({missingCons.length} Encounters)
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                    Completed patient encounters require authentic clinician clinical notes and authorized treatment plans.
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                Strict Clinician Attestation Only
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {missingCons.map((apt) => (
                <div
                  key={apt.id || apt._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'var(--doctor-bg-card, #ffffff)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
                      {apt.token || \`OPD-\${(apt.id || apt._id || '').slice(-4).toUpperCase()}\`}
                    </span>
                    <span style={{ margin: '0 8px', color: 'var(--doctor-text-muted)' }}>•</span>
                    <span>{apt.patientName || 'Patient Encounter'}</span>
                    <span style={{ margin: '0 8px', color: 'var(--doctor-text-muted)' }}>•</span>
                    <span style={{ color: 'var(--doctor-text-muted)' }}>
                      Scheduled: {apt.date || apt.appointmentDate || 'Encounter date'} ({apt.time || apt.startTime || 'Time slot'})
                    </span>
                  </div>
                  <button
                    className="doctor-btn doctor-btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px', background: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() =>
                      onOpenNewConsultation({
                        appointmentId: apt.id || apt._id,
                        patientId: apt.patientId || apt.family_member_id
                      })
                    }
                  >
                    Attest & Complete Note
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Header */}`;

if (!consView.includes('Outstanding Clinical Documentation Required')) {
  consView = consView.replace(bannerPlaceholder, bannerCode);
  fs.writeFileSync('frontend/src/components/doctor/views/ConsultationsView.jsx', consView, 'utf8');
  console.log('✓ Updated ConsultationsView.jsx');
}

// 3. Update AppointmentsView.jsx to include Review Queue Tab
let apptView = fs.readFileSync('frontend/src/components/doctor/views/AppointmentsView.jsx', 'utf8');

// Add Review Queue tab filtering
if (!apptView.includes("'Review Queue'")) {
  const oldFilterLogic = `    if (tabFilter === 'Today') matchesTab = apt.date?.includes('Today') && apt.status !== 'Cancelled';
    else if (tabFilter === 'Upcoming') matchesTab = (apt.status === 'Confirmed' || apt.status === 'Booked') && !apt.date?.includes('Today');`;

  const newFilterLogic = `    if (tabFilter === 'Today') matchesTab = apt.date?.includes('Today') && apt.status !== 'Cancelled';
    else if (tabFilter === 'Upcoming') matchesTab = (apt.status === 'Confirmed' || apt.status === 'Booked') && !apt.date?.includes('Today');
    else if (tabFilter === 'Review Queue') {
      const isPending = apt.status === 'Confirmed' || apt.status === 'Booked' || apt.status === 'In Progress';
      const isPast = !apt.date?.includes('Today') && (apt.date?.includes('Yesterday') || !apt.date?.includes('2026-11') && !apt.date?.includes('Nov'));
      matchesTab = isPending && isPast;
    }`;

  apptView = apptView.replace(oldFilterLogic.replace(/\n/g, '\r\n'), newFilterLogic.replace(/\n/g, '\r\n'));

  // Add Review Queue tab button
  const oldButtons = `<button
            className={\`doctor-tab-btn \${tabFilter === 'Upcoming' ? 'active' : ''}\`}
            onClick={() => setTabFilter('Upcoming')}
          >
            Upcoming
          </button>`;

  const newButtons = `<button
            className={\`doctor-tab-btn \${tabFilter === 'Upcoming' ? 'active' : ''}\`}
            onClick={() => setTabFilter('Upcoming')}
          >
            Upcoming
          </button>
          <button
            className={\`doctor-tab-btn \${tabFilter === 'Review Queue' ? 'active' : ''}\`}
            onClick={() => setTabFilter('Review Queue')}
            style={{ position: 'relative' }}
          >
            Review Queue
            <span
              style={{
                marginLeft: '6px',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                background: tabFilter === 'Review Queue' ? '#ffffff' : '#ef4444',
                color: tabFilter === 'Review Queue' ? '#ef4444' : '#ffffff'
              }}
            >
              Overdue
            </span>
          </button>`;

  apptView = apptView.replace(oldButtons.replace(/\n/g, '\r\n'), newButtons.replace(/\n/g, '\r\n'));
  fs.writeFileSync('frontend/src/components/doctor/views/AppointmentsView.jsx', apptView, 'utf8');
  console.log('✓ Updated AppointmentsView.jsx');
}
