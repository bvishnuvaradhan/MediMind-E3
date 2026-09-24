import { useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { initialRecords } from '../../../data/familyMockData';
import { RecordRow } from '../components/RecordRow';
import { UploadRecordModal } from '../components/UploadRecordModal';

export function MedicalRecordsView({
  records = initialRecords,
  familyMembers = [],
  activeMember,
  announce,
  openFeatureModal,
  onAddRecord,
}) {
  const [recordFilter, setRecordFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const filters = ['All', 'Reports', 'Tests', 'X-Rays', 'Prescriptions', 'Consultations', 'AI Reports'];

  const filteredRecords = records.filter(
    (record) => recordFilter === 'All' || record.category === recordFilter
  );

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <FileText size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Unified medical records</h1>
          <p>A complete, scannable history of lab reports, imaging scans, prescriptions, and clinical notes.</p>
        </div>

        <button
          className="primary-button compact-button"
          onClick={() => setIsUploadOpen(true)}
        >
          <Upload size={16} /> Upload Record
        </button>
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
          {filteredRecords.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--family-muted)' }}>
              No records found in category "{recordFilter}".
            </div>
          ) : (
            filteredRecords.map((record, index) => (
              <RecordRow
                record={record}
                announce={announce}
                onOpen={(item) => openFeatureModal(item, 'Medical record')}
                key={`${record.type}-${record.date}-${index}`}
              />
            ))
          )}
        </div>
      </div>

      <UploadRecordModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        familyMembers={familyMembers}
        activeMember={activeMember}
        onAddRecord={onAddRecord}
        announce={announce}
      />
    </section>
  );
}
