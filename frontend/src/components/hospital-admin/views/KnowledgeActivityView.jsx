import { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Eye,
  Calendar,
  User,
  ShieldCheck,
  Filter,
  RotateCcw,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export function KnowledgeActivityView({
  knowledge,
  articles: propArticles,
  hospital,
  departments: _departments,
  doctors: _doctors,
}) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const currentHospitalId = hospital?.id || 'HOSP-001';
  const currentHospitalName = hospital?.name || 'MediMind Central Hospital';

  // 1. Resolve raw article list from props
  const rawArticles = useMemo(() => {
    if (Array.isArray(propArticles)) return propArticles;
    if (propArticles?.recentArticles) return propArticles.recentArticles;
    if (Array.isArray(knowledge)) return knowledge;
    if (knowledge?.recentArticles) return knowledge.recentArticles;
    return [];
  }, [knowledge, propArticles]);

  // 2. Strict Hospital Scoping & Draft Privacy Boundary:
  // - Hospital Admin only sees articles belonging to their assigned hospital
  // - Draft articles are private to authoring clinicians and are excluded
  const hospitalArticles = useMemo(() => {
    return rawArticles.filter((art) => {
      const isHospitalMatch =
        art.hospitalId === currentHospitalId ||
        art.hospital === currentHospitalName ||
        (!art.hospitalId && !art.hospital);
      const isNotDraft = art.status !== 'Draft';
      return isHospitalMatch && isNotDraft;
    });
  }, [rawArticles, currentHospitalId, currentHospitalName]);

  // 3. Dynamic filter option lists derived from hospital-scoped non-draft articles
  const departmentOptions = useMemo(() => {
    const depts = new Set();
    hospitalArticles.forEach((art) => {
      if (art.department) depts.add(art.department);
      if (art.departmentName) depts.add(art.departmentName);
    });
    return ['All', ...Array.from(depts).sort()];
  }, [hospitalArticles]);

  const statusOptions = useMemo(() => {
    const statuses = new Set();
    hospitalArticles.forEach((art) => {
      if (art.status && art.status !== 'Draft') statuses.add(art.status);
    });
    return ['All', ...Array.from(statuses).sort()];
  }, [hospitalArticles]);

  const authorOptions = useMemo(() => {
    const authors = new Set();
    hospitalArticles.forEach((art) => {
      if (art.author) authors.add(art.author);
      else if (art.authorName) authors.add(art.authorName);
    });
    return ['All', ...Array.from(authors).sort()];
  }, [hospitalArticles]);

  const periodOptions = ['All', 'September 2026', 'Earlier 2026'];

  // 4. Combined Filtering (AND behavior)
  const filteredArticles = useMemo(() => {
    return hospitalArticles.filter((art) => {
      // Search term
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const title = (art.title || '').toLowerCase();
        const author = (art.author || art.authorName || '').toLowerCase();
        const dept = (art.department || art.departmentName || '').toLowerCase();
        const summary = (art.summary || '').toLowerCase();
        const tags = Array.isArray(art.tags) ? art.tags.join(' ').toLowerCase() : '';
        const category = (art.category || '').toLowerCase();

        const matchesSearch =
          title.includes(q) ||
          author.includes(q) ||
          dept.includes(q) ||
          summary.includes(q) ||
          tags.includes(q) ||
          category.includes(q);

        if (!matchesSearch) return false;
      }

      // Department filter
      if (selectedDept !== 'All') {
        const deptName = art.department || art.departmentName || '';
        if (deptName !== selectedDept) return false;
      }

      // Status filter
      if (selectedStatus !== 'All') {
        if (art.status !== selectedStatus) return false;
      }

      // Author filter
      if (selectedAuthor !== 'All') {
        const authorName = art.author || art.authorName || '';
        if (authorName !== selectedAuthor) return false;
      }

      // Period filter
      if (selectedPeriod !== 'All') {
        const dateStr = art.publishedDate || art.date || art.createdDate || '';
        if (selectedPeriod === 'September 2026') {
          if (!dateStr.includes('Sep 2026')) return false;
        } else if (selectedPeriod === 'Earlier 2026') {
          if (dateStr.includes('Sep 2026')) return false;
        }
      }

      return true;
    });
  }, [hospitalArticles, search, selectedDept, selectedStatus, selectedAuthor, selectedPeriod]);

  // Dynamic statistics
  const totalPublishedCount = useMemo(
    () => hospitalArticles.filter((a) => a.status === 'Published').length,
    [hospitalArticles]
  );
  const pendingReviewCount = useMemo(
    () => hospitalArticles.filter((a) => a.status === 'Under Review' || a.status === 'Changes Requested').length,
    [hospitalArticles]
  );
  const guidelinesCount = useMemo(
    () =>
      hospitalArticles.filter(
        (a) =>
          (a.category || '').toLowerCase().includes('clinical') ||
          (a.tags || []).some((t) => t.toLowerCase().includes('protocol') || t.toLowerCase().includes('guideline'))
      ).length,
    [hospitalArticles]
  );

  const isFiltered =
    search.trim() !== '' ||
    selectedDept !== 'All' ||
    selectedStatus !== 'All' ||
    selectedAuthor !== 'All' ||
    selectedPeriod !== 'All';

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDept('All');
    setSelectedStatus('All');
    setSelectedAuthor('All');
    setSelectedPeriod('All');
  };

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <BookOpen size={24} />
          </div>
          <div>
            <h1>MediMind Knowledge & Article Oversight</h1>
            <p>
              Monitor doctor medical knowledge publication, departmental clinical observations, and research activity across {currentHospitalName} clinical teams
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--ha-text-muted)',
            backgroundColor: 'var(--ha-card)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--ha-border)',
          }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Doctors Author · Department Heads Review & Approve · Read-Only Institutional Oversight</span>
        </div>
      </div>

      {/* Dynamic Summary Stats Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Hospital Knowledge Items"
          value={hospitalArticles.length}
          subtext="Institutional clinical records"
          icon={Layers}
          tone="primary"
          isPositive
        />
        <StatCard
          label="Published Articles"
          value={totalPublishedCount}
          subtext="Approved & active in public hub"
          icon={CheckCircle2}
          tone="teal"
          isPositive
        />
        <StatCard
          label="Peer-Review Queue"
          value={pendingReviewCount}
          subtext="Under review or changes requested"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Clinical Protocols & SOPs"
          value={guidelinesCount}
          subtext="Evidence-based care pathways"
          icon={FileText}
          tone="indigo"
        />
      </div>

      {/* Multi-Filter and Search Bar */}
      <div
        className="ha-card-panel"
        style={{
          padding: '16px 20px',
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
            <Filter size={16} style={{ color: 'var(--ha-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ha-text-primary)' }}>
              Filter & Search Knowledge Repository
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ha-text-muted)',
                backgroundColor: 'var(--ha-bg)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--ha-border)',
              }}
            >
              Showing {filteredArticles.length} of {hospitalArticles.length} items
            </span>

            {isFiltered && (
              <button
                className="ha-btn ha-btn-secondary ha-btn-sm"
                onClick={handleResetFilters}
                title="Reset all search and filter parameters"
                style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <RotateCcw size={13} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search Box */}
          <div className="ha-search-box" style={{ width: '100%' }}>
            <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
            <input
              placeholder="Search title, keyword, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              className="ha-select"
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
              className="ha-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Publication Status"
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

          {/* Author / Doctor Filter */}
          <div>
            <select
              className="ha-select"
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              aria-label="Filter by Author"
            >
              <option value="All">All Authors</option>
              {authorOptions
                .filter((a) => a !== 'All')
                .map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <select
              className="ha-select"
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

      {/* Articles Grid or Empty State */}
      {filteredArticles.length === 0 ? (
        <div
          className="ha-card-panel"
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
              backgroundColor: 'var(--ha-soft-bg)',
              color: 'var(--ha-primary)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <BookOpen size={28} />
          </div>
          <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '16px', fontWeight: 700, color: 'var(--ha-text-primary)' }}>
            No Knowledge Articles Match Your Criteria
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ha-text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
            No institutional publications or clinical protocols in {currentHospitalName} matched your active search or filter parameters.
          </p>
          {isFiltered && (
            <button
              className="ha-btn ha-btn-primary ha-btn-sm"
              style={{ marginTop: '8px' }}
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredArticles.map((art) => {
            const isPub = art.status === 'Published';
            const isReview = art.status === 'Under Review';
            const isChanges = art.status === 'Changes Requested';

            let statusTone = 'info';
            if (isPub) statusTone = 'success';
            else if (isReview) statusTone = 'primary';
            else if (isChanges) statusTone = 'warning';

            return (
              <div
                key={art.id}
                className="ha-card-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  margin: 0,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="ha-badge info" style={{ fontSize: '10px' }}>
                        {art.department}
                      </span>
                      {art.category && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--ha-text-muted)',
                            backgroundColor: 'var(--ha-bg)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--ha-border)',
                          }}
                        >
                          {art.category}
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        margin: '4px 0 0',
                        fontFamily: 'Montserrat',
                        fontSize: '15px',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: 'var(--ha-text-primary)',
                      }}
                    >
                      {art.title}
                    </h3>
                  </div>
                  <span className={`ha-badge ${statusTone}`} style={{ flexShrink: 0 }}>
                    {art.status}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--ha-text-secondary)',
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {art.summary}
                </p>

                {/* Author & Publication Telemetry Meta Box */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ha-bg)',
                    fontSize: '11px',
                    color: 'var(--ha-text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1px solid var(--ha-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} style={{ color: 'var(--ha-primary)' }} />
                    <span>
                      Author: <strong style={{ color: 'var(--ha-text-primary)' }}>{art.author}</strong>{' '}
                      {art.authorRole || art.role ? `(${art.authorRole || art.role})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span>
                      Date: {art.publishedDate || art.date || art.createdDate} ·{' '}
                      {art.reads ?? art.views ?? 0} Public Reads · {art.citations ?? 0} Citations
                    </span>
                  </div>
                  {art.reviewerName && (
                    <div style={{ fontSize: '10px', color: 'var(--ha-text-muted)', paddingTop: '2px' }}>
                      Reviewer: {art.reviewerName} ({art.reviewerRole || 'Department Head'})
                    </div>
                  )}
                </div>

                {/* Tags */}
                {Array.isArray(art.tags) && art.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {art.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '10px',
                          color: 'var(--ha-text-muted)',
                          backgroundColor: 'var(--ha-bg)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    {art.tags.length > 3 && (
                      <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>
                        +{art.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Trigger */}
                <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                  <button
                    className="ha-btn ha-btn-secondary ha-btn-sm"
                    style={{ width: '100%' }}
                    onClick={() => setSelectedArticle(art)}
                  >
                    <Eye size={14} /> Read Full Article / Protocol
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Read-Only Article / Protocol Viewer Modal */}
      {selectedArticle && (
        <div className="ha-modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="ha-modal lg" onClick={(e) => e.stopPropagation()}>
            <div className="ha-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} style={{ color: 'var(--ha-primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ha-primary)' }}>
                  {selectedArticle.department} · {selectedArticle.category || 'Clinical Protocol'}
                </span>
              </div>
              <button
                className="ha-modal-close-btn"
                onClick={() => setSelectedArticle(null)}
                aria-label="Close article modal"
              >
                ×
              </button>
            </div>

            <div className="ha-modal-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <h2
                  style={{
                    fontFamily: 'Montserrat',
                    fontSize: '19px',
                    fontWeight: 700,
                    margin: 0,
                    color: 'var(--ha-text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {selectedArticle.title}
                </h2>
                <span className={`ha-badge ${selectedArticle.status === 'Published' ? 'success' : 'warning'}`} style={{ flexShrink: 0 }}>
                  {selectedArticle.status}
                </span>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--ha-text-muted)',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--ha-border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <span>
                  <strong>Author:</strong> {selectedArticle.author}{' '}
                  {selectedArticle.authorRole || selectedArticle.role ? `(${selectedArticle.authorRole || selectedArticle.role})` : ''}
                </span>
                <span>
                  <strong>Facility:</strong> {selectedArticle.hospital || currentHospitalName}
                </span>
                <span>
                  <strong>Date:</strong> {selectedArticle.publishedDate || selectedArticle.date || selectedArticle.createdDate}
                </span>
                <span>
                  <strong>Public Reads:</strong> {selectedArticle.reads ?? selectedArticle.views ?? 0}
                </span>
                <span>
                  <strong>Citations:</strong> {selectedArticle.citations ?? 0}
                </span>
              </div>

              {/* Reviewer Note if available */}
              {selectedArticle.reviewerFeedback && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ha-warning-bg, #fffbeb)',
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

              {/* Summary Abstract */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ha-bg)',
                  border: '1px solid var(--ha-border)',
                  marginBottom: '18px',
                }}
              >
                <strong style={{ fontSize: '12px', color: 'var(--ha-text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Executive Clinical Abstract
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: 1.6, color: 'var(--ha-text-secondary)' }}>
                  {selectedArticle.summary}
                </p>
              </div>

              {/* Full Content / Guidelines Body */}
              <div style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--ha-text-secondary)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)', display: 'block', marginBottom: '8px' }}>
                  Full Manuscript / Clinical Protocol Body:
                </strong>
                {selectedArticle.content ? (
                  <div style={{ whiteSpace: 'pre-line', fontFamily: 'inherit' }}>
                    {selectedArticle.content}
                  </div>
                ) : (
                  <p>
                    This peer-reviewed clinical knowledge document is archived in the {currentHospitalName} repository for collaborative medical exchange, clinical practice harmonization, patient education, and multi-disciplinary specialty alignment.
                  </p>
                )}
              </div>
            </div>

            <div className="ha-modal-footer">
              <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', marginRight: 'auto' }}>
                Institutional Read-Only Oversight Archive
              </span>
              <button
                className="ha-btn ha-btn-primary"
                onClick={() => setSelectedArticle(null)}
              >
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
