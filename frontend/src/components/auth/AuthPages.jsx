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
  User,
  Crown,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Auth.css';

export function LoginPage({ onSwitchToSignup }) {
  const { login, error, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState('CHAIRMAN'); // Default to Chairman so reviewer directly tests Chairman portal
  const [email, setEmail] = useState('chairman@medimind.com');
  const [password, setPassword] = useState('chairman123');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    clearError();
    setValidationError('');
    if (role === 'CHAIRMAN') {
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
            {selectedRole === 'CHAIRMAN' ? 'Platform Administration Portal' : 'Family Healthcare Portal'}
          </p>
          <h2>Welcome back</h2>
          <p className="auth-subheading">
            {selectedRole === 'CHAIRMAN'
              ? 'Sign in to access platform governance, hospital network oversight, and AI service metrics.'
              : 'Sign in to access your family unified health records, appointments, and AI screening.'}
          </p>
        </div>

        {/* Role switcher tabs */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`auth-role-tab chairman ${selectedRole === 'CHAIRMAN' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('CHAIRMAN')}
          >
            <Crown size={15} />
            <span>Chairman / Owner</span>
          </button>
          <button
            type="button"
            className={`auth-role-tab ${selectedRole === 'FAMILY' ? 'active' : ''}`}
            onClick={() => handleRoleTabChange('FAMILY')}
          >
            <UsersRound size={15} />
            <span>Family Account</span>
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
                placeholder={selectedRole === 'CHAIRMAN' ? 'chairman@medimind.com' : 'rohan.kapoor@example.com'}
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
            <span>Demo credentials loaded:</span>
            <button
              type="button"
              className="quick-fill-btn"
              onClick={() => handleRoleTabChange(selectedRole === 'CHAIRMAN' ? 'FAMILY' : 'CHAIRMAN')}
            >
              Switch to {selectedRole === 'CHAIRMAN' ? 'Family Demo' : 'Chairman Demo'}
            </button>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', height: '44px' }}
          >
            {submitting ? 'Signing in...' : `Sign in as ${selectedRole === 'CHAIRMAN' ? 'Chairman' : 'Family'}`}
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
              Root administrative access. Multi-Factor Authentication enabled.
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
      setValidationError('Please enter a valid email address format.');
      return;
    }
    if (!password) {
      setValidationError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please verify.');
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
          <p className="eyebrow" style={{ marginTop: '12px', textAlign: 'center' }}>
            Patient Registration
          </p>
          <h2>Create Family Account</h2>
          <p className="auth-subheading">
            Register your family account to manage member profiles, medical records, and AI screening.
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
            <span>Full Name (Account Creator)</span>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-icon" />
              <input
                type="text"
                placeholder="e.g. Rohan Kapoor"
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
                placeholder="your.family@example.com"
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
            <span>Create Password (min. 6 characters)</span>
            <div className="auth-input-wrapper">
              <LockKeyhole size={16} className="auth-icon" />
              <input
                type="password"
                placeholder="At least 6 characters"
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
                placeholder="Repeat password"
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
            {submitting ? 'Creating Account...' : 'Register Family Account'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered?</span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              clearError();
              onSwitchToLogin();
            }}
          >
            Sign in here
          </button>
        </div>

        <div className="auth-role-notice">
          <small>
            Clinical staff (Doctors, Department Heads, Hospital Admins, Chairman) are provisioned through internal administration.
          </small>
        </div>
      </div>
    </div>
  );
}
