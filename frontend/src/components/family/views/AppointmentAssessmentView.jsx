import { useState } from 'react';
import { Sparkles, ShieldCheck, Upload, ArrowLeft, FileText, Paperclip } from 'lucide-react';

export function AppointmentAssessmentView({
  member: propMember,
  familyMembers = [],
  records = [],
  doctor: propDoctor,
  selectedDoctor,
  returnTo = 'Doctors',
  setAppointmentAssessment,
  onAddRecord,
  navigate,
  announce,
}) {
  const member = propMember || familyMembers[0] || { name: 'Father' };
  const doctor = propDoctor || selectedDoctor || { title: 'Dr. Rahul Mehta', detail: 'Orthopedics' };

  const [symptoms, setSymptoms] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [docSource, setDocSource] = useState('none'); // 'none' | 'upload' | 'existing'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedExistingRecordId, setSelectedExistingRecordId] = useState('');

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

  // Filter records available for this member
  const memberRecords = records.filter(
    (r) => !r.patient || r.patient.toLowerCase() === member.name.toLowerCase()
  );

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

    let attachedDocName = '';
    let attachedRecordObj = null;

    if (docSource === 'upload' && uploadedFileName) {
      attachedDocName = uploadedFileName;
      // Add to unified Medical Records (Requirement 6)
      const newRec = {
        type: 'Symptom Intake Report',
        category: 'Reports',
        patient: member.name,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        source: 'Uploaded by Family',
        description: `Uploaded document: ${uploadedFileName} for ${doctor.title} consultation`,
        icon: FileText,
        color: 'blue',
        status: 'Available',
      };
      if (onAddRecord) {
        onAddRecord(newRec);
      }
      attachedRecordObj = newRec;
    } else if (docSource === 'existing' && selectedExistingRecordId) {
      const found = memberRecords.find((r) => r.type === selectedExistingRecordId || `${r.type}-${r.date}` === selectedExistingRecordId);
      if (found) {
        attachedDocName = `${found.type} (${found.date})`;
        attachedRecordObj = found;
      }
    }

    const combinedSymptoms = [
      ...selectedTags,
      symptoms.trim(),
      attachedDocName ? `Attached: ${attachedDocName}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    if (!combinedSymptoms) {
      announce('Please enter your symptoms or select at least one symptom tag.');
      return;
    }

    const criticalTerms =
      /chest pain|difficulty breathing|shortness of breath|severe bleeding|unconscious|stroke|severe pain|high fever|103/i;
    const highPriority = criticalTerms.test(combinedSymptoms) || /urgent|critical|abnormal/i.test(attachedDocName);

    const assessment = {
      severity: highPriority ? 'High priority' : 'Routine priority',
      summary: highPriority
        ? 'Reported symptoms indicate prompt clinical review is advisable. An early appointment slot is recommended.'
        : 'Reported symptoms are suitable for standard outpatient consultation. You can proceed to select any open slot.',
      reason: combinedSymptoms,
      fileName: attachedDocName,
      attachedRecord: attachedRecordObj,
      doctor: doctor?.title ?? 'Dr. Rahul Mehta',
      urgency: highPriority ? 'high' : 'routine',
      patient: member.name,
    };

    if (setAppointmentAssessment) {
      setAppointmentAssessment(assessment);
    }
    announce(`${assessment.severity} symptom intake completed.`);
    navigate('Book appointment');
  };

  return (
    <section className="feature-view">
      <div className="feature-heading" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="feature-icon" style={{ backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
            <Sparkles size={22} />
          </span>
          <div>
            <p className="eyebrow" style={{ margin: '0 0 2px 0' }}>AI Clinical Intake</p>
            <h1 style={{ margin: 0, fontSize: '22px' }}>Check symptoms before booking</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
              Share health concerns to receive clinical triage and urgency guidance.
            </p>
          </div>
        </div>

        <button
          className="secondary-button compact-button"
          onClick={handleBack}
        >
          <ArrowLeft size={16} /> Back to {returnTo === 'Doctor profile' ? 'doctor profile' : returnTo === 'Doctors' ? 'doctors' : 'appointments'}
        </button>
      </div>

      {/* Selected Patient & Doctor Context Bar */}
      <div className="booking-context-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`avatar small avatar-${member.tone || 'coral'}`}>{member.initials || 'RK'}</div>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--family-muted)', fontWeight: '700' }}>
              Patient
            </span>
            <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--family-ink)' }}>
              {member.name} ({member.relation})
            </strong>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--family-muted)', fontWeight: '700' }}>
            Target Specialist
          </span>
          <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--family-primary)' }}>
            {doctor.title}
          </strong>
        </div>
      </div>

      <form className="booking-form" onSubmit={analyzeSymptoms}>
        <div className="booking-form-header">
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--family-ink)' }}>
              What symptoms or concerns do you have?
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
              Select relevant health symptoms below or type details for {member.name}.
            </p>
          </div>
          <span className="booking-status">
            <ShieldCheck size={15} /> Encrypted Intake
          </span>
        </div>

        {/* Quick Symptom Chips */}
        <div style={{ margin: '16px 0 8px 0' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)', display: 'block', marginBottom: '8px' }}>
            Quick Symptom Suggestions:
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

        {/* Large Symptom Textarea */}
        <label className="booking-reason" style={{ marginTop: '14px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>
            Detailed Symptom Description
          </span>
          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="Describe when the symptoms started, severity, pain triggers, and any previous medications taken..."
            rows={4}
            style={{ fontSize: '13.5px', lineHeight: '1.5' }}
          />
        </label>

        {/* Supporting Document Section (Upload or Existing Record) */}
        <div style={{ margin: '14px 0', padding: '16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', border: '1px solid var(--family-border)' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--family-ink)', display: 'block', marginBottom: '10px' }}>
            Supporting Medical Document (Optional)
          </span>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setDocSource(docSource === 'upload' ? 'none' : 'upload')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: docSource === 'upload' ? 'var(--family-primary)' : 'var(--family-card)',
                color: docSource === 'upload' ? '#ffffff' : 'var(--family-ink)',
                border: '1px solid var(--family-border)',
              }}
            >
              <Upload size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Upload New Document
            </button>

            <button
              type="button"
              onClick={() => setDocSource(docSource === 'existing' ? 'none' : 'existing')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: docSource === 'existing' ? 'var(--family-primary)' : 'var(--family-card)',
                color: docSource === 'existing' ? '#ffffff' : 'var(--family-ink)',
                border: '1px solid var(--family-border)',
              }}
            >
              <Paperclip size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Use Existing Medical Record ({memberRecords.length})
            </button>
          </div>

          {docSource === 'upload' && (
            <label className="drop-zone assessment-upload" style={{ margin: 0, padding: '16px' }}>
              <Upload size={22} style={{ color: 'var(--family-primary)' }} />
              <strong>{uploadedFileName || 'Choose PDF, X-ray, or lab report image'}</strong>
              <span>Uploaded document will also be saved to {member.name}'s Medical Records</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setUploadedFileName(event.target.files?.[0]?.name ?? '')}
              />
            </label>
          )}

          {docSource === 'existing' && (
            <div>
              {memberRecords.length === 0 ? (
                <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
                  No existing medical records found for {member.name}. Please upload a new document instead.
                </span>
              ) : (
                <select
                  className="feature-input"
                  value={selectedExistingRecordId}
                  onChange={(e) => setSelectedExistingRecordId(e.target.value)}
                >
                  <option value="">-- Select an existing medical record for {member.name} --</option>
                  {memberRecords.map((r, idx) => (
                    <option key={`${r.type}-${idx}`} value={`${r.type}-${r.date}`}>
                      {r.type} · {r.date} ({r.source})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="booking-summary">
          <Sparkles size={16} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
          <span>
            MediMind triage evaluates urgency patterns and attaches your health intake summary directly to {doctor.title}'s appointment file.
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
            <Sparkles size={16} /> Analyze & Continue
          </button>
        </div>
      </form>
    </section>
  );
}
