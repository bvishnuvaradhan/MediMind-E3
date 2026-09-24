import { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';

export function GenerateReportModal({ onClose, onGenerate }) {
  const [formData, setFormData] = useState({
    title: 'Hospital Operational Summary Report',
    category: 'Appointments',
    period: 'Current Month (September 2026)',
    format: 'PDF / CSV',
    summary: 'Aggregated operational metrics including appointment volumes, department throughput, doctor workload, and AI triaging statistics.',
  });

  const handleCategoryChange = (category) => {
    let defaultTitle = 'Hospital Operational Summary Report';
    let defaultSummary = 'Aggregated operational metrics across hospital operations.';

    if (category === 'Appointments') {
      defaultTitle = 'Comprehensive Appointment & Consultation Throughput Report';
      defaultSummary = 'Full breakdown of completed, scheduled, and cancelled patient appointments across all hospital departments.';
    } else if (category === 'Doctors & Staff') {
      defaultTitle = 'Doctor Workload & Staff Resource Allocation Report';
      defaultSummary = 'Analysis of clinical duty hours, on-call assignments, and patient consultation load per doctor.';
    } else if (category === 'Departments') {
      defaultTitle = 'Departmental Performance & Bed Occupancy Report';
      defaultSummary = 'Bed occupancy rates, ward throughput, and clinical capacity utilization per department.';
    } else if (category === 'AI Diagnostics') {
      defaultTitle = 'Hospital-Wide AI Diagnostic Screening Utilization Report';
      defaultSummary = 'Aggregate usage metrics for Fracture CNN, Diabetes Risk, and Heart Disease diagnostic models.';
    }

    setFormData({
      ...formData,
      category,
      title: defaultTitle,
      summary: defaultSummary,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Generate Hospital Report</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ha-modal-body">
            <div className="ha-form">
              <div className="ha-form-group">
                <label>Report Category</label>
                <select
                  className="ha-select"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="Appointments">Appointments & Consultations</option>
                  <option value="Doctors & Staff">Doctors & Staff Workload</option>
                  <option value="Departments">Departments & Bed Capacity</option>
                  <option value="AI Diagnostics">AI Screening & Diagnostic Usage</option>
                </select>
              </div>

              <div className="ha-form-group">
                <label>Report Title</label>
                <input
                  type="text"
                  className="ha-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Reporting Period</label>
                  <select
                    className="ha-select"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  >
                    <option value="Current Month (September 2026)">Current Month (September 2026)</option>
                    <option value="Q3 2026 (Jul - Sep)">Q3 2026 (Jul - Sep)</option>
                    <option value="Year-to-Date 2026">Year-to-Date 2026</option>
                    <option value="Last 30 Days (Rolling)">Last 30 Days (Rolling)</option>
                  </select>
                </div>
                <div className="ha-form-group">
                  <label>Export Format</label>
                  <select
                    className="ha-select"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  >
                    <option value="PDF / CSV">PDF & CSV Bundle</option>
                    <option value="PDF Document">PDF Document Only</option>
                    <option value="CSV Spreadsheet">CSV Spreadsheet Only</option>
                  </select>
                </div>
              </div>

              <div className="ha-form-group">
                <label>Scope & Executive Summary</label>
                <textarea
                  rows={3}
                  className="ha-textarea"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="ha-modal-footer">
            <button type="button" className="ha-btn ha-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ha-btn ha-btn-primary">
              <Download size={16} />
              Generate & Download
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

