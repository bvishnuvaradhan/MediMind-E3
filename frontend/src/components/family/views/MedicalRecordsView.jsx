import { useState } from 'react';
import { FileText, Upload, Users } from 'lucide-react';
import { initialRecords } from '../../../data/familyMockData';
import { RecordRow } from '../components/RecordRow';
import { UploadRecordModal } from '../components/UploadRecordModal';
import { DeleteRecordModal } from '../components/DeleteRecordModal';

export function MedicalRecordsView({
  records = initialRecords,
  familyMembers = [],
  activeMember,
  announce,
  openFeatureModal,
  onAddRecord,
  onDeleteRecord,
}) {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('All');
  const [recordFilter, setRecordFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const filters = ['All', 'Reports', 'Tests', 'X-Rays', 'Prescriptions', 'Consultations', 'AI Reports'];

  // 1. Filter by Member
  const memberFilteredRecords = records.filter((record) => {
    if (selectedMemberFilter === 'All') return true;
    if (!record.patient) return true;
    return record.patient.toLowerCase() === selectedMemberFilter.toLowerCase();
  });

  // 2. Filter by Category
  const filteredRecords = memberFilteredRecords.filter(
    (record) => recordFilter === 'All' || record.category === recordFilter
  );

  const handleConfirmDelete = (record) => {
    if (onDeleteRecord) {
      onDeleteRecord(record);
    }
    setRecordToDelete(null);
  };

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
        {/* Controls Bar: Member Filter & Category Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--family-border)' }}>
          {/* Member Filter Dropdown (Requirement 5) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={14} style={{ color: 'var(--family-primary)' }} />
              Member:
            </span>
            <select
              className="feature-input"
              value={selectedMemberFilter}
              onChange={(e) => {
                setSelectedMemberFilter(e.target.value);
                announce(e.target.value === 'All' ? 'Viewing records for all family members.' : `Filtered records for ${e.target.value}.`);
              }}
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '180px', fontWeight: '600' }}
            >
              <option value="All">All Family Members ({records.length})</option>
              {familyMembers.map((m) => {
                const count = records.filter(
                  (r) => !r.patient || r.patient.toLowerCase() === m.name.toLowerCase()
                ).length;
                return (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.relation}) — {count} record{count !== 1 ? 's' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
            Showing <strong>{filteredRecords.length}</strong> of {records.length} total documents
          </div>
        </div>

        {/* Category Filters */}
        <div className="filter-row" style={{ marginBottom: '18px' }}>
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

        {/* Records List with Delete Support (Requirement 4) */}
        <div className="feature-records" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRecords.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--family-muted)' }}>
              No medical records found for {selectedMemberFilter === 'All' ? 'any member' : selectedMemberFilter} in category "{recordFilter}".
            </div>
          ) : (
            filteredRecords.map((record, index) => (
              <RecordRow
                record={record}
                announce={announce}
                onOpen={(item) => openFeatureModal(item, 'Medical record')}
                onDelete={(item) => setRecordToDelete(item)}
                key={`${record.type}-${record.date}-${record.patient}-${index}`}
              />
            ))
          )}
        </div>
      </div>

      {/* Upload Record Modal */}
      <UploadRecordModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        familyMembers={familyMembers}
        activeMember={selectedMemberFilter !== 'All' ? familyMembers.find((m) => m.name.toLowerCase() === selectedMemberFilter.toLowerCase()) || activeMember : activeMember}
        onAddRecord={onAddRecord}
        announce={announce}
      />

      {/* Delete Record Confirmation Modal */}
      <DeleteRecordModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        record={recordToDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </section>
  );
}

