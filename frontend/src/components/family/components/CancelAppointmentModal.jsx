import { X, AlertTriangle } from 'lucide-react';

export function CancelAppointmentModal({ isOpen, onClose, appointment, onConfirmCancel }) {
  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal cancel-appointment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-appointment-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="eyebrow" style={{ color: '#dc2626' }}>Cancellation Warning</p>
              <h2 id="cancel-appointment-title" style={{ margin: 0, fontSize: '18px' }}>
                Cancel Appointment
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close cancellation modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '16px 0', padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
          <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)', marginBottom: '4px' }}>
            {appointment.title}
          </strong>
          <span style={{ display: 'block', fontSize: '13px', color: 'var(--family-muted)' }}>
            {appointment.detail}
          </span>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--family-subtle)', marginTop: '4px' }}>
            📅 {appointment.meta}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--family-muted)', lineHeight: '1.5' }}>
          Are you sure you want to cancel this scheduled appointment? This slot will be released back to the clinic's availability queue.
        </p>

        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Keep Appointment
          </button>
          <button
            type="button"
            className="primary-button"
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            onClick={() => {
              onConfirmCancel(appointment);
              onClose();
            }}
          >
            Confirm Cancellation
          </button>
        </div>
      </section>
    </div>
  );
}
