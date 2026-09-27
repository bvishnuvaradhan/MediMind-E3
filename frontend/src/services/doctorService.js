// MediMind Platform - Doctor Service Layer
// Abstracts clinical data access and mutations scoped to the Doctor role.
// Keeps UI decoupled for future backend API & WebSocket integration.

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
} from '../data/medimindData.js';

let profileState = { ...initialDoctorProfile };
let patientsState = [...initialAuthorizedPatients];
let accessHistoryState = [...initialAccessHistory];
let appointmentsState = [...initialDoctorAppointments];
let consultationsState = [...initialConsultations];
let prescriptionsState = [...initialPrescriptions];
let articlesState = [...initialDoctorArticles];
let notificationsState = [...initialDoctorNotifications];
let settingsState = { ...initialDoctorSettings };

export const doctorService = {
  // --- Profile & Availability ---
  async getProfile() {
    return { ...profileState };
  },

  async updateProfile(updatedData) {
    profileState = {
      ...profileState,
      ...updatedData,
      // Organizational boundaries remain protected
      hospitalId: profileState.hospitalId,
      hospitalName: profileState.hospitalName,
      departmentId: profileState.departmentId,
      departmentName: profileState.departmentName,
    };
    return { ...profileState };
  },

  async updateAvailability(schedule, slotDuration, bufferMinutes) {
    profileState = {
      ...profileState,
      availabilitySchedule: schedule || profileState.availabilitySchedule,
      slotDurationMinutes: slotDuration || profileState.slotDurationMinutes,
      bufferMinutes: bufferMinutes || profileState.bufferMinutes || 3,
    };
    return { ...profileState };
  },

  // --- Authorized Patients ---
  async getAuthorizedPatients(filters = {}) {
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
    const patient = patientsState.find((p) => p.id === patientId);
    if (!patient) return null;
    // Verify access status
    if (patient.accessStatus !== 'Active') {
      return { ...patient, accessRestricted: true };
    }
    return { ...patient };
  },

  async getAccessHistory() {
    return [...accessHistoryState];
  },

  // --- Appointments ---
  async getAppointments(filters = {}) {
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
          a.purpose.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async updateAppointmentStatus(appointmentId, status) {
    appointmentsState = appointmentsState.map((a) =>
      a.id === appointmentId ? { ...a, status } : a
    );
    return appointmentsState.find((a) => a.id === appointmentId);
  },

  // --- Consultations ---
  async getConsultations(filters = {}) {
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
      consultationNumber: `CONS-ORTHO-2026-${Math.floor(100 + Math.random() * 900)}`,
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
        consultationNumber: `CONS-ORTHO-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'FINAL',
        finalizedAt: new Date().toISOString(),
        amendments: [],
        ...consultationData,
      };
      consultationsState = [finalCons, ...consultationsState];
    }

    // Update appointment status if linked
    if (finalCons.appointmentId) {
      appointmentsState = appointmentsState.map((a) =>
        a.id === finalCons.appointmentId ? { ...a, status: 'Completed' } : a
      );
    }

    return finalCons;
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
  async getPrescriptions(filters = {}) {
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
      prescriptionNumber: `RX-ORTHO-2026-${Math.floor(100 + Math.random() * 900)}`,
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
        prescriptionNumber: `RX-ORTHO-2026-${Math.floor(100 + Math.random() * 900)}`,
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
        name: 'Dr. Priya Sharma',
        title: 'Head of Orthopedics & Musculoskeletal Sciences',
        departmentName: profileState.departmentName || 'Orthopedics',
        email: 'priya.sharma@medimindhospital.com',
      }
    );
  },

  // --- Knowledge Articles ---
  async getArticles(filters = {}) {
    let list = [...articlesState];
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

    const newArt = {
      id: `art_doc_${Date.now()}`,
      author: profileState.name,
      authorId: profileState.id || 'doc_001',
      authorRole: profileState.title || 'Senior Consultant Orthopedic Surgeon',
      department: profileState.departmentName || 'Orthopedics',
      departmentId: profileState.departmentId || 'DEP-H1-ORTHO',
      hospital: profileState.hospitalName || 'MediMind Central Hospital',
      hospitalId: profileState.hospitalId || 'HOSP-001',
      views: 0,
      citations: 0,
      status: isSubmitting ? 'Under Review' : 'Draft',
      createdDate: today,
      submittedDate: isSubmitting ? today : null,
      reviewerId: deptHead.id,
      reviewerName: deptHead.name,
      reviewerRole: deptHead.title,
      tags: Array.isArray(articleData.tags) ? articleData.tags : (articleData.tags ? articleData.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      ...articleData,
    };
    articlesState = [newArt, ...articlesState];
    return newArt;
  },

  async updateArticle(articleId, updatedData) {
    const deptHead = this.getDepartmentHead();
    const isSubmitting = Boolean(updatedData.submitForReview);
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let updatedArt = null;

    articlesState = articlesState.map((a) => {
      if (a.id === articleId) {
        const nextStatus = isSubmitting ? 'Under Review' : (updatedData.status || a.status || 'Draft');
        updatedArt = {
          ...a,
          ...updatedData,
          status: nextStatus,
          submittedDate: isSubmitting ? today : a.submittedDate,
          reviewerId: deptHead.id,
          reviewerName: deptHead.name,
          reviewerRole: deptHead.title,
          reviewerFeedback: isSubmitting ? null : a.reviewerFeedback,
          tags: Array.isArray(updatedData.tags)
            ? updatedData.tags
            : (updatedData.tags ? updatedData.tags.split(',').map(t => t.trim()).filter(Boolean) : (a.tags || [])),
        };
        return updatedArt;
      }
      return a;
    });
    return updatedArt || articlesState.find((a) => a.id === articleId);
  },

  async submitDraftForReview(articleId) {
    const deptHead = this.getDepartmentHead();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    articlesState = articlesState.map((a) =>
      a.id === articleId
        ? {
            ...a,
            status: 'Under Review',
            submittedDate: today,
            reviewerId: deptHead.id,
            reviewerName: deptHead.name,
            reviewerRole: deptHead.title,
            reviewerFeedback: null,
          }
        : a
    );
    return articlesState.find((a) => a.id === articleId);
  },

  // --- Notifications ---
  async getNotifications() {
    return [...notificationsState];
  },

  async markNotificationRead(id) {
    notificationsState = notificationsState.map((n) =>
      n.id === id ? { ...n, unread: false } : n
    );
    return [...notificationsState];
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
