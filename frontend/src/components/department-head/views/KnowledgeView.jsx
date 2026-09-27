import React, { useState } from 'react';

export function KnowledgeView({
  articles = [],
  profile = null,
  onOpenCreateArticle,
  onReviewArticle,
}) {
  const [tabFilter, setTabFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [reviewingArticle, setReviewingArticle] = useState(null);
  const [reviewMode, setReviewMode] = useState(null); // 'approve' | 'changes' | null
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const underReviewArticles = articles.filter((a) => a.status === 'Under Review');
  const changesRequestedArticles = articles.filter((a) => a.status === 'Changes Requested');
  const publishedArticles = articles.filter((a) => a.status === 'Published');
  const draftArticles = articles.filter((a) => a.status === 'Draft');

  const categories = ['All', ...new Set(articles.map((a) => a.category).filter(Boolean))];

  const filteredArticles = articles.filter((art) => {
    let matchesTab = true;
    if (tabFilter === 'Under Review') matchesTab = art.status === 'Under Review';
    else if (tabFilter === 'Changes Requested') matchesTab = art.status === 'Changes Requested';
    else if (tabFilter === 'Published') matchesTab = art.status === 'Published';
    else if (tabFilter === 'Drafts') matchesTab = art.status === 'Draft';

    const matchesCategory = categoryFilter === 'All' || art.category === categoryFilter;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (art.title && art.title.toLowerCase().includes(q)) ||
      (art.summary && art.summary.toLowerCase().includes(q)) ||
      (art.author && art.author.toLowerCase().includes(q)) ||
      (art.category && art.category.toLowerCase().includes(q)) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)));

    return matchesTab && matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Under Review':
        return <span className="dh-badge dh-badge-under-review">⏳ Under Review</span>;
      case 'Changes Requested':
        return <span className="dh-badge dh-badge-changes-requested">⚠ Changes Requested</span>;
      case 'Published':
        return <span className="dh-badge dh-badge-published">✓ Published</span>;
      case 'Draft':
        return <span className="dh-badge dh-badge-draft">● Draft</span>;
      default:
        return <span className="dh-badge">{status}</span>;
    }
  };

  const handleOpenReviewModal = (art) => {
    setReviewingArticle(art);
    setReviewMode(null);
    setFeedbackText(art.reviewerFeedback || '');
    setFeedbackError('');
  };

  const handleCloseReviewModal = () => {
    setReviewingArticle(null);
    setReviewMode(null);
    setFeedbackText('');
    setFeedbackError('');
  };

  const handleApprove = async () => {
    if (!reviewingArticle || !onReviewArticle) return;
    setSubmitting(true);
    try {
      await onReviewArticle(reviewingArticle.id, {
        decision: 'Approve',
      });
      handleCloseReviewModal();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setFeedbackError('Please enter detailed clinical feedback explaining what revisions are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onReviewArticle(reviewingArticle.id, {
        decision: 'Changes Requested',
        feedback: feedbackText.trim(),
      });
      handleCloseReviewModal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="dh-badge dh-badge-scheduled">{profile?.departmentName || 'Orthopedics'}</span>
              <span style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>Peer-Review & Knowledge Base</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Knowledge & Publications Review Hub
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Peer-review faculty manuscripts, request clinical guideline revisions, and manage published protocols for {profile?.departmentName || 'Orthopedics'}.
            </p>
          </div>
          {onOpenCreateArticle && (
            <button className="dh-btn dh-btn-primary" onClick={onOpenCreateArticle}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Publish New Guideline
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="dh-card" style={{ padding: '16px 20px' }}>
        {/* Status Tabs */}
        <div className="dh-tabs">
          <button
            type="button"
            className={`dh-tab-btn ${tabFilter === 'All' ? 'active' : ''}`}
            onClick={() => setTabFilter('All')}
          >
            All Protocols <span className="dh-tab-count">{articles.length}</span>
          </button>
          <button
            type="button"
            className={`dh-tab-btn ${tabFilter === 'Under Review' ? 'active' : ''}`}
            onClick={() => setTabFilter('Under Review')}
            style={underReviewArticles.length > 0 ? { borderColor: 'var(--dh-blue)' } : {}}
          >
            ⏳ Under Review <span className="dh-tab-count" style={{ backgroundColor: underReviewArticles.length > 0 ? 'var(--dh-blue)' : undefined, color: underReviewArticles.length > 0 ? '#fff' : undefined }}>{underReviewArticles.length}</span>
          </button>
          <button
            type="button"
            className={`dh-tab-btn ${tabFilter === 'Changes Requested' ? 'active' : ''}`}
            onClick={() => setTabFilter('Changes Requested')}
          >
            ⚠ Changes Requested <span className="dh-tab-count">{changesRequestedArticles.length}</span>
          </button>
          <button
            type="button"
            className={`dh-tab-btn ${tabFilter === 'Published' ? 'active' : ''}`}
            onClick={() => setTabFilter('Published')}
          >
            ✓ Published <span className="dh-tab-count">{publishedArticles.length}</span>
          </button>
          <button
            type="button"
            className={`dh-tab-btn ${tabFilter === 'Drafts' ? 'active' : ''}`}
            onClick={() => setTabFilter('Drafts')}
          >
            ● Drafts <span className="dh-tab-count">{draftArticles.length}</span>
          </button>
        </div>

        {/* Filter & Search */}
        <div className="dh-filter-bar" style={{ margin: 0 }}>
          <div className="dh-filter-left">
            <div className="dh-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search protocols, tags, authors, clinical topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="dh-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>
            Showing <strong>{filteredArticles.length}</strong> of {articles.length} protocols
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredArticles.length === 0 ? (
          <div className="dh-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--dh-text-muted)' }}>
            No knowledge protocols found matching the selected filter criteria.
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isUnderReview = art.status === 'Under Review';
            const isChangesRequested = art.status === 'Changes Requested';
            const isPublished = art.status === 'Published';

            return (
              <div
                key={art.id}
                className="dh-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderLeft: isUnderReview
                    ? '4px solid var(--dh-blue)'
                    : isChangesRequested
                    ? '4px solid var(--dh-coral)'
                    : isPublished
                    ? '4px solid var(--dh-teal)'
                    : '4px solid var(--dh-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="dh-badge dh-badge-draft">{art.category}</span>
                    {getStatusBadge(art.status)}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--dh-text-primary)', lineHeight: 1.3 }}>
                    {art.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--dh-text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                    {art.summary}
                  </p>

                  {/* Status Banner */}
                  {isUnderReview && (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--dh-soft-bg)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--dh-blue)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>⏳</span>
                      <span>
                        Submitted {art.submittedDate || art.date} by <strong>{art.author}</strong> • Pending Department Head Review
                      </span>
                    </div>
                  )}

                  {isChangesRequested && (
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--dh-error-bg)',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--dh-coral)',
                        fontSize: '12px',
                        color: '#991b1b',
                        marginBottom: '10px',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                        💬 Reviewer Feedback Provided:
                      </div>
                      <div style={{ fontStyle: 'italic', color: 'var(--dh-text-primary)' }}>
                        "{art.reviewerFeedback || 'Revisions required.'}"
                      </div>
                    </div>
                  )}

                  {isPublished && (
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--dh-soft-teal)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: 'var(--dh-teal)',
                        marginBottom: '10px',
                      }}
                    >
                      ✓ Published on {art.publishedDate || art.date} • Approved by <strong>{art.reviewerName || 'Department Head'}</strong> • {art.views || 0} reads
                    </div>
                  )}

                  {art.tags && art.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {art.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            backgroundColor: 'var(--dh-bg)',
                            borderRadius: '4px',
                            color: 'var(--dh-text-muted)',
                            border: '1px solid var(--dh-border)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer / Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--dh-border)', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>
                    By <strong>{art.author}</strong> ({art.department || 'Orthopedics'})
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {isUnderReview && (
                      <button
                        type="button"
                        className="dh-btn dh-btn-primary dh-btn-sm"
                        onClick={() => handleOpenReviewModal(art)}
                        style={{ fontSize: '11.5px', padding: '4px 10px' }}
                      >
                        Review Protocol
                      </button>
                    )}

                    <button
                      type="button"
                      className="dh-btn dh-btn-outline dh-btn-sm"
                      onClick={() => setSelectedArticle(art)}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      Read Protocol &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reader Modal */}
      {selectedArticle && (
        <div className="dh-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="dh-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="dh-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="dh-badge dh-badge-draft">{selectedArticle.category}</span>
                  {getStatusBadge(selectedArticle.status)}
                </div>
                <h3 className="dh-modal-title" style={{ marginTop: '4px' }}>
                  {selectedArticle.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)', marginTop: '2px' }}>
                  By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole || selectedArticle.department}) • Department: <strong>{selectedArticle.department || 'Orthopedics'}</strong>
                </div>
              </div>
              <button className="dh-btn-icon" onClick={() => setSelectedArticle(null)} aria-label="Close modal">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="dh-modal-body" style={{ maxHeight: '60vh', lineHeight: 1.6, fontSize: '14px', color: 'var(--dh-text-secondary)', whiteSpace: 'pre-line' }}>
              {/* Reviewer / Meta */}
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--dh-bg)', borderRadius: '8px', border: '1px solid var(--dh-border)', marginBottom: '16px', fontSize: '12.5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--dh-text-muted)' }}>Status:</span> <strong>{selectedArticle.status}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--dh-text-muted)' }}>Department:</span> <strong>{selectedArticle.department || 'Orthopedics'}</strong>
                  </div>
                  {selectedArticle.reviewerName && (
                    <div>
                      <span style={{ color: 'var(--dh-text-muted)' }}>Reviewer:</span> <strong>{selectedArticle.reviewerName}</strong>
                    </div>
                  )}
                  {selectedArticle.publishedDate && (
                    <div>
                      <span style={{ color: 'var(--dh-text-muted)' }}>Published:</span> <strong>{selectedArticle.publishedDate}</strong>
                    </div>
                  )}
                </div>

                {selectedArticle.reviewerFeedback && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: 'var(--dh-error-bg)', borderRadius: '6px', color: '#991b1b' }}>
                    <strong>Reviewer Feedback:</strong> "{selectedArticle.reviewerFeedback}"
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px', marginBottom: '16px', color: 'var(--dh-text-primary)', fontWeight: 500 }}>
                <strong>Executive Summary:</strong> {selectedArticle.summary}
              </div>

              <div>{selectedArticle.content}</div>
            </div>

            <div className="dh-modal-footer">
              {selectedArticle.status === 'Under Review' && (
                <button
                  type="button"
                  className="dh-btn dh-btn-primary"
                  onClick={() => {
                    const art = selectedArticle;
                    setSelectedArticle(null);
                    handleOpenReviewModal(art);
                  }}
                >
                  Review Protocol
                </button>
              )}
              <button className="dh-btn dh-btn-outline" onClick={() => setSelectedArticle(null)}>
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Decision Modal */}
      {reviewingArticle && (
        <div className="dh-modal-overlay" onClick={handleCloseReviewModal}>
          <div className="dh-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="dh-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="dh-badge dh-badge-under-review">⏳ Peer-Review Mode</span>
                  <span className="dh-badge dh-badge-draft">{reviewingArticle.category}</span>
                </div>
                <h3 className="dh-modal-title" style={{ marginTop: '4px' }}>
                  Peer-Review: {reviewingArticle.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)', marginTop: '2px' }}>
                  Submitted by <strong>{reviewingArticle.author}</strong> ({reviewingArticle.authorRole || 'Consultant'}) • Department: <strong>{reviewingArticle.department || 'Orthopedics'}</strong>
                </div>
              </div>
              <button className="dh-btn-icon" onClick={handleCloseReviewModal} aria-label="Close modal">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="dh-modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              {feedbackError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--dh-error-bg)', color: 'var(--dh-error)', fontSize: '13px' }}>
                  {feedbackError}
                </div>
              )}

              {/* Protocol Overview Box */}
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px', color: 'var(--dh-text-primary)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dh-primary-light)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Executive Summary
                </div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.4 }}>{reviewingArticle.summary}</div>
              </div>

              {/* Protocol Full Text */}
              <div style={{ padding: '14px', backgroundColor: 'var(--dh-bg)', borderRadius: '8px', border: '1px solid var(--dh-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dh-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Full Manuscript Content
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--dh-text-secondary)', whiteSpace: 'pre-line' }}>
                  {reviewingArticle.content}
                </div>
              </div>

              {/* Review Decision Form */}
              {reviewMode === 'changes' ? (
                <form onSubmit={handleRequestChanges} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: 'var(--dh-error-bg)', borderRadius: '8px', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dh-coral)' }}>
                    💬 Required Reviewer Feedback for Author
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dh-text-secondary)' }}>
                    Specify exact clinical guideline amendments, dosage checks, citation requirements, or workflow modifications for <strong>{reviewingArticle.author}</strong>:
                  </div>
                  <textarea
                    className="dh-textarea"
                    rows={4}
                    placeholder="e.g. Please expand Section 3 regarding diabetic fasting protocols and cite the latest ASA 2026 clear fluid guidelines before final approval."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="dh-btn dh-btn-outline dh-btn-sm"
                      onClick={() => {
                        setReviewMode(null);
                        setFeedbackError('');
                      }}
                    >
                      Back to Decisions
                    </button>
                    <button
                      type="submit"
                      className="dh-btn dh-btn-danger dh-btn-sm"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback & Request Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: '16px', backgroundColor: 'var(--dh-card-hover)', borderRadius: '8px', border: '1px solid var(--dh-border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dh-text-primary)', marginBottom: '8px' }}>
                    Department Head Reviewer Actions
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--dh-text-muted)', margin: '0 0 14px' }}>
                    As Head of Orthopedics, you can approve and immediately publish this protocol to the hospital clinical guidelines repository, or send it back with written revision notes.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="dh-btn dh-btn-primary"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      ✓ Approve & Publish Protocol
                    </button>
                    <button
                      type="button"
                      className="dh-btn dh-btn-danger"
                      onClick={() => setReviewMode('changes')}
                    >
                      ⚠ Request Changes with Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="dh-modal-footer">
              <button type="button" className="dh-btn dh-btn-outline" onClick={handleCloseReviewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeView;
