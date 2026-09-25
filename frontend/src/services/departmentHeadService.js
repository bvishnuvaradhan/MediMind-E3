// MediMind Platform - Department Head Service Layer
// Service abstraction layer providing data access and mutations scoped to the Department Head workspace.
// Keeps data access separate from UI components for clean future backend integration.

import {
  initialDepartmentHeadProfile,
  initialDepartmentInfo,
  initialDepartmentDoctors,
  initialDepartmentAppointments,
  initialDepartmentSchedules,
  initialDepartmentAnalytics,
  initialDoctorPerformance,
  initialDepartmentArticles,
  initialDepartmentSettings,
} from '../data/departmentHeadMockData';

// In-memory working state
let profileState = { ...initialDepartmentHeadProfile };
let departmentInfoState = { ...initialDepartmentInfo };
let doctorsState = [...initialDepartmentDoctors];
let appointmentsState = [...initialDepartmentAppointments];
let schedulesState = [...initialDepartmentSchedules];
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
          d.room.toLowerCase().includes(q)
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
      maxCapacity: Number(doctorData.maxCapacity) || 25,
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
      d.id === doctorId ? { ...d, ...updatedData, maxCapacity: Number(updatedData.maxCapacity) || d.maxCapacity } : d
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
        const nextStatus = d.status === 'Active' ? 'On Leave' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    return doctorsState.find((d) => d.id === doctorId);
  },

  async updateDoctorCapacity(doctorId, newCapacity) {
    doctorsState = doctorsState.map((d) =>
      d.id === doctorId ? { ...d, maxCapacity: Math.max(5, Math.min(50, Number(newCapacity))) } : d
    );
    return doctorsState.find((d) => d.id === doctorId);
  },

  // --- Appointments ---
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
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.token.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q)
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

  // --- Schedules / Rosters ---
  async getSchedules(filters = {}) {
    let list = [...schedulesState];
    if (filters.day && filters.day !== 'All') {
      list = list.filter((s) => s.day === filters.day);
    }
    if (filters.doctorId && filters.doctorId !== 'All') {
      list = list.filter((s) => s.doctorId === filters.doctorId);
    }
    return list;
  },

  async updateScheduleStatus(scheduleId, status) {
    schedulesState = schedulesState.map((s) =>
      s.id === scheduleId ? { ...s, status } : s
    );
    return schedulesState.find((s) => s.id === scheduleId);
  },

  async createScheduleShift(shiftData) {
    const newShift = {
      id: `sch_${Date.now()}`,
      status: 'Active',
      ...shiftData,
    };
    schedulesState = [newShift, ...schedulesState];
    return newShift;
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
