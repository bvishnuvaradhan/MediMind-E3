import { useState } from 'react';

/**
 * Reusable Pure-SVG Radar / Spider Chart Component
 * Multidimensional attribute comparison for Clinical AI models & Department KPIs
 */
export function RadarChart({
  metrics = ['Accuracy', 'Sensitivity', 'Specificity', 'Uptime'],
  data = [], // [{ name: 'Fracture CNN', values: [97, 96, 98, 99], color: '#2563eb' }]
  size = 220,
  maxVal = 100,
  showLegend = true,
}) {
  const [hoveredInfo, setHoveredInfo] = useState(null);

  if (!metrics || metrics.length === 0 || !data || data.length === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No radar metrics available
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const numAxes = metrics.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Compute axis points
  const getPoint = (axisIdx, value) => {
    const angle = axisIdx * angleStep - Math.PI / 2;
    const r = (value / maxVal) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Concentric polygon grid levels (3 levels: 33%, 66%, 100%)
  const levels = [0.33, 0.66, 1.0];

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      {showLegend && data.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '8px', fontSize: '11px' }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }} />
              <span style={{ fontWeight: 600 }}>{d.name}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size, display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredInfo(null)}
      >
        {/* Concentric Grid Polygons */}
        {levels.map((lvl, lIdx) => {
          const polyPoints = metrics
            .map((_, i) => {
              const pt = getPoint(i, maxVal * lvl);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <polygon
              key={`lvl-${lIdx}`}
              points={polyPoints}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeDasharray={lIdx < 2 ? '2 2' : 'none'}
            />
          );
        })}

        {/* Radial Axis Spokes & Metric Labels */}
        {metrics.map((metric, i) => {
          const edgePt = getPoint(i, maxVal);
          const labelPt = getPoint(i, maxVal * 1.22);

          return (
            <g key={`axis-${i}`}>
              <line
                x1={cx}
                y1={cy}
                x2={edgePt.x}
                y2={edgePt.y}
                stroke="currentColor"
                strokeOpacity={0.12}
              />
              <text
                x={labelPt.x}
                y={labelPt.y + 3.5}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="currentColor"
                opacity={0.7}
              >
                {metric}
              </text>
            </g>
          );
        })}

        {/* Data Polygons */}
        {data.map((series, sIdx) => {
          const polyPoints = series.values
            .map((val, i) => {
              const pt = getPoint(i, val);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');

          const isSeriesHovered = hoveredInfo && hoveredInfo.seriesName === series.name;

          return (
            <g key={`s-${sIdx}`}>
              <polygon
                points={polyPoints}
                fill={series.color}
                fillOpacity={isSeriesHovered ? 0.35 : 0.22}
                stroke={series.color}
                strokeWidth={isSeriesHovered ? 2.5 : 2}
                strokeLinejoin="round"
              />
              {series.values.map((val, i) => {
                const pt = getPoint(i, val);
                const isPointHovered = isSeriesHovered && hoveredInfo.metric === metrics[i];
                return (
                  <circle
                    key={`p-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isPointHovered ? 5.5 : 3.5}
                    fill="#ffffff"
                    stroke={series.color}
                    strokeWidth={isPointHovered ? 2.5 : 1.5}
                    onMouseEnter={() =>
                      setHoveredInfo({
                        seriesName: series.name,
                        metric: metrics[i],
                        value: val,
                        color: series.color,
                      })
                    }
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Tooltip Popup */}
      {hoveredInfo && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 50,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hoveredInfo.color }} />
          <span style={{ color: '#cbd5e1' }}>{hoveredInfo.seriesName} · {hoveredInfo.metric}:</span>
          <strong style={{ color: '#38bdf8' }}>{hoveredInfo.value}%</strong>
        </div>
      )}
    </div>
  );
}

export default RadarChart;
