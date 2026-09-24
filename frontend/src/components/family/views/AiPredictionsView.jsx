import { Sparkles, Activity, HeartPulse, ShieldCheck, ArrowUpRight } from 'lucide-react';

export function AiPredictionsView({ member, announce, navigate }) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>AI predictions</h1>
          <p>Decision-support tools for {member?.name || 'your family'}.</p>
        </div>
      </div>

      <div className="feature-panel">
        <div className="ai-modules">
          <button
            className="ai-module"
            onClick={() => announce('Fracture detection upload flow opened.')}
          >
            <span className="ai-icon coral-bg">
              <Activity size={18} />
            </span>
            <h3>Fracture detection</h3>
            <p>Upload an X-Ray, review confidence, and view explanation.</p>
            <ArrowUpRight size={16} />
          </button>

          <button
            className="ai-module"
            onClick={() => announce('Diabetes risk parameters opened.')}
          >
            <span className="ai-icon lilac-bg">
              <Activity size={18} />
            </span>
            <h3>Diabetes risk</h3>
            <p>Enter health parameters and review risk score.</p>
            <ArrowUpRight size={16} />
          </button>

          <button
            className="ai-module"
            onClick={() => announce('Heart disease risk parameters opened.')}
          >
            <span className="ai-icon mint-bg">
              <HeartPulse size={18} />
            </span>
            <h3>Heart disease risk</h3>
            <p>Enter health parameters and review risk score.</p>
            <ArrowUpRight size={16} />
          </button>

          <button className="ai-module" onClick={() => navigate('General health risk')}>
            <span className="ai-icon yellow-bg">
              <ShieldCheck size={18} />
            </span>
            <h3>General health risk</h3>
            <p>
              Combine family history, lifestyle, symptoms, and recent records into one overall risk
              estimate.
            </p>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="ai-warning">
          <ShieldCheck size={17} /> AI-assisted results support clinical decisions and are not a
          medical diagnosis.
        </div>
      </div>
    </section>
  );
}
