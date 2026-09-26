// MediMind Platform - Knowledge Activity (Chairman / Platform Owner)
// Section 20 of PLATFORM OWNER.txt: Medical knowledge & doctor contribution oversight

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Eye,
  X,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function KnowledgeActivityView() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getKnowledgeArticles();
      setArticles(data || []);
    }
    load();
  }, []);

  const filtered = (articles || []).filter((a) => {
    const s = search.toLowerCase();
    const title = a.title || '';
    const author = a.author || '';
    const dept = a.department || '';
    return (
      title.toLowerCase().includes(s) ||
      author.toLowerCase().includes(s) ||
      dept.toLowerCase().includes(s)
    );
  });

  const totalPublished = articles.length;
  const uniqueAuthors = new Set(articles.map(a => a.author).filter(Boolean)).size;
  const orthoCount = articles.filter(a => a.department === 'Orthopedics').length;
  const diabCount = articles.filter(a => a.department?.includes('Diab')).length;
  const cardioCount = articles.filter(a => a.department === 'Cardiology').length;

  return (
    <div className="knowledge-activity-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <BookOpen size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Medical Publishing
            </p>
            <h1>Knowledge Activity & Clinical Publications</h1>
            <p>High-level platform oversight of peer-reviewed clinical knowledge and doctor research articles.</p>
          </div>
        </div>
      </div>

      {/* Aggregate Knowledge KPIs */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <p>Total Published Articles</p>
          <h3 style={{ marginTop: '8px' }}>{totalPublished}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Publicly accessible healthcare library</small>
        </div>
        <div className="stat-card">
          <p>Active Doctor Authors</p>
          <h3 style={{ marginTop: '8px' }}>{uniqueAuthors}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Contributing clinicians</small>
        </div>
        <div className="stat-card">
          <p>🦴 Orthopedics Publications</p>
          <h3 style={{ marginTop: '8px' }}>{orthoCount}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Skeletal & trauma care</small>
        </div>
        <div className="stat-card">
          <p>🩺 Diabetology Publications</p>
          <h3 style={{ marginTop: '8px' }}>{diabCount}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Glycemic & metabolic research</small>
        </div>
        <div className="stat-card">
          <p>❤️ Cardiology Publications</p>
          <h3 style={{ marginTop: '8px' }}>{cardioCount}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Coronary & vascular health</small>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="chairman-search">
          <Search size={15} />
          <input
            placeholder="Search article title, author doctor, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--chair-muted)' }}>
          Showing <b>{filtered.length}</b> published medical articles
        </div>
      </div>

      {/* Articles Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Article Title</th>
                <th>Author Specialist</th>
                <th>Department</th>
                <th>Published Date</th>
                <th>Reader Views</th>
                <th>Category</th>
                <th>Review Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((art) => (
                <tr key={art.id}>
                  <td>
                    <strong>{art.title}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>ID: {art.id}</div>
                  </td>
                  <td>{art.author}</td>
                  <td>
                    <span className="badge badge-info">{art.department}</span>
                  </td>
                  <td>{art.publishedDate || art.date || '—'}</td>
                  <td>
                    <strong>{(art.viewsCount || art.views || 0).toLocaleString()}</strong> reads
                  </td>
                  <td>{art.category || art.readTime || 'Clinical Protocol'}</td>
                  <td>
                    <span className="badge badge-approved">{art.status || 'Published'}</span>
                  </td>
                  <td>
                    <button
                      className="secondary-button"
                      style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }}
                      onClick={() => setSelectedArticle(art)}
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
                  Published Medical Article
                </p>
                <h2>{selectedArticle.title}</h2>
                <p>
                  Authored by {selectedArticle.author} · {selectedArticle.department}
                </p>
              </div>
              <button className="close-form" onClick={() => setSelectedArticle(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '16px', padding: '12px', background: 'var(--chair-bg)', borderRadius: '10px' }}>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>PUBLISHED</small>
                  <div style={{ fontWeight: 600 }}>{selectedArticle.publishedDate || selectedArticle.date || '—'}</div>
                </div>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>TOTAL VIEWS</small>
                  <div style={{ fontWeight: 600 }}>{(selectedArticle.viewsCount || selectedArticle.views || 0).toLocaleString()} reads</div>
                </div>
                <div>
                  <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>CATEGORY</small>
                  <div style={{ fontWeight: 600 }}>{selectedArticle.category || 'Clinical Protocol'}</div>
                </div>
              </div>

              <div>
                <strong>Clinical Summary:</strong>
                <p style={{ margin: '6px 0 0', lineHeight: 1.6, color: 'var(--chair-ink)' }}>
                  {selectedArticle.summary}
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--chair-indigo-soft)', fontSize: '11px', color: 'var(--chair-indigo)' }}>
                Knowledge Publication Policy: MediMind articles are reviewed and approved by Department Heads prior to public dissemination. No private patient data is permitted in educational articles.
              </div>
            </div>

            <div className="modal-footer">
              <button className="primary-button" onClick={() => setSelectedArticle(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeActivityView;
