import { HeartPulse } from 'lucide-react';
import { PresentationFeature } from '../components/PresentationFeature';

export function PrescriptionsView({ announce, navigate, openFeatureModal }) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <HeartPulse size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Prescriptions</h1>
          <p>View finalized prescriptions and instructions.</p>
        </div>
      </div>

      <div className="feature-panel">
        <PresentationFeature
          page="Prescriptions"
          announce={announce}
          navigate={navigate}
          openFeatureModal={openFeatureModal}
        />
      </div>
    </section>
  );
}
