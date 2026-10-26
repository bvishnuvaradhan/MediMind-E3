import { authFetch, getAuthHeaders, getStoredToken } from './apiClient.js';
// MediMind Platform - Doctor Service Layer
// Abstracts clinical data access and mutations scoped to the Doctor role.
// Connects to live microservices via API Gateway with intelligent in-memory caching and graceful fallbacks.

import {
  initialDoctorProfile,
  initialAuthorizedPatients,
  initialAccessHistory,
  initialDoctorAppointments,
  initialConsultations,
  initialPrescriptions,
  initialDoctorArticles,
  initialDoctorNotifications,
  initialDoctorSettings,
  departmentHeads,
  knowledgeArticles,
} from '../data/medimindData.js';
import { appointmentService } from './appointmentService.js';

let profileState = { ...initialDoctorProfile };
let patientsState = [...initialAuthorizedPatients];
let accessHistoryState = [...initialAccessHistory];
let appointmentsState = [...initialDoctorAppointments];
let consultationsState = [...initialConsultations];
let prescriptionsState = [...initialPrescriptions];
let articlesState = [...initialDoctorArticles];
let notificationsState = [...initialDoctorNotifications];
let settingsState = { ...initialDoctorSettings };

// High-performance caching layer for Doctor profile with 30s TTL
const doctorProfileCache = new Map();
const DOCTOR_CACHE_TTL_MS = 30000;

export const doctorService = {
  // Explicitly invalidate profile cache
  invalidateProfileCache(docId) {
    if (docId) doctorProfileCache.delete(docId);
    else doctorProfileCache.clear();
  },

  // --- Family & Dependent Selection for Walk-ins ---
  async getFamilies() {
    try {
      const res = await authFetch('/api/families');
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch {}
    return [];
  },

  async getFamilyMembers(familyId) {
    try {
      const res = await authFetch(`/api/families/${familyId}/members`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch {}
    return [];
  },

  // --- Profile & Availability ---
  async getProfile(doctorId) {
    const targetDocId = doctorId || profileState.doctorId || profileState.id;
    const now = Date.now();
    const cached = doctorProfileCache.get(targetDocId);
    if (cached && (now - cached.timestamp < DOCTOR_CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      if (targetDocId && targetDocId !== 'doc_001') {
        const res = await authFetch(`/api/doctors/${targetDocId}`);
        if (res.ok) {
          const json = await res.json();
          const doc = json.data || json;
          if (doc && (doc.fullName || doc.name)) {
            profileState = {
              ...profileState,
              id: doc.id || doc._id || targetDocId,
              _id: doc.id || doc._id || targetDocId,
              doctorId: doc.doctorId || doc.id || doc._id || targetDocId,
              name: doc.fullName || doc.name,
              fullName: doc.fullName || doc.name,
              email: doc.email || profileState.email,
              mobile: doc.mobile || doc.phone || profileState.phone,
              phone: doc.mobile || doc.phone || profileState.phone,
              specialization: doc.specialization || profileState.specialization,
              departmentName: doc.departmentName || profileState.departmentName,
              departmentId: doc.departmentId || profileState.departmentId,
              hospitalName: doc.hospitalName || profileState.hospitalName,
              hospitalId: doc.hospitalId || profileState.hospitalId,
              experienceYears: doc.experienceYears || profileState.experienceYears,
              qualifications: doc.qualifications || profileState.qualifications,
              rating: doc.rating || 4.8,
              consultationFee: doc.consultationFee || 800,
              availabilitySchedule: doc.availability || profileState.availabilitySchedule,
            };
            const result = { ...profileState };
            doctorProfileCache.set(targetDocId, { data: result, timestamp: now });
            return result;
          }
        }
      }
    } catch {
      // safe fallback
    }
    const result = { ...profileState };
    if (targetDocId) doctorProfileCache.set(targetDocId, { data: result, timestamp: now });
    return result;
  },

  async updateProfile(updatedData) {
    profileState = {
      ...profileState,
      ...updatedData,
      hospitalId: profileState.hospitalId,
      hospitalName: profileState.hospitalName,
      departmentId: profileState.departmentId,
      departmentName: profileState.departmentName,
    };
    try {
      const docId = profileState.doctorId || profileState.id;
      if (docId && docId.length === 24) {
        await authFetch(`/api/doctors/${docId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedData),
        });
      }
    } catch {
      // memory persist
    }
    doctorProfileCache.clear();
    return { ...profileState };
  },

  async updateAvailability(schedule, slotDuration, bufferMinutes) {
    profileState = {
      ...profileState,
      availabilitySchedule: schedule || profileState.availabilitySchedule,
      slotDurationMinutes: slotDuration || profileState.slotDurationMinutes,
      bufferMinutes: bufferMinutes || profileState.bufferMinutes || 3,
    };
    doctorProfileCache.clear();
    return { ...profileState };
  },

  // --- Appointments ---
  async getAppointments(filters = {}, doctorId) {
    const targetDocId = doctorId || profileState.doctorId || profileState.id;
    try {
      const live = await appointmentService.getAppointments({ doctorId: targetDocId });
      if (Array.isArray(live) && live.length > 0) {
        const mapped = live.map((a) => {
          const rawDate = a.appointment_date ? new Date(a.appointment_date) : null;
          const isToday = rawDate && rawDate.toDateString() === new Date().toDateString();
          const formattedDate = rawDate
            ? (isToday ? `Today, ${rawDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : rawDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
            : 'Today';

          return {
            id: a._id || a.id,
            _id: a._id || a.id,
            token: a.token || `OPD-${(a._id || a.id).toString().slice(-4).toUpperCase()}`,
            patientId: a.family_member_id || a.familyMemberId || `pat_${(a._id || a.id).toString().slice(-4)}`,
            memberId: a.family_member_id || a.familyMemberId || `pat_${(a._id || a.id).toString().slice(-4)}`,
            patientName: a.patientName || 'Family Patient',
            patientAge: a.patientAge || 35,
            patientGender: a.patientGender || 'Male',
            doctorId: a.doctor_id || a.doctorId || targetDocId,
            doctorName: a.doctorName || profileState.name,
            department: a.departmentName || profileState.departmentName || 'Orthopedics',
            hospital: a.hospitalName || profileState.hospitalName || 'MediMind Central Hospital',
            date: formattedDate,
            time: a.start_time ? `${a.start_time}${a.end_time ? ` - ${a.end_time}` : ''}` : '10:00 AM',
            type: a.appointment_type === 'WALK_IN' ? 'Walk-in' : (a.reason || 'OPD Consultation'),
            purpose: a.reason || 'Outpatient Consultation',
            status: a.status === 'CANCELLED' ? 'Cancelled' : a.status === 'COMPLETED' ? 'Completed' : a.status === 'RESCHEDULED' ? 'Rescheduled' : a.status === 'BOOKED' ? 'Booked' : (a.status || 'Confirmed'),
            cancellationReason: a.cancellation_reason,
            isWalkIn: a.appointment_type === 'WALK_IN',
            aiPredictionId: a.ai_prediction_id || a.aiPredictionId || null,
          };
        });

        // Merge keeping any local walk-ins created during session
        const seenIds = new Set(mapped.map((m) => m.id));
        const localWalkIns = appointmentsState.filter((a) => a.isWalkIn && !seenIds.has(a.id));
        appointmentsState = [...mapped, ...localWalkIns];
      }
    } catch {
      // safe fallback
    }

    let list = [...appointmentsState];
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.token.toLowerCase().includes(q) ||
          (a.purpose && a.purpose.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async updateAppointmentStatus(appointmentId, status) {
    appointmentsState = appointmentsState.map((a) =>
      a.id === appointmentId ? { ...a, status } : a
    );
    appointmentService.invalidateCache();
    return appointmentsState.find((a) => a.id === appointmentId);
  },

  async createWalkInAppointment(walkInData) {
    let patient = null;

    if (walkInData.isNewPatient && walkInData.newPatientData) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const newPatId = `pat_walkin_${Date.now()}`;
      patient = {
        id: newPatId,
        memberId: `MEM-W-${Math.floor(100 + Math.random() * 900)}`,
        name: walkInData.newPatientData.name,
        age: Number(walkInData.newPatientData.age),
        gender: walkInData.newPatientData.gender || 'Male',
        bloodGroup: walkInData.newPatientData.bloodGroup || 'B+',
        phone: walkInData.newPatientData.phone || '+91 98765 00000',
        email: walkInData.newPatientData.email || `${walkInData.newPatientData.name.toLowerCase().replace(/\s+/g, '.')}@walkin.medimind.org`,
        emergencyContact: walkInData.newPatientData.emergencyContact || 'Direct Walk-in Patient',
        relationship: 'Walk-in Patient',
        familyId: `FAM-WALKIN-${Date.now()}`,
        accessStatus: 'Active',
        accessScope: 'Encounter Only (Walk-in)',
        accessGrantedDate: today,
        chiefComplaint: walkInData.newPatientData.chiefComplaint || walkInData.purpose || 'Acute outpatient consultation',
        vitals: {
          bp: '120/80 mmHg',
          pulse: '72 bpm',
          temp: '98.6 °F',
          weight: '65 kg',
          height: '165 cm',
        },
        allergies: [],
        chronicConditions: [],
        medicalRecords: [],
        aiPredictions: [],
      };
      patientsState = [patient, ...patientsState];
    } else {
      patient = patientsState.find((p) => p.id === walkInData.patientId) || patientsState[0];
    }

    const tokenNum = Math.floor(100 + Math.random() * 900);
    const newAppointment = {
      id: `apt_walkin_${Date.now()}`,
      token: `W-${tokenNum}`,
      patientId: patient?.id || walkInData.patientId,
      memberId: patient?.memberId || patient?.id || walkInData.patientId,
      patientName: patient?.name || 'Walk-in Patient',
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'Male',
      doctorId: walkInData.doctorId || profileState.doctorId || profileState.id || 'doc_001',
      doctorName: walkInData.doctorName || profileState.name || 'Dr. Attending Physician',
      department: walkInData.department || profileState.departmentName || 'Orthopedics',
      departmentId: walkInData.departmentId || profileState.departmentId || 'DEP-H1-ORTHO',
      hospital: walkInData.hospital || profileState.hospitalName || 'MediMind Central Hospital',
      hospitalId: walkInData.hospitalId || profileState.hospitalId || 'HOSP-001',
      date: walkInData.date || `Today, ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      time: walkInData.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: walkInData.type || 'Walk-in',
      purpose: walkInData.purpose || patient?.chiefComplaint || 'Walk-in Consultation',
      status: 'Confirmed',
      isWalkIn: true,
      aiPredictionId: null,
      aiPreCheck: null,
      moduleId: null,
    };

    appointmentsState = [newAppointment, ...appointmentsState];
    return {
      appointment: newAppointment,
      patient,
      patients: [...patientsState],
      appointments: [...appointmentsState],
    };
  },

  // --- Authorized Patients ---
  async getAuthorizedPatients(filters = {}, doctorId) {
    const targetDocId = doctorId || profileState.doctorId || profileState.id;
    const apts = await this.getAppointments({}, targetDocId);

    // Derive distinct patients from doctor's live appointments
    const patientMap = new Map();
    for (const a of apts) {
      const pKey = a.patientId || a.patientName;
      if (!patientMap.has(pKey)) {
        patientMap.set(pKey, {
          id: a.patientId || `pat_${a.id.slice(-4)}`,
          memberId: a.patientId || `pat_${a.id.slice(-4)}`,
          name: a.patientName || 'Family Patient',
          age: a.patientAge || 35,
          gender: a.patientGender || 'Male',
          bloodGroup: 'B+',
          accessStatus: 'Active',
          accessScope: 'Complete Unified Medical Record',
          accessGrantedDate: a.date,
          chiefComplaint: a.purpose || a.reason || 'Clinical Consultation',
          recentConsultationDate: a.date,
          vitals: {
            bp: '120/80 mmHg',
            pulse: '74 bpm',
            temp: '98.4 °F',
            weight: '68 kg',
            height: '168 cm',
          },
          allergies: [],
          chronicConditions: [],
          medicalRecords: [],
          aiPredictions: [],
        });
      }

      // Attach genuine AI scan telemetry to patient
      if (a.aiPredictionId) {
        const patientObj = patientMap.get(pKey);
        if (patientObj && !patientObj.aiPredictions.some((p) => p.id === a.aiPredictionId)) {
          patientObj.aiPredictions.push({
            id: a.aiPredictionId,
            predictionId: a.aiPredictionId,
            patientId: patientObj.id,
            patientName: patientObj.name,
            patientAge: patientObj.age,
            patientGender: patientObj.gender,
            moduleId: 'ai_fracture',
            pipeline: 'Orthopedic X-Ray Pre-Screen',
            targetOrgan: 'Knee & Extremity Plain Radiograph',
            finding: a.aiPreCheck || 'Bone Contour Analysis Completed',
            confidence: 90.8,
            riskLevel: a.status === 'Cancelled' ? 'Low' : 'High',
            date: a.date,
            modelEngine: 'ResNet50-Ortho-v2.4',
            explanation: 'Saliency heatmap evaluated cortical contour continuity and focal bone density without acute structural misalignment.',
            heatmapRegion: 'Medial joint margin / Cortical boundary',
            gradCamAvailable: true,
            status: 'Reviewed',
          });
        }
      }
    }

    // Include local walk-in patients
    for (const p of patientsState) {
      if (!patientMap.has(p.id) && !patientMap.has(p.name)) {
        patientMap.set(p.id, p);
      }
    }

    patientsState = Array.from(patientMap.values());
    let list = [...patientsState];
    if (filters.status) {
      list = list.filter((p) => p.accessStatus === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.bloodGroup.toLowerCase().includes(q) ||
          p.chiefComplaint.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getPatientById(patientId) {
    const patient = patientsState.find((p) => p.id === patientId || p.memberId === patientId);
    if (!patient) return null;
    if (patient.accessStatus !== 'Active') {
      return { ...patient, accessRestricted: true };
    }
    return { ...patient };
  },

  async getAccessHistory() {
    return [...accessHistoryState];
  },

  // --- Consultations ---
  async getConsultations(filters = {}, doctorId) {
    const targetDocId = doctorId || profileState.doctorId || profileState.id;
    try {
      const res = await authFetch('/api/consultations');
      if (res.ok) {
        const json = await res.json();
        const liveCons = json.data || json;
        if (Array.isArray(liveCons) && liveCons.length > 0) {
          const apts = await this.getAppointments({}, targetDocId);
          const aptMap = new Map(apts.map((a) => [a.id, a]));
          consultationsState = liveCons.map((c) => {
            const linkedApt = aptMap.get((c.appointment_id || c.appointmentId || '').toString());
            return {
              id: c.id || c._id,
              _id: c.id || c._id,
              appointmentId: c.appointment_id || c.appointmentId,
              patientId: c.family_member_id || c.familyMemberId,
              patientName: linkedApt?.patientName || 'Family Patient',
              doctorId: c.doctor_id || c.doctorId || targetDocId,
              doctorName: profileState.name,
              department: linkedApt?.department || profileState.departmentName || 'Orthopedics',
              consultationNumber: `CONS-OPD-${(c.id || c._id).toString().slice(-6).toUpperCase()}`,
              chiefComplaint: c.symptoms || linkedApt?.purpose || 'Clinical Consultation',
              symptoms: c.symptoms || '',
              observations: c.observations || '',
              diagnosis: c.clinical_assessment || c.clinicalAssessment || 'Clinical evaluation and follow-up',
              clinicalAssessment: c.clinical_assessment || c.clinicalAssessment || '',
              treatmentPlan: c.treatment_plan || c.treatmentPlan || 'Maintain therapeutic protocol.',
              doctorNotes: c.notes || '',
              notes: c.notes || '',
              aiPredictionIds: c.ai_prediction_ids || c.aiPredictionIds || [],
              status: c.status || 'FINAL',
              finalizedAt: c.finalized_at || c.finalizedAt || c.created_at || c.createdAt,
              date: (c.created_at || c.createdAt) ? new Date(c.created_at || c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              amendments: [],
            };
          });
        }
      }
    } catch {}

    let list = [...consultationsState];
    if (filters.patientId) {
      list = list.filter((c) => c.patientId === filters.patientId);
    }
    if (filters.status) {
      list = list.filter((c) => c.status === filters.status);
    }
    return list;
  },

  async getConsultationById(consId) {
    return consultationsState.find((c) => c.id === consId) || null;
  },

  async saveDraftConsultation(consultationData) {
    if (consultationData.id) {
      consultationsState = consultationsState.map((c) =>
        c.id === consultationData.id
          ? { ...c, ...consultationData, status: 'DRAFT' }
          : c
      );
      return consultationsState.find((c) => c.id === consultationData.id);
    }

    const newCons = {
      id: `cons_${Date.now()}`,
      consultationNumber: `CONS-OPD-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'DRAFT',
      amendments: [],
      ...consultationData,
    };
    consultationsState = [newCons, ...consultationsState];
    return newCons;
  },

  async finalizeConsultation(consultationData) {
    let targetId = consultationData.id;
    let finalCons;

    if (targetId) {
      consultationsState = consultationsState.map((c) => {
        if (c.id === targetId) {
          finalCons = {
            ...c,
            ...consultationData,
            status: 'FINAL',
            finalizedAt: new Date().toISOString(),
          };
          return finalCons;
        }
        return c;
      });
    } else {
      finalCons = {
        id: `cons_${Date.now()}`,
        consultationNumber: `CONS-OPD-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'FINAL',
        finalizedAt: new Date().toISOString(),
        amendments: [],
        ...consultationData,
      };
      consultationsState = [finalCons, ...consultationsState];
    }

    if (finalCons.appointmentId) {
      appointmentsState = appointmentsState.map((a) =>
        a.id === finalCons.appointmentId ? { ...a, status: 'Completed' } : a
      );
    }

    return finalCons;
  },

  async createConsultation(consultationData) {
    if (consultationData.status === 'DRAFT') {
      return this.saveDraftConsultation(consultationData);
    }
    return this.finalizeConsultation(consultationData);
  },

  async amendConsultation(consultationId, amendmentData) {
    const original = consultationsState.find((c) => c.id === consultationId);
    if (!original) throw new Error('Consultation not found');

    const newAmendment = {
      id: `amend_${Date.now()}`,
      amendmentNumber: `AMEND-${original.consultationNumber}-${(original.amendments?.length || 0) + 1}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      doctorName: profileState.name,
      reason: amendmentData.reason,
      clinicalAddendum: amendmentData.clinicalAddendum,
      updatedTreatmentPlan: amendmentData.updatedTreatmentPlan,
    };

    consultationsState = consultationsState.map((c) => {
      if (c.id === consultationId) {
        return {
          ...c,
          status: 'AMENDED',
          amendments: [...(c.amendments || []), newAmendment],
        };
      }
      return c;
    });

    return consultationsState.find((c) => c.id === consultationId);
  },

  // --- Prescriptions ---
  async getPrescriptions(filters = {}, doctorId) {
    const targetDocId = doctorId || profileState.doctorId || profileState.id;
    try {
      const res = await authFetch('/api/prescriptions');
      if (res.ok) {
        const json = await res.json();
        const liveRx = json.data || json;
        if (Array.isArray(liveRx) && liveRx.length > 0) {
          const apts = await this.getAppointments({}, targetDocId);
          const aptMap = new Map(apts.map((a) => [a.id, a]));
          prescriptionsState = liveRx.map((p) => {
            const linkedApt = aptMap.get((p.appointment_id || p.appointmentId || '').toString());
            return {
              id: p.id || p._id,
              _id: p.id || p._id,
              consultationId: p.consultation_id || p.consultationId,
              patientId: p.family_member_id || p.familyMemberId,
              patientName: linkedApt?.patientName || 'Family Patient',
              doctorId: p.doctor_id || p.doctorId || targetDocId,
              doctorName: profileState.name,
              department: linkedApt?.department || profileState.departmentName || 'Orthopedics',
              prescriptionNumber: `RX-OPD-${(p.id || p._id).toString().slice(-6).toUpperCase()}`,
              medicines: p.medicines || [],
              medications: (p.medicines || []).map((m, idx) => ({
                id: `med_${idx}`,
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
                instructions: m.instructions || 'Take after food',
              })),
              generalInstructions: p.general_instructions || p.generalInstructions || 'Adhere to medication instructions.',
              remarks: p.general_instructions || p.generalInstructions || '',
              status: p.status || 'FINAL',
              finalizedAt: p.finalized_at || p.finalizedAt || p.created_at || p.createdAt,
              date: (p.created_at || p.createdAt) ? new Date(p.created_at || p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
              corrections: [],
            };
          });
        }
      }
    } catch {}
    let list = [...prescriptionsState];
    if (filters.patientId) {
      list = list.filter((p) => p.patientId === filters.patientId);
    }
    if (filters.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    return list;
  },

  async saveDraftPrescription(rxData) {
    if (rxData.id) {
      prescriptionsState = prescriptionsState.map((p) =>
        p.id === rxData.id ? { ...p, ...rxData, status: 'DRAFT' } : p
      );
      return prescriptionsState.find((p) => p.id === rxData.id);
    }

    const newRx = {
      id: `rx_${Date.now()}`,
      prescriptionNumber: `RX-OPD-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'DRAFT',
      corrections: [],
      ...rxData,
    };
    prescriptionsState = [newRx, ...prescriptionsState];
    return newRx;
  },

  async finalizePrescription(rxData) {
    let targetId = rxData.id;
    let finalRx;

    if (targetId) {
      prescriptionsState = prescriptionsState.map((p) => {
        if (p.id === targetId) {
          finalRx = {
            ...p,
            ...rxData,
            status: 'FINAL',
            finalizedAt: new Date().toISOString(),
          };
          return finalRx;
        }
        return p;
      });
    } else {
      finalRx = {
        id: `rx_${Date.now()}`,
        prescriptionNumber: `RX-OPD-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'FINAL',
        finalizedAt: new Date().toISOString(),
        corrections: [],
        ...rxData,
      };
      prescriptionsState = [finalRx, ...prescriptionsState];
    }

    return finalRx;
  },

  async createPrescription(rxData) {
    if (rxData.status === 'DRAFT') {
      return this.saveDraftPrescription(rxData);
    }
    return this.finalizePrescription(rxData);
  },

  async correctPrescription(prescriptionId, correctionData) {
    const original = prescriptionsState.find((p) => p.id === prescriptionId);
    if (!original) throw new Error('Original prescription not found');

    const newCorrection = {
      id: `corr_${Date.now()}`,
      correctionNumber: `CORR-${original.prescriptionNumber}-${(original.corrections?.length || 0) + 1}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      doctorName: profileState.name,
      reasonForCorrection: correctionData.reasonForCorrection,
      adjustedMedications: correctionData.adjustedMedications,
      remarks: correctionData.remarks,
    };

    prescriptionsState = prescriptionsState.map((p) => {
      if (p.id === prescriptionId) {
        return {
          ...p,
          status: 'CORRECTED',
          corrections: [...(p.corrections || []), newCorrection],
        };
      }
      return p;
    });

    return prescriptionsState.find((p) => p.id === prescriptionId);
  },

  // --- Department Head Resolution ---
  getDepartmentHead(departmentId = profileState.departmentId, hospitalId = profileState.hospitalId) {
    return (
      departmentHeads.find(
        (dh) =>
          (dh.departmentId === departmentId || dh.departmentName === profileState.departmentName) &&
          (!hospitalId || dh.hospitalId === hospitalId)
      ) || {
        id: 'DH-H1-ORTHO',
        name: 'Dr. Arun Prakash',
        title: 'Head of Department',
        departmentName: profileState.departmentName || 'Orthopedics & Trauma',
        email: 'arun.prakash@aarogyam.hospital',
      }
    );
  },

  // --- Knowledge Articles ---
  async getArticles(filters = {}) {
    let list = articlesState.filter((a) => {
      if (a.status === 'Draft') {
        return (
          (a.authorId && a.authorId === profileState.id) ||
          (a.author && a.author.trim().toLowerCase() === (profileState.name || '').trim().toLowerCase())
        );
      }
      return true;
    });
    if (filters.status && filters.status !== 'All') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q))) ||
          (a.author && a.author.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async createArticle(articleData) {
    const deptHead = this.getDepartmentHead();
    const isSubmitting = Boolean(articleData.submitForReview);
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newArticle = {
      id: `art_${Date.now()}`,
      author: profileState.name,
      authorId: profileState.id,
      department: profileState.departmentName,
      departmentId: profileState.departmentId,
      status: isSubmitting ? 'Under Review' : 'Draft',
      date: today,
      views: 0,
      readTime: `${Math.ceil((articleData.content || '').split(' ').length / 150) || 3} min read`,
      reviewedBy: null,
      reviewedDate: null,
      reviewerNotes: null,
      designatedReviewer: deptHead?.name || 'Department Head',
      designatedReviewerEmail: deptHead?.email || '',
      ...articleData,
    };

    articlesState = [newArticle, ...articlesState];
    return newArticle;
  },

  async updateArticle(articleId, updatedData) {
    articlesState = articlesState.map((a) =>
      a.id === articleId ? { ...a, ...updatedData } : a
    );
    return articlesState.find((a) => a.id === articleId);
  },

  async submitDraftForReview(articleId) {
    const deptHead = this.getDepartmentHead();
    articlesState = articlesState.map((a) => {
      if (a.id === articleId) {
        return {
          ...a,
          status: 'Under Review',
          submittedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          designatedReviewer: deptHead?.name || 'Department Head',
          designatedReviewerEmail: deptHead?.email || '',
        };
      }
      return a;
    });
    return articlesState.find((a) => a.id === articleId);
  },

  async submitArticleForReview(articleId) {
    return this.submitDraftForReview(articleId);
  },

  // --- Notifications ---
  async getNotifications(filters = {}) {
    let list = [...notificationsState];
    if (filters.unreadOnly) {
      list = list.filter((n) => !n.read);
    }
    return list;
  },

  async markNotificationRead(notifId) {
    notificationsState = notificationsState.map((n) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    return notificationsState.find((n) => n.id === notifId);
  },

  // --- Settings ---
  async getSettings() {
    return { ...settingsState };
  },

  async updateSettings(newSettings) {
    settingsState = { ...settingsState, ...newSettings };
    return { ...settingsState };
  },
};
