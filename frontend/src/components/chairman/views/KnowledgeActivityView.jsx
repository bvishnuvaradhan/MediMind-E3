// MediMind Platform - Knowledge Activity (Chairman / Platform Owner)
// Section 20 of PLATFORM OWNER.txt: Medical knowledge & doctor contribution oversight across platform network
// Multi-filter system: Hospital, Department, Status, Author, Date/Period + Search
// Strict Privacy: Drafts excluded, read-only oversight archive

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Eye,
  X,
  Building2,
  Filter,
  RotateCcw,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function KnowledgeActivityView() {
  const [articles, setArticles] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function load() {
      const [articlesData, hospsData] = await Promise.all([
        chairmanService.getKnowledgeArticles(),
        chairmanService.getHospitals(),
      ]);
      // Explicit guarantee: Filter out drafts (drafts belong privately to authoring clinician)
      const nonDrafts = (articlesData || []).filter((a) => a.status !== 'Draft');
      setArticles(nonDrafts);
      setHospitals(hospsData || []);
    }
    load();
  }, []);

  // Dynamic filter options derived from non-draft articles
  const hospitalOptions = useMemo(() => {
    const list = new Set();
    articles.forEach((a) => {
      if (a.hospital) list.add(a.hospital);
      else if (a.hospitalName) list.add(a.hospitalName);
    });
    return ['All', ...Array.from(list).sort()];
  }, [articles]);

  const departmentOptions = useMemo(() => {
    const list = new Set();
    articles.forEach((a) => {
      if (a.department) list.add(a.department);
      else if (a.departmentName) list.add(a.departmentName);
    });
    return ['All', ...Array.from(list).sort()];
  }, [articles]);

  const statusOptions = useMemo(() => {
    const list = new Set();
    articles.forEach((a) => {
      if (a.status && a.status !== 'Draft') list.add(a.status);
    });
    return ['All', ...Array.from(list).sort()];
  }, [articles]);

  const authorOptions = useMemo(() => {
    const list = new Set();
    articles.forEach((a) => {
      if (a.author) list.add(a.author);
      else if (a.authorName) list.add(a.authorName);
    });
    return ['All', ...Array.from(list).sort()];
  }, [articles]);

  const periodOptions = ['All', 'September 2026', 'Earlier 2026'];

  // Combined Multi-Filter Logic (AND behavior)
  const filtered = useMemo(() => {
    return articles.filter((a) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const title = (a.title || '').toLowerCase();
        const author = (a.author || a.authorName || '').toLowerCase();
        const dept = (a.department || a.departmentName || '').toLowerCase();
        const hosp = (a.hospital || a.hospitalName || '').toLowerCase();
        const summary = (a.summary || '').toLowerCase();
        const tags = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';
        const category = (a.category || '').toLowerCase();

        const matchesSearch =
          title.includes(q) ||
          author.includes(q) ||
          dept.includes(q) ||
          hosp.includes(q) ||
          summary.includes(q) ||
          tags.includes(q) ||
          category.includes(q);

        if (!matchesSearch) return false;
      }

      // Hospital filter
      if (selectedHospital !== 'All') {
        const hospName = a.hospital || a.hospitalName || '';
        const hospId = a.hospitalId || '';
        if (hospName !== selectedHospital && hospId !== selectedHospital) return false;
      }

      // Department filter
      if (selectedDept !== 'All') {
        const deptName = a.department || a.departmentName || '';
        if (deptName !== selectedDept) return false;
      }

      // Status filter
      if (selectedStatus !== 'All') {
        if (a.status !== selectedStatus) return false;
      }

      // Author filter
      if (selectedAuthor !== 'All') {
        const authorName = a.author || a.authorName || '';
        if (authorName !== selectedAuthor) return false;
      }

      // Period filter
      if (selectedPeriod !== 'All') {
        const dateStr = a.publishedDate || a.date || a.createdDate || '';
        if (selectedPeriod === 'September 2026') {
          if (!dateStr.includes('Sep 2026')) return false;
        } else if (selectedPeriod === 'Earlier 2026') {
          if (dateStr.includes('Sep 2026')) return false;
        }
      }

      return true;
    });
  }, [articles, search, selectedHospital, selectedDept, selectedStatus, selectedAuthor, selectedPeriod]);

  const isFiltered =
    search.trim() !== '' ||
    selectedHospital !== 'All' ||
    selectedDept !== 'All' ||
    selectedStatus !== 'All' ||
    selectedAuthor !== 'All' ||
    selectedPeriod !== 'All';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedHospital('All');
    setSelectedDept('All');
    setSelectedStatus('All');
    setSelectedAuthor('All');
    setSelectedPeriod('All');
  };

  const totalPublished = useMemo(() => articles.filter((a) => a.status === 'Published').length, [articles]);
  const pendingReviews = useMemo(
    () => articles.filter((a) => a.status === 'Under Review' || a.status === 'Changes Requested').length,
    [articles]
  );
  const uniqueAuthors = useMemo(
    () => new Set(articles.map((a) => a.author).filter(Boolean)).size,
    [articles]
  );
  const guidelinesCount = useMemo(
    () =>
      articles.filter(
        (a) =>
          (a.category || '').toLowerCase().includes('clinical') ||
          (a.tags || []).some((t) => t.toLowerCase().includes('protocol') || t.toLowerCase().includes('guideline'))
      ).length,
    [articles]
  );

  return (
    <div className="knowledge-activity-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <BookOpen size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Medical Publishing & Clinical Protocols
            </p>
            <h1>Knowledge Activity & Platform Publication Oversight</h1>
            <p>
              High-level network oversight of peer-reviewed clinical knowledge, departmental SOPs, and physician publications.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--chair-muted)',
            backgroundColor: 'var(--chair-card)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--chair-border)',
          }}
        >
          <ShieldCheck size={16} style={{ color: '#0f766e' }} />
          <span>Doctors Author · Dept Heads Review · Institutional Oversight Only</span>
        </div>
      </div>

      {/* Aggregate Knowledge KPIs */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <Layers size={18} />
            </span>
            <span className="stat-delta">Platform Hub</span>
          </div>
          <h3>{articles.length}</h3>
          <p>Total Knowledge Records</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Across {hospitals.length || 3} Network Hospitals
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={18} />
            </span>
            <span className="stat-delta">Publicly Active</span>
          </div>
          <h3>{totalPublished}</h3>
          <p>Published Articles</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            {uniqueAuthors} contributing clinician authors
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={18} />
            </span>
            <span className="stat-delta">Review Queue</span>
          </div>
          <h3>{pendingReviews}</h3>
          <p>Under Peer Review</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Department Head review pipeline
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <FileText size={18} />
            </span>
            <span className="stat-delta">Clinical SOPs</span>
          </div>
          <h3>{guidelinesCount}</h3>
          <p>Clinical Protocols</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Standardized clinical pathways
          </small>
        </div>
      </div>

      {/* Multi-Filter & Search Panel */}
      <div
        className="table-card"
        style={{
          padding: '18px 22px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--chair-sapphire)" />
            <strong style={{ fontSize: '13px', color: 'var(--chair-ink)' }}>
              Filter & Search Platform Repository
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--chair-muted)',
                backgroundColor: 'var(--chair-bg)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--chair-border)',
              }}
            >
              Showing {filtered.length} of {articles.length} items
            </span>

            {isFiltered && (
              <button
                className="secondary-button"
                onClick={handleResetFilters}
                style={{ padding: '4px 10px', fontSize: '12px', gap: '5px' }}
                title="Reset all search and filter parameters"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Keyword Search */}
          <div className="chairman-search" style={{ width: '100%' }}>
            <Search size={15} />
            <input
              placeholder="Search title, author, keyword, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--chair-border)',
                background: 'var(--chair-bg)',
                color: 'var(--chair-ink)',
                fontSize: '12.5px',
                outline: 'none',
              }}
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              aria-label="Filter by Hospital"
            >
              <option value="All">All Hospitals</option>
              {hospitalOptions
                .filter((h) => h !== 'All')
                .map((hosp) => (
                  <option key={hosp} value={hosp}>
                    {hosp}
                  </option>
                ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--chair-border)',
                background: 'var(--chair-bg)',
                color: 'var(--chair-ink)',
                fontSize: '12.5px',
                outline: 'none',
              }}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="Filter by Department"
            >
              <option value="All">All Departments</option>
              {departmentOptions
                .filter((d) => d !== 'All')
                .map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--chair-border)',
                background: 'var(--chair-bg)',
                color: 'var(--chair-ink)',
                fontSize: '12.5px',
                outline: 'none',
              }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="All">All Statuses</option>
              {statusOptions
                .filter((s) => s !== 'All')
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--chair-border)',
                background: 'var(--chair-bg)',
                color: 'var(--chair-ink)',
                fontSize: '12.5px',
                outline: 'none',
              }}
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              aria-label="Filter by Author"
            >
              <option value="All">All Authors</option>
              {authorOptions
                .filter((a) => a !== 'All')
                .map((auth) => (
                  <option key={auth} value={auth}>
                    {auth}
                  </option>
                ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <select
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--chair-border)',
                background: 'var(--chair-bg)',
                color: 'var(--chair-ink)',
                fontSize: '12.5px',
                outline: 'none',
              }}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              aria-label="Filter by Period"
            >
              {periodOptions.map((period) => (
                <option key={period} value={period}>
                  {period === 'All' ? 'All Periods' : period}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table or Empty State */}
      {filtered.length === 0 ? (
        <div
          className="table-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--chair-indigo-soft)',
              color: 'var(--chair-indigo)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <BookOpen size={28} />
          </div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', fontSize: '16px', fontWeight: 700 }}>
            No Knowledge Articles Match Your Criteria
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--chair-muted)', maxWidth: '440px', lineHeight: 1.5 }}>
            No clinical publications or protocols across the network matched your active search or filter parameters.
          </p>
          {isFiltered && (
            <button
              className="primary-button"
              style={{ marginTop: '8px', fontSize: '12px' }}
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Article Title & Topic</th>
                  <th>Hospital Facility</th>
                  <th>Author Specialist</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Reads & Citations</th>
                  <th>Category</th>
                  <th>Review Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((art) => {
                  const isPub = art.status === 'Published';
                  const isReview = art.status === 'Under Review';
                  const isChanges = art.status === 'Changes Requested';

                  let statusBadgeClass = 'badge-info';
                  if (isPub) statusBadgeClass = 'badge-approved';
                  else if (isReview) statusBadgeClass = 'badge-pending';
                  else if (isChanges) statusBadgeClass = 'badge-inactive';

                  return (
                    <tr key={art.id}>
                      <td>
                        <strong style={{ display: 'block', fontSize: '13px', lineHeight: 1.35 }}>{art.title}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>ID: {art.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <Building2 size={13} style={{ color: 'var(--chair-muted)' }} />
                          <span>{art.hospital || art.hospitalName || 'Network Hospital'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{art.author}</div>
                        <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{art.authorRole || art.role || 'Clinician'}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{art.department}</span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{art.publishedDate || art.date || art.createdDate || '—'}</td>
                      <td>
                        <strong style={{ fontSize: '12px' }}>{(art.viewsCount ?? art.views ?? art.reads ?? 0).toLocaleString()}</strong>
                        <span style={{ color: 'var(--chair-muted)', fontSize: '11px' }}> reads</span>
                        {art.citations ? (
                          <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{art.citations} citations</div>
                        ) : null}
                      </td>
                      <td style={{ fontSize: '12px' }}>{art.category || 'Clinical Protocol'}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>{art.status || 'Published'}</span>
                      </td>
                      <td>
                        <button
                          className="secondary-button"
                          style={{ padding: '6px 12px', fontSize: '11px', gap: '5px' }}
                          onClick={() => setSelectedArticle(art)}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Article Detail / Manuscript Modal with Smooth Scrolling */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-dialog lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  {selectedArticle.hospital || 'MediMind Platform'} · {selectedArticle.department}
                </p>
                <h2>{selectedArticle.title}</h2>
                <p>
                  Authored by {selectedArticle.author}{' '}
                  {selectedArticle.authorRole ? `(${selectedArticle.authorRole})` : ''}
                </p>
              </div>
              <button
                className="close-form"
                onClick={() => setSelectedArticle(null)}
                aria-label="Close article modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '12px 16px',
                  background: 'var(--chair-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--chair-border)',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                    Facility
                  </small>
                  <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                    {selectedArticle.hospital || selectedArticle.hospitalName || 'MediMind Central Hospital'}
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                    Published Date
                  </small>
                  <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                    {selectedArticle.publishedDate || selectedArticle.date || selectedArticle.createdDate || '—'}
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                    Public Reads
                  </small>
                  <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                    {(selectedArticle.viewsCount ?? selectedArticle.views ?? selectedArticle.reads ?? 0).toLocaleString()} views
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                    Category
                  </small>
                  <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                    {selectedArticle.category || 'Clinical Protocol'}
                  </div>
                </div>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                    Status
                  </small>
                  <div>
                    <span className="badge badge-approved">{selectedArticle.status}</span>
                  </div>
                </div>
              </div>

              {selectedArticle.reviewerFeedback && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#92400e',
                  }}
                >
                  <strong>Department Head Peer-Review Feedback:</strong>
                  <p style={{ margin: '4px 0 0', lineHeight: 1.4 }}>{selectedArticle.reviewerFeedback}</p>
                </div>
              )}

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--chair-bg)',
                  border: '1px solid var(--chair-border)',
                  marginBottom: '18px',
                }}
              >
                <strong style={{ fontSize: '12px', color: 'var(--chair-ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Executive Clinical Abstract
                </strong>
                <p style={{ margin: '6px 0 0', lineHeight: 1.6, color: 'var(--chair-ink)', fontSize: '13px' }}>
                  {selectedArticle.summary}
                </p>
              </div>

              <div style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--chair-ink)' }}>
                <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  Full Manuscript / Protocol Body:
                </strong>
                {selectedArticle.content ? (
                  <div style={{ whiteSpace: 'pre-line', fontFamily: 'inherit' }}>
                    {selectedArticle.content}
                  </div>
                ) : (
                  <p style={{ color: 'var(--chair-muted)' }}>
                    This peer-reviewed clinical knowledge document is maintained in the institutional repository for cross-hospital standard of care synchronization and medical exchange.
                  </p>
                )}
              </div>

              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--chair-indigo-soft)',
                  fontSize: '11px',
                  color: 'var(--chair-indigo)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={16} />
                <span>
                  MediMind Platform Governance Policy: Educational and clinical publications are peer-reviewed by Department Heads. Patient PHI is strictly excluded.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)', marginRight: 'auto' }}>
                Platform-Wide Read-Only Archive
              </span>
              <button className="primary-button" onClick={() => setSelectedArticle(null)}>
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeActivityView;
