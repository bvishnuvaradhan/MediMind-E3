import { useState } from 'react';
import { CircleHelp, ArrowUpRight, ShieldCheck, MessageSquare } from 'lucide-react';
import { HelpArticleModal } from '../components/HelpArticleModal';
import { ContactSupportModal } from '../components/ContactSupportModal';

export function HelpCenterView({ announce, userEmail }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const helpItems = [
    {
      question: 'How do I add a family member?',
      answer: 'Open the Family members tab from the sidebar, click the "+ Add member" button, fill in their name, relationship, age, and medical parameters, and confirm.',
    },
    {
      question: 'How are records protected?',
      answer: 'MediMind utilizes AES-256 account-level encryption for all medical records and scans. Doctors only receive access if you explicitly authorize them or schedule a clinical appointment.',
    },
    {
      question: 'How do I book an appointment?',
      answer: 'Navigate to Doctors or Appointments, choose an authorized specialist, complete the AI symptom check, select an available date and time slot, and confirm your booking.',
    },
  ];

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <CircleHelp size={20} />
        </span>
        <div>
          <p className="eyebrow">Support & Guidance</p>
          <h1>Help center</h1>
          <p>Frequently asked questions, platform walkthroughs, and 24/7 care assistance.</p>
        </div>

        <button
          className="primary-button compact-button"
          onClick={() => setIsSupportModalOpen(true)}
        >
          <MessageSquare size={16} /> Contact Support
        </button>
      </div>

      <div className="feature-panel">
        <div className="feature-list">
          {helpItems.map((item) => (
            <article className="feature-card" key={item.question}>
              <div className="feature-icon compact-feature-icon">
                <CircleHelp size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 2px 0' }}>{item.question}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--family-muted)' }}>{item.answer}</p>
              </div>
              <button
                className="text-button"
                onClick={() => setSelectedArticle(item)}
                style={{ marginLeft: 'auto' }}
              >
                Read answer <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>

        <div className="secure-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--family-primary)' }} />
            <span>Need personalized help with medical records or scheduling?</span>
          </div>
          <button
            className="text-button"
            onClick={() => setIsSupportModalOpen(true)}
            style={{ fontWeight: '600', color: 'var(--family-primary)' }}
          >
            Contact support <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Help Article Modal */}
      <HelpArticleModal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
      />

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        userEmail={userEmail}
        announce={announce}
      />
    </section>
  );
}
