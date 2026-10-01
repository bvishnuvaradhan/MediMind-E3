const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5004';
const HOSPITAL_SERVICE_URL = process.env.HOSPITAL_SERVICE_URL || 'http://localhost:5003';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

export const internalServices = {
  /**
   * Fetch doctor details from Doctor Service
   */
  async getDoctor(doctorId) {
    const url = `${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': INTERNAL_SECRET,
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
    const url = `${HOSPITAL_SERVICE_URL}/api/departments/${departmentId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': INTERNAL_SECRET,
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
    const url = `${HOSPITAL_SERVICE_URL}/api/hospitals/${hospitalId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': INTERNAL_SECRET,
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
