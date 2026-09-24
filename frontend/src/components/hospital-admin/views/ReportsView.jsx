import { useState } from 'react';
import {
  FileText,
  Plus,
  Download,
  Search,
  Calendar,
  User,
} from 'lucide-react';

export function ReportsView({ reports, onOpenGenerateReport, onDownloadReport }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredReports = reports.filter((rep) => {
    const matchesCat = categoryFilter === 'ALL' || rep.category === categoryFilter;
    const matchesSearch =
      !search ||
      rep.title.toLowerCase().includes(search.toLowerCase()) ||
      rep.summary.toLowerCase().includes(search.toLowerCase()) ||
      rep.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
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
                <span>Period: <strong style={{ color: 'var(--ha-text-primary)' }}>{rep.period}</strong> · Generated {rep.generatedAt}</span>
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
                onClick={() => onDownloadReport(rep)}
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

