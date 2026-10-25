import { authFetch, getAuthHeaders, getStoredToken } from './apiClient.js';
// MediMind Platform - Frontend Appointment Service Client
// Integrates with backend appointment-service via API Gateway (/api/appointments)
// Enforces centralized authFetch and high-performance in-memory TTL caching (15s).

const appointmentsCache = new Map();
const CACHE_TTL_MS = 15000;

function getCacheKey(prefix, params = {}) {
  const sorted = Object.entries(params)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${JSON.stringify(sorted)}`;
}

export const appointmentService = {
  /**
   * Explicitly invalidate the in-memory appointments cache
   */
  invalidateCache() {
    appointmentsCache.clear();
  },

  /**
   * Fetch appointments with role-scoped query (with 15s cache)
   */
  async getAppointments(params = {}) {
    const cacheKey = getCacheKey('list', params);
    const cached = appointmentsCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const url = `/api/appointments${query.toString() ? `?${query.toString()}` : ''}`;
    try {
      const res = await authFetch(url);
      if (!res.ok) {
        return cached ? cached.data : [];
      }
      const data = await res.json();
      const result = data.success ? (Array.isArray(data.data) ? data.data : (Array.isArray(data.data?.items) ? data.data.items : [])) : [];
      appointmentsCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch {
      return cached ? cached.data : [];
    }
  },

  /**
   * Fetch appointments with pagination metadata (with 15s cache)
   */
  async getAppointmentsPaginated(params = {}) {
    const cacheKey = getCacheKey('paginated', params);
    const cached = appointmentsCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const url = `/api/appointments${query.toString() ? `?${query.toString()}` : ''}`;
    try {
      const res = await authFetch(url);
      if (!res.ok) {
        return cached ? cached.data : { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      }
      const data = await res.json();
      let result = { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          result = { items: data.data, total: data.data.length, page: 1, limit: data.data.length, totalPages: 1 };
        } else {
          result = data.data;
        }
      }
      appointmentsCache.set(cacheKey, { data: result, timestamp: now });
      return result;
    } catch {
      return cached ? cached.data : { items: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }
  },

  /**
   * Book a new appointment or rebook an alternative
   */
  async bookAppointment(payload) {
    const res = await authFetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Failed to book appointment (${res.status})`);
      err.statusCode = res.status;
      err.data = data;
      throw err;
    }
    // Invalidate cached appointment views upon new booking
    appointmentsCache.clear();
    return data.data;
  },

  /**
   * Cancel an appointment (with required or optional reason)
   */
  async cancelAppointment(appointmentId, reason = '') {
    const res = await authFetch(`/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Failed to cancel appointment (${res.status})`);
      err.statusCode = res.status;
      throw err;
    }
    // Invalidate cached appointment views upon cancellation
    appointmentsCache.clear();
    return data.data;
  },

  /**
   * Discover available alternative doctors and slots after cancellation
   */
  async getAlternatives(appointmentId) {
    const url = appointmentId
      ? `/api/appointments/${appointmentId}/alternatives`
      : '/api/appointments/alternatives';

    const res = await authFetch(url);

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
      const res = await authFetch(url);
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
      const res = await authFetch(`/api/appointments/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },
};
