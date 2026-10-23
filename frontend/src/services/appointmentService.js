// MediMind Platform - Frontend Appointment Service Client
// Integrates with backend appointment-service via API Gateway (/api/appointments)

function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('medimind_jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const appointmentService = {
  /**
   * Fetch appointments with role-scoped query
   */
  async getAppointments(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const url = `/api/appointments${query.toString() ? `?${query.toString()}` : ''}`;
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return data.success ? (Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.items) ? data.data.items : [])) : [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch appointments with pagination metadata
   */
  async getAppointmentsPaginated(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const url = `/api/appointments${query.toString() ? `?${query.toString()}` : ''}`;
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      }
      const data = await res.json();
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          return { items: data.data, total: data.data.length, page: 1, limit: data.data.length, totalPages: 1 };
        }
        return data.data;
      }
      return { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    } catch {
      return { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }
  },

  /**
   * Book a new appointment or rebook an alternative
   */
  async bookAppointment(payload) {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Failed to book appointment (${res.status})`);
      err.statusCode = res.status;
      err.data = data;
      throw err;
    }
    return data.data;
  },

  /**
   * Cancel an appointment (with required or optional reason)
   */
  async cancelAppointment(appointmentId, reason = '') {
    const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Failed to cancel appointment (${res.status})`);
      err.statusCode = res.status;
      throw err;
    }
    return data.data;
  },

  /**
   * Discover available alternative doctors and slots after cancellation
   */
  async getAlternatives(appointmentId) {
    const url = appointmentId
      ? `/api/appointments/${appointmentId}/alternatives`
      : '/api/appointments/alternatives';

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch alternative appointments');
    }
    return data.data;
  },

  /**
   * Fetch in-app notifications
   */
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/api/appointments/notifications${query ? `?${query}` : ''}`;

    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return data.success ? (Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.items) ? data.data.items : [])) : [];
    } catch {
      return [];
    }
  },

  /**
   * Mark a notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const res = await fetch(`/api/appointments/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },
};
