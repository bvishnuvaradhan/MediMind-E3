import { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle } from 'lucide-react';

export function ContactSupportModal({ isOpen, onClose, userEmail, announce }) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical Inquiry',
    email: userEmail || 'rohan.kapoor@example.com',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      announce('Please enter both a subject and a message.');
      return;
    }

    setSubmitted(true);
    announce('Support request received for this session. A confirmation copy has been acknowledged.');
  };

  const handleDone = () => {
    setSubmitted(false);
    setFormData({
      subject: '',
      category: 'Technical Inquiry',
      email: userEmail || 'rohan.kapoor@example.com',
      message: '',
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="eyebrow">MediMind Support Desk</p>
              <h2 id="support-modal-title" style={{ margin: 0, fontSize: '18px' }}>
                Contact Support Team
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close support modal">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '24px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center' }}>
              <CheckCircle size={28} />
            </div>
            <h3 style={{ fontSize: '17px', margin: 0, color: 'var(--family-ink)' }}>Support Request Acknowledged</h3>
            <p style={{ fontSize: '13px', color: 'var(--family-muted)', maxWidth: '380px', lineHeight: '1.5' }}>
              Your inquiry has been logged in this session for <strong>{formData.email}</strong>. Our clinical help team will review the submitted details.
            </p>
            <button type="button" className="primary-button" onClick={handleDone} style={{ marginTop: '8px' }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Category</span>
                <select
                  className="feature-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option>Technical Inquiry / App Assistance</option>
                  <option>Medical Records & Scan Uploads</option>
                  <option>Appointment Scheduling & Doctor Access</option>
                  <option>AI Predictions & Telemetry Questions</option>
                  <option>Account Security & Family Profiles</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Subject *</span>
                <input
                  className="feature-input"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Question about sharing X-Ray with Dr. Mehta"
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Your Email *</span>
                <input
                  type="email"
                  className="feature-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Description / Message *</span>
                <textarea
                  className="feature-input"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please provide details on how we can assist you..."
                  required
                />
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Send size={15} /> Submit Request
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
