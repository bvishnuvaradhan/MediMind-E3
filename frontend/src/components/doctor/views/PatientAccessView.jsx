import React from 'react';

export function PatientAccessView({ accessHistory = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Patient Authorization & Access History Log
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Auditable record of patient authorizations granted and revoked by families
            </p>
          </div>
          <span className="doctor-badge doctor-badge-completed" style={{ padding: '6px 12px' }}>
            ABDM / HIPAA Access Auditing
          </span>
        </div>
      </div>

      {/* Info Notice */}
      <div style={{ padding: '14px 18px', backgroundColor: 'var(--doctor-soft-bg)', borderRadius: '10px', borderLeft: '4px solid var(--doctor-primary)', fontSize: '13px', color: 'var(--doctor-text-primary)', lineHeight: 1.5 }}>
        <strong>Access Control Architecture:</strong> A doctor cannot unilaterally grant themselves access to any patient's records. Access is created exclusively when a family account member selects this clinician and grants authorization. Once revoked by the family, all patient records are immediately sealed.
      </div>

      {/* Access History Table */}
      <div className="doctor-card">
        <div className="doctor-table-container">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Authorization Event & Scope</th>
                <th>Timestamp</th>
                <th>Access Status</th>
              </tr>
            </thead>
            <tbody>
              {accessHistory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ fontSize: '13.5px', color: 'var(--doctor-text-primary)' }}>
                      {item.patientName}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.action}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>
                      Scope: {item.scope}
                    </div>
                  </td>
                  <td style={{ color: 'var(--doctor-text-secondary)', fontSize: '12.5px' }}>
                    {item.date}
                  </td>
                  <td>
                    <span className={`doctor-badge doctor-badge-${item.status.toLowerCase()}`}>
                      ● {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PatientAccessView;
