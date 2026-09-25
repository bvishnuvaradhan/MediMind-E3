import { useState } from 'react';
import { X, FileText, Download, AlertTriangle } from 'lucide-react';

export function GenerateReportModal({ onClose, onGenerate }) {
  const [formData, setFormData] = useState({
    title: 'Comprehensive Appointment & Consultation Throughput Report',
    category: 'Appointments',
    period: 'This Month',
    fromDate: '2026-09-01',
    toDate: '2026-09-25',
    format: 'PDF / CSV',
    summary: 'Aggregated operational metrics including appointment volumes, department throughput, doctor workload, and AI triaging statistics.',
  });

  const [error, setError] = useState('');

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
    if (formData.period === 'Custom Range') {
      if (!formData.fromDate || !formData.toDate) {
        setError('Both From Date and To Date are required for Custom Range.');
        return;
      }
      if (formData.fromDate > formData.toDate) {
        setError('From Date must be earlier than or equal to To Date.');
        return;
      }
    }
    setError('');

    const finalPeriod =
      formData.period === 'Custom Range'
        ? `${formData.fromDate} to ${formData.toDate}`
        : formData.period;

    onGenerate({
      ...formData,
      period: finalPeriod,
    });
  };

  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Generate Hospital Report</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ha-modal-body">
            {error && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--ha-error-bg)', color: 'var(--ha-error)', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

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
                    <option value="This Month">This Month</option>
                    <option value="Last Month">Last Month</option>
                    <option value="This Quarter">This Quarter</option>
                    <option value="Last Quarter">Last Quarter</option>
                    <option value="This Year">This Year</option>
                    <option value="Custom Range">Custom Range</option>
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

              {formData.period === 'Custom Range' && (
                <div className="ha-form-row">
                  <div className="ha-form-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      className="ha-input"
                      value={formData.fromDate}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="ha-form-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      className="ha-input"
                      value={formData.toDate}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

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
