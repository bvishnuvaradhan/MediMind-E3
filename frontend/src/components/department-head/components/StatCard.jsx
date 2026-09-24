import React from 'react';

export function StatCard({ label, value, icon, tone = 'indigo', change, changeType = 'positive', subtext }) {
  return (
    <div className="dh-stat-card">
      <div className="dh-stat-top">
        <span className="dh-stat-label">{label}</span>
        <div className={`dh-stat-icon-wrapper ${tone}`}>
          {icon}
        </div>
      </div>
      <div className="dh-stat-value">{value}</div>
      {(change || subtext) && (
        <div className="dh-stat-bottom">
          {change && (
            <span className={`dh-stat-badge ${changeType === 'positive' ? 'positive' : 'neutral'}`}>
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
