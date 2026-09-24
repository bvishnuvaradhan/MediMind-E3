import { X, FileText, CalendarDays, Download } from 'lucide-react';

export function FeatureDetailModal({ item: propItem, feature: propFeature, detail, onClose, announce }) {
  const item = propItem || detail?.item || {};
  const feature = propFeature || detail?.feature || 'Details';
  const titles = {
    'Medical record': 'Medical record details',
    Appointments: 'Appointment details',
    Consultations: 'Consultation notes',
    Prescriptions: 'Prescription instructions',
  };

  const downloadPrescription = () => {
    const content = `MediMind prescription\n\n${item.title}\n${item.detail}\n${item.meta}\n\nInstructions: Follow the care plan provided by your doctor. Contact the clinic if symptoms change.`;
    const file = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-prescription.txt`;
    link.click();
    URL.revokeObjectURL(url);
    announce('Prescription downloaded.');
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{feature}</p>
            <h2 id="detail-modal-title">{titles[feature]}</h2>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close details">
            <X size={17} />
          </button>
        </div>

        <div className="modal-icon">
          <FileText size={20} />
        </div>
        <h3>{item.title}</h3>
        <p className="modal-detail">{item.detail}</p>
        <div className="modal-meta">
          <CalendarDays size={15} /> {item.meta ?? `${item.date} · ${item.source}`}
        </div>

        {feature === 'Medical record' && (
          <div className="modal-section">
            <strong>Patient: {item.patient}</strong>
            <p>{item.description ?? 'Mock medical record available for review.'}</p>
          </div>
        )}
        {feature === 'Appointments' && (
          <div className="modal-section">
            <strong>What to bring</strong>
            <p>Bring recent reports, current prescriptions, and any questions for the care team.</p>
          </div>
        )}
        {feature === 'Consultations' && (
          <div className="modal-section">
            <strong>Doctor notes</strong>
            <p>The consultation has been reviewed and the treatment plan is available for this family profile.</p>
          </div>
        )}
        {feature === 'Prescriptions' && (
          <div className="modal-section">
            <strong>Instructions</strong>
            <p>Follow the prescribed schedule and contact the clinic if you experience any unexpected symptoms.</p>
          </div>
        )}

        <div className="modal-actions">
          {feature === 'Prescriptions' && (
            <button className="primary-button" onClick={downloadPrescription}>
              <Download size={16} /> Download prescription
            </button>
          )}
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
