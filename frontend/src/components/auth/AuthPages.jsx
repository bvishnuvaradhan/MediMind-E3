import { useState } from "react";
import { HeartPulse, LockKeyhole, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function LoginPage({ onSwitchToSignup }) {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationError("Please enter your email address.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    const result = await login(cleanEmail, password);
    setSubmitting(false);

    if (!result.success) {
      // Error is set in AuthContext
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand" style={{ padding: 0, justifyContent: "center" }}>
            <span className="brand-mark">
              <HeartPulse size={20} />
            </span>
            <span>
              Medi<span>Mind</span>
            </span>
          </div>
          <p className="eyebrow" style={{ marginTop: "14px", textAlign: "center" }}>
            Family Health Portal
          </p>
          <h2>Welcome back</h2>
          <p className="auth-subheading">
            Sign in to access your family's unified health records, appointments, and AI insights.
          </p>
        </div>

        {displayError && (
          <div className="auth-alert">
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
                placeholder="family@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError("");
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError("");
                }}
                disabled={submitting}
              />
            </div>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
            style={{ width: "100%", justifyContent: "center", marginTop: "8px", height: "44px" }}
          >
            {submitting ? "Signing in..." : "Sign in to Family Account"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account yet?</span>
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
          <span>Secure HIPAA-aligned architecture with role-isolated authorization</span>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onSwitchToLogin }) {
  const { signup, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationError("Please enter your email address.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setValidationError("Please enter a valid email address format.");
      return;
    }
    if (!password) {
      setValidationError("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    const result = await signup({ email: cleanEmail, password });
    setSubmitting(false);

    if (!result.success) {
      // Error displayed via AuthContext
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand" style={{ padding: 0, justifyContent: "center" }}>
            <span className="brand-mark">
              <HeartPulse size={20} />
            </span>
            <span>
              Medi<span>Mind</span>
            </span>
          </div>
          <p className="eyebrow" style={{ marginTop: "14px", textAlign: "center" }}>
            Patient Registration
          </p>
          <h2>Create Family Account</h2>
          <p className="auth-subheading">
            Register your family account to manage member profiles, medical records, and AI screening.
          </p>
        </div>

        {displayError && (
          <div className="auth-alert">
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
                placeholder="your.family@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError("");
                }}
                disabled={submitting}
                autoFocus
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
                  if (validationError) setValidationError("");
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
                  if (validationError) setValidationError("");
                }}
                disabled={submitting}
              />
            </div>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
            style={{ width: "100%", justifyContent: "center", marginTop: "8px", height: "44px" }}
          >
            {submitting ? "Creating Account..." : "Register Family Account"}
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
            Clinical staff (Doctors, Department Heads, Admins) are provisioned through internal administration.
          </small>
        </div>
      </div>
    </div>
  );
}
