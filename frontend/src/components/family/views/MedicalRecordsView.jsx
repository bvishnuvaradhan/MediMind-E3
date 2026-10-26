import { Pagination } from '../../common/Pagination';
import { useState, useMemo, useEffect } from 'react';
import { FileText, Upload, Users, Search, Calendar, Filter, RotateCcw } from 'lucide-react';
import { initialRecords, matchesFamilyMember } from '../../../data/medimindData';
import { RecordRow } from '../components/RecordRow';
import { UploadRecordModal } from '../components/UploadRecordModal';
import { DeleteRecordModal } from '../components/DeleteRecordModal';
import { DonutChart } from '../../common/charts';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMemberFilter, recordFilter, searchQuery, dateRangeFilter, statusFilter]);

  const filters = ['All', 'Reports', 'Tests', 'X-Rays', 'Prescriptions', 'Consultations', 'AI Reports'];
  const dateRanges = ['All Time', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months'];
  const statuses = ['All', 'Available', 'Verified', 'Pending'];

  const selectedMemberObj = useMemo(() => {
    return familyMembers.find(
      (m) => m.name === selectedMemberFilter || m.fullName === selectedMemberFilter || m.id === selectedMemberFilter
    );
  }, [familyMembers, selectedMemberFilter]);

  // 1. Filter by Member
  const memberFilteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (selectedMemberFilter === 'All') return true;
      return matchesFamilyMember(record, selectedMemberObj);
    });
  }, [records, selectedMemberFilter, selectedMemberObj]);

  // Helper to parse record date safely
  const getRecordTimestamp = (record) => {
    const raw = record.date || record.created_at || record.createdAt;
    if (!raw) return 0;
    const ts = new Date(raw).getTime();
    return isNaN(ts) ? 0 : ts;
  };

  // Helper for flexible category matching
  const matchesCategory = (record, filter) => {
    if (filter === 'All') return true;
    const cat = (record.category || '').toLowerCase();
    const type = (record.type || record.record_type || '').toLowerCase();
    const target = filter.toLowerCase();

    if (filter === 'Reports') {
      return cat === 'reports' || type.includes('report') || type.includes('lab') || type.includes('blood');
    }
    if (filter === 'Tests') {
      return cat === 'tests' || type.includes('test') || type.includes('panel') || type.includes('ecg') || type.includes('lipid');
    }
    if (filter === 'X-Rays') {
      return cat === 'x-rays' || type.includes('x-ray') || type.includes('scan') || type.includes('mri') || type.includes('ct') || type.includes('imaging') || type.includes('radiology');
    }
    if (filter === 'Prescriptions') {
      return cat === 'prescriptions' || type.includes('prescription') || type.includes('rx') || type.includes('medication');
    }
    if (filter === 'Consultations') {
      return cat === 'consultations' || type.includes('consult') || type.includes('visit') || type.includes('summary');
    }
    if (filter === 'AI Reports') {
      return cat === 'ai reports' || type.includes('ai') || type.includes('prediction') || Boolean(record.aiScreened) || Boolean(record.aiModuleId);
    }
    return cat === target || type.includes(target);
  };

  // Combined Filtering
  const filteredRecords = useMemo(() => {
    const now = new Date('2026-10-19T14:00:00').getTime();
    let cutoff = 0;
    if (dateRangeFilter === 'Last 30 Days') {
      cutoff = now - 30 * 24 * 60 * 60 * 1000;
    } else if (dateRangeFilter === 'Last 3 Months') {
      cutoff = now - 90 * 24 * 60 * 60 * 1000;
    } else if (dateRangeFilter === 'Last 6 Months') {
      cutoff = now - 180 * 24 * 60 * 60 * 1000;
    }

    const cleanSearch = searchQuery.trim().toLowerCase();

    return memberFilteredRecords.filter((record) => {
      // Category match
      if (!matchesCategory(record, recordFilter)) return false;

      // Status match
      if (statusFilter !== 'All') {
        const recStatus = (record.status || '').toLowerCase();
        if (recStatus !== statusFilter.toLowerCase()) return false;
      }

      // Date range match
      if (cutoff > 0) {
        const recordTs = getRecordTimestamp(record);
        if (recordTs > 0 && recordTs < cutoff) return false;
      }

      // Search query match
      if (cleanSearch) {
        const title = (record.title || '').toLowerCase();
        const type = (record.type || record.record_type || '').toLowerCase();
        const doctor = (record.doctor || record.doctorName || '').toLowerCase();
        const source = (record.source || record.uploader || '').toLowerCase();
        const patient = (record.patient || record.patientName || '').toLowerCase();
        const description = (record.description || '').toLowerCase();

        const matches =
          title.includes(cleanSearch) ||
          type.includes(cleanSearch) ||
          doctor.includes(cleanSearch) ||
          source.includes(cleanSearch) ||
          patient.includes(cleanSearch) ||
          description.includes(cleanSearch);

        if (!matches) return false;
      }

      return true;
    });
  }, [memberFilteredRecords, recordFilter, statusFilter, dateRangeFilter, searchQuery]);

  const totalFiltered = filteredRecords.length;
  const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters =
    selectedMemberFilter !== 'All' ||
    recordFilter !== 'All' ||
    searchQuery.trim() !== '' ||
    dateRangeFilter !== 'All Time' ||
    statusFilter !== 'All';

  const handleResetFilters = () => {
    setSelectedMemberFilter('All');
    setRecordFilter('All');
    setSearchQuery('');
    setDateRangeFilter('All Time');
    setStatusFilter('All');
    if (announce) announce('All medical record filters have been reset.');
  };

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
        {/* Controls Bar: Search, Member, Date Range, Status & Reset */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--family-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', maxWidth: '380px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--family-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="feature-input"
                placeholder="Search title, doctor, facility..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', width: '100%', fontSize: '13px' }}
              />
            </div>

            {/* Member Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} style={{ color: 'var(--family-primary)' }} />
                Member:
              </span>
              <select
                className="feature-input"
                value={selectedMemberFilter}
                onChange={(e) => {
                  setSelectedMemberFilter(e.target.value);
                  if (announce) announce(e.target.value === 'All' ? 'Viewing records for all family members.' : `Filtered records for ${e.target.value}.`);
                }}
                style={{ padding: '6px 10px', fontSize: '13px', minWidth: '180px', fontWeight: '600' }}
              >
                <option value="All">All Family Members ({records.length})</option>
                {familyMembers.map((m) => {
                  const mName = m.fullName || m.name;
                  const mRel = m.relationship || m.relation || 'Member';
                  const count = records.filter((r) => matchesFamilyMember(r, m)).length;
                  return (
                    <option key={m.id || m.name} value={m.name}>
                      {mName} — {mRel} ({count} doc{count !== 1 ? 's' : ''})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} style={{ color: 'var(--family-primary)' }} />
                Date:
              </span>
              <select
                className="feature-input"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '13px', minWidth: '130px', fontWeight: '500' }}
              >
                {dateRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={13} style={{ color: 'var(--family-primary)' }} />
                Status:
              </span>
              <select
                className="feature-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '13px', minWidth: '110px', fontWeight: '500' }}
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>{st === 'All' ? 'All Status' : st}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="text-button"
                onClick={handleResetFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#dc2626', fontWeight: '600', padding: '6px 10px' }}
              >
                <RotateCcw size={13} /> Clear filters
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '12px', color: 'var(--family-muted)' }}>
            Showing <strong>{filteredRecords.length}</strong> of {records.length} total documents
          </div>
        </div>

        {/* Category Breakdown Donut Summary */}
        <div style={{ padding: '16px 20px', backgroundColor: 'var(--family-soft, #f8fafc)', borderRadius: '12px', border: '1px solid var(--family-border)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--family-ink)', display: 'block' }}>Health Portfolio Composition</strong>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)' }}>Document classification across diagnostic domains</span>
            </div>

            <DonutChart
              data={[
                { label: 'Lab Reports', value: memberFilteredRecords.filter(r => matchesCategory(r, 'Reports')).length, color: '#2563eb' },
                { label: 'Clinical Tests', value: memberFilteredRecords.filter(r => matchesCategory(r, 'Tests')).length, color: '#0f766e' },
                { label: 'Radiology / X-Rays', value: memberFilteredRecords.filter(r => matchesCategory(r, 'X-Rays')).length, color: '#f43f5e' },
                { label: 'Prescriptions', value: memberFilteredRecords.filter(r => matchesCategory(r, 'Prescriptions')).length, color: '#7c3aed' },
              ]}
              size={130}
              innerRadius={36}
              outerRadius={54}
              centerValue={memberFilteredRecords.length}
              centerLabel="Docs"
            />
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

        {/* Records List with Delete Support */}
        <div className="feature-records" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRecords.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--family-card, #ffffff)',
                borderRadius: '12px',
                border: '1px dashed var(--family-border, #e2e8f0)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--family-soft, #f1f5f9)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--family-muted, #64748b)',
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', margin: '0 0 6px', color: 'var(--family-ink, #0f172a)' }}>
                  No Matching Medical Records Found
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--family-muted, #64748b)', maxWidth: '420px' }}>
                  No documents match your active search and filter criteria. Try adjusting your query or resetting all filters.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="primary-button compact-button"
                  onClick={handleResetFilters}
                  style={{ marginTop: '6px' }}
                >
                  <RotateCcw size={14} /> Reset all filters
                </button>
              )}
            </div>
          ) : (
            pagedRecords.map((record, index) => (
              <RecordRow
                record={record}
                announce={announce}
                onOpen={(item) => openFeatureModal(item, 'Medical record')}
                onDelete={(item) => setRecordToDelete(item)}
                key={`${record.id || record._id || record.type}-${record.date}-${record.patient}-${index}`}
              />
            ))
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={totalFiltered}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        />
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
