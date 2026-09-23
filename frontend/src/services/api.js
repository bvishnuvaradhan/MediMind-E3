const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "medimind_auth_token";
const USER_KEY = "medimind_auth_user";

export const tokenStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch {
      // Ignore localStorage write failures
    }
  },
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  },
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch {
      // Ignore
    }
  },
  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
  },
  clearSession: () => {
    tokenStorage.removeToken();
    tokenStorage.removeUser();
  },
};

export const authApi = {
  async register({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role: "FAMILY",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Registration failed with status ${res.status}`);
    }
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Login failed with status ${res.status}`);
    }
    return data;
  },

  async getMe(token = tokenStorage.getToken()) {
    if (!token) {
      throw new Error("No authentication token available");
    }

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Session verification failed with status ${res.status}`);
    }
    return data;
  },
};
