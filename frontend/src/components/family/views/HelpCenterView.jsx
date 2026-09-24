import { CircleHelp, ArrowUpRight, ShieldCheck } from 'lucide-react';

export function HelpCenterView({ announce }) {
  const helpItems = [
    ['How do I add a family member?', 'Open Family members, choose Add member, and enter their profile details.'],
    ['How are records protected?', 'MediMind keeps family health information private with account-level secure access.'],
    ['How do I book an appointment?', 'Choose Appointments or a doctor, select an available slot, and confirm the visit details.'],
  ];

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <CircleHelp size={20} />
        </span>
        <div>
          <p className="eyebrow">Support</p>
          <h1>Help center</h1>
          <p>Find quick answers and contact the MediMind support team.</p>
        </div>
      </div>

      <div className="feature-panel">
        <div className="feature-list">
          {helpItems.map(([question, answer]) => (
            <article className="feature-card" key={question}>
              <div className="feature-icon compact-feature-icon">
                <CircleHelp size={18} />
              </div>
              <div>
                <h3>{question}</h3>
                <p>{answer}</p>
              </div>
              <button
                className="text-button"
                onClick={() => announce(`Opening help article: ${question}.`)}
              >
                Read answer <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>

        <div className="secure-banner">
          <ShieldCheck size={17} />
          <span>Need more help? Our support team is ready to assist.</span>
          <button
            className="text-button"
            onClick={() => announce('Support request form opened.')}
          >
            Contact support <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
