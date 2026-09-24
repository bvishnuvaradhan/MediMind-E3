import React, { useState } from 'react';

export function CreateArticleModal({ isOpen, onClose, onSave, authorName = 'Dr. Priya Sharma' }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Clinical Protocol',
    tags: 'Orthopedics, AI Triage, Trauma',
    summary: '',
    content: '',
    status: 'Published',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please provide article title and detailed clinical content.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        ...formData,
        tags: tagsArray,
        author: authorName,
      });
      onClose();
    } catch {
      setError('Failed to publish knowledge article.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dh-modal-overlay" onClick={onClose}>
      <div className="dh-modal-box lg" onClick={(e) => e.stopPropagation()}>
        <div className="dh-modal-header">
          <div>
            <h3 className="dh-modal-title">Publish Department Guideline & Knowledge Article</h3>
            <div className="dh-card-description">
              Clinical knowledge base contribution for department staff and doctors
            </div>
          </div>
          <button className="dh-btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dh-modal-body">
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--dh-error-bg)', color: 'var(--dh-error)', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="dh-form-group">
              <label className="dh-label">Article Title *</label>
              <input
                className="dh-input"
                name="title"
                placeholder="e.g. Perioperative Anticoagulation Protocol in Arthroplasty"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Category</label>
                <select
                  className="dh-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Clinical Protocol">Clinical Protocol</option>
                  <option value="AI Triage Guideline">AI Triage Guideline</option>
                  <option value="Emergency Care">Emergency Care</option>
                  <option value="Surgical Best Practices">Surgical Best Practices</option>
                  <option value="Department Notice">Department Notice</option>
                </select>
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Status</label>
                <select
                  className="dh-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Published">Published (Live for All Staff)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="dh-form-group">
              <label className="dh-label">Search Tags (Comma separated)</label>
              <input
                className="dh-input"
                name="tags"
                placeholder="e.g. Fracture, X-Ray, Emergency, Arthroplasty"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>

            <div className="dh-form-group">
              <label className="dh-label">Executive Summary</label>
              <input
                className="dh-input"
                name="summary"
                placeholder="Brief summary of recommendation..."
                value={formData.summary}
                onChange={handleChange}
              />
            </div>

            <div className="dh-form-group">
              <label className="dh-label">Clinical Content / Instructions *</label>
              <textarea
                className="dh-textarea"
                name="content"
                rows="6"
                placeholder="Detailed guidance, dosage recommendations, workflow checkpoints, AI validation steps..."
                value={formData.content}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="dh-modal-footer">
            <button type="button" className="dh-btn dh-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dh-btn dh-btn-primary" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateArticleModal;
