// MediMind Platform - Department Performance (Chairman / Platform Owner)
// Section 15 of PLATFORM OWNER.txt: Cross-department comparative metrics

import { useState, useEffect } from 'react';
import {
  Layers,
  Activity,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function DepartmentPerformanceView() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getDepartmentPerformance();
      setDepartments(data);
    }
    load();
  }, []);

  return (
    <div className="department-performance-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Layers size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Clinical Department Analytics
            </p>
            <h1>Department Performance Comparison</h1>
            <p>Comparative utilization, appointment resolution, and clinical AI adoption across medical disciplines.</p>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Discipline</th>
                <th>Appointed Department Head</th>
                <th>Doctors Roster</th>
                <th>Appointments Handled</th>
                <th>AI Diagnostic Runs</th>
                <th>Integrated Clinical AI</th>
                <th>Operational Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: dept.id === 'DEP-ORTHO' ? '#e0e7ff' : dept.id === 'DEP-DIAB' ? '#ccfbf1' : '#fce7f3',
                          color: dept.id === 'DEP-ORTHO' ? '#4338ca' : dept.id === 'DEP-DIAB' ? '#0f766e' : '#db2777',
                        }}
                      >
                        {dept.id === 'DEP-ORTHO' ? <Activity size={18} /> : dept.id === 'DEP-DIAB' ? <Stethoscope size={18} /> : <HeartPulse size={18} />}
                      </div>
                      <div>
                        <strong>{dept.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>Code: {dept.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{dept.head}</strong>
                  </td>
                  <td>{dept.doctorsCount} Specialists</td>
                  <td>
                    <strong>{dept.appointmentsCount}</strong> visits
                  </td>
                  <td>
                    <strong>{dept.predictionsCount}</strong> inferences
                  </td>
                  <td>
                    <span className="badge badge-info">{dept.aiModel}</span>
                  </td>
                  <td>
                    <span className="badge badge-active">{dept.efficiencyIndex}</span>
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
