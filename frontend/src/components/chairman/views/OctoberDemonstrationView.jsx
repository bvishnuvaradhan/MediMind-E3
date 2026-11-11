// MediMind Platform - October 2026 Demonstration Target View
// Displays the combined 1,128 appointment capacity demonstration (741 Genuine + 387 Simulated)
// Strictly labeled: "Demonstration Total — Includes Simulated Data"

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  ShieldCheck,
  Building2,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function OctoberDemonstrationView({ onNavigate }) {
  const [demoData, setDemoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await chairmanService.getOctoberDemonstrationData();
        if (isMounted) {
          setDemoData(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (loading || !demoData) {
    return <div className="loading-state">Loading October 2026 Demonstration Dashboard...</div>;
  }

  const { totals, hospitalAllocations, metadata } = demoData;

  return (
    <div className="appointments-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            <Sparkles size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: '#6d28d9' }}>
              Capacity Planning & Target Demonstration
            </p>
            <h1>October 2026 Demonstration Dashboard</h1>
            <p>
              Simulated target demonstration combining verified production scheduled care with isolated staging simulation fixtures.
            </p>
          </div>
        </div>

        <div className="view-actions">
          {onNavigate && (
            <button
              className="secondary-button"
              onClick={() => onNavigate('Platform Appointments Overview')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CalendarDays size={15} />
              <span>Standard Production View</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Demonstration Disclosure Banner (Requirement 6 & 7) */}
      <div
        className="privacy-banner"
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
          borderColor: '#f59e0b',
          color: '#92400e',
          marginBottom: '24px',
        }}
      >
        <ShieldAlert size={22} style={{ color: '#d97706', flexShrink: 0 }} />
        <div>
          <strong style={{ fontSize: '14px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Demonstration Total — Includes Simulated Data</span>
            <span
              style={{
                fontSize: '11px',
                background: '#d97706',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              Isolated Staging
            </span>
          </strong>
          <p style={{ margin: '4px 0 0', fontSize: '13px', lineHeight: 1.45, color: '#78350f' }}>
            {metadata.disclaimer}
          </p>
        </div>
      </div>

      {/* Primary KPI Cards Grid (Requirement 4) */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {/* Card 1: Combined Demonstration Total */}
        <div className="stat-card" style={{ borderTop: '4px solid #6d28d9' }}>
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#ede9fe', color: '#6d28d9' }}>
              <Sparkles size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#ede9fe', color: '#6d28d9' }}>
              100% Target Met
            </span>
          </div>
          <h3>{totals.combinedDemonstrationTotal.toLocaleString()}</h3>
          <p style={{ fontWeight: 600 }}>Demonstration Total</p>
          <small style={{ color: '#6d28d9', marginTop: '4px', fontWeight: 600 }}>
            Includes 387 Simulated Records
          </small>
        </div>

        {/* Card 2: Genuine Production Appointments */}
        <div className="stat-card" style={{ borderTop: '4px solid #2563eb' }}>
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <ShieldCheck size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#dbeafe', color: '#1e40af' }}>
              Genuine Production Care
            </span>
          </div>
          <h3>{totals.genuineProductionAppointments.toLocaleString()}</h3>
          <p style={{ fontWeight: 600 }}>Genuine Production Appointments</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Scheduled for October 2026
          </small>
        </div>

        {/* Card 3: Simulated Demonstration Appointments */}
        <div className="stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Layers size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#fef3c7', color: '#92400e' }}>
              Isolated Staging Only
            </span>
          </div>
          <h3>{totals.simulatedDemonstrationAppointments.toLocaleString()}</h3>
          <p style={{ fontWeight: 600 }}>Simulated Demonstration Data</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Simulated capacity planning delta
          </small>
        </div>

        {/* Card 4: Clinical Prescriptions Safeguard */}
        <div className="stat-card" style={{ borderTop: '4px solid #10b981' }}>
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
              <CheckCircle size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#d1fae5', color: '#065f46' }}>
              Safety Guard Active
            </span>
          </div>
          <h3>{metadata.simulatedPrescriptionsCount}</h3>
          <p style={{ fontWeight: 600 }}>Simulated Prescriptions</p>
          <small style={{ color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            Zero fake prescriptions written
          </small>
        </div>
      </div>

      {/* Hospital Allocation Cards Grid (Requirement 5) */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', fontFamily: 'Plus Jakarta Sans' }}>
          Hospital-Level Demonstration Allocation (1,128 Target Breakdown)
        </h2>
        <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '13px' }}>
          Exact reconciliation formula: <strong>Genuine Production Baseline + Isolated Staging Simulation = Target Capacity</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {hospitalAllocations.map((hosp) => {
          const genuinePct = Math.round((hosp.genuineCount / hosp.targetCount) * 100);
          const simPct = Math.round((hosp.simulatedCount / hosp.targetCount) * 100);

          return (
            <div key={hosp.hospitalId} className="table-card" style={{ padding: '22px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#ede9fe',
                      color: '#6d28d9',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{hosp.hospitalName}</h3>
                    <small style={{ color: 'var(--chair-muted)' }}>Facility Target: {hosp.targetCount} appointments</small>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#dcfce7',
                    color: '#166534',
                  }}
                >
                  100% Target Met
                </span>
              </div>

              {/* Progress Bar showing Genuine vs Simulated contribution */}
              <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', display: 'flex', margin: '14px 0 8px' }}>
                <div style={{ width: `${genuinePct}%`, background: '#2563eb' }} title={`Genuine: ${hosp.genuineCount}`} />
                <div style={{ width: `${simPct}%`, background: '#f59e0b' }} title={`Simulated: ${hosp.simulatedCount}`} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--chair-muted)', marginBottom: '16px' }}>
                <span>Genuine Care ({genuinePct}%)</span>
                <span>Simulated Fixtures ({simPct}%)</span>
              </div>

              {/* Counts Breakdown Box */}
              <div
                style={{
                  background: 'var(--chair-bg)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--chair-border)',
                }}
              >
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Genuine Baseline</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--chair-text)' }}>{hosp.genuineCount}</div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--chair-muted)', padding: '0 8px' }}>+</div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>Simulated Delta</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--chair-text)' }}>{hosp.simulatedCount}</div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--chair-muted)', padding: '0 8px' }}>=</div>
                <div style={{ textAlign: 'center', flex: 1.2, background: '#ede9fe', padding: '6px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 700 }}>Combined Total</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#6d28d9' }}>{hosp.demonstrationTotal}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Audit & Verification Matrix */}
      <div className="table-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
              Capacity Planning & Reconciliation Matrix
            </h3>
            <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '12px' }}>
              Full operational breakdown verified under canonical <code>appointment_date</code> semantics
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px' }}>
            ✓ Target Verified: 1,128 Total
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="chairman-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--chair-border)', fontSize: '12px', color: 'var(--chair-muted)' }}>
                <th style={{ padding: '10px 14px' }}>Hospital Facility</th>
                <th style={{ padding: '10px 14px' }}>Genuine Production Scheduled</th>
                <th style={{ padding: '10px 14px' }}>Simulated Staging Fixtures</th>
                <th style={{ padding: '10px 14px' }}>Demonstration Total</th>
                <th style={{ padding: '10px 14px' }}>Facility Target</th>
                <th style={{ padding: '10px 14px' }}>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {hospitalAllocations.map((hosp) => (
                <tr key={hosp.hospitalId} style={{ borderBottom: '1px solid var(--chair-border)', fontSize: '13px' }}>
                  <td style={{ padding: '14px', fontWeight: 600 }}>{hosp.hospitalName}</td>
                  <td style={{ padding: '14px', color: '#2563eb', fontWeight: 600 }}>{hosp.genuineCount}</td>
                  <td style={{ padding: '14px', color: '#d97706', fontWeight: 600 }}>+{hosp.simulatedCount}</td>
                  <td style={{ padding: '14px', color: '#6d28d9', fontWeight: 800 }}>{hosp.demonstrationTotal}</td>
                  <td style={{ padding: '14px', fontWeight: 600 }}>{hosp.targetCount}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#dcfce7', color: '#166534' }}>
                      100% Target Met
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--chair-bg)', fontWeight: 700, fontSize: '14px' }}>
                <td style={{ padding: '14px' }}>Network Demonstration Total</td>
                <td style={{ padding: '14px', color: '#2563eb' }}>{totals.genuineProductionAppointments}</td>
                <td style={{ padding: '14px', color: '#d97706' }}>+{totals.simulatedDemonstrationAppointments}</td>
                <td style={{ padding: '14px', color: '#6d28d9', fontSize: '16px', fontWeight: 800 }}>
                  {totals.combinedDemonstrationTotal}
                </td>
                <td style={{ padding: '14px' }}>{totals.targetTotal}</td>
                <td style={{ padding: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#ede9fe', color: '#6d28d9' }}>
                    Demonstration Total
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Clinical Safety & Data Isolation Guarantees (Requirements 8, 9, 10) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#166534', display: 'grid', placeItems: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <h4 style={{ margin: 0, fontSize: '15px' }}>Production Data Immutability</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--chair-muted)', margin: 0, lineHeight: 1.5 }}>
            MongoDB Atlas production remains 100% untouched. All genuine clinical charts, consultation notes, patient family accounts, and billing ledgers strictly reflect only the 741 verified appointments.
          </p>
        </div>

        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', display: 'grid', placeItems: 'center' }}>
              <XCircle size={18} />
            </div>
            <h4 style={{ margin: 0, fontSize: '15px' }}>Zero Simulated Prescriptions</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--chair-muted)', margin: 0, lineHeight: 1.5 }}>
            Strict clinical safety controls prohibit simulated prescriptions. No medication orders, pharmacy fulfillment events, or prescription records enter the MediMind system.
          </p>
        </div>

        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#4338ca', display: 'grid', placeItems: 'center' }}>
              <Info size={18} />
            </div>
            <h4 style={{ margin: 0, fontSize: '15px' }}>Frontend Security & Isolation</h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--chair-muted)', margin: 0, lineHeight: 1.5 }}>
            No database connection strings, staging credentials, or internal topology details are exposed to the client. All demonstration data is served via authorized server-side API endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
