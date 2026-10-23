// MediMind Platform - Hospital Admin Service
// Service abstraction layer providing live data access and mutations for Hospital Admin operations.
// Integrates with backend microservices via API Gateway with intelligent in-memory caching and graceful fallbacks.

import {
  initialHospitalProfile,
  initialHospitalDepartments,
  initialDepartmentHeads,
  initialHospitalDoctors,
  initialAppointments,
  initialHospitalAnalytics,
  initialReports,
  initialKnowledgeActivity,
  initialAuditLogs,
  initialHospitalSettings,
} from '../data/medimindData.js';
import { appointmentService } from './appointmentService.js';

// In-memory state for runtime mutations and offline fallbacks
let hospitalProfileState = { ...initialHospitalProfile };
let departmentsState = [...initialHospitalDepartments];
let departmentHeadsState = [...initialDepartmentHeads];
let doctorsState = [...initialHospitalDoctors];
let appointmentsState = [...initialAppointments];
let analyticsState = { ...initialHospitalAnalytics };
let reportsState = [...initialReports];
let knowledgeState = Array.isArray(initialKnowledgeActivity) ? [...initialKnowledgeActivity] : (initialKnowledgeActivity?.recentArticles ? [...initialKnowledgeActivity.recentArticles] : []);
let auditLogsState = [...initialAuditLogs];
let settingsState = { ...initialHospitalSettings };

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('medimind_jwt_token');
    if (!token) {
      try {
        const session = JSON.parse(localStorage.getItem('medimind_auth_session') || '{}');
        token = session?.token;
        if (token) {
          localStorage.setItem('medimind_jwt_token', token);
        }
      } catch {}
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const hospitalAdminService = {
  // --- Hospital Profile ---
  async getHospitalProfile(hospitalId) {
    try {
      const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
      const url = targetId && targetId !== 'HOSP-001' ? `/api/hospitals/${targetId}` : '/api/hospitals';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const hosp = json.data ? (Array.isArray(json.data) ? json.data[0] : json.data) : null;
        if (hosp) {
          const totalBeds = Number(hosp.totalBeds || hosp.total_beds) || hospitalProfileState.totalBeds || 250;
          const occupiedBeds = Number(hosp.occupiedBeds || hosp.occupied_beds) || hospitalProfileState.occupiedBeds || 210;
          const occupancyRate = `${Math.round((occupiedBeds / totalBeds) * 100)}%`;

          hospitalProfileState = {
            ...hospitalProfileState,
            id: hosp._id || hosp.id,
            _id: hosp._id || hosp.id,
            name: hosp.name || hospitalProfileState.name,
            code: hosp.code || hosp.id || hospitalProfileState.code,
            location: hosp.location || hosp.city || hospitalProfileState.location,
            address: hosp.address || `${hosp.city || ''}, ${hosp.state || ''}`.trim() || hospitalProfileState.address,
            phone: hosp.phone || hosp.contact_phone || hospitalProfileState.phone,
            email: hosp.adminEmail || hosp.email || hospitalProfileState.email,
            adminEmail: hosp.adminEmail || hosp.email || hospitalProfileState.adminEmail,
            status: hosp.status || 'Active',
            totalBeds,
            occupiedBeds,
            occupancyRate,
          };
          return { ...hospitalProfileState };
        }
      }
    } catch {
      // safe fallback
    }
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

    try {
      const hospId = hospitalProfileState._id || hospitalProfileState.id;
      if (hospId && hospId.length === 24) {
        await fetch(`/api/hospitals/${hospId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });
      }
    } catch {
      // persist in memory
    }

    this.logAuditEvent(
      'Updated Hospital General Information & Facility Parameters',
      'Hospital Administration'
    );
    return { ...hospitalProfileState };
  },

  // --- Departments ---
  async getDepartments(hospitalId) {
    try {
      const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
      const res = await fetch('/api/departments', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          let list = json.data;
          if (targetId) {
            const filtered = list.filter(
              (d) => (d.hospital_id && d.hospital_id.toString() === targetId.toString()) ||
                     (d.hospitalId && d.hospitalId.toString() === targetId.toString())
            );
            if (filtered.length > 0) list = filtered;
          }

          departmentsState = list.map((d) => ({
            id: d._id || d.id,
            _id: d._id || d.id,
            code: d.code || (d.name || '').slice(0, 4).toUpperCase(),
            name: d.name,
            specialization: d.specialization || d.name,
            hospitalId: d.hospital_id || d.hospitalId || targetId,
            hospitalName: d.hospitalName || hospitalProfileState.name,
            headName: d.head_name || d.headName || d.fullName || 'Assigned Head',
            headId: d.head_id || d.headId,
            headEmail: d.head_email || d.headEmail,
            doctorsCount: d.doctorsCount || d.doctors_count || 3,
            activeAppointments: d.activeAppointments || 12,
            completedConsultations: d.completedConsultations || 45,
            aiPredictionsCount: d.aiPredictionsCount || 42,
            wardCapacity: Number(d.ward_capacity || d.wardCapacity) || 40,
            bedOccupancy: d.bedOccupancy || '75%',
            status: d.status === 'INACTIVE' ? 'Inactive' : 'Active',
          }));
          return [...departmentsState];
        }
      }
    } catch {
      // safe fallback
    }
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

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: departmentData.name,
          code: newDept.code,
          specialization: newDept.specialization,
          hospital_id: departmentData.hospitalId || hospitalProfileState._id || hospitalProfileState.id,
          ward_capacity: wardCap,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          newDept.id = json.data._id || json.data.id || newDept.id;
          newDept._id = newDept.id;
        }
      }
    } catch {
      // memory persist
    }

    departmentsState = [newDept, ...departmentsState];
    this.logAuditEvent(
      `Created New Hospital Department: ${newDept.name} (${newDept.code})`,
      newDept.name
    );
    return newDept;
  },

  async updateDepartment(deptId, updatedData) {
    departmentsState = departmentsState.map(d => {
      if (d.id === deptId || d._id === deptId) {
        const wardCap = updatedData.wardCapacity !== undefined ? Number(updatedData.wardCapacity) : d.wardCapacity;
        return {
          ...d,
          ...updatedData,
          wardCapacity: wardCap,
        };
      }
      return d;
    });

    try {
      if (deptId && deptId.length === 24) {
        await fetch(`/api/departments/${deptId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });
      }
    } catch {
      // memory persist
    }

    const updated = departmentsState.find(d => d.id === deptId || d._id === deptId);
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
      if (d.id === deptId || d._id === deptId) {
        const nextStatus = d.status === 'Active' ? 'Inactive' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    const updated = departmentsState.find(d => d.id === deptId || d._id === deptId);
    if (updated) {
      this.logAuditEvent(
        `Toggled Department Status to ${updated.status}: ${updated.name}`,
        updated.name
      );
    }
    return updated;
  },

  async getDepartmentById(deptId) {
    return departmentsState.find(d => d.id === deptId || d._id === deptId) || null;
  },

  // --- Department Heads ---
  async getDepartmentHeads(hospitalId) {
    try {
      const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
      const res = await fetch('/api/department-heads', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          let list = json.data;
          if (targetId) {
            const filtered = list.filter(
              (h) => (h.hospital_id && h.hospital_id.toString() === targetId.toString()) ||
                     (h.hospitalId && h.hospitalId.toString() === targetId.toString())
            );
            if (filtered.length > 0) list = filtered;
          }

          const tones = ['coral', 'sapphire', 'emerald', 'amber', 'purple'];
          departmentHeadsState = list.map((h, idx) => {
            const displayName = h.fullName || h.full_name || h.name || 'Department Head';
            const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            return {
              id: h._id || h.id || h.headId,
              headId: h.headId || h._id || h.id,
              name: displayName,
              fullName: displayName,
              email: h.email || '',
              phone: h.phone || h.mobile || '+91 98490 11000',
              departmentId: h.department_id || h.departmentId,
              departmentName: h.departmentName || h.department || 'Specialty Dept',
              department: h.departmentName || h.department || 'Specialty Dept',
              hospitalId: h.hospital_id || h.hospitalId || targetId,
              hospitalName: h.hospitalName || hospitalProfileState.name,
              specialization: h.specialization || 'Clinical Specialist',
              status: h.status === 'INACTIVE' ? 'Inactive' : 'Active',
              avatarInitials: initials,
              avatarTone: tones[idx % tones.length],
              assignedDate: h.createdAt ? new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Sep 2026',
              doctorsUnderSupervision: 4,
              activePatients: 24,
              publishedArticles: 2,
            };
          });
          return [...departmentHeadsState];
        }
      }
    } catch {
      // safe fallback
    }
    return [...departmentHeadsState];
  },

  async getDepartmentHeadById(headId) {
    return departmentHeadsState.find(h => h.id === headId || h.headId === headId) || null;
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

    try {
      await fetch('/api/department-heads', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fullName: headData.name,
          email: headData.email,
          phone: headData.phone,
          department_id: headData.departmentId,
          hospital_id: headData.hospitalId || hospitalProfileState._id || hospitalProfileState.id,
          specialization: headData.specialization,
        }),
      });
    } catch {
      // memory persist
    }

    departmentHeadsState = [newHead, ...departmentHeadsState];
    if (headData.departmentId) {
      departmentsState = departmentsState.map(d =>
        d.id === headData.departmentId
          ? { ...d, headName: newHead.name, headId: newHead.id, headEmail: newHead.email }
          : d
      );
    }

    this.logAuditEvent(
      `Created & Assigned Department Head Account: ${newHead.name} (${newHead.department || headData.departmentId})`,
      newHead.department || 'Hospital Administration'
    );

    return newHead;
  },

  async updateDepartmentHead(headId, updatedData) {
    departmentHeadsState = departmentHeadsState.map(h =>
      h.id === headId || h.headId === headId ? { ...h, ...updatedData } : h
    );
    const updated = departmentHeadsState.find(h => h.id === headId || h.headId === headId);
    if (updated) {
      this.logAuditEvent(
        `Updated Department Head Profile: ${updated.name}`,
        updated.department || 'Hospital Administration'
      );
    }
    return updated;
  },

  async toggleDepartmentHeadStatus(headId) {
    departmentHeadsState = departmentHeadsState.map(h => {
      if (h.id === headId || h.headId === headId) {
        const nextStatus = h.status === 'Active' ? 'Suspended' : 'Active';
        return { ...h, status: nextStatus };
      }
      return h;
    });
    const updated = departmentHeadsState.find(h => h.id === headId || h.headId === headId);
    if (updated) {
      this.logAuditEvent(
        `Changed Department Head Account Status to ${updated.status}: ${updated.name}`,
        updated.department || 'Hospital Administration'
      );
    }
    return updated;
  },

  // --- Doctors ---
  async getDoctors(filters = {}, hospitalId) {
    try {
      const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
      const res = await fetch('/api/doctors', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          let list = json.data;
          if (targetId) {
            const filtered = list.filter(
              (d) => (d.hospital_id && d.hospital_id.toString() === targetId.toString()) ||
                     (d.hospitalId && d.hospitalId.toString() === targetId.toString())
            );
            if (filtered.length > 0) list = filtered;
          }

          const tones = ['coral', 'sapphire', 'emerald', 'amber', 'purple'];
          doctorsState = list.map((d, idx) => {
            const displayName = d.fullName || d.full_name || d.name || 'Dr. Attending Physician';
            const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            return {
              id: d._id || d.id || d.doctorId,
              doctorId: d.doctorId || d._id || d.id,
              name: displayName,
              fullName: displayName,
              email: d.email || '',
              phone: d.mobile || d.phone || '+91 98490 11100',
              specialization: d.specialization || 'Consultant',
              department: d.departmentName || d.department || 'Clinical Department',
              departmentName: d.departmentName || d.department || 'Clinical Department',
              departmentId: d.department_id || d.departmentId,
              hospitalId: d.hospital_id || d.hospitalId || targetId,
              hospitalName: d.hospitalName || hospitalProfileState.name,
              status: d.status === 'INACTIVE' ? 'Inactive' : 'Active',
              rating: d.rating || 4.8,
              workload: d.experienceYears || 10,
              room: d.room || 'OPD Room 204',
              avatarInitials: initials,
              avatarTone: tones[idx % tones.length],
              consultationFee: d.consultationFee || 800,
            };
          });
        }
      }
    } catch {
      // safe fallback
    }

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
          (d.department && d.department.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getDoctorById(doctorId) {
    return doctorsState.find(d => d.id === doctorId || d.doctorId === doctorId) || null;
  },

  async toggleDoctorStatus(doctorId) {
    doctorsState = doctorsState.map(d => {
      if (d.id === doctorId || d.doctorId === doctorId) {
        const nextStatus = d.status === 'Active' ? 'Suspended' : 'Active';
        return { ...d, status: nextStatus };
      }
      return d;
    });
    const updated = doctorsState.find(d => d.id === doctorId || d.doctorId === doctorId);
    if (updated) {
      this.logAuditEvent(
        `Administrative Action: Toggled Doctor Account Status to ${updated.status} for ${updated.name}`,
        updated.department || 'Hospital Administration'
      );
    }
    return updated;
  },

  // --- Staff Management ---
  async getStaffList(filters = {}, hospitalId) {
    const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
    const [heads, docs] = await Promise.all([
      this.getDepartmentHeads(targetId),
      this.getDoctors({}, targetId),
    ]);

    const formattedHeads = heads.map(h => ({
      ...h,
      roleType: 'Department Head',
      staffRole: 'DEPARTMENT_HEAD',
      workload: h.activePatients,
    }));
    const formattedDocs = docs.map(d => ({
      ...d,
      roleType: 'Staff Doctor',
      staffRole: 'DOCTOR',
    }));

    let allStaff = [...formattedHeads, ...formattedDocs];
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
          (s.department && s.department.toLowerCase().includes(q)) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return allStaff;
  },

  // --- Appointments ---
  async getAppointments(hospitalId, filters = {}) {
    const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
    try {
      const live = await appointmentService.getAppointments({ hospitalId: targetId });
      if (Array.isArray(live) && live.length > 0) {
        const mapped = live.map((a) => {
          const rawDate = a.appointment_date ? new Date(a.appointment_date) : null;
          return {
            id: a._id || a.id,
            _id: a._id || a.id,
            token: a.token || `OPD-${(a._id || a.id).toString().slice(-4).toUpperCase()}`,
            patientRef: a.patientName || `Patient (${(a.family_member_id || a.familyMemberId || '').slice(-4)})`,
            patientName: a.patientName || `Patient (${(a.family_member_id || a.familyMemberId || '').slice(-4)})`,
            doctorId: a.doctor_id || a.doctorId,
            doctorName: a.doctorName || 'Attending Physician',
            departmentId: a.department_id || a.departmentId,
            departmentName: a.departmentName || 'Specialty OPD',
            department: a.departmentName || 'Specialty OPD',
            hospitalId: a.hospital_id || a.hospitalId || targetId,
            hospitalName: a.hospitalName || hospitalProfileState.name,
            date: rawDate ? rawDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
            time: a.start_time ? `${a.start_time}${a.end_time ? ` - ${a.end_time}` : ''}` : '10:00 AM',
            status: a.status === 'CANCELLED' ? 'Cancelled' : a.status === 'COMPLETED' ? 'Completed' : 'Confirmed',
            type: a.appointment_type === 'WALK_IN' ? 'Walk-in' : (a.reason || 'General Outpatient'),
            cancellationReason: a.cancellation_reason,
          };
        });
        appointmentsState = mapped;
      }
    } catch {
      // safe fallback
    }

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
  async getHospitalAnalytics(hospitalId) {
    const targetId = hospitalId || hospitalProfileState._id || hospitalProfileState.id;
    try {
      const [statsRes, aiRes] = await Promise.all([
        fetch(`/api/appointments/stats?hospitalId=${targetId}`, { headers: getAuthHeaders() }),
        fetch('/api/ai/analytics', { headers: getAuthHeaders() }),
      ]);

      const statsJson = statsRes.ok ? await statsRes.json() : null;
      const aiJson = aiRes.ok ? await aiRes.json() : null;

      if (statsJson?.success && statsJson.data) {
        const stats = statsJson.data;
        const aiData = aiJson?.data || {};

        const totalConsultations = stats.total || 0;
        const completedConsultations = stats.completed || 0;
        const totalPreds = (stats.byHospitalPreds && stats.byHospitalPreds[targetId]) || aiData.totalInferences || 0;

        // Map department traffic
        const deptTraffic = [];
        if (stats.byDepartment) {
          const depts = departmentsState;
          Object.entries(stats.byDepartment).forEach(([dId, count]) => {
            const foundDept = depts.find(d => d.id === dId || d._id === dId);
            deptTraffic.push({
              department: foundDept?.name || 'Specialty Dept',
              count,
            });
          });
        }

        analyticsState = {
          totalOPDConsultations: totalConsultations,
          completedConsultations,
          bedOccupancyPercentage: 84,
          aiAssistedAccuracy: '98.2%',
          averageConsultationDuration: '18 mins',
          kpis: {
            totalOPDConsultations: totalConsultations,
            completedConsultations,
            bedOccupancyPercentage: 84,
            aiAssistedAccuracy: '98.2%',
            activeDoctorsCount: doctorsState.length || 24,
            departmentCount: departmentsState.length || 3,
          },
          aiAggregateMetrics: {
            totalScans: totalPreds,
            totalInferences: totalPreds,
            diagnosticAssistanceRate: '98.5%',
            accuracy: '98.2%',
            averageConfidence: aiData.averageConfidence || '63.6%',
          },
          monthlyDepartmentTraffic: deptTraffic.length > 0 ? deptTraffic : analyticsState.monthlyDepartmentTraffic,
          monthlyTrends: stats.monthlyTrends || [],
        };
        return { ...analyticsState };
      }
    } catch {
      // safe fallback
    }
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
      generatedBy: hospitalProfileState.name || 'Hospital Administration',
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
    try {
      const res = await fetch('/api/knowledge', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          knowledgeState = json.data;
        }
      }
    } catch {
      // safe fallback
    }

    const raw = Array.isArray(knowledgeState) ? knowledgeState : (knowledgeState.recentArticles || []);
    const currentHospitalId = hospitalProfileState?.id || hospitalProfileState?._id || 'HOSP-001';
    const currentHospitalName = hospitalProfileState?.name || 'Aarogyam Multispeciality Hospital';

    const hospitalArticles = raw.filter(a => {
      const isHospitalMatch = (a.hospitalId === currentHospitalId) || (a.hospital === currentHospitalName) || (!a.hospitalId && !a.hospital);
      const isNotDraft = a.status !== 'Draft';
      return isHospitalMatch && isNotDraft;
    });

    const published = hospitalArticles.filter(a => a.status === 'Published');
    const underReview = hospitalArticles.filter(a => a.status === 'Under Review' || a.status === 'Changes Requested');

    return {
      stats: {
        totalArticles: hospitalArticles.length,
        totalPublished: published.length,
        publishedThisMonth: published.filter(a => (a.date || a.publishedDate || a.createdAt || '').includes('2026')).length,
        peerReviewsPending: underReview.length,
        clinicalGuidelinesActive: hospitalArticles.filter(a => (a.category || '').toLowerCase().includes('clinical') || (a.tags || []).some(t => t.toLowerCase().includes('protocol') || t.toLowerCase().includes('guideline'))).length,
        orthopedicsPublished: published.filter(a => (a.department || '').includes('Ortho')).length,
        diabetologyPublished: published.filter(a => (a.department || '').includes('Diab')).length,
        cardiologyPublished: published.filter(a => (a.department || '').includes('Cardio')).length,
        generalMedicinePublished: published.filter(a => (a.department || '').includes('General')).length,
      },
      recentArticles: [...hospitalArticles],
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
      actor: hospitalProfileState.name || 'Hospital Administration',
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
