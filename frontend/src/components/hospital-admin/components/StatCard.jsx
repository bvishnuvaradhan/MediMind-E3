
export function StatCard({ label, value, subtext, icon: Icon, tone = 'primary', isPositive = false }) {
  return (
    <div className="ha-stat-card">
      <div className="ha-stat-top">
        <span className="ha-stat-label">{label}</span>
        {Icon && (
          <div className={`ha-stat-icon ${tone}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="ha-stat-value">{value}</div>
      {subtext && (
        <div className={`ha-stat-subtext ${isPositive ? 'positive' : ''}`}>
          {subtext}
        </div>
      )}
    </div>
  );
}

