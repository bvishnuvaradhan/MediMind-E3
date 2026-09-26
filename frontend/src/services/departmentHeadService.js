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

  // --- Knowledge Articles ---
  async getArticles(filters = {}) {
    let list = [...articlesState];
    if (filters.category && filters.category !== 'All') {
      list = list.filter((a) => a.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return list;
  },

  async createArticle(articleData) {
    const newArticle = {
      id: `art_dept_${Date.now()}`,
      author: profileState.name,
      role: `Head of ${profileState.departmentName}`,
      publishedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Published',
      reads: 0,
      ...articleData,
    };
    articlesState = [newArticle, ...articlesState];
    return newArticle;
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
