import { Settings, Sun, Moon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/useAuth';

export function SettingsView({ dark, setDark, announce }) {
  const { user, logout } = useAuth();

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Settings size={20} />
        </span>
        <div>
          <p className="eyebrow">Account preferences</p>
          <h1>Settings</h1>
          <p>Manage appearance, notifications, and family account preferences.</p>
        </div>
      </div>

      <div className="feature-panel settings-panel">
        <div className="settings-section">
          <div>
            <h2>Appearance</h2>
            <p>Choose how MediMind looks on this device.</p>
          </div>
          <button className="secondary-button" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}{' '}
            {dark ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>
        </div>

        <div className="settings-section">
          <div>
            <h2>Notifications</h2>
            <p>Appointment reminders and family health updates are enabled.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => announce('Notification preferences saved.')}
          >
            Manage notifications
          </button>
        </div>

        <div className="settings-section">
          <div>
            <h2>Privacy and security</h2>
            <p>Your family profiles are protected with secure access.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => announce('Privacy settings opened.')}
          >
            <ShieldCheck size={16} /> Review privacy
          </button>
        </div>

        <div className="settings-section">
          <div>
            <h2>Account session</h2>
            <p>Signed in as {user?.email || 'rohan.kapoor@example.com'}.</p>
          </div>
          <button
            className="secondary-button"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => logout()}
          >
            Sign out
          </button>
        </div>
      </div>
    </section>
  );
}
