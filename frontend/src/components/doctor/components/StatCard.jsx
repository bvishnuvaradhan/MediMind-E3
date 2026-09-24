import React from 'react';

export function StatCard({ label, value, icon, tone = 'blue', change, changeType = 'positive', subtext }) {
  return (
    <div className="doctor-stat-card">
      <div className="doctor-stat-top">
        <span className="doctor-stat-label">{label}</span>
        <div className={`doctor-stat-icon-wrapper ${tone}`}>
          {icon}
        </div>
      </div>
      <div className="doctor-stat-value">{value}</div>
      {(change || subtext) && (
        <div className="doctor-stat-bottom">
          {change && (
            <span className={`doctor-stat-badge ${changeType === 'positive' ? 'positive' : 'neutral'}`}>
              {change}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
