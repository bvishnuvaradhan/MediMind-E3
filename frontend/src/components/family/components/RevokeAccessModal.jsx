import { X, LockKeyhole } from 'lucide-react';

export function RevokeAccessModal({ isOpen, onClose, entry, onConfirmRevoke }) {
  if (!isOpen || !entry) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal revoke-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-access-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="eyebrow" style={{ color: '#dc2626' }}>Revoke Record Authorization</p>
              <h2 id="revoke-access-title" style={{ margin: 0, fontSize: '18px' }}>
                Revoke Doctor Access
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close revoke modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '16px 0', padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)', marginBottom: '4px' }}>
            {entry.doctor} ({entry.department || 'Specialist'})
          </strong>
          <span style={{ display: 'block', fontSize: '13px', color: 'var(--family-muted)' }}>
            Authorized Patient: <strong>{entry.member}</strong>
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--family-subtle)', marginTop: '4px' }}>
            Access Granted: {entry.granted}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--family-muted)', lineHeight: '1.5' }}>
          Revoking access will immediately prevent <strong>{entry.doctor}</strong> from viewing <strong>{entry.member}</strong>'s medical history, lab reports, and AI diagnostic telemetry in their clinician portal.
        </p>

        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Keep Access
          </button>
          <button
            type="button"
            className="primary-button"
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            onClick={() => {
              onConfirmRevoke(entry);
              onClose();
            }}
          >
            Revoke Access
          </button>
        </div>
      </section>
    </div>
  );
}
