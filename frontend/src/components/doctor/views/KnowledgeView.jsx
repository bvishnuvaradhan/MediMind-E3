import React, { useState } from 'react';

export function KnowledgeView({
  articles = [],
  doctorName = 'Dr. Rahul Mehta',
  deptHead = null,
  onOpenCreateArticle,
  onOpenEditArticle,
  onSubmitDraft,
}) {
  const [tabFilter, setTabFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const myArticles = articles.filter(
    (art) =>
      art.author?.toLowerCase().includes(doctorName.toLowerCase()) ||
      art.authorId === 'doc_001'
  );
  const draftArticles = articles.filter((art) => art.status === 'Draft');
  const underReviewArticles = articles.filter((art) => art.status === 'Under Review');
  const changesRequestedArticles = articles.filter((art) => art.status === 'Changes Requested');
  const publishedArticles = articles.filter((art) => art.status === 'Published');

  const filteredArticles = articles.filter((art) => {
    let matchesTab = true;
    if (tabFilter === 'My Articles') {
      matchesTab =
        art.author?.toLowerCase().includes(doctorName.toLowerCase()) ||
        art.authorId === 'doc_001';
    } else if (tabFilter === 'Drafts') {
      matchesTab = art.status === 'Draft';
    } else if (tabFilter === 'Under Review') {
      matchesTab = art.status === 'Under Review';
    } else if (tabFilter === 'Changes Requested') {
      matchesTab = art.status === 'Changes Requested';
    } else if (tabFilter === 'Published') {
      matchesTab = art.status === 'Published';
    }

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      art.title.toLowerCase().includes(q) ||
      art.summary?.toLowerCase().includes(q) ||
      art.author?.toLowerCase().includes(q) ||
      art.category?.toLowerCase().includes(q) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)));

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="doctor-badge doctor-badge-draft">● Draft</span>;
      case 'Under Review':
        return <span className="doctor-badge doctor-badge-scheduled">⏳ Under Review</span>;
      case 'Changes Requested':
        return <span className="doctor-badge doctor-badge-high">⚠ Changes Requested</span>;
      case 'Published':
        return <span className="doctor-badge doctor-badge-completed">✓ Published</span>;
      default:
        return <span className="doctor-badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              MediMind Clinical Knowledge Base & Guidelines
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Author clinical guidelines and protocols subject to Department Head (<strong>{deptHead?.name || 'Dr. Priya Sharma'}</strong>) peer review
            </p>
          </div>
          <button className="doctor-btn doctor-btn-primary" onClick={onOpenCreateArticle}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Write Knowledge Article
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="doctor-card" style={{ padding: '16px 20px' }}>
        <div className="doctor-tabs" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
          <button
            className={`doctor-tab-btn ${tabFilter === 'All' ? 'active' : ''}`}
            onClick={() => setTabFilter('All')}
          >
            All Articles ({articles.length})
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'My Articles' ? 'active' : ''}`}
            onClick={() => setTabFilter('My Articles')}
          >
            My Authored ({myArticles.length})
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Drafts' ? 'active' : ''}`}
            onClick={() => setTabFilter('Drafts')}
          >
            Drafts ({draftArticles.length})
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Under Review' ? 'active' : ''}`}
            onClick={() => setTabFilter('Under Review')}
          >
            Under Review ({underReviewArticles.length})
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Changes Requested' ? 'active' : ''}`}
            onClick={() => setTabFilter('Changes Requested')}
          >
            Changes Requested ({changesRequestedArticles.length})
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Published' ? 'active' : ''}`}
            onClick={() => setTabFilter('Published')}
          >
            Published ({publishedArticles.length})
          </button>
        </div>

        <div className="doctor-search-input">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search medical guidelines, tags, authors, clinical topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Articles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredArticles.length === 0 ? (
          <div className="doctor-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--doctor-text-muted)' }}>
            No knowledge articles found matching the selected filter criteria.
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isAuthor =
              art.author?.toLowerCase().includes(doctorName.toLowerCase()) ||
              art.authorId === 'doc_001';

            return (
              <div
                key={art.id}
                className="doctor-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  borderLeft:
                    art.status === 'Changes Requested'
                      ? '4px solid var(--doctor-coral)'
                      : art.status === 'Under Review'
                      ? '4px solid var(--doctor-primary)'
                      : art.status === 'Published'
                      ? '4px solid var(--doctor-teal)'
                      : '4px solid var(--doctor-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="doctor-badge doctor-badge-draft">{art.category}</span>
                    {getStatusBadge(art.status)}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--doctor-text-primary)', lineHeight: 1.3 }}>
                    {art.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                    {art.summary}
                  </p>

                  {/* Review / Status Specific Banner */}
                  {art.status === 'Under Review' && (
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--doctor-soft-bg)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--doctor-primary)',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>⏳</span>
                      <span>
                        Submitted {art.submittedDate || art.date} • Awaiting <strong>{art.reviewerName || deptHead?.name || 'Department Head'}</strong> review
                      </span>
                    </div>
                  )}

                  {art.status === 'Changes Requested' && (
                    <div
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--doctor-soft-coral)',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--doctor-coral)',
                        fontSize: '12px',
                        color: '#991b1b',
                        marginBottom: '10px',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                        💬 Reviewer Feedback ({art.reviewerName || deptHead?.name || 'Department Head'}):
                      </div>
                      <div style={{ fontStyle: 'italic', color: 'var(--doctor-text-primary)' }}>
                        "{art.reviewerFeedback || 'Please revise clinical citations and resubmit.'}"
                      </div>
                    </div>
                  )}

                  {art.status === 'Published' && (
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--doctor-soft-teal)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: 'var(--doctor-teal)',
                        marginBottom: '10px',
                      }}
                    >
                      ✓ Published on {art.publishedDate || art.date} • Approved by <strong>{art.reviewerName || 'Department Head'}</strong> • {art.views || 0} views
                    </div>
                  )}

                  {art.status === 'Draft' && (
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--doctor-bg)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: 'var(--doctor-text-muted)',
                        marginBottom: '10px',
                        border: '1px solid var(--doctor-border)',
                      }}
                    >
                      Draft created {art.createdDate || art.date} • Reviewer: <strong>{art.reviewerName || deptHead?.name || 'Department Head'}</strong>
                    </div>
                  )}

                  {art.tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {art.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            backgroundColor: 'var(--doctor-bg)',
                            borderRadius: '4px',
                            color: 'var(--doctor-text-muted)',
                            border: '1px solid var(--doctor-border)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--doctor-border)', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                    By <strong>{art.author}</strong> ({art.department})
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Draft Actions */}
                    {art.status === 'Draft' && isAuthor && (
                      <>
                        <button
                          type="button"
                          className="doctor-btn doctor-btn-outline doctor-btn-sm"
                          onClick={() => onOpenEditArticle(art)}
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Edit Draft
                        </button>
                        <button
                          type="button"
                          className="doctor-btn doctor-btn-primary doctor-btn-sm"
                          onClick={() => onSubmitDraft(art.id)}
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Submit for Review
                        </button>
                      </>
                    )}

                    {/* Changes Requested Actions */}
                    {art.status === 'Changes Requested' && isAuthor && (
                      <button
                        type="button"
                        className="doctor-btn doctor-btn-primary doctor-btn-sm"
                        onClick={() => onOpenEditArticle(art)}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        Edit & Resubmit
                      </button>
                    )}

                    {/* Under Review Indicator */}
                    {art.status === 'Under Review' && isAuthor && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          backgroundColor: 'var(--doctor-soft-bg)',
                          borderRadius: '4px',
                          color: 'var(--doctor-primary)',
                          fontWeight: 600,
                        }}
                      >
                        Awaiting Review
                      </span>
                    )}

                    {/* Universal Reader Button */}
                    <button
                      type="button"
                      className="doctor-btn doctor-btn-outline doctor-btn-sm"
                      onClick={() => setSelectedArticle(art)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Read Article &rarr;
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
        <div className="doctor-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="doctor-badge doctor-badge-draft">
                    {selectedArticle.category}
                  </span>
                  {getStatusBadge(selectedArticle.status)}
                </div>
                <h3 className="doctor-modal-title" style={{ marginTop: '4px' }}>
                  {selectedArticle.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                  By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole || selectedArticle.department}) • Department: <strong>{selectedArticle.department}</strong>
                </div>
              </div>
              <button className="doctor-btn-icon" onClick={() => setSelectedArticle(null)} aria-label="Close reader">✕</button>
            </div>

            <div className="doctor-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', lineHeight: 1.6, fontSize: '14px', color: 'var(--doctor-text-secondary)' }}>
              {/* Reviewer / Approval Metadata Card in Reader */}
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', border: '1px solid var(--doctor-border)', marginBottom: '16px', fontSize: '12.5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)' }}>Status:</span> <strong>{selectedArticle.status}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--doctor-text-muted)' }}>Assigned Reviewer:</span> <strong>{selectedArticle.reviewerName || deptHead?.name || 'Department Head'}</strong>
                  </div>
                  {selectedArticle.submittedDate && (
                    <div>
                      <span style={{ color: 'var(--doctor-text-muted)' }}>Submitted:</span> <strong>{selectedArticle.submittedDate}</strong>
                    </div>
                  )}
                  {selectedArticle.publishedDate && (
                    <div>
                      <span style={{ color: 'var(--doctor-text-muted)' }}>Published:</span> <strong>{selectedArticle.publishedDate}</strong>
                    </div>
                  )}
                </div>

                {selectedArticle.reviewerFeedback && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: 'var(--doctor-soft-coral)', borderRadius: '6px', color: '#991b1b' }}>
                    <strong>Reviewer Feedback:</strong> "{selectedArticle.reviewerFeedback}"
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', marginBottom: '16px', color: 'var(--doctor-text-primary)', fontWeight: 500 }}>
                <strong>Executive Summary:</strong> {selectedArticle.summary}
              </div>

              <div style={{ whiteSpace: 'pre-line' }}>{selectedArticle.content}</div>
            </div>

            <div className="doctor-modal-footer">
              <button className="doctor-btn doctor-btn-primary" onClick={() => setSelectedArticle(null)}>
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeView;
