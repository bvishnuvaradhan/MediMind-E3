import { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Search,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function ReportsView({ reports = [], onOpenGenerateReport, onDownloadReport }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [reportingPeriod, setReportingPeriod] = useState('This Month');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-25');

  const isCustomRange = reportingPeriod === 'Custom Range';
  const isDateRangeInvalid = isCustomRange && fromDate && toDate && fromDate > toDate;

  // Filter reports by category, search term, and period context
  const filteredReports = reports.filter((rep) => {
    const matchesCat = categoryFilter === 'ALL' || rep.category === categoryFilter;
    const matchesSearch =
      !search ||
      rep.title.toLowerCase().includes(search.toLowerCase()) ||
      rep.summary.toLowerCase().includes(search.toLowerCase()) ||
      rep.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Dynamic metrics based on reporting period
  const getPeriodMetrics = () => {
    switch (reportingPeriod) {
      case 'Last Month':
        return {
          totalGenerated: 14,
          auditCompliance: '99.1%',
          archivedRecords: '38,400',
          label: 'August 2026 (Historical Period)',
        };
      case 'This Quarter':
        return {
          totalGenerated: 28,
          auditCompliance: '98.8%',
          archivedRecords: '72,150',
          label: 'Q3 2026 (Jul – Sep 2026)',
        };
      case 'Last Quarter':
        return {
          totalGenerated: 31,
          auditCompliance: '99.5%',
          archivedRecords: '69,800',
          label: 'Q2 2026 (Apr – Jun 2026)',
        };
      case 'This Year':
        return {
          totalGenerated: 86,
          auditCompliance: '98.9%',
          archivedRecords: '210,500',
          label: 'Calendar Year 2026',
        };
      case 'Custom Range':
        return {
          totalGenerated: isDateRangeInvalid ? 0 : 9,
          auditCompliance: isDateRangeInvalid ? 'N/A' : '98.6%',
          archivedRecords: isDateRangeInvalid ? '0' : '24,300',
          label: isDateRangeInvalid ? 'Invalid Range' : `${fromDate} to ${toDate}`,
        };
      case 'This Month':
      default:
        return {
          totalGenerated: 12,
          auditCompliance: '98.4%',
          archivedRecords: '29,450',
          label: 'September 2026 (Current Period)',
        };
    }
  };

  const periodMetrics = getPeriodMetrics();

  return (
    <div>
      {/* Header */}
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <FileText size={24} />
          </div>
          <div>
            <h1>Hospital Reports & Compliance Documentation</h1>
            <p>Generate, export, and review formal hospital operational, staffing, clinical throughput, and AI screening reports</p>
          </div>
        </div>

        <button className="ha-btn ha-btn-primary" onClick={onOpenGenerateReport}>
          <Plus size={16} /> Generate New Report
        </button>
      </div>

      {/* Reporting Period Selector Bar */}
      <div className="ha-card-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-primary)', fontWeight: 700, fontSize: '13px' }}>
              <Calendar size={16} />
              <span>Reporting Period:</span>
            </div>

            <select
              className="ha-select"
              style={{ minWidth: '160px', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="This Year">This Year</option>
              <option value="Custom Range">Custom Range</option>
            </select>

            {isCustomRange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--ha-text-muted)' }}>From:</label>
                  <input
                    type="date"
                    className="ha-input"
                    style={{ padding: '4px 8px', fontSize: '12px', width: '135px' }}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--ha-text-muted)' }}>To:</label>
                  <input
                    type="date"
                    className="ha-input"
                    style={{ padding: '4px 8px', fontSize: '12px', width: '135px' }}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--ha-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} style={{ color: 'var(--ha-teal)' }} />
            <span>Active Range: <strong style={{ color: 'var(--ha-text-primary)' }}>{periodMetrics.label}</strong></span>
          </div>
        </div>

        {/* Date Validation Error Warning */}
        {isDateRangeInvalid && (
          <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--ha-error-bg)', color: 'var(--ha-error)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} />
            <span>Invalid Custom Date Range: <strong>From Date</strong> must be earlier than or equal to <strong>To Date</strong>.</span>
          </div>
        )}
      </div>

      {/* Compliance & Summary Metrics for Selected Period */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '14px 16px', borderRadius: '8px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)', boxShadow: 'var(--ha-shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--ha-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Compliance Score ({reportingPeriod})
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-teal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={18} /> {periodMetrics.auditCompliance}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>NABH & statutory compliance index</span>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '8px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)', boxShadow: 'var(--ha-shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--ha-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Compiled Bundles ({reportingPeriod})
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-primary)' }}>
            {periodMetrics.totalGenerated} Reports
          </div>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Ready for regulatory export</span>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '8px', backgroundColor: 'var(--ha-card)', border: '1px solid var(--ha-border)', boxShadow: 'var(--ha-shadow-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--ha-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Archived Audit Logs
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-indigo)' }}>
            {periodMetrics.archivedRecords} Logs
          </div>
          <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Encrypted tamper-evident records</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '280px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search reports by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${categoryFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('ALL')}
          >
            All Reports ({reports.length})
          </button>
          <button
            className={`ha-filter-pill ${categoryFilter === 'Appointments' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('Appointments')}
          >
            Appointments
          </button>
          <button
            className={`ha-filter-pill ${categoryFilter === 'Doctors & Staff' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('Doctors & Staff')}
          >
            Doctors & Staff
          </button>
          <button
            className={`ha-filter-pill ${categoryFilter === 'Departments' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('Departments')}
          >
            Departments
          </button>
          <button
            className={`ha-filter-pill ${categoryFilter === 'AI Diagnostics' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('AI Diagnostics')}
          >
            AI Diagnostics
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredReports.map((rep) => (
          <div key={rep.id} className="ha-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--ha-soft-bg)', color: 'var(--ha-primary)', display: 'grid', placeItems: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                    {rep.title}
                  </h3>
                  <span className="ha-badge info" style={{ marginTop: '4px', display: 'inline-block' }}>
                    {rep.category}
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-bg)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--ha-border)' }}>
                {rep.format}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.45 }}>
              {rep.summary}
            </p>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', fontSize: '11px', color: 'var(--ha-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                <span>Period: <strong style={{ color: 'var(--ha-text-primary)' }}>{reportingPeriod === 'This Month' ? rep.period : periodMetrics.label}</strong> · Generated {rep.generatedAt}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                <span>Compiler: {rep.generatedBy}</span>
              </div>
            </div>

            {/* Download Button */}
            <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
              <button
                className="ha-btn ha-btn-primary ha-btn-sm"
                style={{ width: '100%' }}
                disabled={isDateRangeInvalid}
                onClick={() => onDownloadReport({
                  ...rep,
                  period: reportingPeriod === 'This Month' ? rep.period : periodMetrics.label,
                })}
              >
                <Download size={14} /> Download Report Bundle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
