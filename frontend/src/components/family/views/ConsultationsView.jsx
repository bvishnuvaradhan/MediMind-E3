import { Activity } from 'lucide-react';
import { PresentationFeature } from '../components/PresentationFeature';

export function ConsultationsView({ announce, navigate, openFeatureModal }) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Activity size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Consultations</h1>
          <p>Review doctor notes, treatment plans, and linked records.</p>
        </div>
      </div>

      <div className="feature-panel">
        <PresentationFeature
          page="Consultations"
          announce={announce}
          navigate={navigate}
          openFeatureModal={openFeatureModal}
        />
      </div>
    </section>
  );
}
