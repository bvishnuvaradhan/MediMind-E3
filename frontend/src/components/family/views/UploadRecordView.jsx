import { useState } from 'react';
import { Upload, ArrowUpRight } from 'lucide-react';

export function UploadRecordView({
  member: propMember,
  familyMembers = [],
  navigate,
  announce,
  onAddRecord,
}) {
  const member = propMember || familyMembers[0] || { name: 'Father' };
  const [patient, setPatient] = useState(member.name);
  const [recordType, setRecordType] = useState('Report');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!description.trim() && !fileName) {
      announce('Please provide a file or description for this record.');
      return;
    }

    const newRecord = {
      type: recordType,
      category: recordType === 'Report' ? 'Reports' : recordType === 'Test result' ? 'Tests' : recordType === 'X-Ray or scan' ? 'X-Rays' : 'Prescriptions',
      patient,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: 'Uploaded by Family',
      description: description.trim() || `Uploaded document: ${fileName || recordType}`,
      status: 'Available',
    };

    if (onAddRecord) {
      onAddRecord(newRecord);
    }
    announce(`Medical record for ${patient} uploaded successfully.`);
    if (navigate) {
      navigate('Medical records');
    }
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Upload size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Upload record</h1>
          <p>Add a family-owned document for {patient || 'your family'}.</p>
        </div>
        {navigate && (
          <button
            className="secondary-button compact-button"
            onClick={() => navigate('Medical records')}
          >
            <ArrowUpRight size={16} /> Back to records
          </button>
        )}
      </div>

      <div className="feature-panel">
        <form className="upload-form" onSubmit={handleSave}>
          <label>
            Patient profile
            <select
              className="feature-input"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
            >
              {familyMembers.length > 0 ? (
                familyMembers.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.relation})
                  </option>
                ))
              ) : (
                <>
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Son</option>
                </>
              )}
            </select>
          </label>

          <label>
            Record type
            <select
              className="feature-input"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
            >
              <option>Report</option>
              <option>Test result</option>
              <option>X-Ray or scan</option>
              <option>Prescription</option>
            </select>
          </label>

          <label className="drop-zone">
            <Upload size={25} />
            <strong>{fileName || 'Choose a PDF, image, X-ray, or scan'}</strong>
            <span>{fileName ? 'File attached' : 'Drag and drop files here'}</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
          </label>

          <label>
            Description
            <textarea
              className="feature-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context for this medical record (e.g. Annual health checkup report)"
            />
          </label>

          <button type="submit" className="primary-button">
            Save record
          </button>
        </form>
      </div>
    </section>
  );
}
