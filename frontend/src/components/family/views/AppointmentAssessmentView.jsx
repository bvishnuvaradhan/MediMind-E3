import { useState } from 'react';
import { Sparkles, ShieldCheck, Upload, ArrowUpRight } from 'lucide-react';

export function AppointmentAssessmentView({
  member: propMember,
  doctor: propDoctor,
  selectedDoctor,
  setAssessment: propSetAssessment,
  setAppointmentAssessment,
  navigate,
  announce,
}) {
  const member = propMember || { name: 'Father' };
  const doctor = propDoctor || selectedDoctor;
  const setAssessment = propSetAssessment || setAppointmentAssessment || (() => {});
  const [symptoms, setSymptoms] = useState('');
  const [fileName, setFileName] = useState('');

  const analyzeSymptoms = (event) => {
    event.preventDefault();
    if (!symptoms.trim() && !fileName) {
      announce('Add symptoms or upload a report before running the AI assessment.');
      return;
    }

    const criticalTerms =
      /chest pain|difficulty breathing|shortness of breath|severe bleeding|unconscious|stroke|severe pain|high fever/i;
    const highPriority =
      criticalTerms.test(symptoms) || /critical|urgent|abnormal/i.test(fileName);
    const assessment = {
      severity: highPriority ? 'High priority' : 'Routine priority',
      summary: highPriority
        ? 'The reported symptoms may need prompt clinical review. We recommend choosing the earliest available appointment slot.'
        : 'The reported information appears suitable for a routine consultation. You can choose any available appointment slot.',
      reason: symptoms.trim() || `Review uploaded file: ${fileName}`,
      fileName,
      doctor: doctor?.title ?? 'Dr. Rahul Mehta',
      urgency: highPriority ? 'high' : 'routine',
    };
    setAssessment(assessment);
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
          <p className="eyebrow">AI-assisted intake</p>
          <h1>Check symptoms before booking</h1>
          <p>Share symptoms or a report so MediMind can recommend appointment urgency.</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('Appointments')}
        >
          <ArrowUpRight size={16} /> Back to appointments
        </button>
      </div>

      <form className="booking-form" onSubmit={analyzeSymptoms}>
        <div className="booking-form-header">
          <div>
            <h2>AI symptom assessment</h2>
            <p>This is decision support, not a medical diagnosis.</p>
          </div>
          <span className="booking-status">
            <ShieldCheck size={15} /> Private and secure
          </span>
        </div>

        <label className="booking-reason">
          <span>What symptoms or concerns does {member.name} have?</span>
          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="For example: chest discomfort for two days, or routine follow-up after a blood test"
          />
        </label>

        <label className="drop-zone assessment-upload">
          <Upload size={24} />
          <strong>{fileName || 'Upload a report or prescription'}</strong>
          <span>PDF or image files are supported</span>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
          />
        </label>

        <div className="booking-summary">
          <Sparkles size={17} />
          <span>
            The AI summary will be added to Appointment details and used to recommend the earliest
            slot when needed.
          </span>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('Appointments')}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            <Sparkles size={16} /> Analyze and continue
          </button>
        </div>
      </form>
    </section>
  );
}
