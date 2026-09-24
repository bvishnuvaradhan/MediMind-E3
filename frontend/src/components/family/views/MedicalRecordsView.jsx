import { useState } from 'react';
import { FileText } from 'lucide-react';
import { initialRecords } from '../../../data/familyMockData';
import { RecordRow } from '../components/RecordRow';

export function MedicalRecordsView({ announce, openFeatureModal }) {
  const [recordFilter, setRecordFilter] = useState('All');
  const filters = ['All', 'Reports', 'Tests', 'X-Rays', 'Prescriptions', 'Consultations', 'AI Reports'];

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <FileText size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Unified medical records</h1>
          <p>A complete, scannable history of reports, tests, prescriptions, and consultations.</p>
        </div>
      </div>

      <div className="feature-panel">
        <div className="filter-row">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter ${recordFilter === filter ? 'active' : ''}`}
              onClick={() => setRecordFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="feature-records">
          {initialRecords
            .filter((record) => recordFilter === 'All' || record.category === recordFilter)
            .map((record) => (
              <RecordRow
                record={record}
                announce={announce}
                onOpen={(item) => openFeatureModal(item, 'Medical record')}
                key={record.type}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
