import React, { useState } from 'react';

export function CreateArticleModal({ isOpen, onClose, onSave, authorName = 'Dr. Rahul Mehta' }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Clinical Protocol',
    tags: 'Orthopedics, Rehabilitation',
    summary: '',
    content: '',
    submitForReview: false,
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (submitForReview) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please provide an article title and detailed clinical content.');
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
        submitForReview,
      });
      onClose();
    } catch {
      setError('Failed to save article.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
        <div className="doctor-modal-header">
          <div>
            <h3 className="doctor-modal-title">Write Medical Knowledge Article</h3>
            <div className="doctor-card-description">
              Contribute clinical best practices (Subject to Department Head review prior to publication)
            </div>
          </div>
          <button className="doctor-btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="doctor-modal-body">
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--doctor-error-bg)', color: 'var(--doctor-error)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div className="doctor-form-group">
            <label className="doctor-label">Article Title *</label>
            <input
              className="doctor-input"
              name="title"
              placeholder="e.g. Modern Rehabilitation Protocols After Total Hip Arthroplasty"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="doctor-form-row">
            <div className="doctor-form-group">
              <label className="doctor-label">Category</label>
              <select
                className="doctor-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Clinical Protocol">Clinical Protocol</option>
                <option value="Surgical Best Practices">Surgical Best Practices</option>
                <option value="AI Clinical Guidelines">AI Clinical Guidelines</option>
                <option value="Patient Education">Patient Education</option>
                <option value="Emergency Orthopedics">Emergency Orthopedics</option>
              </select>
            </div>

            <div className="doctor-form-group">
              <label className="doctor-label">Search Tags (Comma separated)</label>
              <input
                className="doctor-input"
                name="tags"
                placeholder="e.g. Arthroplasty, Rehab, Knee, AI"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="doctor-form-group">
            <label className="doctor-label">Executive Summary</label>
            <input
              className="doctor-input"
              name="summary"
              placeholder="Brief summary of clinical recommendation..."
              value={formData.summary}
              onChange={handleChange}
            />
          </div>

          <div className="doctor-form-group">
            <label className="doctor-label">Article Body & Clinical Content *</label>
            <textarea
              className="doctor-textarea"
              name="content"
              rows="6"
              placeholder="Detailed evidence-based findings, recovery phases, clinical contraindications..."
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          {/* Department Head Approval note */}
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '6px', fontSize: '12px', color: 'var(--doctor-indigo-light)' }}>
            <strong>Review Hierarchy:</strong> Submitting will queue this article for Department Head (Dr. Priya Sharma) clinical review before it is published to the public portal.
          </div>
        </div>

        <div className="doctor-modal-footer">
          <button type="button" className="doctor-btn doctor-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="doctor-btn doctor-btn-outline"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="doctor-btn doctor-btn-primary"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit to Dept Head for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateArticleModal;
