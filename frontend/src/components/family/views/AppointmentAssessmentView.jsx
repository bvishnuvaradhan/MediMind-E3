import { useState } from 'react';
import { Sparkles, ShieldCheck, Upload, ArrowLeft } from 'lucide-react';

export function AppointmentAssessmentView({
  member: propMember,
  familyMembers = [],
  doctor: propDoctor,
  selectedDoctor,
  returnTo = 'Doctors',
  setAppointmentAssessment,
  navigate,
  announce,
}) {
  const member = propMember || familyMembers[0] || { name: 'Father' };
  const doctor = propDoctor || selectedDoctor || { title: 'Dr. Rahul Mehta', detail: 'Orthopedics' };
  const [symptoms, setSymptoms] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [fileName, setFileName] = useState('');

  const commonSymptomTags = [
    'Joint pain',
    'Fever',
    'Chest discomfort',
    'Persistent cough',
    'Back pain',
    'Severe headache',
    'Digestive issues',
    'Routine follow-up',
    'Blood report review',
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleBack = () => {
    navigate(returnTo || 'Doctors');
  };

  const analyzeSymptoms = (event) => {
    event.preventDefault();
    const combinedSymptoms = [
      ...selectedTags,
      symptoms.trim(),
      fileName ? `Attached: ${fileName}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    if (!combinedSymptoms) {
      announce('Please enter your symptoms or select at least one symptom tag.');
      return;
    }

    const criticalTerms =
      /chest pain|difficulty breathing|shortness of breath|severe bleeding|unconscious|stroke|severe pain|high fever|103/i;
    const highPriority = criticalTerms.test(combinedSymptoms) || /urgent|critical|abnormal/i.test(fileName);

    const assessment = {
      severity: highPriority ? 'High priority' : 'Routine priority',
      summary: highPriority
        ? 'Reported symptoms indicate prompt clinical review is advisable. An early appointment slot is recommended.'
        : 'Reported symptoms are suitable for standard outpatient consultation. You can proceed to select any open slot.',
      reason: combinedSymptoms,
      fileName,
      doctor: doctor?.title ?? 'Dr. Rahul Mehta',
      urgency: highPriority ? 'high' : 'routine',
      patient: member.name,
    };

    if (setAppointmentAssessment) {
      setAppointmentAssessment(assessment);
    }
    announce(`${assessment.severity} assessment complete.`);
    navigate('Book appointment');
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <p className="eyebrow">AI Clinical Intake</p>
          <h1>Check symptoms before booking</h1>
          <p>Share health concerns for triage guidance before scheduling your consultation.</p>
        </div>

        <button
          className="secondary-button compact-button"
          onClick={handleBack}
        >
          <ArrowLeft size={16} /> Back to {returnTo === 'Doctor profile' ? 'doctor profile' : returnTo === 'Doctors' ? 'doctors' : 'appointments'}
        </button>
      </div>

      {/* Unobtrusive Patient & Provider Context Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'var(--family-soft)',
          borderRadius: '10px',
          border: '1px solid var(--family-border)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`avatar small avatar-${member.tone || 'coral'}`}>{member.initials || 'RK'}</div>
          <div>
            <span style={{ fontSize: '11.5px', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>
              Consultation For
            </span>
            <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--family-ink)' }}>
              {member.name} ({member.relation})
            </strong>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700' }}>
            Selected Specialist
          </span>
          <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--family-primary)' }}>
            {doctor.title}
          </strong>
        </div>
      </div>

      <form className="booking-form" onSubmit={analyzeSymptoms}>
        <div className="booking-form-header">
          <div>
            <h2 style={{ fontSize: '17px', margin: 0 }}>What symptoms or concerns do you have?</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
              Select common symptoms below or describe what you are experiencing.
            </p>
          </div>
          <span className="booking-status">
            <ShieldCheck size={15} /> Encrypted Intake
          </span>
        </div>

        {/* Quick Symptom Tags */}
        <div style={{ margin: '14px 0 6px 0' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)', display: 'block', marginBottom: '8px' }}>
            Quick Select Common Symptoms:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {commonSymptomTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? '600' : '500',
                    backgroundColor: isSelected ? 'var(--family-primary)' : 'var(--family-soft)',
                    color: isSelected ? '#ffffff' : 'var(--family-ink)',
                    border: `1px solid ${isSelected ? 'var(--family-primary)' : 'var(--family-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && '✓ '}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <label className="booking-reason" style={{ marginTop: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>
            Detailed Symptom Description
          </span>
          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="e.g. Mild pain in the right knee for 3 days, exacerbated after walking..."
            rows={3}
          />
        </label>

        <label className="drop-zone assessment-upload" style={{ margin: '8px 0' }}>
          <Upload size={22} style={{ color: 'var(--family-primary)' }} />
          <strong>{fileName || 'Attach relevant report or previous prescription (optional)'}</strong>
          <span>Supported formats: PDF, PNG, JPEG</span>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
          />
        </label>

        <div className="booking-summary">
          <Sparkles size={16} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
          <span>
            MediMind triage evaluates urgency indicators and forwards your summary directly to {doctor.title}'s appointment record.
          </span>
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleBack}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Sparkles size={16} /> Analyze and Continue
          </button>
        </div>
      </form>
    </section>
  );
}
