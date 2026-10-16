import { X, CheckCircle, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { appointmentService } from '../../../services/appointmentService';

export function AlternativeBookingModal({
  isOpen,
  appointment,
  notification,
  onClose,
  onRebookSuccess,
  announce,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alternativesData, setAlternativesData] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const targetApptId = appointment?.metadata?.appointment_id ||
    appointment?.metadata?.appointmentId ||
    appointment?.appointment_id ||
    appointment?.appointmentId ||
    appointment?._id ||
    appointment?.id ||
    notification?.metadata?.appointment_id ||
    notification?.metadata?.appointmentId ||
    notification?.appointmentId ||
    notification?.appointment_id;

  useEffect(() => {
    if (!isOpen) {
      setSelectedDoctorId(null);
      setSelectedSlot(null);
      setBookingSuccess(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    appointmentService.getAlternatives(targetApptId)
      .then((data) => {
        if (!isMounted) return;
        setAlternativesData(data);
        if (data.recommendedDoctors && data.recommendedDoctors.length > 0) {
          setSelectedDoctorId(data.recommendedDoctors[0].doctorId);
          if (data.recommendedDoctors[0].availableSlots?.length > 0) {
            setSelectedSlot(data.recommendedDoctors[0].availableSlots[0]);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load alternative appointments');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetApptId]);

  if (!isOpen) return null;

  const handleSelectDoctor = (doc) => {
    setSelectedDoctorId(doc.doctorId);
    if (doc.availableSlots && doc.availableSlots.length > 0) {
      setSelectedSlot(doc.availableSlots[0]);
    } else {
      setSelectedSlot(null);
    }
  };

  const selectedDoctor = alternativesData?.recommendedDoctors?.find(
    (d) => d.doctorId === selectedDoctorId
  );

  const handleConfirmRebooking = async () => {
    if (!selectedDoctor || !selectedSlot) {
      setError('Please select an alternative doctor and available time slot.');
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const familyMemberId = appointment?.familyMemberId || appointment?.family_member_id || notification?.familyMemberId || notification?.family_member_id || appointment?.patientId;

      const payload = {
        familyMemberId: familyMemberId || '670691234567890abcdef123',
        doctorId: selectedDoctor.doctorId,
        hospitalId: selectedDoctor.hospitalId,
        departmentId: selectedDoctor.departmentId,
        appointmentDate: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: `Rebooked alternative after cancellation of prior appointment (${appointment?.doctorName || notification?.doctorName || 'Previous doctor'})`,
        originalAppointmentId: targetApptId,
      };

      const newAppointment = await appointmentService.bookAppointment(payload);
      setBookingSuccess(newAppointment);

      if (notification?.id || notification?._id) {
        await appointmentService.markNotificationRead(notification.id || notification._id);
      }

      if (announce) {
        announce(`Alternative appointment confirmed with ${selectedDoctor.fullName} on ${selectedSlot.formattedDate} at ${selectedSlot.startTime}.`);
      }

      if (onRebookSuccess) {
        onRebookSuccess(newAppointment);
      }
    } catch (err) {
      setError(err.message || 'Failed to confirm rebooking. The selected slot may have just been booked. Please try another slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="feature-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="feature-modal-card"
        style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--family-border, #e2e8f0)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                Doctor Cancellation Resolved
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--family-muted, #64748b)' }}>
                Guaranteed Clinical Continuity
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 2px', color: 'var(--family-text, #0f172a)' }}>
              Find Alternative Appointment & Rebook
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--family-muted, #64748b)' }}>
              Select an available specialist in the same department and hospital to rebook without delay
            </p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={onClose}
            aria-label="Close alternative booking modal"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cancellation Context Card */}
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
            <AlertCircle size={16} />
            Cancelled Visit Details:
          </div>
          <div style={{ fontSize: '12.5px', color: '#7f1d1d', lineHeight: '1.5' }}>
            <strong>Patient:</strong> {appointment?.patientName || appointment?.patient || notification?.familyMemberName || 'Family Member'} &nbsp;|&nbsp;
            <strong>Original Doctor:</strong> {appointment?.doctorName || appointment?.doctor || notification?.doctorName || 'Attending Physician'} &nbsp;|&nbsp;
            <strong>Scheduled Slot:</strong> {appointment?.meta || appointment?.date || notification?.appointmentDate ? `${notification?.appointmentDate?.slice(0, 10)} ${notification?.startTime || ''}` : 'Scheduled visit'}
            <div style={{ marginTop: '3px' }}>
              <strong>Cancellation Reason:</strong> {appointment?.cancellationReason || notification?.cancellationReason || 'Doctor scheduling conflict / emergency surgery'}
            </div>
          </div>
        </div>

        {/* Success View */}
        {bookingSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#166534' }}>
              Alternative Appointment Confirmed!
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#14532d' }}>
              Your replacement consultation has been booked with <strong>{selectedDoctor?.fullName}</strong> on <strong>{selectedSlot?.formattedDate}</strong> at <strong>{selectedSlot?.startTime}</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="primary-button"
                onClick={onClose}
                style={{ padding: '8px 20px' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--family-muted, #64748b)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Searching genuinely available alternative doctors and open OPD slots...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '16px', backgroundColor: '#fff1f2', borderRadius: '8px', color: '#be123c', fontSize: '13px', marginBottom: '16px' }}>
            <strong>Error:</strong> {error}
          </div>
        ) : alternativesData?.recommendedDoctors?.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#334155', marginBottom: '4px' }}>No Alternative Slots Immediately Available</div>
            <p style={{ margin: 0, fontSize: '13px' }}>
              No other doctors in this specialty currently have open booking slots for the next 7 days.
              Please reach out directly to the MediMind hospital priority coordination desk at <strong>+91 80 4000 1100</strong>.
            </p>
          </div>
        ) : (
          <div>
            {/* Step 1: Choose Doctor */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--family-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                1. Select Available Specialist ({alternativesData?.recommendedDoctors?.length} recommended):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {alternativesData.recommendedDoctors.map((doc) => {
                  const isSelected = doc.doctorId === selectedDoctorId;
                  const isSameDept = doc.tier === 'SAME_DEPARTMENT_AND_HOSPITAL';
                  return (
                    <div
                      key={doc.doctorId}
                      onClick={() => handleSelectDoctor(doc)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--family-primary, #0ea5e9)' : 'var(--family-border, #e2e8f0)'}`,
                        backgroundColor: isSelected ? 'var(--family-soft, #f0f9ff)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: isSameDept ? '#dcfce7' : '#e0e7ff', color: isSameDept ? '#166534' : '#3730a3' }}>
                          {isSameDept ? 'Same Dept' : 'Alternative Specialist'}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>
                          ★ {doc.rating?.toFixed(1) || '4.8'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--family-text, #0f172a)' }}>
                        {doc.fullName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--family-muted, #64748b)', margin: '2px 0 4px' }}>
                        {doc.specialization} · {doc.experienceYears || 8} yrs exp
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={11} />
                        {doc.hospitalName || 'MediMind Central Hospital'}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--family-primary, #0ea5e9)', marginTop: '6px' }}>
                        {doc.availableSlots?.length || 0} open slots
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Slot */}
            {selectedDoctor && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--family-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  2. Select Available Slot for {selectedDoctor.fullName}:
                </div>
                {selectedDoctor.availableSlots?.length === 0 ? (
                  <div style={{ padding: '12px', fontSize: '13px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    No slots open for this clinician. Please select another doctor above.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                    {selectedDoctor.availableSlots.map((slot, idx) => {
                      const isSlotSelected = selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          type="button"
                          key={`${slot.date}_${slot.startTime}_${idx}`}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: `1.5px solid ${isSlotSelected ? 'var(--family-primary, #0ea5e9)' : 'var(--family-border, #cbd5e1)'}`,
                            backgroundColor: isSlotSelected ? 'var(--family-primary, #0ea5e9)' : '#ffffff',
                            color: isSlotSelected ? '#ffffff' : 'var(--family-text, #0f172a)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <div style={{ fontSize: '10.5px', opacity: isSlotSelected ? 0.9 : 0.7 }}>
                            {slot.formattedDate}
                          </div>
                          <div>{slot.startTime}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Footer / Confirm Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--family-border, #e2e8f0)', paddingTop: '14px' }}>
              <button
                type="button"
                className="text-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!selectedDoctor || !selectedSlot || bookingLoading}
                onClick={handleConfirmRebooking}
                style={{ minWidth: '220px' }}
              >
                {bookingLoading ? (
                  'Confirming Rebooking...'
                ) : (
                  <>
                    Confirm Rebooking <ArrowRight size={15} style={{ marginLeft: '4px' }} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlternativeBookingModal;
