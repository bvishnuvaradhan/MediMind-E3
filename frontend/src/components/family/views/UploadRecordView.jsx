import { Upload } from 'lucide-react';

export function UploadRecordView({ member, announce }) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Upload size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Upload record</h1>
          <p>Add a family-owned document for {member?.name || 'your family'}.</p>
        </div>
      </div>

      <div className="feature-panel">
        <div className="upload-form">
          <label>
            Patient profile
            <select className="feature-input">
              <option>Father</option>
              <option>Mother</option>
              <option>Son</option>
            </select>
          </label>

          <label>
            Record type
            <select className="feature-input">
              <option>Report</option>
              <option>Test result</option>
              <option>X-Ray or scan</option>
              <option>Prescription</option>
            </select>
          </label>

          <label className="drop-zone">
            <Upload size={25} />
            <strong>Choose a PDF, image, X-ray, or scan</strong>
            <span>Drag and drop files here</span>
            <input type="file" accept=".pdf,image/*" />
          </label>

          <label>
            Description
            <textarea className="feature-input" placeholder="Add context for this medical record" />
          </label>

          <button
            className="primary-button"
            onClick={() => announce('Medical record upload is ready to save.')}
          >
            Save record
          </button>
        </div>
      </div>
    </section>
  );
}
