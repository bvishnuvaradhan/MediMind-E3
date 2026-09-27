// MediMind Platform - Department Head Service Layer
// Service abstraction layer providing data access and mutations scoped to the Department Head workspace.
// Keeps data access separate from UI components for clean future backend integration.

import {
  initialDepartmentHeadProfile,
  initialDepartmentInfo,
  initialDepartmentDoctors,
  initialDepartmentAppointments,
  initialDepartmentAnalytics,
  initialDoctorPerformance,
  initialDepartmentArticles,
  initialDepartmentSettings,
  knowledgeArticles,
} from '../data/medimindData.js';

// In-memory working state
let profileState = { ...initialDepartmentHeadProfile };
let departmentInfoState = { ...initialDepartmentInfo };
let doctorsState = [...initialDepartmentDoctors];
let appointmentsState = [...initialDepartmentAppointments];
let analyticsState = { ...initialDepartmentAnalytics };
let performanceState = [...initialDoctorPerformance];
let articlesState = [...initialDepartmentArticles];
let settingsState = { ...initialDepartmentSettings };

export const departmentHeadService = {
  // --- Profile & Department Info ---
  async getProfile() {
    return { ...profileState };
  },

  async updateProfile(updatedData) {
    profileState = {
      ...profileState,
      ...updatedData,
      departmentId: profileState.departmentId,
      departmentName: profileState.departmentName,
      hospitalId: profileState.hospitalId,
      hospitalName: profileState.hospitalName,
    };
    return { ...profileState };
  },

  async getDepartmentInfo() {
    return { ...departmentInfoState };
  },

  async updateDepartmentInfo(updatedData) {
    departmentInfoState = { ...departmentInfoState, ...updatedData };
    return { ...departmentInfoState };
  },

  // --- Doctors Management ---
  async getDoctors(filters = {}) {
    let list = [...doctorsState];
    if (filters.status && filters.status !== 'All') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (d.room && d.room.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getDoctorById(doctorId) {
    return doctorsState.find((d) => d.id === doctorId) || null;
  },

  async createDoctor(doctorData) {
    const initials = (doctorData.name || 'DR')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');

    const newDoc = {
      id: `doc_${Date.now()}`,
      department: profileState.departmentName,
      departmentId: profileState.departmentId,
      status: 'Active',
      avatarInitials: initials,
      avatarTone: 'coral',
      workload: 0,
      rating: 5.0,
      consultationsCompleted: 0,
      todayAppointments: 0,
      room: doctorData.room || 'OPD Room 210',
      ...doctorData,
    };

    doctorsState = [newDoc, ...doctorsState];

    // Update department doctor count
    departmentInfoState = {
      ...departmentInfoState,
      totalDoctors: doctorsState.length,
    };

    return newDoc;
  },

  async updateDoctor(doctorId, updatedData) {
    doctorsState = doctorsState.map((d) =>
      d.id === doctorId ? { ...d, ...updatedData } : d
    );
    return doctorsState.find((d) => d.id === doctorId);
  },

  async updateDoctorStatus(doctorId, newStatus) {
    doctorsState = doctorsState.map((d) =>
      d.id === doctorId ? { ...d, status: newStatus } : d
    );
    return doctorsState.find((d) => d.id === doctorId);
  },

  async toggleDoctorStatus(doctorId) {
    doctorsState = doctorsState.map((d) => {
      if (d.id === doctorId) {
        const nextStatus = d.status === 'Active' ? 'Inactive' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    return doctorsState.find((d) => d.id === doctorId);
  },

  // --- Appointments (View-Only) ---
  async getAppointments(filters = {}) {
    let list = [...appointmentsState];
    if (filters.status && filters.status !== 'All') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.doctorId && filters.doctorId !== 'All') {
      list = list.filter((a) => a.doctorId === filters.doctorId);
    }
    if (filters.date) {
      list = list.filter((a) => a.date === filters.date);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.patientName || a.patientRef || '').toLowerCase().includes(q) ||
          (a.doctorName || '').toLowerCase().includes(q) ||
          (a.token || a.id || '').toLowerCase().includes(q) ||
          (a.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  },

  // --- Analytics ---
  async getAnalytics() {
    return { ...analyticsState };
  },

  async getAiAnalytics() {
    return { ...analyticsState.aiAggregate };
  },

  // --- Doctor Performance ---
  async getDoctorPerformance() {
    return [...performanceState];
  },

  // --- Knowledge Articles & Reviewer ---
  async getArticles(filters = {}) {
    if (Array.isArray(knowledgeArticles)) {
      const existingIds = new Set(articlesState.map((a) => a.id));
      const deptFromMaster = knowledgeArticles.filter(
        (a) => a.departmentId === profileState.departmentId || a.department === profileState.departmentName
      );
      for (const art of deptFromMaster) {
        if (!existingIds.has(art.id)) {
          articlesState.unshift(art);
          existingIds.add(art.id);
        }
      }
    }

    let list = articlesState.filter((a) => {
      // Drafts are strictly private to their author
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
    if (filters.category && filters.category !== 'All') {
      list = list.filter((a) => a.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          (a.author && a.author.toLowerCase().includes(q)) ||
          (a.category && a.category.toLowerCase().includes(q)) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return list;
  },

  async createArticle(articleData) {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isPublished = articleData.status === 'Published';
    const newArticle = {
      id: `art_dept_${Date.now()}`,
      author: profileState.name,
      authorId: profileState.id || 'DH-H1-ORTHO',
      authorRole: profileState.title || profileState.role || 'Department Head',
      department: profileState.departmentName || 'Orthopedics',
      departmentId: profileState.departmentId || 'DEP-H1-ORTHO',
      hospital: profileState.hospitalName || 'MediMind Central Hospital',
      hospitalId: profileState.hospitalId || 'HOSP-001',
      date: today,
      createdDate: today,
      publishedDate: isPublished ? today : null,
      reviewedDate: isPublished ? today : null,
      reviewerId: isPublished ? (profileState.id || 'DH-H1-ORTHO') : null,
      reviewerName: isPublished ? (profileState.name || 'Dr. Priya Sharma') : null,
      reviewerRole: isPublished ? (profileState.title || profileState.role || 'Head of Orthopedics & Musculoskeletal Sciences') : null,
      status: articleData.status || 'Published',
      views: 0,
      citations: 0,
      ...articleData,
    };
    articlesState = [newArticle, ...articlesState];
    if (Array.isArray(knowledgeArticles) && !knowledgeArticles.some((a) => a.id === newArticle.id)) {
      knowledgeArticles.unshift(newArticle);
    }
    return newArticle;
  },

  async reviewArticle(articleId, { decision, feedback = '' }) {
    if (Array.isArray(knowledgeArticles) && !articlesState.some((a) => a.id === articleId)) {
      const fromMaster = knowledgeArticles.find((a) => a.id === articleId);
      if (fromMaster) {
        articlesState.unshift({ ...fromMaster });
      }
    }

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let updatedArt = null;
    articlesState = articlesState.map((art) => {
      if (art.id === articleId) {
        if (decision === 'Approve' || decision === 'Published') {
          updatedArt = {
            ...art,
            status: 'Published',
            publishedDate: today,
            reviewedDate: today,
            reviewerId: profileState.id || 'DH-H1-ORTHO',
            reviewerName: profileState.name || 'Dr. Priya Sharma',
            reviewerRole: profileState.title || profileState.role || 'Head of Orthopedics & Musculoskeletal Sciences',
          };
          return updatedArt;
        } else if (decision === 'Changes Requested') {
          updatedArt = {
            ...art,
            status: 'Changes Requested',
            reviewedDate: today,
            reviewerFeedback: feedback || 'Please update the clinical citations and revise protocol steps before resubmission.',
            reviewerId: profileState.id || 'DH-H1-ORTHO',
            reviewerName: profileState.name || 'Dr. Priya Sharma',
            reviewerRole: profileState.title || profileState.role || 'Head of Orthopedics & Musculoskeletal Sciences',
          };
          return updatedArt;
        }
      }
      return art;
    });

    if (Array.isArray(knowledgeArticles) && updatedArt) {
      const idx = knowledgeArticles.findIndex((a) => a.id === articleId);
      if (idx !== -1) {
        knowledgeArticles[idx] = { ...knowledgeArticles[idx], ...updatedArt };
      }
    }

    return updatedArt || articlesState.find((a) => a.id === articleId);
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
