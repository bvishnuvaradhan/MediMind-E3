import React, { useState } from 'react';

function ArticleForm({
  initialData = null,
  onClose,
  onSave,
  authorName = 'Dr. Rahul Mehta',
  reviewerName = 'Dr. Priya Sharma',
  reviewerRole = 'Department Head',
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'Clinical Protocol',
    tags: Array.isArray(initialData?.tags)
      ? initialData.tags.join(', ')
      : (initialData?.tags || 'Orthopedics, Rehabilitation'),
    summary: initialData?.summary || '',
    content: initialData?.content || '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialData?.id);
  const isChangesRequested = initialData?.status === 'Changes Requested';

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
        ...(initialData ? { id: initialData.id } : {}),
        ...formData,
        tags: tagsArray,
        author: initialData?.author || authorName,
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
    <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
      <div className="doctor-modal-header">
        <div>
          <h3 className="doctor-modal-title">
            {isChangesRequested
              ? 'Edit & Resubmit Article'
              : isEditing
              ? 'Edit Knowledge Article Draft'
              : 'Write Medical Knowledge Article'}
          </h3>
          <div className="doctor-card-description">
            Contribute clinical guidelines (Subject to Department Head review prior to publication)
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

        {/* Department Head Feedback Callout for Changes Requested */}
        {isChangesRequested && initialData?.reviewerFeedback && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--doctor-soft-coral)',
              borderRadius: '8px',
              borderLeft: '4px solid var(--doctor-coral)',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--doctor-coral)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span>💬</span> Department Head Reviewer Feedback ({initialData.reviewerName || reviewerName}):
            </div>
            <div style={{ color: 'var(--doctor-text-primary)', fontStyle: 'italic' }}>
              "{initialData.reviewerFeedback}"
            </div>
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
              <option value="Clinical Decision Support">Clinical Decision Support</option>
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
          <strong>Review Hierarchy:</strong> Submitting will queue this article for Department Head (<strong>{reviewerName}</strong>, {reviewerRole}) clinical review before publication.
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
          {submitting ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          className="doctor-btn doctor-btn-primary"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
        >
          {submitting
            ? 'Submitting...'
            : isChangesRequested
            ? 'Resubmit to Dept Head for Review'
            : 'Submit to Dept Head for Review'}
        </button>
      </div>
    </div>
  );
}

export function CreateArticleModal({
  isOpen,
  initialData = null,
  onClose,
  onSave,
  authorName = 'Dr. Rahul Mehta',
  reviewerName = 'Dr. Priya Sharma',
  reviewerRole = 'Department Head',
}) {
  if (!isOpen) return null;

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <ArticleForm
        key={initialData?.id || 'new_art'}
        initialData={initialData}
        onClose={onClose}
        onSave={onSave}
        authorName={authorName}
        reviewerName={reviewerName}
        reviewerRole={reviewerRole}
      />
    </div>
  );
}

export default CreateArticleModal;
