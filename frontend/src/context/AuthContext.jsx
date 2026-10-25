// MediMind Platform - Authentication Context
// Manages authentication state, user identity, and strict role isolation.
// Roles supported: FAMILY, CHAIRMAN, HOSPITAL_ADMIN, DEPARTMENT_HEAD, DOCTOR.

import { useState, useEffect } from 'react';
import { AuthContext } from './authContextCore';
import { chairmen, hospitalAdmins, departmentHeads, doctors, hospitals, families } from '../data/medimindData';
import {
  TOKEN_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  isTokenExpired,
  getStoredToken,
  handleUnauthorized,
} from '../services/apiClient';

const STORAGE_KEY = SESSION_STORAGE_KEY;

function resolveUserProfile(role, email, apiUser = {}) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (role === 'CHAIRMAN') {
    const matched = chairmen.find((c) => c.email.toLowerCase() === cleanEmail) ||
      (cleanEmail.includes('menon') ? chairmen[1] : chairmen[0]);
    return {
      id: apiUser.userId || matched.userId || matched.id,
      userId: apiUser.userId || matched.userId || matched.id,
      name: apiUser.name || matched.name,
      email: cleanEmail || matched.email,
      role: 'CHAIRMAN',
      title: matched.title || 'Chairman & Platform Owner',
      avatarInitials: matched.avatarInitials,
      avatarTone: matched.avatarTone || 'indigo',
      scope: matched.scope || 'Global Platform Owner',
      referenceId: apiUser.referenceId || matched.id,
      accountType: apiUser.accountType || 'CHAIRMAN_ACCOUNT',
    };
  }

  if (role === 'HOSPITAL_ADMIN') {
    const matched = hospitalAdmins.find((ha) => ha.email.toLowerCase() === cleanEmail || (apiUser.hospitalId && ha.hospitalId === apiUser.hospitalId)) ||
      (cleanEmail.includes('apexmetro') ? hospitalAdmins[1] : cleanEmail.includes('stjude') ? hospitalAdmins[2] : hospitalAdmins[0]);
    const hosp = hospitals.find((h) => h.id === (apiUser.hospitalId || matched.hospitalId) || h.adminEmail?.toLowerCase() === cleanEmail) || hospitals[0];
    return {
      id: apiUser.userId || matched.id,
      userId: apiUser.userId || matched.id,
      name: matched.name,
      email: cleanEmail || matched.email,
      role: 'HOSPITAL_ADMIN',
      title: `${hosp.name} Administrator`,
      hospitalId: apiUser.hospitalId || matched.hospitalId || hosp.id,
      hospitalName: hosp.name,
      avatarInitials: matched.avatarInitials,
      avatarTone: matched.avatarTone || 'blue',
      referenceId: apiUser.referenceId || matched.id,
      accountType: apiUser.accountType || 'HOSPITAL_ADMIN_ACCOUNT',
    };
  }

  if (role === 'DEPARTMENT_HEAD') {
    const matched = departmentHeads.find((dh) => dh.email.toLowerCase() === cleanEmail || (apiUser.departmentId && dh.departmentId === apiUser.departmentId)) ||
      departmentHeads[0];
    const hosp = hospitals.find((h) => h.id === (apiUser.hospitalId || matched.hospitalId)) || hospitals[0];
    return {
      id: apiUser.userId || matched.id,
      userId: apiUser.userId || matched.id,
      name: matched.name,
      email: cleanEmail || matched.email,
      role: 'DEPARTMENT_HEAD',
      title: `Head of ${matched.departmentName}`,
      departmentId: apiUser.departmentId || matched.departmentId,
      departmentName: matched.departmentName,
      hospitalId: apiUser.hospitalId || matched.hospitalId || hosp.id,
      hospitalName: hosp.name,
      avatarInitials: matched.avatarInitials,
      avatarTone: matched.avatarTone || 'emerald',
      referenceId: apiUser.referenceId || matched.id,
      accountType: apiUser.accountType || 'DEPARTMENT_HEAD_ACCOUNT',
    };
  }

  if (role === 'DOCTOR') {
    const matched = doctors.find((d) => d.email.toLowerCase() === cleanEmail || (apiUser.doctorId && d.id === apiUser.doctorId)) ||
      doctors[0];
    const hosp = hospitals.find((h) => h.id === (apiUser.hospitalId || matched.hospitalId)) || hospitals[0];
    return {
      id: apiUser.userId || matched.id,
      userId: apiUser.userId || matched.id,
      doctorId: apiUser.doctorId || matched.id,
      name: matched.name,
      email: cleanEmail || matched.email,
      role: 'DOCTOR',
      title: `${matched.specialty} Specialist`,
      specialty: matched.specialty,
      department: matched.department,
      hospitalId: apiUser.hospitalId || matched.hospitalId || hosp.id,
      hospitalName: hosp.name,
      avatarInitials: matched.avatarInitials,
      avatarTone: matched.avatarTone || 'teal',
      referenceId: apiUser.referenceId || matched.id,
      accountType: apiUser.accountType || 'DOCTOR_ACCOUNT',
    };
  }

  // FAMILY Role
  const matchedFamily = families.find((f) => f.email?.toLowerCase() === cleanEmail || (apiUser.familyId && f.id === apiUser.familyId)) ||
    families[0];
  const resolvedFamId = apiUser.familyId || matchedFamily.id;
  return {
    id: apiUser.userId || `usr_${resolvedFamId.toLowerCase()}`,
    userId: apiUser.userId || `usr_${resolvedFamId.toLowerCase()}`,
    name: matchedFamily.primaryContact || matchedFamily.name,
    email: cleanEmail || matchedFamily.email,
    role: 'FAMILY',
    title: `${matchedFamily.name} Head`,
    familyId: apiUser.familyId || resolvedFamId,
    familyName: apiUser.familyName || matchedFamily.name,
    avatarInitials: matchedFamily.primaryContact ? matchedFamily.primaryContact.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'FA',
    avatarTone: 'coral',
    referenceId: apiUser.referenceId || matchedFamily.id,
    accountType: apiUser.accountType || 'FAMILY_ACCOUNT',
  };
}

function getInitialUser() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.role && parsed.token) {
        if (!isTokenExpired(parsed.token)) {
          if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
            localStorage.setItem(TOKEN_STORAGE_KEY, parsed.token);
          }
          return parsed;
        }
      }
    }
  } catch {
    // clear corrupted storage
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize state on unauthorized event to smoothly show login screen
  useEffect(() => {
    const onUnauthorized = (e) => {
      setUser(null);
      if (e.detail?.message) {
        setError(e.detail.message);
      }
    };
    window.addEventListener('medimind:unauthorized', onUnauthorized);
    return () => window.removeEventListener('medimind:unauthorized', onUnauthorized);
  }, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch {
        // ignore storage errors
      }
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      const err = 'Please enter both email address and password.';
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }

    // Attempt real backend authentication first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.data?.token) {
        const { user: apiUser, token } = data.data;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);

        const roleUser = resolveUserProfile(apiUser.role, apiUser.email || cleanEmail, apiUser);

        const authenticatedUser = {
          ...roleUser,
          token,
        };
        setUser(authenticatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
        setLoading(false);
        return { success: true, user: authenticatedUser };
      } else {
        const errMessage = data.message || `Authentication failed (${res.status})`;
        setError(errMessage);
        setLoading(false);
        return { success: false, error: errMessage };
      }
    } catch {
      const errMessage = 'Authentication service is unreachable. Ensure backend microservices are running on port 5000.';
      setError(errMessage);
      setLoading(false);
      return { success: false, error: errMessage };
    }
  };

  const signup = async ({ name, email, password: _password }) => {
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch {
        // ignore
      }
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

    // Family account creation
    try {
      const res = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${cleanName} Family`,
          primaryContact: cleanName,
          email: cleanEmail,
          phone: '+91 98765 00000',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data?.token) {
        const { token, family } = data.data;
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        const newUser = {
          id: `usr_${family.id || Date.now()}`,
          userId: `usr_${family.id || Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: 'FAMILY',
          title: `${cleanName} Household Head`,
          familyId: family.id,
          familyName: family.name,
          avatarInitials: cleanName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'FA',
          avatarTone: 'coral',
          referenceId: family.id,
          token,
        };
        setUser(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        return { success: true, user: newUser };
      }
    } catch {
      // ignore
    }

    const fallbackErr = 'Failed to register family account. Please try again.';
    setError(fallbackErr);
    return { success: false, error: fallbackErr };
  };

  const logout = () => {
    const token = getStoredToken();
    handleUnauthorized('You have signed out of your session.');
    setUser(null);
    setError(null);
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const ROLE_CREDENTIALS = {
    CHAIRMAN: { email: 'chairman@medimind.org', password: 'Chair#2026$01!Dev' },
    HOSPITAL_ADMIN: { email: 'admin@aarogyam.hospital', password: 'Admin#2026$01!Dev' },
    DEPARTMENT_HEAD: { email: 'meenakshi.sundaram@aarogyam.hospital', password: 'Head#2026$02!Dev' },
    DOCTOR: { email: 'dr.rahul.sharma@aarogyam.hospital', password: 'Doctor#2026$01!Dev' },
    FAMILY: { email: 'rohan.kapoor@example.com', password: 'Family#2026$01!Dev' },
  };

  const switchRole = async (targetRole) => {
    const creds = ROLE_CREDENTIALS[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!user?.token && !isTokenExpired(user?.token),
        role: user?.role || null,
        isDoctor: user?.role === 'DOCTOR',
        isDepartmentHead: user?.role === 'DEPARTMENT_HEAD',
        isHospitalAdmin: user?.role === 'HOSPITAL_ADMIN',
        isChairman: user?.role === 'CHAIRMAN',
        isFamily: user?.role === 'FAMILY',
        loading,
        error,
        login,
        signup,
        logout,
        switchRole,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
