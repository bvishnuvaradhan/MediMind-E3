const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const HOSPITAL_SERVICE_URL = process.env.HOSPITAL_SERVICE_URL || 'http://localhost:5003';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

export const internalServices = {
  /**
   * Provision a User authentication record via Auth Service internal endpoint
   */
  async createAuthUser({ email, password, role = 'DOCTOR', accountType = 'DOCTOR_ACCOUNT', referenceId }) {
    const url = `${AUTH_SERVICE_URL}/api/auth/internal/users`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-secret': INTERNAL_SECRET,
        },
        body: JSON.stringify({
          email,
          password,
          role,
          accountType,
          referenceId,
          status: 'ACTIVE',
        }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const err = new Error(data.message || 'Failed to create auth user');
        err.statusCode = response.status || 500;
        throw err;
      }

      return data.data;
    } catch (error) {
      if (error.statusCode) throw error;
      // In standalone unit test or if Auth Service is offline, wrap appropriately
      const err = new Error(`Auth Service communication failed: ${error.message}`);
      err.statusCode = 503;
      throw err;
    }
  },

  /**
   * Resolve Department Head hospital and department assignment via Hospital Service
   */
  async resolveDepartmentHead({ userId, headId, referenceId }) {
    const queryParam = userId ? `userId=${userId}` : (headId ? `headId=${headId}` : `referenceId=${referenceId}`);
    const url = `${HOSPITAL_SERVICE_URL}/api/department-heads?${queryParam}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': INTERNAL_SECRET,
          'x-user-id': 'internal_doctor_service',
          'x-user-role': 'CHAIRMAN',
        },
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return null;
      }

      const heads = data.data || [];
      if (heads.length > 0) {
        return heads[0];
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Verify whether a department belongs to the specified hospital via Hospital Service
   */
  async verifyDepartmentInHospital({ departmentId, hospitalId }) {
    const url = `${HOSPITAL_SERVICE_URL}/api/departments/${departmentId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': INTERNAL_SECRET,
          'x-user-id': 'internal_doctor_service',
          'x-user-role': 'CHAIRMAN',
        },
        signal: AbortSignal.timeout(5000),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        return false;
      }

      const dept = data.data;
      const deptHospitalId = dept.hospitalId || dept.hospital_id?._id || dept.hospital_id;
      return deptHospitalId && deptHospitalId.toString() === hospitalId.toString();
    } catch {
      // In isolated environments where Hospital Service is not running, return null to signify unverified
      return null;
    }
  },
};
