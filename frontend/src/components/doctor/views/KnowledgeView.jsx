import React, { useState } from 'react';

export function KnowledgeView({
  articles = [],
  onOpenCreateArticle,
}) {
  const [tabFilter, setTabFilter] = useState('My Articles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = articles.filter((art) => {
    let matchesTab = true;
    if (tabFilter === 'My Articles') matchesTab = art.author?.includes('Dr. Rahul Mehta');
    else if (tabFilter === 'Published') matchesTab = art.status === 'Published';
    else if (tabFilter === 'Under Review') matchesTab = art.status === 'Under Review';

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)));

    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              MediMind Clinical Knowledge Base & Articles
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Contribute peer-reviewed medical guidelines, rehabilitation protocols, and patient education
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
        <div className="doctor-tabs" style={{ marginBottom: '14px' }}>
          <button
            className={`doctor-tab-btn ${tabFilter === 'My Articles' ? 'active' : ''}`}
            onClick={() => setTabFilter('My Articles')}
          >
            My Authored Articles
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Published' ? 'active' : ''}`}
            onClick={() => setTabFilter('Published')}
          >
            Published Guidelines
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Under Review' ? 'active' : ''}`}
            onClick={() => setTabFilter('Under Review')}
          >
            Under Review (Dept Head)
          </button>
        </div>

        <div className="doctor-search-input">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search medical guidelines, tags, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Articles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="doctor-card"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="doctor-badge doctor-badge-draft">{art.category}</span>
                <span className={`doctor-badge doctor-badge-${art.status.toLowerCase().replace(' ', '-')}`}>
                  ● {art.status}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--doctor-text-primary)', lineHeight: 1.3 }}>
                {art.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--doctor-text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                {art.summary}
              </p>

              {art.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {art.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: 'var(--doctor-bg)', borderRadius: '4px', color: 'var(--doctor-text-muted)', border: '1px solid var(--doctor-border)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--doctor-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                By <strong>{art.author}</strong> ({art.department})
              </div>
              <button
                className="doctor-btn doctor-btn-outline doctor-btn-sm"
                onClick={() => setSelectedArticle(art)}
              >
                Read Article &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {selectedArticle && (
        <div className="doctor-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <span className="doctor-badge doctor-badge-draft" style={{ marginBottom: '6px' }}>
                  {selectedArticle.category}
                </span>
                <h3 className="doctor-modal-title" style={{ marginTop: '4px' }}>
                  {selectedArticle.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                  By {selectedArticle.author} ({selectedArticle.authorRole}) • Status: {selectedArticle.status}
                </div>
              </div>
              <button className="doctor-btn-icon" onClick={() => setSelectedArticle(null)}>✕</button>
            </div>

            <div className="doctor-modal-body" style={{ maxHeight: '60vh', lineHeight: 1.6, fontSize: '14px', color: 'var(--doctor-text-secondary)', whiteSpace: 'pre-line' }}>
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '8px', marginBottom: '16px', color: 'var(--doctor-text-primary)', fontWeight: 500 }}>
                <strong>Executive Summary:</strong> {selectedArticle.summary}
              </div>
              <div>{selectedArticle.content}</div>
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
