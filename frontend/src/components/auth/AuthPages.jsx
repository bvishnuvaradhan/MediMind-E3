
const ROLE_PRESETS = [
  { label: 'Platform Owner', email: 'chairman@medimind.org', badge: 'Chairman' },
  { label: 'Hospital Admin', email: 'admin@aarogyam.hospital', badge: 'Admin' },
  { label: 'Doctor', email: 'dr.rahul.sharma@aarogyam.hospital', badge: 'Doctor' },
  { label: 'Department Head', email: 'meenakshi.sundaram@aarogyam.hospital', badge: 'Dept Head' },
  { label: 'Family Account', email: 'rohan.kapoor@example.com', badge: 'Family' },
];

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
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Auth.css';

export function LoginPage({ onSwitchToSignup }) {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    await login(cleanEmail, password);
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
            Unified Healthcare Platform
          </p>
          <h2>Welcome back</h2>
          <p className="auth-subheading">
            Sign in to access your clinical workspace, family health portal, or administrative center.
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
            <span>Email Address</span>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-icon" />
              <input
                type="email"
                placeholder="name@example.com"
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

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', height: '44px' }}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', textAlign: 'center' }}>
            Role Quick Select
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
            {ROLE_PRESETS.map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={() => {
                  setEmail(role.email);
                  if (validationError) setValidationError('');
                }}
                style={{
                  padding: '6px 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{role.label}</span>
                <span style={{ fontSize: '9px', background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: '4px' }}>
                  {role.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="auth-footer">
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
        </div>

        <div className="auth-security-note">
          <ShieldCheck size={14} />
          <span>AES-256 encrypted session · Role-isolated clinical authority and ABDM compliant.</span>
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
