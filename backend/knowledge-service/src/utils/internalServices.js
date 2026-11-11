import { getInternalServiceSecret, resolveServiceUrl } from '../config/runtimeConfig.js';

const getDoctorServiceUrl = () => resolveServiceUrl('DOCTOR_SERVICE_URL', 'doctor', 5004);
const getHospitalServiceUrl = () => resolveServiceUrl('HOSPITAL_SERVICE_URL', 'hospital', 5003);

export const internalServices = {
  /**
   * Fetch doctor details from Doctor Service
   */
  async getDoctor(doctorId) {
    const url = `${getDoctorServiceUrl()}/api/doctors/${doctorId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': getInternalServiceSecret(),
          'x-user-id': 'internal_knowledge_service',
          'x-user-role': 'CHAIRMAN',
        },
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        return null;
      }
      return data.data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch department details from Hospital Service
   */
  async getDepartment(departmentId) {
    const url = `${getHospitalServiceUrl()}/api/departments/${departmentId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': getInternalServiceSecret(),
          'x-user-id': 'internal_knowledge_service',
          'x-user-role': 'CHAIRMAN',
        },
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        return null;
      }
      return data.data;
    } catch {
      return null;
    }
  },

  /**
   * Fetch hospital details from Hospital Service
   */
  async getHospital(hospitalId) {
    const url = `${getHospitalServiceUrl()}/api/hospitals/${hospitalId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': getInternalServiceSecret(),
          'x-user-id': 'internal_knowledge_service',
          'x-user-role': 'CHAIRMAN',
        },
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        return null;
      }
      return data.data;
    } catch {
      return null;
    }
  },
};
