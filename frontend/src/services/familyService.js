// MediMind Platform - Family Account Service Layer
// Abstracts patient & family health record management, appointments, consultations, and doctor access.
// Decoupled for future microservice & API integration.

import {
  initialFamilyMembers,
  initialRecords,
  initialPresentationData,
  initialBookedSlots,
  initialDoctorAccess,
} from '../data/medimindData.js';

let membersState = [...initialFamilyMembers];
let recordsState = [...initialRecords];
let presentationState = { ...initialPresentationData };
let bookedSlotsState = { ...initialBookedSlots };
let doctorAccessState = [...initialDoctorAccess];

export const familyService = {
  // --- Family Members ---
  async getMembers() {
    return [...membersState];
  },

  async getMemberByName(name) {
    return membersState.find((m) => m.name.toLowerCase() === name.toLowerCase()) || null;
  },

  async addMember(newMember) {
    const member = {
      ...newMember,
      records: 0,
      predictions: 0,
      appointments: 0,
      consultations: 0,
      prescriptions: 0,
    };
    membersState = [...membersState, member];
    return member;
  },

  async updateMember(name, updatedData) {
    membersState = membersState.map((m) =>
      m.name.toLowerCase() === name.toLowerCase() ? { ...m, ...updatedData } : m
    );
    return membersState.find((m) => m.name.toLowerCase() === name.toLowerCase()) || null;
  },

  // --- Records ---
  async getRecords(filters = {}) {
    let list = [...recordsState];
    if (filters.patient && filters.patient !== 'all') {
      list = list.filter((r) => r.patient.toLowerCase() === filters.patient.toLowerCase());
    }
    if (filters.category && filters.category !== 'all') {
      list = list.filter((r) => r.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.type.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.source.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async addRecord(record) {
    const newRecord = {
      ...record,
      date: record.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: record.status || 'Available',
    };
    recordsState = [newRecord, ...recordsState];

    // Increment member record count
    if (newRecord.patient) {
      membersState = membersState.map((m) =>
        m.name.toLowerCase() === newRecord.patient.toLowerCase()
          ? { ...m, records: (m.records || 0) + 1 }
          : m
      );
    }

    return newRecord;
  },

  // --- Presentation Data (Doctors, Appointments, Consultations, Prescriptions) ---
  async getPresentationData(category) {
    if (category) {
      return [...(presentationState[category] || [])];
    }
    return { ...presentationState };
  },

  // --- Doctor Access Sharing ---
  async getDoctorAccessList() {
    return [...doctorAccessState];
  },

  async getDoctorAccess() {
    return [...doctorAccessState];
  },

  async grantDoctorAccess(grant) {
    const newGrant = {
      ...grant,
      granted: grant.granted || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    doctorAccessState = [...doctorAccessState, newGrant];
    return newGrant;
  },

  async revokeDoctorAccess(member, doctor) {
    doctorAccessState = doctorAccessState.filter(
      (g) => !(g.member === member && g.doctor === doctor)
    );
    return true;
  },

  // --- Appointments & Booked Slots ---
  async getBookedSlots() {
    return { ...bookedSlotsState };
  },

  async bookSlot(doctor, date, slot) {
    const key = `${doctor}|${date}`;
    const current = bookedSlotsState[key] || [];
    bookedSlotsState = {
      ...bookedSlotsState,
      [key]: [...current, slot],
    };
    return true;
  },
};
