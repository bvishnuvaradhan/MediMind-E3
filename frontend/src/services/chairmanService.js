// MediMind Platform - Chairman Service Layer
// Clean service abstraction isolating data management from React components.
// Can be replaced with actual HTTP API endpoints in the future with zero component changes.

import {
  initialPlatformSummary,
  initialHospitals,
  initialHospitalRequests,
  initialHospitalAdmins,
  initialDepartments,
  initialDoctors,
  initialFamilyAccounts,
  initialAppointmentsLedger,
  initialAppointmentAnalytics,
  initialAiAnalytics,
  initialKnowledgeActivity,
  initialAuditLogs,
  initialPlatformSettings,
} from '../data/medimindData';

// In-memory mutable state to support live UI interactions
let platformSummary = { ...initialPlatformSummary };
let hospitals = [...initialHospitals];
let hospitalRequests = [...initialHospitalRequests];
let hospitalAdmins = [...initialHospitalAdmins];
let departments = [...initialDepartments];
let doctors = [...initialDoctors];
let familyAccounts = [...initialFamilyAccounts];
let appointmentsLedger = [...initialAppointmentsLedger];
let appointmentAnalytics = { ...initialAppointmentAnalytics };
let aiAnalytics = { ...initialAiAnalytics };
let knowledgeArticles = [...initialKnowledgeActivity];
let auditLogs = [...initialAuditLogs];
let platformSettings = { ...initialPlatformSettings };

export const chairmanService = {
  // Platform Summary
  getPlatformSummary: async () => {
    return {
      ...platformSummary,
      totalHospitals: hospitals.filter(h => h.status === 'Active').length,
      pendingHospitalRequests: hospitalRequests.filter(r => r.status === 'Pending').length,
      totalHospitalAdmins: hospitalAdmins.filter(a => a.status === 'Active').length,
      totalDoctors: doctors.length,
      totalFamilyAccounts: familyAccounts.length,
    };
  },

  // Hospitals
  getHospitals: async (statusFilter = 'All') => {
    if (statusFilter === 'All') return [...hospitals];
    return hospitals.filter(h => h.status.toLowerCase() === statusFilter.toLowerCase());
  },

  getHospitalById: async (id) => {
    return hospitals.find(h => h.id === id) || null;
  },

  createHospital: async (newHospitalData) => {
    const id = `HOSP-00${hospitals.length + 1}`;
    const hospital = {
      id,
      code: `MM-NET-0${hospitals.length + 1}`,
      status: 'Active',
      departmentsCount: newHospitalData.departments?.length || 3,
      doctorsCount: 0,
      appointmentsCount: 0,
      aiPredictionsCount: 0,
      familyAccountsServed: 0,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ...newHospitalData,
    };
    hospitals.unshift(hospital);
    
    // Log audit action
    auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      actor: 'Chairman (Dr. Suresh Menon)',
      role: 'CHAIRMAN',
      action: `Registered New Hospital: ${hospital.name}`,
      affectedEntity: `Hospital: ${hospital.id}`,
      service: 'hospital-service',
      status: 'Success',
      ip: '10.0.0.1',
    });

    return hospital;
  },

  // Hospital Onboarding Requests (Approve / Reject)
  getHospitalRequests: async (statusFilter = 'All') => {
    if (statusFilter === 'All') return [...hospitalRequests];
    return hospitalRequests.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
  },

  approveHospitalRequest: async (requestId) => {
    const reqIndex = hospitalRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const req = hospitalRequests[reqIndex];
    req.status = 'Approved';

    // Add to hospitals directory
    const newHospitalId = `HOSP-00${hospitals.length + 1}`;
    const newHospital = {
      id: newHospitalId,
      name: req.name,
      code: `MM-${req.city.slice(0, 3).toUpperCase()}-01`,
      type: req.type,
      city: req.city,
      state: req.state,
      address: req.address,
      status: 'Active',
      adminId: 'Unassigned',
      adminName: 'To Be Assigned',
      adminEmail: req.email,
      departmentsCount: req.requestedDepartments?.length || 2,
      doctorsCount: 0,
      appointmentsCount: 0,
      aiPredictionsCount: 0,
      familyAccountsServed: 0,
      bedCapacity: req.bedCapacity,
      accreditation: 'State Healthcare Board Certified',
      phone: req.phone,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      departments: req.requestedDepartments || ['General Medicine', 'Diabetology'],
    };
    hospitals.unshift(newHospital);

    // Audit log
    auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      actor: 'Chairman (Dr. Suresh Menon)',
      role: 'CHAIRMAN',
      action: `Approved Hospital Onboarding Request: ${req.name}`,
      affectedEntity: `${req.id} -> ${newHospital.id}`,
      service: 'hospital-service',
      status: 'Success',
      ip: '10.0.0.1',
    });

    return { request: req, hospital: newHospital };
  },

  rejectHospitalRequest: async (requestId, reason = 'Criteria not met') => {
    const reqIndex = hospitalRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) throw new Error('Request not found');

    const req = hospitalRequests[reqIndex];
    req.status = 'Rejected';
    req.rejectionReason = reason;

    auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      actor: 'Chairman (Dr. Suresh Menon)',
      role: 'CHAIRMAN',
      action: `Rejected Hospital Request: ${req.name}`,
      affectedEntity: req.id,
      service: 'hospital-service',
      status: 'Warning',
      ip: '10.0.0.1',
    });

    return req;
  },

  // Hospital Admins
  getHospitalAdmins: async () => {
    return [...hospitalAdmins];
  },

  createHospitalAdmin: async (adminData) => {
    const id = `ADM-00${hospitalAdmins.length + 1}`;
    const newAdmin = {
      id,
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone || '+91 98765 00000',
      hospitalId: adminData.hospitalId,
      hospitalName: adminData.hospitalName,
      status: 'Active',
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLogin: 'Never',
      role: 'HOSPITAL_ADMIN',
      departmentHeadsManaged: 0,
      doctorsManaged: 0,
    };
    hospitalAdmins.unshift(newAdmin);

    // Link to hospital if found
    const targetHosp = hospitals.find(h => h.id === adminData.hospitalId);
    if (targetHosp) {
      targetHosp.adminId = id;
      targetHosp.adminName = adminData.name;
      targetHosp.adminEmail = adminData.email;
    }

    auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      actor: 'Chairman (Dr. Suresh Menon)',
      role: 'CHAIRMAN',
      action: `Created Hospital Admin Account: ${adminData.name}`,
      affectedEntity: `${id} (${adminData.hospitalName})`,
      service: 'auth-service',
      status: 'Success',
      ip: '10.0.0.1',
    });

    return newAdmin;
  },

  toggleAdminStatus: async (adminId) => {
    const admin = hospitalAdmins.find(a => a.id === adminId);
    if (!admin) throw new Error('Admin not found');
    admin.status = admin.status === 'Active' ? 'Inactive' : 'Active';

    auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      actor: 'Chairman (Dr. Suresh Menon)',
      role: 'CHAIRMAN',
      action: `${admin.status === 'Active' ? 'Activated' : 'Deactivated'} Hospital Admin: ${admin.name}`,
      affectedEntity: admin.id,
      service: 'auth-service',
      status: 'Security',
      ip: '10.0.0.1',
    });

    return admin;
  },

  // Departments
  getDepartments: async (hospitalId = 'All') => {
    if (!hospitalId || hospitalId === 'All') return [...departments];
    return departments.filter(d => d.hospitalId === hospitalId || d.hospitalName === hospitalId);
  },

  getDepartmentsByHospitalId: async (hospitalId) => {
    if (!hospitalId || hospitalId === 'All') return [...departments];
    return departments.filter(d => d.hospitalId === hospitalId || d.hospitalName === hospitalId);
  },

  // Doctors (Administrative workforce overview, strictly NO patient records)
  getDoctors: async (search = '', departmentFilter = 'All', hospitalFilter = 'All') => {
    return doctors.filter(doc => {
      const matchSearch = search ? (
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
        doc.department.toLowerCase().includes(search.toLowerCase())
      ) : true;
      const matchDept = (!departmentFilter || departmentFilter === 'All') ? true : doc.department === departmentFilter;
      const matchHosp = (!hospitalFilter || hospitalFilter === 'All') ? true : (doc.hospitalId === hospitalFilter || doc.hospital === hospitalFilter);
      return matchSearch && matchDept && matchHosp;
    });
  },

  getDoctorsByDepartmentAndHospital: async (departmentName, hospitalId) => {
    return doctors.filter(doc => {
      const matchDept = !departmentName || departmentName === 'All' || doc.department.toLowerCase() === departmentName.toLowerCase();
      const matchHosp = !hospitalId || hospitalId === 'All' || doc.hospitalId === hospitalId || doc.hospital === hospitalId;
      return matchDept && matchHosp;
    });
  },

  // Family Accounts (Platform-level statistics & metadata, strictly NO patient medical records)
  getFamilyAccounts: async (search = '') => {
    if (!search) return [...familyAccounts];
    const s = search.toLowerCase();
    return familyAccounts.filter(f => 
      f.name.toLowerCase().includes(s) || 
      f.primaryContact.toLowerCase().includes(s) || 
      f.email.toLowerCase().includes(s) ||
      f.city.toLowerCase().includes(s)
    );
  },

  // Platform Aggregate Appointments Overview (Zero patient rows)
  getAppointmentAnalytics: async () => {
    return { ...appointmentAnalytics };
  },

  // Appointments (Operational ledger - backwards compatible helper)
  getAppointmentsLedger: async (filters = {}) => {
    let result = [...appointmentsLedger];
    if (filters.department && filters.department !== 'All') {
      result = result.filter(a => a.department === filters.department);
    }
    if (filters.status && filters.status !== 'All') {
      result = result.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(a => 
        a.doctor.toLowerCase().includes(s) || 
        a.id.toLowerCase().includes(s) ||
        a.type.toLowerCase().includes(s)
      );
    }
    return result;
  },

  // Clinical AI Analytics (Platform-wide aggregate metrics)
  getAiAnalytics: async () => {
    return { ...aiAnalytics };
  },

  // Platform Analytics & Comparisons
  getHospitalPerformance: async () => {
    return hospitals.map(h => ({
      id: h.id,
      name: h.name,
      city: h.city,
      doctorsCount: h.doctorsCount,
      departmentsCount: h.departmentsCount,
      appointmentsCount: h.appointmentsCount,
      aiPredictionsCount: h.aiPredictionsCount,
      patientSatisfaction: '98.4%',
      status: h.status,
      utilizationRate: '87%',
    }));
  },

  getDepartmentPerformance: async () => {
    return departments.map(d => ({
      id: d.id,
      name: d.name,
      head: d.headName,
      doctorsCount: d.doctorsCount,
      appointmentsCount: d.appointmentsCount,
      predictionsCount: d.predictionsCount,
      aiModel: d.linkedAi,
      efficiencyIndex: '94%',
    }));
  },

  // Knowledge Activity
  getKnowledgeArticles: async () => {
    return [...knowledgeArticles];
  },

  // Audit Logs
  getAuditLogs: async (filters = {}) => {
    let result = [...auditLogs];
    if (filters.service && filters.service !== 'All') {
      result = result.filter(log => log.service === filters.service);
    }
    if (filters.role && filters.role !== 'All') {
      result = result.filter(log => log.role === filters.role);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(log => 
        log.action.toLowerCase().includes(s) || 
        log.actor.toLowerCase().includes(s) ||
        log.affectedEntity.toLowerCase().includes(s)
      );
    }
    return result;
  },

  // Settings
  getSettings: async () => {
    return { ...platformSettings };
  },

  updateSettings: async (newSettings) => {
    platformSettings = {
      ...platformSettings,
      ...newSettings,
      security: { ...platformSettings.security, ...newSettings.security },
      policies: { ...platformSettings.policies, ...newSettings.policies },
      notifications: { ...platformSettings.notifications, ...newSettings.notifications },
    };

    auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      actor: 'Chairman (Dr. Suresh Menon)',
      role: 'CHAIRMAN',
      action: 'Updated Platform System Configuration & Policies',
      affectedEntity: 'Global Platform Settings',
      service: 'platform-service',
      status: 'Security',
      ip: '10.0.0.1',
    });

    return platformSettings;
  },
};
