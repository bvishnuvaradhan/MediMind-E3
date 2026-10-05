import { X, FileText, CalendarDays, Download, Sparkles, Eye, Activity } from 'lucide-react';
import { aiPredictions } from '../../../data/medimindData';

export function FeatureDetailModal({ item: propItem, feature: propFeature, detail, onClose, announce }) {
  const item = propItem || detail?.item || {};
  const feature = propFeature || detail?.feature || 'Details';
  const titles = {
    'Medical record': 'Medical Record Details',
    Appointments: 'Appointment Details',
    Consultations: 'Consultation Notes',
    Prescriptions: 'Prescription Instructions',
  };

  const isMedicalRecord = feature === 'Medical record' || feature === 'Medical records';
  const recordTitle = (item.title || item.type || '').toLowerCase();
  const recordPatient = (item.patient || item.patientName || '').toLowerCase();

  // Find linked AI prediction if any
  const linkedPrediction = item.associatedPrediction || aiPredictions.find((p) => {
    const pPatient = (p.patientName || '').toLowerCase();
    const isPatientMatch = pPatient && recordPatient && (pPatient.includes(recordPatient) || recordPatient.includes(pPatient));
    const isDocMatch = p.attachedDoc?.title && recordTitle && p.attachedDoc.title.toLowerCase().includes(recordTitle);
    return (isPatientMatch && (isDocMatch || recordTitle.includes('x-ray') || recordTitle.includes('glucose') || recordTitle.includes('lipid')));
  });

  const isImageOrRadiograph = recordTitle.includes('x-ray') || recordTitle.includes('radiograph') || recordTitle.includes('mri') || recordTitle.includes('scan') || item.category === 'X-Rays';

  const downloadPrescription = () => {
    const content = `MediMind Prescription\n\n${item.title || item.type}\n${item.detail || item.description}\n${item.meta || item.date}\n\nInstructions: Follow the care plan provided by your doctor. Contact the clinic if symptoms change.`;
    const file = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(item.title || item.type || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-record.txt`;
    link.click();
    URL.revokeObjectURL(url);
    if (announce) announce('Prescription / Clinical document downloaded.');
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: '580px', maxHeight: '88vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{feature}</p>
            <h2 id="detail-modal-title">{titles[feature] || 'Document Details'}</h2>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close details">
            <X size={17} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div className="modal-icon" style={{ margin: 0, backgroundColor: isImageOrRadiograph ? '#ffe4e6' : 'var(--family-primary-subtle)', color: isImageOrRadiograph ? '#be123c' : 'var(--family-primary)' }}>
            <FileText size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{item.title || item.type || 'Clinical Document'}</h3>
            <p className="modal-detail" style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--family-muted)' }}>
              {item.detail || item.description || 'Verified healthcare record'}
            </p>
          </div>
        </div>

        <div className="modal-meta" style={{ marginBottom: '14px', fontSize: '12px' }}>
          <CalendarDays size={14} /> {item.meta ?? `${item.date || 'Recent'} · ${item.source || 'Medical Records'} · Patient: ${item.patient || 'Family Member'}`}
        </div>

        {/* Document / Image Functional Preview Viewer (Requirement 5) */}
        {isMedicalRecord && (
          <div style={{ margin: '14px 0', padding: '16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', border: '1px solid var(--family-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} style={{ color: 'var(--family-primary)' }} /> Document Preview & Clinical Inspection
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--family-card)', color: 'var(--family-primary)', fontWeight: '600', border: '1px solid var(--family-border)' }}>
                {isImageOrRadiograph ? 'DICOM Radiograph' : 'Structured Lab Report'}
              </span>
            </div>

            {isImageOrRadiograph ? (
              <div style={{ height: '160px', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #334155' }}>
                <Activity size={32} style={{ color: '#38bdf8', marginBottom: '8px' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                  {item.title || item.type || 'Radiograph View (AP / Lateral)'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Bone integrity & cortical margin scan verified by Radiology Dept
                </span>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--family-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--family-border)', fontSize: '12px', color: 'var(--family-ink)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--family-border)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--family-muted)' }}>Clinical Test / Parameter</span>
                  <span style={{ fontWeight: '600' }}>Reference Range</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Diagnostic Classification</span>
                  <span style={{ fontWeight: '600', color: '#16a34a' }}>Normal / Stable Baseline</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Verified Clinical Facility</span>
                  <span style={{ fontWeight: '500' }}>{item.source || 'MediMind Central Pathology'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Associated AI Predictions Section (Requirement 5) */}
        {isMedicalRecord && linkedPrediction && (
          <div style={{ margin: '14px 0', padding: '12px 14px', backgroundColor: '#ede9fe', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={16} style={{ color: '#7c3aed' }} />
              <strong style={{ fontSize: '13px', color: '#5b21b6' }}>
                Associated AI Prediction: {linkedPrediction.moduleName || linkedPrediction.title || 'Clinical Decision Support'}
              </strong>
            </div>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6d28d9', lineHeight: '1.4' }}>
              Risk Level: <strong>{linkedPrediction.riskLevel || 'Low Risk'}</strong> · Result: {linkedPrediction.summary || linkedPrediction.result || 'Within physiological parameters'}
            </p>
            <span style={{ fontSize: '11px', color: '#7c3aed' }}>
              Evaluated on {linkedPrediction.date || item.date || 'Recent'} via AI rules engine
            </span>
          </div>
        )}

        {feature === 'Medical record' && (
          <div className="modal-section" style={{ marginTop: '10px' }}>
            <strong>Patient Record: {item.patient || 'Family Member'}</strong>
            <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '4px 0 0' }}>
              {item.description || item.detail || 'Clinical document verified in encrypted family records.'}
            </p>
          </div>
        )}
        {feature === 'Appointments' && (
          <div className="modal-section" style={{ marginTop: '10px' }}>
            <strong>What to bring</strong>
            <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '4px 0 0' }}>
              Bring recent reports, current prescriptions, and any questions for the care team.
            </p>
          </div>
        )}
        {feature === 'Consultations' && (
          <div className="modal-section" style={{ marginTop: '10px' }}>
            <strong>Doctor notes</strong>
            <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '4px 0 0' }}>
              The consultation has been reviewed and the treatment plan is available for this family profile.
            </p>
          </div>
        )}
        {feature === 'Prescriptions' && (
          <div className="modal-section" style={{ marginTop: '10px' }}>
            <strong>Instructions</strong>
            <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '4px 0 0' }}>
              Follow the prescribed schedule and contact the clinic if you experience any unexpected symptoms.
            </p>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '18px' }}>
          <button className="secondary-button" onClick={downloadPrescription}>
            <Download size={15} /> Download Record
          </button>
          <button className="primary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
