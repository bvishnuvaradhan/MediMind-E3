// MediMind Platform - Departments Overview (Chairman / Platform Owner)
// Section 9 of PLATFORM OWNER.txt: Cross-hospital clinical department overview

import { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Stethoscope,
  HeartPulse,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function DepartmentsView() {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    async function load() {
      const deps = await chairmanService.getDepartments();
      setDepartments(deps);
    }
    load();
  }, []);

  return (
    <div className="departments-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Layers size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Clinical Organization
            </p>
            <h1>Departments Overview</h1>
            <p>Cross-hospital oversight of specialized clinical departments, appointed department heads, and AI integrations.</p>
          </div>
        </div>
      </div>

      {/* Clinical Department Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {departments.map((dept) => (
          <div key={dept.id} className="table-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: dept.id === 'DEP-ORTHO' ? '#e0e7ff' : dept.id === 'DEP-DIAB' ? '#ccfbf1' : '#fce7f3',
                    color: dept.id === 'DEP-ORTHO' ? '#4338ca' : dept.id === 'DEP-DIAB' ? '#0f766e' : '#db2777',
                  }}
                >
                  {dept.id === 'DEP-ORTHO' ? <Activity size={22} /> : dept.id === 'DEP-DIAB' ? <Stethoscope size={22} /> : <HeartPulse size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Plus Jakarta Sans' }}>{dept.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>{dept.hospitalName}</span>
                </div>
              </div>
              <span className="badge badge-active">{dept.status}</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--chair-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {dept.description}
            </p>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)', display: 'block' }}>DEPARTMENT HEAD</span>
              <strong style={{ fontSize: '13px', display: 'block', marginTop: '2px' }}>{dept.headName}</strong>
              <small style={{ color: 'var(--chair-muted)', fontSize: '11px' }}>{dept.headEmail}</small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'var(--chair-indigo-soft)', color: 'var(--chair-indigo)', fontSize: '12px', marginBottom: '18px' }}>
              <Sparkles size={16} />
              <span><b>Linked Clinical AI:</b> {dept.linkedAi}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--chair-border)', textAlign: 'center' }}>
              <div>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>DOCTORS</small>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{dept.doctorsCount}</div>
              </div>
              <div>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>VISITS</small>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{dept.appointmentsCount}</div>
              </div>
              <div>
                <small style={{ color: 'var(--chair-muted)', fontSize: '10px' }}>AI RUNS</small>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{dept.predictionsCount}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Departmental Policy Note */}
      <div className="privacy-banner">
        <ShieldCheck size={18} />
        <div>
          <strong>Organizational Hierarchy</strong>
          <p style={{ margin: '2px 0 0' }}>
            Chairman oversees Department operational KPIs. Department Heads manage doctor creation and clinical schedules for their specialized department.
          </p>
        </div>
      </div>
    </div>
  );
}
