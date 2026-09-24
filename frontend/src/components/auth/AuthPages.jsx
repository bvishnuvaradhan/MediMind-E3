// MediMind Platform - Authentication Pages
// Provides role-aware Login and Family Registration matching MediMind specifications.

import { useState } from 'react';
import {
  HeartPulse,
  LockKeyhole,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Crown,
  Building2,
  UsersRound,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Auth.css';

export function LoginPage({ onSwitchToSignup }) {
  const { login, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('DEPARTMENT_HEAD'); // Default to Department Head for active testing
  const [email, setEmail] = useState('priya.sharma@medimindhospital.com');
  const [password, setPassword] = useState('depthead123');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    clearError();
    setValidationError('');
    if (role === 'DEPARTMENT_HEAD') {
      setEmail('priya.sharma@medimindhospital.com');
      setPassword('depthead123');
    } else if (role === 'HOSPITAL_ADMIN') {
      setEmail('admin@medimindhospital.com');
      setPassword('hospital123');
    } else if (role === 'CHAIRMAN') {
      setEmail('chairman@medimind.com');
      setPassword('chairman123');
    } else {
      setEmail('rohan.kapoor@example.com');
      setPassword('family123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationError('Please enter your email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    await login(cleanEmail, password, selectedRole);
    setSubmitting(false);
  };

  const displayError = validationError || error;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand">
            <span className="brand-mark">
              <HeartPulse size={20} />
            </span>
            <span>
              Medi<span>Mind</span>
            </span>
          </div>
          <p className="eyebrow" style={{ marginTop: '12px', textAlign: 'center' }}>
            {selectedRole === 'DEPARTMENT_HEAD'
              ? 'Department Head Clinical Portal'
              : selectedRole === 'HOSPITAL_ADMIN'
              ? 'Hospital Administration Portal'
              : selectedRole === 'CHAIRMAN'
              ? 'Platform Administration Portal'
              : 'Family Healthcare Portal'}
          </p>
          <h2>Welcome back</h2>
          <p className="auth-subheading">
            {selectedRole === 'DEPARTMENT_HEAD'
              ? 'Sign in to manage department doctors, OPD duty rosters, capacity workloads, and aggregate AI diagnostics.'
              : selectedRole === 'HOSPITAL_ADMIN'
              ? 'Sign in to manage hospital departments, clinical staff, operational schedules, and aggregate AI screening.'
              : selectedRole === 'CHAIRMAN'
              ? 'Sign in to access platform governance, hospital network oversight, and AI service metrics.'
              : 'Sign in to access your family unified health records, appointments, and AI screening.'}
          </p>
        </div>

        {/* Role switcher tabs */}
        <div className="auth-role-tabs" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button
            type="button"
            className={`auth-role-tab ${selectedRole === 'DEPARTMENT_HEAD' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('DEPARTMENT_HEAD')}
          >
            <Stethoscope size={15} />
            <span>Dept Head</span>
          </button>
          <button
            type="button"
            className={`auth-role-tab ${selectedRole === 'HOSPITAL_ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('HOSPITAL_ADMIN')}
          >
            <Building2 size={15} />
            <span>Hosp Admin</span>
          </button>
          <button
            type="button"
            className={`auth-role-tab chairman ${selectedRole === 'CHAIRMAN' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('CHAIRMAN')}
          >
            <Crown size={15} />
            <span>Chairman</span>
          </button>
          <button
            type="button"
            className={`auth-role-tab ${selectedRole === 'FAMILY' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('FAMILY')}
          >
            <UsersRound size={15} />
            <span>Family</span>
          </button>
        </div>

        {displayError && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label>
            <span>Email Address</span>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-icon" />
              <input
                type="email"
                placeholder={
                  selectedRole === 'DEPARTMENT_HEAD'
                    ? 'priya.sharma@medimindhospital.com'
                    : selectedRole === 'HOSPITAL_ADMIN'
                    ? 'admin@medimindhospital.com'
                    : selectedRole === 'CHAIRMAN'
                    ? 'chairman@medimind.com'
                    : 'rohan.kapoor@example.com'
                }
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={submitting}
                autoFocus
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="auth-input-wrapper">
              <LockKeyhole size={16} className="auth-icon" />
              <input
                type="password"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={submitting}
              />
            </div>
          </label>

          <div className="auth-quick-pills">
            <span>Quick demo accounts:</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleRoleTabChange('DEPARTMENT_HEAD')}
              >
                Dept Head
              </button>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleRoleTabChange('HOSPITAL_ADMIN')}
              >
                Hospital Admin
              </button>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleRoleTabChange('CHAIRMAN')}
              >
                Chairman
              </button>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleRoleTabChange('FAMILY')}
              >
                Family
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', height: '44px' }}
          >
            {submitting
              ? 'Signing in...'
              : `Sign in as ${
                  selectedRole === 'DEPARTMENT_HEAD'
                    ? 'Department Head'
                    : selectedRole === 'HOSPITAL_ADMIN'
                    ? 'Hospital Admin'
                    : selectedRole === 'CHAIRMAN'
                    ? 'Chairman'
                    : 'Family'
                }`}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          {selectedRole === 'FAMILY' ? (
            <>
              <span>Don't have a family account yet?</span>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  clearError();
                  onSwitchToSignup();
                }}
              >
                Create Family Account
              </button>
            </>
          ) : (
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {selectedRole === 'DEPARTMENT_HEAD'
                ? 'Clinical Department Head Access · Scoped Authority'
                : selectedRole === 'HOSPITAL_ADMIN'
                ? 'Hospital Administrative Access · NABH/JCI Verified'
                : 'Root Platform Owner Access · Multi-Factor Authentication enabled'}
            </span>
          )}
        </div>

        <div className="auth-security-note">
          <ShieldCheck size={14} />
          <span>Role-isolated authorization: Administrative authority does not equal medical-record authority.</span>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onSwitchToLogin }) {
  const { signup, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      setValidationError('Please enter your email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    await signup({ name: cleanName, email: cleanEmail, password });
    setSubmitting(false);
  };

  const displayError = validationError || error;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand">
            <span className="brand-mark">
              <HeartPulse size={20} />
            </span>
            <span>
              Medi<span>Mind</span>
            </span>
          </div>
          <p className="eyebrow" style={{ marginTop: '12px', textAlign: 'center' }}>Family Registration</p>
          <h2>Create account</h2>
          <p className="auth-subheading">
            Set up your family health portal to manage members, share unified health records, and access AI diagnostic screening.
          </p>
        </div>

        {displayError && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={16} />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label>
            <span>Full Name</span>
            <div className="auth-input-wrapper">
              <input
                type="text"
                placeholder="Rohan Kapoor"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={submitting}
                autoFocus
              />
            </div>
          </label>

          <label>
            <span>Email Address</span>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-icon" />
              <input
                type="email"
                placeholder="rohan.kapoor@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={submitting}
              />
            </div>
          </label>

          <label>
            <span>Password (min 6 characters)</span>
            <div className="auth-input-wrapper">
              <LockKeyhole size={16} className="auth-icon" />
              <input
                type="password"
                placeholder="Create secure password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={submitting}
              />
            </div>
          </label>

          <label>
            <span>Confirm Password</span>
            <div className="auth-input-wrapper">
              <LockKeyhole size={16} className="auth-icon" />
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={submitting}
              />
            </div>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', height: '44px' }}
          >
            {submitting ? 'Creating account...' : 'Create Family Account'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              clearError();
              onSwitchToLogin();
            }}
          >
            Sign In
          </button>
        </div>

        <div className="auth-security-note">
          <ShieldCheck size={14} />
          <span>AES-256 encrypted storage · HIPAA/ABDM compliant family data isolation.</span>
        </div>
      </div>
    </div>
  );
}
