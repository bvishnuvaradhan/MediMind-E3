import { X, AlertTriangle } from 'lucide-react';
import { appointmentService } from '../../../services/appointmentService';

export function DoctorCancelAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onCancelSuccess,
  showToast,
}) {
  const [reasonPreset, setReasonPreset] = useState('Emergency orthopedic trauma surgery');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !appointment) return null;

  const presets = [
    'Emergency orthopedic trauma surgery',
    'Urgent clinical on-call hospital duty',
    'Schedule conflict / revised OPD clinic hours',
    'Unforeseen medical leave',
    'Other clinical reason',
  ];

  const effectiveReason = reasonPreset === 'Other clinical reason' ? (customReason.trim() || 'Attending physician unavailable') : reasonPreset;

  const handleConfirmCancel = async () => {
    setLoading(true);
    setError(null);

    const targetApptId = appointment.id || appointment._id;

    try {
      await appointmentService.cancelAppointment(targetApptId, effectiveReason);

      if (showToast) {
        showToast('Appointment cancelled. Family notified with automatic alternative options.', 'info');
      }

      if (onCancelSuccess) {
        onCancelSuccess({
          ...appointment,
          status: 'Cancelled',
          cancellationReason: effectiveReason,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment. Please verify connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div
        className="doctor-card"
        style={{ width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--doctor-border, #e2e8f0)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--doctor-text-primary, #0f172a)' }}>
                Cancel Consultation
              </h2>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--doctor-text-muted, #64748b)' }}>
                Token: <strong style={{ fontFamily: 'monospace' }}>{appointment.token || 'OPD-APT'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cancel appointment modal"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Appointment Details Box */}
        <div style={{ backgroundColor: 'var(--doctor-bg, #f8fafc)', border: '1px solid var(--doctor-border, #e2e8f0)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--doctor-text-muted, #64748b)' }}>Patient:</span>
            <strong style={{ color: 'var(--doctor-text-primary, #0f172a)' }}>{appointment.patientName || 'Patient'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--doctor-text-muted, #64748b)' }}>Date & Time:</span>
            <strong style={{ color: 'var(--doctor-text-primary, #0f172a)' }}>{appointment.date || 'Today'} · {appointment.time}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--doctor-text-muted, #64748b)' }}>Purpose:</span>
            <span style={{ color: 'var(--doctor-text-primary, #0f172a)' }}>{appointment.purpose || 'OPD Consultation'}</span>
          </div>
        </div>

        {/* Reason Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--doctor-text-primary, #0f172a)', marginBottom: '6px' }}>
            Cancellation Reason (Shared with Family for Alternative Rebooking):
          </label>
          <select
            value={reasonPreset}
            onChange={(e) => setReasonPreset(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--doctor-border, #cbd5e1)', backgroundColor: '#ffffff', marginBottom: '8px' }}
          >
            {presets.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {reasonPreset === 'Other clinical reason' && (
            <textarea
              rows={2}
              placeholder="Specify the clinical cancellation reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--doctor-border, #cbd5e1)', boxSizing: 'border-box' }}
            />
          )}
        </div>

        {/* Notice of Automatic Rebooking Assistance */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#1e40af', marginBottom: '18px', lineHeight: 1.4 }}>
          <strong>Cross-Role Synchronization Notice:</strong> Cancelling this appointment will instantly alert the patient's family portal and present recommended alternative doctors with available booking slots in the same department.
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="doctor-btn doctor-btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Keep Appointment
          </button>
          <button
            type="button"
            className="doctor-btn"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#dc2626' }}
            onClick={handleConfirmCancel}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DoctorCancelAppointmentModal;
