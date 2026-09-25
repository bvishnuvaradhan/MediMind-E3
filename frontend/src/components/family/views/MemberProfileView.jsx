import { useState } from 'react';
import {
  ArrowUpRight,
  HeartPulse,
  FileText,
  Sparkles,
  ShieldCheck,
  User,
  Activity,
  Heart,
  Pencil,
  Trash2,
} from 'lucide-react';
import { initialRecords } from '../../../data/familyMockData';
import { RecordRow } from '../components/RecordRow';
import { EditMemberModal } from '../components/EditMemberModal';

export function MemberProfileView({
  member,
  records = initialRecords,
  navigate,
  announce,
  openFeatureModal,
  onUpdateMember,
  onDeleteMember,
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const memberRecords = records.filter(
    (r) => !r.patient || r.patient.toLowerCase() === member.name.toLowerCase()
  );

  const handleConfirmDelete = () => {
    if (onDeleteMember) {
      onDeleteMember(member);
      setIsDeleteModalOpen(false);
      navigate('Family members');
    }
  };

  return (
    <section className="feature-view">
      {/* 1. Header with Actions */}
      <div className="feature-heading" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span className={`avatar avatar-${member.tone || 'coral'}`} style={{ width: '48px', height: '48px', fontSize: '18px' }}>
            {member.initials}
          </span>
          <div>
            <p className="eyebrow" style={{ margin: '0 0 2px 0' }}>Family Member Profile</p>
            <h1 style={{ margin: 0, fontSize: '22px' }}>{member.name}'s Profile</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
              {member.relation} · Comprehensive health overview and clinical activity.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <button
            className="secondary-button compact-button"
            onClick={() => setIsEditModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Pencil size={15} /> Edit Profile
          </button>

          {onDeleteMember && (
            <button
              className="secondary-button compact-button"
              onClick={() => setIsDeleteModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: '#fca5a5' }}
              title="Delete this family profile"
            >
              <Trash2 size={15} /> Delete Profile
            </button>
          )}

          <button
            className="secondary-button compact-button"
            onClick={() => navigate('Family members')}
          >
            <ArrowUpRight size={15} /> Back to family members
          </button>
        </div>
      </div>

      {/* 2. Top Summary Grid */}
      <div className="dashboard-grid profile-summary-grid" style={{ marginBottom: '20px', marginTop: 0 }}>
        <div className="insight-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
            <div className="insight-icon" style={{ marginTop: '2px' }}>
              <HeartPulse size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="card-kicker">HEALTH OVERVIEW · {member.name.toUpperCase()}</p>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Health Profile is Active & Verified</h3>
              <p className="insight-copy" style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.5' }}>
                Review medical history, authorized consultations, and AI predictive telemetry for {member.name}.
              </p>
              <button
                className="text-button"
                onClick={() => navigate('Medical records')}
                style={{ fontSize: '12.5px', fontWeight: '600' }}
              >
                View full medical records <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
          <div className="insight-ring">
            <span>{member.records ? 75 + Math.min(20, member.records * 3) : 78}</span>
            <small>index</small>
          </div>
        </div>

        <div className="activity-panel" style={{ padding: '22px 24px' }}>
          <div className="section-heading" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>At a Glance</h2>
              <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>{member.name}'s account telemetry</p>
            </div>
          </div>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="stat" style={{ padding: '12px 14px' }}>
              <span className="stat-icon coral-bg">
                <FileText size={17} />
              </span>
              <strong>{memberRecords.length}</strong>
              <span>Medical records</span>
            </div>
            <div className="stat" style={{ padding: '12px 14px' }}>
              <span className="stat-icon lilac-bg">
                <Sparkles size={17} />
              </span>
              <strong>{member.predictions || 2}</strong>
              <span>AI predictions</span>
            </div>
          </div>
          <div className="secure-banner" style={{ marginTop: '14px', padding: '10px 12px' }}>
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>Profile protected under HIPAA-ready family authorization.</span>
          </div>
        </div>
      </div>

      {/* 3. Personal Information Card */}
      <div className="doctor-section-card" style={{ marginBottom: '20px' }}>
        <div className="doctor-section-title">
          <User size={18} />
          <span>Personal Information</span>
        </div>

        <div className="doctor-info-grid">
          <div className="info-tile">
            <span className="info-tile-label">Date of Birth</span>
            <span className="info-tile-value">{member.dob || 'Not provided'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Age</span>
            <span className="info-tile-value">{member.age ? `${member.age} years` : 'Not provided'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Gender</span>
            <span className="info-tile-value">{member.gender || 'Not specified'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Blood Group</span>
            <span className="info-tile-value">{member.bloodGroup || 'Unknown'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Phone Number</span>
            <span className="info-tile-value">{member.phone || 'Not provided'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Email Address</span>
            <span className="info-tile-value">{member.email || 'Not provided'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Residential Address</span>
            <span className="info-tile-value">{member.address || 'Bengaluru, Karnataka'}</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Emergency Contact</span>
            <span className="info-tile-value">{member.emergencyContact || 'Primary Account Holder'}</span>
          </div>
        </div>
      </div>

      {/* 4. Health & Clinical Information Card */}
      <div className="doctor-section-card" style={{ marginBottom: '20px' }}>
        <div className="doctor-section-title">
          <Heart size={18} />
          <span>Clinical & Health Information</span>
        </div>

        <div className="doctor-info-grid">
          <div className="info-tile">
            <span className="info-tile-label">Medical Conditions</span>
            <span className="info-tile-value">{member.conditions || 'No known conditions'}</span>
            <span className="info-tile-sub">Active diagnosis tracking</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Known Allergies</span>
            <span className="info-tile-value">{member.allergies || 'No known allergies'}</span>
            <span className="info-tile-sub">Prescription safety alert</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Previous Treatments & Care Plan</span>
            <span className="info-tile-value">{member.treatments || 'Routine preventive care'}</span>
            <span className="info-tile-sub">Clinical care history</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Health Risk Telemetry</span>
            <span className="info-tile-value">Under continuous family wellness review</span>
            <span className="info-tile-sub">AI-monitored biomarkers</span>
          </div>
        </div>
      </div>

      {/* 5. Account Activity & Care Team */}
      <div className="doctor-section-card" style={{ marginBottom: '20px' }}>
        <div className="doctor-section-title">
          <Activity size={18} />
          <span>Care Activity & History</span>
        </div>

        <div className="doctor-info-grid">
          <div className="info-tile">
            <span className="info-tile-label">Scheduled Appointments</span>
            <span className="info-tile-value">{member.appointments || 0} scheduled visit(s)</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Past Consultations</span>
            <span className="info-tile-value">{member.consultations || 0} completed consultation(s)</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Active Prescriptions</span>
            <span className="info-tile-value">{member.prescriptions || 0} valid prescription(s)</span>
          </div>

          <div className="info-tile">
            <span className="info-tile-label">Shared Doctor Access</span>
            <span className="info-tile-value">Authorized clinicians with active record access</span>
          </div>
        </div>
      </div>

      {/* 6. Recent Records Section */}
      <div className="doctor-section-card" style={{ marginBottom: '10px' }}>
        <div className="section-heading" style={{ marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Recent Medical Records</h2>
            <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>Latest verified documents for {member.name}</p>
          </div>
          <button className="text-button" onClick={() => navigate('Medical records')}>
            View all ({memberRecords.length}) <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="feature-records">
          {memberRecords.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--family-muted)', fontSize: '13px' }}>
              No medical records uploaded for {member.name} yet.
            </div>
          ) : (
            memberRecords.slice(0, 3).map((record, idx) => (
              <RecordRow
                record={record}
                announce={announce}
                onOpen={(rec) =>
                  openFeatureModal
                    ? openFeatureModal(rec, 'Medical record')
                    : announce(`Viewing ${rec.type}`)
                }
                key={`${record.type}-${record.date}-${idx}`}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={member}
        onUpdateMember={(updated) => {
          if (onUpdateMember) {
            onUpdateMember(updated);
          }
        }}
        announce={announce}
      />

      {/* Delete Member Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsDeleteModalOpen(false)}>
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon" style={{ margin: 0, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <p className="eyebrow" style={{ color: '#dc2626' }}>Confirm Profile Deletion</p>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Delete Family Profile</h2>
                </div>
              </div>
            </div>
            <p style={{ margin: '14px 0', fontSize: '13.5px', color: 'var(--family-muted)', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{member.name}</strong> ({member.relation})? All associated records and predictions will remain in archive but this profile will be removed from your family account.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleConfirmDelete}
              >
                Delete Profile
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

