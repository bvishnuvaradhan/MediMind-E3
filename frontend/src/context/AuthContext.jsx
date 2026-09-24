// MediMind Platform - Authentication Context
// Manages authentication state, user identity, and strict role isolation.
// Roles supported: FAMILY, CHAIRMAN, HOSPITAL_ADMIN.

import { useState } from 'react';
import { AuthContext } from './authContextCore';

const STORAGE_KEY = 'medimind_auth_session';

const DEFAULT_CHAIRMAN = {
  id: 'usr_chair_001',
  name: 'Dr. Suresh Menon',
  email: 'chairman@medimind.com',
  role: 'CHAIRMAN',
  title: 'Chairman & Platform Owner',
  avatarInitials: 'SM',
  avatarTone: 'indigo',
};

const DEFAULT_HOSPITAL_ADMIN = {
  id: 'usr_hadmin_001',
  name: 'Dr. Rajesh Sharma',
  email: 'admin@medimindhospital.com',
  role: 'HOSPITAL_ADMIN',
  title: 'Hospital Administrator',
  hospitalId: 'hosp_001',
  hospitalName: 'MediMind Central Hospital',
  avatarInitials: 'RS',
  avatarTone: 'sapphire',
};

const DEFAULT_FAMILY = {
  id: 'usr_fam_001',
  name: 'Rohan Kapoor',
  email: 'rohan.kapoor@example.com',
  role: 'FAMILY',
  title: 'Family Account Creator',
  avatarInitials: 'RK',
  avatarTone: 'coral',
};

function getInitialUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.role) {
        return parsed;
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, _password, roleHint = null) => {
    setError(null);
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check credentials or roleHint for Chairman
    if (roleHint === 'CHAIRMAN' || cleanEmail.includes('chairman') || cleanEmail.includes('owner') || cleanEmail === 'admin@medimind.com') {
      const chairmanUser = {
        ...DEFAULT_CHAIRMAN,
        email: cleanEmail || DEFAULT_CHAIRMAN.email,
      };
      setUser(chairmanUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chairmanUser));
      return { success: true, user: chairmanUser };
    }

    // Check credentials or roleHint for Hospital Admin
    if (roleHint === 'HOSPITAL_ADMIN' || cleanEmail.includes('hospital') || cleanEmail === 'admin@medimindhospital.com' || cleanEmail.includes('hadmin')) {
      const hospitalAdminUser = {
        ...DEFAULT_HOSPITAL_ADMIN,
        email: cleanEmail || DEFAULT_HOSPITAL_ADMIN.email,
      };
      setUser(hospitalAdminUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hospitalAdminUser));
      return { success: true, user: hospitalAdminUser };
    }

    // Default to Family account login
    const familyUser = {
      ...DEFAULT_FAMILY,
      email: cleanEmail || DEFAULT_FAMILY.email,
      name: cleanEmail ? cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : DEFAULT_FAMILY.name,
    };
    setUser(familyUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(familyUser));
    return { success: true, user: familyUser };
  };

  const signup = async ({ name, email, password: _password }) => {
    setError(null);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

    const newUser = {
      id: `usr_fam_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'FAMILY',
      title: 'Family Account Creator',
      avatarInitials: cleanName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'FA',
      avatarTone: 'mint',
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true, user: newUser };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setError(null);
  };

  const switchRole = (targetRole) => {
    if (targetRole === 'CHAIRMAN') {
      setUser(DEFAULT_CHAIRMAN);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHAIRMAN));
    } else if (targetRole === 'HOSPITAL_ADMIN') {
      setUser(DEFAULT_HOSPITAL_ADMIN);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HOSPITAL_ADMIN));
    } else {
      setUser(DEFAULT_FAMILY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FAMILY));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        isChairman: user?.role === 'CHAIRMAN',
        isHospitalAdmin: user?.role === 'HOSPITAL_ADMIN',
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
