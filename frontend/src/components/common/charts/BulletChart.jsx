/**
 * Reusable Pure-SVG Bullet Chart Component
 * Standard Stephen Few Bullet Graph displaying qualitative ranges, actual performance bar, and target marker line.
 */
export function BulletChart({
  title = '',
  subtitle = '',
  actual = 0,
  target = null,
  max = 100,
  ranges = [60, 85, 100], // [poor, satisfactory, good] thresholds
  unit = '%',
  height = 34,
  color = '#2563eb',
}) {
  const chartWidth = 400;
  const innerWidth = chartWidth;
  const numActual = typeof actual === 'number' ? actual : parseFloat(actual) || 0;
  const numTarget = target !== null ? (typeof target === 'number' ? target : parseFloat(target) || 0) : null;

  const actualWidth = Math.min(innerWidth, Math.max(0, (numActual / max) * innerWidth));
  const targetX = numTarget !== null ? Math.min(innerWidth, Math.max(0, (numTarget / max) * innerWidth)) : null;

  // Background range bands
  const range1W = (ranges[0] / max) * innerWidth;
  const range2W = ((ranges[1] - ranges[0]) / max) * innerWidth;
  const range3W = ((max - ranges[1]) / max) * innerWidth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', userSelect: 'none' }}>
      {(title || subtitle) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12px' }}>
          <div>
            <strong style={{ color: 'var(--chair-text, #334155)' }}>{title}</strong>
            {subtitle && <span style={{ marginLeft: '6px', color: 'var(--chair-muted, #94a3b8)', fontSize: '11px' }}>{subtitle}</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: '12.5px' }}>
            {actual}{unit} {numTarget !== null && <span style={{ fontWeight: 400, color: 'var(--chair-muted, #94a3b8)', fontSize: '11px' }}>/ target {target}{unit}</span>}
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${chartWidth} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Qualitative Range 1 (Base/Low) */}
        <rect x="0" y="0" width={range1W} height={height} fill="rgba(0,0,0,0.06)" rx={3} />
        {/* Qualitative Range 2 (Mid) */}
        <rect x={range1W} y="0" width={range2W} height={height} fill="rgba(0,0,0,0.04)" />
        {/* Qualitative Range 3 (High) */}
        <rect x={range1W + range2W} y="0" width={range3W} height={height} fill="rgba(0,0,0,0.02)" />

        {/* Actual Performance Bar (Thicker center bar) */}
        <rect
          x="0"
          y={height * 0.22}
          width={actualWidth}
          height={height * 0.56}
          fill={color}
          rx={3}
        />

        {/* Comparative Target Marker Line */}
        {targetX !== null && (
          <g>
            <line
              x1={targetX}
              y1={height * 0.08}
              x2={targetX}
              y2={height * 0.92}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

export default BulletChart;
