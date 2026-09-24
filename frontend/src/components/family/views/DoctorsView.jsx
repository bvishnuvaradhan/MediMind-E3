import { Stethoscope } from 'lucide-react';
import { PresentationFeature } from '../components/PresentationFeature';

export function DoctorsView({ announce, navigate, openFeatureModal, setSelectedDoctor }) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Stethoscope size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Doctors</h1>
          <p>Browse trusted healthcare professionals by department.</p>
        </div>
      </div>

      <div className="feature-panel">
        <PresentationFeature
          page="Doctors"
          announce={announce}
          navigate={navigate}
          openFeatureModal={openFeatureModal}
          setSelectedDoctor={setSelectedDoctor}
        />
      </div>
    </section>
  );
}
