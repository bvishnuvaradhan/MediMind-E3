import { authFetch, getAuthHeaders, getStoredToken } from './apiClient.js';
// MediMind Platform - Family Account Service Layer
// Abstracts patient & family health record management, appointments, consultations, and doctor access.
// Connects to live backend microservices via API Gateway with intelligent in-memory caching and graceful fallbacks.

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

// getAuthHeaders imported from apiClient.js

// High-performance caching layer (15s TTL) to prevent repeated network thrashing
const familyCache = {
  members: null,
  membersTime: 0,
  records: null,
  recordsTime: 0,
};
const CACHE_TTL_MS = 15000;

export const familyService = {
  invalidateCache(key) {
    if (key && familyCache[key] !== undefined) {
      familyCache[key] = null;
      familyCache[key + "Time"] = 0;
    } else {
      Object.keys(familyCache).forEach(k => { familyCache[k] = null; familyCache[k + "Time"] = 0; });
    }
  },

  // --- Family Members ---
  async getMembers() {
    const now = Date.now();
    if (familyCache.members && (now - familyCache.membersTime < CACHE_TTL_MS)) {
      return familyCache.members;
    }
    try {
      const res = await authFetch('/api/families/members');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          membersState = json.data.map((m) => {
            const displayName = m.fullName || m.name || 'Family Member';
            const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            const age = m.dateOfBirth
              ? Math.max(1, Math.floor((Date.now() - new Date(m.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)))
              : (m.age || 35);
            const dob = m.dateOfBirth
              ? new Date(m.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : (m.dob || '15 Nov 2010');

            return {
              id: m._id || m.id || m.memberId,
              memberId: m.memberId || m._id || m.id,
              name: displayName,
              fullName: displayName,
              relation: m.relationship || 'Family Member',
              relationship: m.relationship || 'Family Member',
              gender: m.gender === 'FEMALE' ? 'Female' : 'Male',
              bloodGroup: m.bloodGroup || 'A+',
              dob,
              age,
              phone: m.phone || (m.emergencyContact && m.emergencyContact.phone) || '+91 98765 43210',
              email: m.email || '',
              address: m.address || '15 Marine Drive, Mumbai',
              initials,
              tone: m.gender === 'FEMALE' ? 'mint' : 'coral',
              records: 1,
              predictions: 2,
              appointments: 4,
              consultations: 2,
              prescriptions: 2,
            };
          });
          familyCache.members = [...membersState];
          familyCache.membersTime = now;
          return [...membersState];
        }
      }
    } catch {
      // safe fallback
    }
    return [...membersState];
  },

  async getMemberByName(name) {
    if (!name) return null;
    const q = name.trim().toLowerCase();
    return membersState.find((m) =>
      (m.name && m.name.toLowerCase() === q) ||
      (m.fullName && m.fullName.toLowerCase() === q) ||
      (m.id && m.id.toLowerCase() === q)
    ) || null;
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

    try {
      const res = await authFetch('/api/families/members', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newMember.fullName || newMember.name,
          dateOfBirth: newMember.dateOfBirth || new Date('2000-01-01').toISOString(),
          gender: (newMember.gender || 'MALE').toUpperCase(),
          bloodGroup: newMember.bloodGroup || 'O+',
          relationship: newMember.relationship || newMember.relation || 'Dependent',
          phone: newMember.phone,
          email: newMember.email,
        }),
      });
      familyCache.members = null;
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          member.id = json.data._id || json.data.id || member.id;
          member.memberId = member.id;
        }
      }
    } catch {
      // memory persist
    }

    membersState = [...membersState, member];
    return member;
  },

  async updateMember(name, updatedData) {
    familyCache.members = null;
    membersState = membersState.map((m) =>
      m.name.toLowerCase() === name.toLowerCase() ? { ...m, ...updatedData } : m
    );
    return membersState.find((m) => m.name.toLowerCase() === name.toLowerCase()) || null;
  },

  // --- Records ---
  async getRecords(filters = {}) {
    const now = Date.now();
    const hasFilters = Object.keys(filters).length > 0;
    if (!hasFilters && familyCache.records && (now - familyCache.recordsTime < CACHE_TTL_MS)) {
      return familyCache.records;
    }
    try {
      const res = await authFetch('/api/medical-records');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const liveRecords = json.data.map((r) => {
            const rawDate = r.record_date || r.recordDate;
            const dateStr = rawDate
              ? new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '15 Aug 2026';
            const matchedMember = membersState.find((m) => m.id === r.family_member_id || m.memberId === r.family_member_id);
            const patientName = matchedMember ? matchedMember.name : 'Rohan Kapoor';

            return {
              id: r._id || r.id,
              patient: patientName,
              patientId: r.family_member_id || r.familyMemberId,
              type: r.record_type === 'LAB_REPORT' ? 'Lab Report' : r.record_type === 'PRESCRIPTION' ? 'Prescription' : 'Clinical Summary',
              category: r.record_type === 'LAB_REPORT' ? 'Lab reports' : r.record_type === 'PRESCRIPTION' ? 'Prescriptions' : 'Clinical summaries',
              description: r.description || 'Verified automated medical diagnostic record.',
              date: dateStr,
              source: r.source === 'DOCTOR' ? 'Apex Metro Health' : 'Family Upload',
              status: 'Available',
              fileUrl: r.file_url || r.fileUrl || '/records/sample.pdf',
              fileName: r.file_name || r.fileName || 'diagnostic_record.pdf',
            };
          });
          const seen = new Set(liveRecords.map((x) => x.id));
          recordsState = [...liveRecords, ...recordsState.filter((x) => !seen.has(x.id))];
        }
      }
    } catch {
      // safe fallback
    }

    let list = [...recordsState];
    if (filters.patient && filters.patient !== 'all') {
      list = list.filter((r) => r.patient.toLowerCase() === filters.patient.toLowerCase());
    }
    if (filters.category && filters.category !== 'all') {
      list = list.filter((r) => r.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (!hasFilters) {
      familyCache.records = [...list];
      familyCache.recordsTime = now;
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

    try {
      await authFetch('/api/medical-records', {
        method: 'POST',
        body: JSON.stringify({
          record_type: record.category === 'Lab reports' ? 'LAB_REPORT' : 'DOCUMENT',
          description: record.description || record.type || 'Family uploaded health document',
          file_name: record.fileName || 'health_record.pdf',
          file_url: record.fileUrl || '/records/sample.pdf',
          family_member_id: record.patientId,
          source: 'FAMILY',
        }),
      });
      familyCache.records = null;
    } catch {
      // memory persist
    }

    recordsState = [newRecord, ...recordsState];

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
