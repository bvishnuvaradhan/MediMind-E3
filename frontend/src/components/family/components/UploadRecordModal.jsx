import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';

export function UploadRecordModal({
  isOpen,
  onClose,
  familyMembers = [],
  activeMember,
  onAddRecord,
  announce,
}) {
  const [patient, setPatient] = useState(activeMember?.name || familyMembers[0]?.name || 'Father');
  const [recordType, setRecordType] = useState('Report');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() && !fileName) {
      announce('Please provide a file attachment or clinical description.');
      return;
    }

    const categoryMap = {
      Report: 'Reports',
      'Blood test': 'Reports',
      'Test result': 'Tests',
      'X-Ray or scan': 'X-Rays',
      Prescription: 'Prescriptions',
      'Consultation note': 'Consultations',
    };

    const newRecord = {
      type: recordType,
      category: categoryMap[recordType] || 'Reports',
      patient,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: 'Uploaded by Family',
      description: description.trim() || `Uploaded document: ${fileName || recordType}`,
      icon: FileText,
      color: 'blue',
      status: 'Available',
    };

    onAddRecord(newRecord);
    announce(`Medical record for ${patient} uploaded successfully.`);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal upload-record-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-record-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0 }}>
              <Upload size={20} />
            </div>
            <div>
              <p className="eyebrow">Medical Records</p>
              <h2 id="upload-record-title" style={{ margin: 0, fontSize: '18px' }}>
                Upload Medical Document
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close upload modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Patient Profile *</span>
              <select
                className="feature-input"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
              >
                {familyMembers.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Record Type *</span>
              <select
                className="feature-input"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
              >
                <option value="Report">Medical Report</option>
                <option value="Blood test">Blood Test / Lab Panel</option>
                <option value="Test result">Diagnostic Test Result</option>
                <option value="X-Ray or scan">X-Ray / MRI / CT Scan</option>
                <option value="Prescription">Prescription Document</option>
                <option value="Consultation note">Consultation Summary</option>
              </select>
            </label>

            <label className="drop-zone" style={{ margin: '4px 0' }}>
              <Upload size={26} style={{ color: 'var(--family-primary)' }} />
              <strong>{fileName || 'Choose PDF, image, scan or drag and drop'}</strong>
              <span>Maximum file size 25MB · HIPAA Encrypted</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Description / Clinical Notes</span>
              <textarea
                className="feature-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Annual cardiology ECG report, normal sinus rhythm..."
                rows={3}
              />
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Upload size={16} /> Upload Record
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
