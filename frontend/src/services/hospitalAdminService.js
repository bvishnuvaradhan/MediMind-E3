// MediMind Platform - Hospital Admin Service
// Service abstraction layer providing data access and mutations for Hospital Admin operations.
// Centralizes all CRUD simulations, state modifications, and audit logging.

import {
  initialHospitalProfile,
  initialDepartments,
  initialDepartmentHeads,
  initialDoctors,
  initialAppointments,
  initialHospitalAnalytics,
  initialReports,
  initialKnowledgeActivity,
  initialAuditLogs,
  initialHospitalSettings,
} from '../data/hospitalAdminMockData';

// In-memory state for prototype lifecycle
let hospitalProfileState = { ...initialHospitalProfile };
let departmentsState = [...initialDepartments];
let departmentHeadsState = [...initialDepartmentHeads];
let doctorsState = [...initialDoctors];
let appointmentsState = [...initialAppointments];
let analyticsState = { ...initialHospitalAnalytics };
let reportsState = [...initialReports];
let knowledgeState = { ...initialKnowledgeActivity };
let auditLogsState = [...initialAuditLogs];
let settingsState = { ...initialHospitalSettings };

export const hospitalAdminService = {
  // --- Hospital Profile ---
  async getHospitalProfile() {
    return { ...hospitalProfileState };
  },

  async updateHospitalProfile(updatedData) {
    const totalBeds = Number(updatedData.totalBeds) || hospitalProfileState.totalBeds || 250;
    const occupiedBeds = Number(updatedData.occupiedBeds) || hospitalProfileState.occupiedBeds || 210;
    const occupancyRate = `${Math.round((occupiedBeds / totalBeds) * 100)}%`;

    hospitalProfileState = {
      ...hospitalProfileState,
      ...updatedData,
      totalBeds,
      occupiedBeds,
      occupancyRate,
    };
    this.logAuditEvent(
      'Updated Hospital General Information & Facility Parameters',
      'Hospital Administration'
    );
    return { ...hospitalProfileState };
  },

  // --- Departments ---
  async getDepartments() {
    return [...departmentsState];
  },

  async createDepartment(departmentData) {
    const wardCap = Number(departmentData.wardCapacity) || 40;
    const newDept = {
      id: `dept_${Date.now()}`,
      code: (departmentData.code || departmentData.name.slice(0, 4)).toUpperCase(),
      doctorsCount: 0,
      activeAppointments: 0,
      completedConsultations: 0,
      aiPredictionsCount: 0,
      status: 'Active',
      bedOccupancy: '0%',
      specialization: departmentData.specialization || departmentData.name,
      ...departmentData,
      wardCapacity: wardCap,
    };
    departmentsState = [newDept, ...departmentsState];
    this.logAuditEvent(
      `Created New Hospital Department: ${newDept.name} (${newDept.code})`,
      newDept.name
    );
    return newDept;
  },

  async updateDepartment(deptId, updatedData) {
    departmentsState = departmentsState.map(d => {
      if (d.id === deptId) {
        const wardCap = updatedData.wardCapacity !== undefined ? Number(updatedData.wardCapacity) : d.wardCapacity;
        return {
          ...d,
          ...updatedData,
          wardCapacity: wardCap,
        };
      }
      return d;
    });
    const updated = departmentsState.find(d => d.id === deptId);
    if (updated) {
      this.logAuditEvent(
        `Updated Department Configuration: ${updated.name}`,
        updated.name
      );
    }
    return updated;
  },

  async toggleDepartmentStatus(deptId) {
    departmentsState = departmentsState.map(d => {
      if (d.id === deptId) {
        const nextStatus = d.status === 'Active' ? 'Inactive' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    const updated = departmentsState.find(d => d.id === deptId);
    if (updated) {
      this.logAuditEvent(
        `Toggled Department Status to ${updated.status}: ${updated.name}`,
        updated.name
      );
    }
    return updated;
  },

  async getDepartmentById(deptId) {
    return departmentsState.find(d => d.id === deptId) || null;
  },

  // --- Department Heads ---
  async getDepartmentHeads() {
    return [...departmentHeadsState];
  },

  async getDepartmentHeadById(headId) {
    return departmentHeadsState.find(h => h.id === headId) || null;
  },

  async createDepartmentHead(headData) {
    const tones = ['coral', 'mint', 'lilac'];
    const initials = (headData.name || 'DH')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');

    const newHead = {
      id: `dh_${Date.now()}`,
      status: 'Active',
      avatarInitials: initials,
      avatarTone: tones[departmentHeadsState.length % tones.length],
      assignedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      doctorsUnderSupervision: 3,
      activePatients: 0,
      publishedArticles: 0,
      ...headData,
    };

    departmentHeadsState = [newHead, ...departmentHeadsState];

    // Update corresponding department head assignment
    if (headData.departmentId) {
      departmentsState = departmentsState.map(d =>
        d.id === headData.departmentId
          ? { ...d, headName: newHead.name, headId: newHead.id, headEmail: newHead.email }
          : d
      );
    }

    this.logAuditEvent(
      `Created & Assigned Department Head Account: ${newHead.name} (${newHead.department})`,
      newHead.department
    );

    return newHead;
  },

  async updateDepartmentHead(headId, updatedData) {
    departmentHeadsState = departmentHeadsState.map(h =>
      h.id === headId ? { ...h, ...updatedData } : h
    );
    const updated = departmentHeadsState.find(h => h.id === headId);
    if (updated) {
      this.logAuditEvent(
        `Updated Department Head Profile: ${updated.name}`,
        updated.department
      );
    }
    return updated;
  },

  async toggleDepartmentHeadStatus(headId) {
    departmentHeadsState = departmentHeadsState.map(h => {
      if (h.id === headId) {
        const nextStatus = h.status === 'Active' ? 'Suspended' : 'Active';
        return { ...h, status: nextStatus };
      }
      return h;
    });
    const updated = departmentHeadsState.find(h => h.id === headId);
    if (updated) {
      this.logAuditEvent(
        `Changed Department Head Account Status to ${updated.status}: ${updated.name}`,
        updated.department
      );
    }
    return updated;
  },

  // --- Doctors ---
  async getDoctors(filters = {}) {
    let list = [...doctorsState];
    if (filters.departmentId) {
      list = list.filter(d => d.departmentId === filters.departmentId);
    }
    if (filters.status) {
      list = list.filter(d => d.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getDoctorById(doctorId) {
    return doctorsState.find(d => d.id === doctorId) || null;
  },

  async toggleDoctorStatus(doctorId) {
    doctorsState = doctorsState.map(d => {
      if (d.id === doctorId) {
        const nextStatus = d.status === 'Active' ? 'Suspended' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    const updated = doctorsState.find(d => d.id === doctorId);
    if (updated) {
      this.logAuditEvent(
        `Administrative Action: Toggled Doctor Account Status to ${updated.status} for ${updated.name}`,
        updated.department
      );
    }
    return updated;
  },

  // --- Staff Management ---
  async getStaffList(filters = {}) {
    const heads = departmentHeadsState.map(h => ({
      ...h,
      roleType: 'Department Head',
      staffRole: 'DEPARTMENT_HEAD',
      workload: h.activePatients,
    }));
    const docs = doctorsState.map(d => ({
      ...d,
      roleType: 'Staff Doctor',
      staffRole: 'DOCTOR',
    }));

    let allStaff = [...heads, ...docs];

    if (filters.departmentId) {
      allStaff = allStaff.filter(s => s.departmentId === filters.departmentId);
    }
    if (filters.roleType) {
      allStaff = allStaff.filter(s => s.roleType === filters.roleType);
    }
    if (filters.status) {
      allStaff = allStaff.filter(s => s.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      allStaff = allStaff.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return allStaff;
  },

  // --- Appointments ---
  async getAppointments(filters = {}) {
    let list = [...appointmentsState];
    if (filters.departmentId) {
      list = list.filter(a => a.departmentId === filters.departmentId);
    }
    if (filters.status) {
      list = list.filter(a => a.status === filters.status);
    }
    if (filters.date) {
      list = list.filter(a => a.date === filters.date);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        a =>
          a.doctorName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.patientRef.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q)
      );
    }
    return list;
  },

  // --- Analytics ---
  async getHospitalAnalytics() {
    return { ...analyticsState };
  },

  // --- Reports ---
  async getReports() {
    return [...reportsState];
  },

  async generateReport(reportConfig) {
    const newReport = {
      id: `rep_${Date.now()}`,
      title: reportConfig.title || 'Custom Hospital Operational Summary Report',
      category: reportConfig.category || 'General Administration',
      period: reportConfig.period || 'Current Cycle (Real-Time)',
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      generatedBy: 'Dr. Rajesh Sharma (Hospital Admin)',
      format: reportConfig.format || 'PDF / CSV',
      summary: reportConfig.summary || 'Real-time aggregated operational metrics and performance data compiled successfully.',
    };
    reportsState = [newReport, ...reportsState];
    this.logAuditEvent(
      `Generated Formal Report: ${newReport.title} (${newReport.category})`,
      'Hospital Administration'
    );
    return newReport;
  },

  // --- Knowledge Activity ---
  async getKnowledgeActivity() {
    return {
      stats: { ...knowledgeState.stats },
      recentArticles: [...knowledgeState.recentArticles],
    };
  },

  // --- Audit Logs ---
  async getAuditLogs(filters = {}) {
    let list = [...auditLogsState];
    if (filters.department) {
      list = list.filter(l => l.department === filters.department);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        l =>
          l.action.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.department.toLowerCase().includes(q)
      );
    }
    return list;
  },

  logAuditEvent(action, department = 'Hospital Administration') {
    const newLog = {
      id: `log_hosp_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Dr. Rajesh Sharma (Hospital Admin)',
      action,
      department,
      ipAddress: '10.0.4.12',
      status: 'Success',
    };
    auditLogsState = [newLog, ...auditLogsState];
    return newLog;
  },

  // --- Settings ---
  async getHospitalSettings() {
    return { ...settingsState };
  },

  async updateHospitalSettings(newSettings) {
    settingsState = { ...settingsState, ...newSettings };
    this.logAuditEvent(
      'Updated Hospital Administrative Configuration & Preferences',
      'Hospital Administration'
    );
    return { ...settingsState };
  },
};
