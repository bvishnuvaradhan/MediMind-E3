import { useState } from 'react';
import { ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';

export function GeneralHealthRiskView({ member, navigate, announce }) {
  const [input, setInput] = useState({ symptoms: '', lifestyle: '', familyHistory: '' });
  const [result, setResult] = useState(null);

  const runAssessment = (event) => {
    event.preventDefault();
    if (!input.symptoms.trim() && !input.lifestyle.trim() && !input.familyHistory.trim()) {
      announce('Enter at least one health detail before running the assessment.');
      return;
    }
    const highPriority = /103|high fever|chest pain|difficulty breathing|severe|faint/i.test(
      `${input.symptoms} ${input.lifestyle} ${input.familyHistory}`
    );
    setResult({
      priority: highPriority ? 'High priority' : 'Routine priority',
      summary: highPriority
        ? 'Potential risk detected. Clinical review is recommended at the earliest available opportunity.'
        : 'No urgent pattern was identified in this mock assessment. Continue routine monitoring and discuss concerns with a doctor.',
      factors: [
        input.symptoms && 'Symptoms and health concerns',
        input.lifestyle && 'Lifestyle information',
        input.familyHistory && 'Family history',
        'Recent medical records',
      ].filter(Boolean),
    });
    announce('AI assessment completed.');
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <ShieldCheck size={20} />
        </span>
        <div>
          <p className="eyebrow">AI Decision Support</p>
          <h1>General health risk</h1>
          <p>
            Review a mock overall risk estimate for {member.name} using free-text health
            information.
          </p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('AI predictions')}
        >
          <ArrowUpRight size={16} /> Back to predictions
        </button>
      </div>
      <form className="booking-form" onSubmit={runAssessment}>
        <div className="booking-form-header">
          <div>
            <h2>Health information</h2>
            <p>Decision support only. This is not a medical diagnosis.</p>
          </div>
          <span className="booking-status">
            <Sparkles size={15} /> Mock assessment
          </span>
        </div>
        <label className="booking-reason">
          <span>Symptoms or general health concerns</span>
          <textarea
            value={input.symptoms}
            onChange={(event) =>
              setInput((current) => ({ ...current, symptoms: event.target.value }))
            }
            placeholder="Example: I have fever and body pain."
          />
        </label>
        <div className="form-grid">
          <label>
            <span>Lifestyle information</span>
            <textarea
              value={input.lifestyle}
              onChange={(event) =>
                setInput((current) => ({ ...current, lifestyle: event.target.value }))
              }
              placeholder="Sleep, exercise, diet, tobacco, or alcohol"
            />
          </label>
          <label>
            <span>Family history</span>
            <textarea
              value={input.familyHistory}
              onChange={(event) =>
                setInput((current) => ({ ...current, familyHistory: event.target.value }))
              }
              placeholder="Relevant family health history"
            />
          </label>
        </div>
        <div className="booking-summary">
          <ShieldCheck size={17} />
          <span>Recent medical records are considered as a mock assessment factor.</span>
        </div>
        {result && (
          <div
            className={`assessment-result ${result.priority === 'High priority' ? 'high' : 'routine'}`}
          >
            <div>
              <Sparkles size={17} />
              <strong>{result.priority}</strong>
            </div>
            <p>{result.summary}</p>
            <small>Factors considered: {result.factors.join(', ')}.</small>
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('AI predictions')}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Sparkles size={16} /> Run assessment
          </button>
        </div>
      </form>
    </section>
  );
}
