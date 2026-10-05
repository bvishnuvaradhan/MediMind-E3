import { useState, useMemo } from 'react';
import { Sparkles, ShieldCheck, Upload, ArrowLeft, FileText, Paperclip, Stethoscope } from 'lucide-react';
import { initialPresentationData } from '../../../data/medimindData';

const allDocs = initialPresentationData.Doctors || [];

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
  const [selectedPatientName, setSelectedPatientName] = useState(() => propMember?.name || familyMembers[0]?.name || 'Rohan Kapoor');
  const activeMember = familyMembers.find((m) => m.name === selectedPatientName || m.fullName === selectedPatientName) || propMember || { name: selectedPatientName, relation: 'Self' };

  const [symptoms, setSymptoms] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [docSource, setDocSource] = useState('none'); // 'none' | 'upload' | 'existing'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedExistingRecordId, setSelectedExistingRecordId] = useState('');

  // 3 Curated Recommended Doctors (Requirement 7)
  const recommendedDoctors = useMemo(() => {
    // If a doctor was explicitly selected, put them first and add 2 other diverse specialists
    if (selectedDoctor || propDoctor) {
      const targetDoc = selectedDoctor || propDoctor;
      const targetName = targetDoc.title || targetDoc.name;
      const primaryDoc = allDocs.find((d) => d.title === targetName || d.name === targetName) || targetDoc;
      const others = allDocs.filter((d) => (d.title !== targetName && d.name !== targetName)).slice(0, 2);
      return [primaryDoc, ...others].slice(0, 3);
    }
    // Default 3 diverse top-rated specialists
    return allDocs.slice(0, 3);
  }, [selectedDoctor, propDoctor]);

  const [chosenDoctor, setChosenDoctor] = useState(() => {
    return recommendedDoctors[0] || {
      title: 'Dr. Rahul Mehta',
      name: 'Dr. Rahul Mehta',
      department: 'Orthopedics',
      hospital: 'MediMind Central Hospital',
      fee: '₹800 (In-person) / ₹650 (Video)',
      experience: '16+ Years Clinical Practice',
      rating: '4.9 / 5.0 (240+ reviews)',
      modes: ['In-person OPD Clinic', 'Secure Video Consultation'],
    };
  });

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
    (r) => !r.patient || r.patient.toLowerCase() === selectedPatientName.toLowerCase()
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
      // Add to unified Medical Records (Requirement 5)
      const newRec = {
        type: 'Symptom Intake Report',
        category: 'Reports',
        patient: selectedPatientName,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        source: 'Uploaded by Family',
        description: `Uploaded document: ${uploadedFileName} for ${chosenDoctor.title || chosenDoctor.name} consultation`,
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
      doctor: chosenDoctor?.title || chosenDoctor?.name || 'Dr. Rahul Mehta',
      doctorObj: chosenDoctor,
      urgency: highPriority ? 'high' : 'routine',
      patient: selectedPatientName,
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

      {/* Step 1: Patient Selection */}
      <div style={{ padding: '14px 16px', backgroundColor: 'var(--family-card)', borderRadius: '10px', border: '1px solid var(--family-border)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label htmlFor="assessment-patient-select" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            1. Patient Profile *
          </label>
          <span style={{ fontSize: '11.5px', color: 'var(--family-primary)', fontWeight: '600' }}>
            Consultation Recipient
          </span>
        </div>

        <select
          id="assessment-patient-select"
          className="feature-input"
          value={selectedPatientName}
          onChange={(e) => {
            setSelectedPatientName(e.target.value);
            setSelectedExistingRecordId('');
            if (announce) announce(`Selected patient ${e.target.value} for consultation.`);
          }}
          style={{ fontWeight: '600', fontSize: '13.5px' }}
        >
          {familyMembers.map((m) => {
            const mName = m.fullName || m.name;
            const mRel = m.relationship || m.relation || 'Member';
            return (
              <option key={m.id || m.name} value={m.name}>
                {mName} ({mRel} · Age {m.age || 'N/A'})
              </option>
            );
          })}
        </select>
      </div>

      {/* Step 2: Select from Exactly 3 Recommended Specialists (Requirement 7) */}
      <div style={{ padding: '16px 18px', backgroundColor: 'var(--family-card)', borderRadius: '10px', border: '1px solid var(--family-border)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={16} style={{ color: 'var(--family-primary)' }} />
              2. Choose from Recommended Specialists (Select 1 of 3) *
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--family-muted)' }}>
              Curated clinicians matching hospital departments and clinical experience
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {recommendedDoctors.map((doc, idx) => {
            const isSelected = (chosenDoctor.title || chosenDoctor.name) === (doc.title || doc.name);
            const docName = doc.title || doc.name;
            const docDept = doc.department || doc.specialty || 'Specialist';
            const docHosp = doc.hospital || 'MediMind Central Hospital';

            return (
              <div
                key={`${docName}-${idx}`}
                onClick={() => {
                  setChosenDoctor(doc);
                  if (announce) announce(`Selected specialist ${docName}.`);
                }}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid var(--family-primary)' : '1px solid var(--family-border)',
                  backgroundColor: isSelected ? 'var(--family-primary-subtle, #f0fdfa)' : 'var(--family-soft)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className={`avatar small avatar-${doc.tone || 'coral'}`}>
                      {doc.initials || docName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--family-ink)', display: 'block' }}>
                        {docName}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--family-primary)', fontWeight: '600' }}>
                        {docDept}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <span style={{ display: 'grid', placeItems: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--family-primary)', color: '#fff', fontSize: '12px', fontWeight: '700' }}>
                      ✓
                    </span>
                  ) : (
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid var(--family-muted)' }} />
                  )}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--family-muted)', lineHeight: '1.4' }}>
                  <div>🏥 <strong>{docHosp}</strong></div>
                  <div>💰 Fee: <strong>{doc.fee || '₹800 (In-person) / ₹650 (Video)'}</strong></div>
                  <div>⭐ {doc.experience || '15+ Years Clinical Practice'} · {doc.rating || '4.9/5.0'}</div>
                  <div style={{ marginTop: '3px', color: 'var(--family-ink)', fontSize: '11px' }}>
                    Modes: In-Person OPD Clinic, Video Consultation
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form className="booking-form" onSubmit={analyzeSymptoms}>
        <div className="booking-form-header">
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--family-ink)' }}>
              3. Clinical Symptoms & Intake Notes
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--family-muted)' }}>
              Select relevant health symptoms below or type details for {activeMember.name}.
            </p>
          </div>
          <span className="booking-status">
            <ShieldCheck size={15} /> Encrypted Intake
          </span>
        </div>

        {/* Quick Symptom Chips */}
        <div style={{ margin: '14px 0 8px 0' }}>
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

        {/* Large Symptom Textarea (Requirement 6: resizeable, non-clipped) */}
        <label className="booking-reason" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>
            Detailed Symptom Description *
          </span>
          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="Describe when symptoms started, severity, pain triggers, medications, or specific concerns for the specialist..."
            rows={4}
            style={{ fontSize: '13.5px', lineHeight: '1.5', minHeight: '90px', resize: 'vertical' }}
            required
          />
        </label>

        {/* Supporting Document Section (Upload or Existing Record) */}
        <div style={{ margin: '14px 0', padding: '16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', border: '1px solid var(--family-border)' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--family-ink)', display: 'block', marginBottom: '10px' }}>
            4. Supporting Medical Document (Optional)
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
              <span>Uploaded document will also be saved to {selectedPatientName}'s Medical Records</span>
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
                  No existing medical records found for {selectedPatientName}. Please upload a new document instead.
                </span>
              ) : (
                <select
                  className="feature-input"
                  value={selectedExistingRecordId}
                  onChange={(e) => setSelectedExistingRecordId(e.target.value)}
                >
                  <option value="">-- Select an existing medical record for {selectedPatientName} --</option>
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

        <div className="booking-summary" style={{ padding: '12px 16px', borderRadius: '8px' }}>
          <Sparkles size={16} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
            MediMind triage evaluates urgency patterns and prepares your health intake summary for <strong>{chosenDoctor.title || chosenDoctor.name}</strong>.
          </span>
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleBack}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Sparkles size={16} /> Continue to Booking
          </button>
        </div>
      </form>
    </section>
  );
}
