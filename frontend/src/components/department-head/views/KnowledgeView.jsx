import React, { useState } from 'react';

export function KnowledgeView({
  articles = [],
  onOpenCreateArticle,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = categoryFilter === 'All' || art.category === categoryFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Orthopedic Clinical Guidelines & Knowledge Base
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Standardized clinical workflows, AI triage decision protocols, and peer-reviewed surgical practices
            </p>
          </div>
          <button className="dh-btn dh-btn-primary" onClick={onOpenCreateArticle}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Publish New Protocol
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dh-card" style={{ padding: '16px 20px' }}>
        <div className="dh-filter-bar" style={{ margin: 0 }}>
          <div className="dh-filter-left">
            <div className="dh-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search protocols, tags, topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="dh-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="AI Triage Guideline">AI Triage Guideline</option>
              <option value="Clinical Protocol">Clinical Protocol</option>
              <option value="Emergency Care">Emergency Care</option>
              <option value="Surgical Best Practices">Surgical Best Practices</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>
            Showing <strong>{filteredArticles.length}</strong> of {articles.length} protocols
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredArticles.map((art) => (
          <div key={art.id} className="dh-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="dh-badge dh-badge-scheduled">{art.category}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>{art.publishedDate}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--dh-text-primary)', lineHeight: 1.3 }}>
                {art.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--dh-text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                {art.summary}
              </p>
              {art.tags && art.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {art.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: 'var(--dh-bg)', borderRadius: '4px', color: 'var(--dh-text-muted)', border: '1px solid var(--dh-border)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--dh-border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>
                By <strong>{art.author}</strong>
              </div>
              <button
                className="dh-btn dh-btn-outline dh-btn-sm"
                onClick={() => setSelectedArticle(art)}
              >
                Read Protocol &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {selectedArticle && (
        <div className="dh-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="dh-modal-box lg" onClick={(e) => e.stopPropagation()}>
            <div className="dh-modal-header">
              <div>
                <span className="dh-badge dh-badge-scheduled" style={{ marginBottom: '6px' }}>
                  {selectedArticle.category}
                </span>
                <h3 className="dh-modal-title" style={{ marginTop: '4px' }}>
                  {selectedArticle.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)', marginTop: '2px' }}>
                  Authored by {selectedArticle.author} • Published on {selectedArticle.publishedDate}
                </div>
              </div>
              <button className="dh-btn-icon" onClick={() => setSelectedArticle(null)} aria-label="Close modal">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="dh-modal-body" style={{ maxHeight: '60vh', lineHeight: 1.6, fontSize: '14px', color: 'var(--dh-text-secondary)', whiteSpace: 'pre-line' }}>
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px', marginBottom: '16px', color: 'var(--dh-text-primary)', fontWeight: 500 }}>
                <strong>Executive Summary:</strong> {selectedArticle.summary}
              </div>
              <div>{selectedArticle.content}</div>
            </div>

            <div className="dh-modal-footer">
              <button className="dh-btn dh-btn-primary" onClick={() => setSelectedArticle(null)}>
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
