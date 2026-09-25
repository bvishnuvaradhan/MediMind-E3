import { useState } from 'react';
import {
  BookOpen,
  Search,
  Eye,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export function KnowledgeActivityView({ knowledge, articles: propArticles }) {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const stats = (knowledge && knowledge.stats) ? knowledge.stats : (propArticles && propArticles.stats ? propArticles.stats : {});
  const rawArticles = Array.isArray(propArticles)
    ? propArticles
    : (propArticles?.recentArticles || (Array.isArray(knowledge) ? knowledge : knowledge?.recentArticles) || []);
  const articles = Array.isArray(rawArticles) ? rawArticles : [];

  const filteredArticles = articles.filter((art) => {
    const title = art.title || '';
    const author = art.author || art.authorName || '';
    const dept = art.department || art.departmentName || '';
    return (
      !search ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      author.toLowerCase().includes(search.toLowerCase()) ||
      dept.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <BookOpen size={24} />
          </div>
          <div>
            <h1>MediMind Knowledge & Article Oversight</h1>
            <p>Monitor doctor medical knowledge publication, departmental clinical observations, and research activity across hospital clinical teams</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Doctors create · Department Heads review & approve · Publicly readable</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Published Articles"
          value={stats.totalPublished || 24}
          subtext="Hospital-wide medical publications"
          icon={BookOpen}
          tone="primary"
          isPositive
        />
        <StatCard
          label="Orthopedics Library"
          value={stats.orthopedicsPublished || 10}
          subtext="Trauma, Arthroplasty & Imaging"
          icon={BookOpen}
          tone="indigo"
        />
        <StatCard
          label="Diabetology Library"
          value={stats.diabetologyPublished || 7}
          subtext="Glycemic management & sensors"
          icon={BookOpen}
          tone="teal"
        />
        <StatCard
          label="Cardiology Library"
          value={stats.cardiologyPublished || 7}
          subtext="Coronary & Arrhythmia insights"
          icon={BookOpen}
          tone="warning"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '300px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search knowledge articles, authors, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredArticles.map((art) => (
          <div key={art.id} className="ha-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <span className="ha-badge info" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  {art.department}
                </span>
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700, lineHeight: 1.35 }}>
                  {art.title}
                </h3>
              </div>
              <span className={`ha-badge ${art.status === 'Published' ? 'success' : 'warning'}`}>
                {art.status}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.45 }}>
              {art.summary}
            </p>

            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', fontSize: '11px', color: 'var(--ha-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} />
                <span>Author: <strong style={{ color: 'var(--ha-text-primary)' }}>{art.author}</strong> ({art.role})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} />
                <span>Date: {art.publishedDate} · {art.reads} Public Reads</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
              <button
                className="ha-btn ha-btn-secondary ha-btn-sm"
                style={{ width: '100%' }}
                onClick={() => setSelectedArticle(art)}
              >
                <Eye size={14} /> Read Full Article
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="ha-modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ha-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} style={{ color: 'var(--ha-primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ha-primary)' }}>
                  {selectedArticle.department}
                </span>
              </div>
              <button className="ha-modal-close-btn" onClick={() => setSelectedArticle(null)}>
                ×
              </button>
            </div>

            <div className="ha-modal-body">
              <h2 style={{ fontFamily: 'Montserrat', fontSize: '18px', fontWeight: 700, margin: '0 0 10px', color: 'var(--ha-text-primary)' }}>
                {selectedArticle.title}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--ha-text-muted)', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <span>Author: {selectedArticle.author} ({selectedArticle.role})</span>
                <span>Date: {selectedArticle.publishedDate}</span>
              </div>

              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ha-text-secondary)' }}>
                <p><strong>Executive Abstract:</strong></p>
                <p>{selectedArticle.summary}</p>
                <p>
                  This peer-reviewed clinical knowledge document is archived in the MediMind Central Hospital repository for collaborative medical exchange, patient education, and cross-departmental specialty alignment.
                </p>
              </div>
            </div>

            <div className="ha-modal-footer">
              <button className="ha-btn ha-btn-primary" onClick={() => setSelectedArticle(null)}>
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

