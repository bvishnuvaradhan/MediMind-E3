import { X, CircleHelp, CheckCircle2, ShieldCheck } from 'lucide-react';

export function HelpArticleModal({ isOpen, onClose, article }) {
  if (!isOpen || !article) return null;

  const detailsMap = {
    'How do I add a family member?': {
      category: 'Account & Family Profiles',
      steps: [
        'Click "Family members" from the left sidebar navigation.',
        'Click the "+ Add member" button in the top right corner.',
        'Enter full name, relationship, age, gender, blood group, and medical history.',
        'Click "Add Member" to instantly create the encrypted profile.',
      ],
      tip: 'You can switch between member profiles anytime using the account switcher at the top of the sidebar.',
    },
    'How are records protected?': {
      category: 'Privacy & HIPAA Compliance',
      steps: [
        'All patient records and clinical scans are secured with account-level encryption.',
        'Doctors can only view your family records if you explicitly grant them authorization under Doctor Access or through an active consultation booking.',
        'You can revoke doctor access at any time with a single click, instantly cutting off viewing rights.',
      ],
      tip: 'Audit logs of every clinician access are permanently tracked in the MediMind system.',
    },
    'How do I book an appointment?': {
      category: 'Appointments & Scheduling',
      steps: [
        'Navigate to "Doctors" to browse available specialists or click "Book appointment" on the Appointments page.',
        'Complete the AI symptom assessment to receive urgency triage recommendations.',
        'Select your preferred in-person or video consultation date and time slot.',
        'Confirm booking. The slot is immediately reserved and linked to the patient profile.',
      ],
      tip: 'You can reschedule or cancel active appointments at any time from the Appointments tab.',
    },
  };

  const detailedInfo = detailsMap[article.question] || {
    category: 'General Knowledge',
    steps: [article.answer],
    tip: 'Contact MediMind 24/7 Support if you have additional questions.',
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
              <CircleHelp size={20} />
            </div>
            <div>
              <p className="eyebrow">{detailedInfo.category}</p>
              <h2 id="help-modal-title" style={{ margin: 0, fontSize: '17px' }}>
                {article.question}
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close help article">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13.5px', color: 'var(--family-ink)', lineHeight: '1.5', margin: 0 }}>
            {article.answer}
          </p>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
            <strong style={{ fontSize: '12.5px', color: 'var(--family-primary)', display: 'block', marginBottom: '8px' }}>
              Step-by-Step Instructions:
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detailedInfo.steps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12.5px', color: 'var(--family-ink)', lineHeight: '1.4' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="secure-banner" style={{ margin: 0 }}>
            <ShieldCheck size={16} />
            <span>{detailedInfo.tip}</span>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="primary-button" onClick={onClose}>
            Got it, thanks
          </button>
        </div>
      </section>
    </div>
  );
}
