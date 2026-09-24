// MediMind Platform - Reports Generation (Chairman / Platform Owner)
// Section 17 of PLATFORM OWNER.txt: Platform-wide report generation and download

import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  UsersRound,
  Building2,
  Eye,
  X,
} from 'lucide-react';

export function ReportsView({ announce }) {
  const [reportType, setReportType] = useState('hospital');
  const [dateRange, setDateRange] = useState('Sep 2026');
  const [format, setFormat] = useState('CSV');
  const [previewModal, setPreviewModal] = useState(null);

  const availableReports = [
    {
      id: 'hospital',
      title: 'Hospital Network & Infrastructure Report',
      description: 'Audit of registered hospitals, bed utilization, operational statuses, and assigned administrators.',
      icon: Building2,
      color: '#2563eb',
      bg: '#dbeafe',
    },
    {
      id: 'user',
      title: 'Platform User & Workforce Distribution Report',
      description: 'Comprehensive roster of family accounts, member demographics, credentialed doctors, and administrators.',
      icon: UsersRound,
      color: '#d97706',
      bg: '#fef3c7',
    },
    {
      id: 'appointment',
      title: 'Appointments & Clinical Utilization Report',
      description: 'Breakdown of completed consultations, cancellations, scheduling modes, and department loads.',
      icon: Calendar,
      color: '#0f766e',
      bg: '#ccfbf1',
    },
    {
      id: 'ai',
      title: 'Clinical AI Diagnostic Services & Model Report',
      description: 'Inference volume, accuracy benchmarks, latency metrics, and confidence distributions across all 3 AI models.',
      icon: Sparkles,
      color: '#4338ca',
      bg: '#e0e7ff',
    },
  ];

  const handleGeneratePreview = () => {
    const selected = availableReports.find((r) => r.id === reportType);
    let sampleData = '';

    if (reportType === 'hospital') {
      sampleData = `MediMind Platform - Hospital Network Report (${dateRange})\n=======================================================\nTotal Registered Facilities: 1 Active, 2 Pending\nPrimary Facility: MediMind Central Hospital (NABH Accredited)\nAssigned Administrator: Rajesh Kumar\nDepartments: Orthopedics (3 Doctors), Diabetology (3 Doctors), Cardiology (3 Doctors)\nTotal Bed Capacity: 450 Beds (87% Utilization)\nPlatform Status: Verified & Compliant`;
    } else if (reportType === 'user') {
      sampleData = `MediMind Platform - User & Workforce Distribution Report (${dateRange})\n=======================================================\nTotal Registered Family Accounts: 3\nTotal Covered Family Members: 13 Profiles\nCredentialed Clinical Doctors: 9 Specialists\nDepartment Heads: 3\nHospital Administrators: 1 Active, 1 Inactive\nChairman & Root Platform Governance: 1 Account`;
    } else if (reportType === 'appointment') {
      sampleData = `MediMind Platform - Appointments & Clinical Utilization (${dateRange})\n=======================================================\nTotal Platform Appointments: 128\nCompleted Consultations: 96 (75% Completion Rate)\nUpcoming Scheduled: 24 (19% Forward Booking)\nCancelled / Rescheduled: 8 (6% Disruption Index)\nDepartment Volume: Orthopedics (48), Diabetology (42), Cardiology (38)`;
    } else {
      sampleData = `MediMind Platform - Clinical AI Diagnostic Report (${dateRange})\n=======================================================\nTotal Diagnostic Inferences: 91 Inferences\nFracture Detection (ResNet50 CNN): 31 runs (94.2% avg confidence, 142ms latency)\nDiabetes Risk (XGBoost ML): 29 runs (91.8% avg confidence, 68ms latency)\nHeart Disease Risk (Ensemble ML): 31 runs (89.5% avg confidence, 85ms latency)\nSystem AI Availability: 99.98% uptime`;
    }

    setPreviewModal({
      title: selected?.title || 'Platform Report',
      content: sampleData,
    });
  };

  const handleDownload = () => {
    const selected = availableReports.find((r) => r.id === reportType);
    const content = previewModal ? previewModal.content : `MediMind Report (${reportType}) - Generated on ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: format === 'CSV' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medimind-${reportType}-report-${dateRange.replace(/\s+/g, '-').toLowerCase()}.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    announce(`Downloaded ${selected?.title} (${format}).`);
  };

  return (
    <div className="reports-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <FileText size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Governance Documentation
            </p>
            <h1>Platform Executive Reports</h1>
            <p>Generate, preview, and download institutional compliance, operational, and clinical intelligence reports.</p>
          </div>
        </div>
      </div>

      {/* Available Report Catalog Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {availableReports.map((rep) => {
          const Icon = rep.icon;
          const isSelected = reportType === rep.id;
          return (
            <div
              key={rep.id}
              className="table-card"
              style={{
                padding: '22px',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--chair-sapphire)' : 'var(--chair-border)',
                background: isSelected ? 'var(--chair-indigo-soft)' : 'var(--chair-card)',
                boxShadow: isSelected ? '0 0 0 2px var(--chair-sapphire)' : 'none',
              }}
              onClick={() => setReportType(rep.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '10px', background: rep.bg, color: rep.color }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>{rep.title}</h3>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)', lineHeight: 1.5 }}>
                {rep.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Report Generator Control Card */}
      <div className="table-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
          Configure & Export Report Parameters
        </h3>

        <div className="chair-form-grid" style={{ marginBottom: '20px' }}>
          <div className="chair-form-group">
            <label>Selected Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {availableReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div className="chair-form-group">
            <label>Audit Reporting Timeline</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="Sep 2026">Current Month (September 2026)</option>
              <option value="Q3 2026">Q3 2026 (Jul - Sep 2026)</option>
              <option value="All Time">All-Time Cumulative</option>
            </select>
          </div>

          <div className="chair-form-group">
            <label>Export File Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="CSV">Comma Separated Values (.csv)</option>
              <option value="JSON">Structured JSON (.json)</option>
              <option value="TXT">Plain Text Summary (.txt)</option>
            </select>
          </div>

          <div className="chair-form-group" style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <button className="secondary-button" onClick={handleGeneratePreview}>
                <Eye size={15} />
                <span>Preview Report</span>
              </button>
              <button className="primary-button" onClick={handleDownload}>
                <Download size={15} />
                <span>Download Report ({format})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal && (
        <div className="modal-overlay" onClick={() => setPreviewModal(null)}>
          <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Report Preview
                </p>
                <h2>{previewModal.title}</h2>
                <p>Audited data export formatted for executive compliance review</p>
              </div>
              <button className="close-form" onClick={() => setPreviewModal(null)}>
                <X size={16} />
              </button>
            </div>

            <pre
              style={{
                padding: '16px',
                background: 'var(--chair-bg)',
                borderRadius: '10px',
                fontSize: '12px',
                lineHeight: 1.6,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '360px',
                overflowY: 'auto',
                border: '1px solid var(--chair-border)',
              }}
            >
              {previewModal.content}
            </pre>

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setPreviewModal(null)}>
                Close Preview
              </button>
              <button className="primary-button" onClick={handleDownload}>
                <Download size={15} />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
