import { useState } from 'react';

/**
 * Clean Pure-SVG Line and Multi-Series Area Chart Component
 */
export function LineChart({
  data = [],
  series = [],
  xKey = 'label',
  height = 220,
  yAxisLabel = '',
  showGrid = true,
  showLegend = true,
  curve = true,
  yMin = null,
  yMax = null,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0 || !series || series.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No trend data available
      </div>
    );
  }

  const padding = { top: 20, right: 24, bottom: 32, left: 42 };
  const chartWidth = 560;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Compute Y-min and Y-max
  const allValues = data.flatMap((d) =>
    series.map((s) => (typeof d[s.key] === 'number' ? d[s.key] : Number(d[s.key]) || 0))
  );
  const dataMin = Math.min(...allValues, 0);
  const dataMax = Math.max(...allValues, 10);
  const minVal = yMin !== null ? yMin : dataMin;
  const maxVal = yMax !== null ? yMax : Math.ceil(dataMax * 1.15);
  const valRange = maxVal - minVal || 1;

  const getX = (index) => {
    if (data.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const num = typeof val === 'number' ? val : Number(val) || 0;
    const clamped = Math.max(minVal, Math.min(maxVal, num));
    const ratio = (clamped - minVal) / valRange;
    return padding.top + innerHeight - ratio * innerHeight;
  };

  // Generate SVG path for a line
  const generateLinePath = (sKey) => {
    return data.reduce((acc, d, i) => {
      const x = getX(i);
      const y = getY(d[sKey]);
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      if (curve && i > 0) {
        const prevX = getX(i - 1);
        const prevY = getY(data[i - 1][sKey]);
        const cp1x = prevX + (x - prevX) / 2;
        const cp1y = prevY;
        const cp2x = prevX + (x - prevX) / 2;
        const cp2y = y;
        return `${acc} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      return `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  // Generate SVG path for area fill
  const generateAreaPath = (sKey) => {
    const linePath = generateLinePath(sKey);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + innerHeight;
    return `${linePath} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  };

  // Y-axis grid ticks (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = Math.round(minVal + ratio * valRange);
    const y = padding.top + innerHeight - ratio * innerHeight;
    return { val, y };
  });

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '8px', fontSize: '11.5px', color: 'var(--chair-text, #334155)' }}>
          {series.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: s.area ? '2px' : '50%', backgroundColor: s.color }} />
              <span style={{ fontWeight: 600 }}>{s.name || s.key}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={s.fillOpacity || 0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal Gridlines & Y-Ticks */}
        {showGrid &&
          yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={chartWidth - padding.right}
                y2={tick.y}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeDasharray={idx === 0 ? 'none' : '3 3'}
              />
              <text
                x={padding.left - 8}
                y={tick.y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                opacity={0.55}
                fontWeight={500}
              >
                {tick.val}
              </text>
            </g>
          ))}

        {yAxisLabel && (
          <text
            x={12}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="9.5"
            fill="currentColor"
            opacity={0.5}
            transform={`rotate(-90 12 ${padding.top + innerHeight / 2})`}
            fontWeight={600}
          >
            {yAxisLabel}
          </text>
        )}

        {/* X-Axis Labels */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <text
              key={i}
              x={x}
              y={chartHeight - padding.bottom + 16}
              textAnchor="middle"
              fontSize="10.5"
              fill="currentColor"
              opacity={hoveredIndex === i ? 0.95 : 0.6}
              fontWeight={hoveredIndex === i ? 700 : 500}
            >
              {d[xKey]}
            </text>
          );
        })}

        {/* Area Fills */}
        {series
          .filter((s) => s.area)
          .map((s) => (
            <path
              key={`area-${s.key}`}
              d={generateAreaPath(s.key)}
              fill={`url(#grad-${s.key})`}
              pointerEvents="none"
            />
          ))}

        {/* Line Paths */}
        {series.map((s) => (
          <path
            key={`line-${s.key}`}
            d={generateLinePath(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.strokeWidth || 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Interactive Dots & Tooltip Trigger Areas */}
        {data.map((d, i) => {
          const x = getX(i);
          return (
            <g key={`col-${i}`}>
              {/* Vertical Guide Line when hovered */}
              {hoveredIndex === i && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                  strokeDasharray="2 2"
                />
              )}

              {/* Data points */}
              {series.map((s) => {
                const y = getY(d[s.key]);
                const isHovered = hoveredIndex === i;
                return (
                  <circle
                    key={`dot-${s.key}-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#ffffff"
                    stroke={s.color}
                    strokeWidth={isHovered ? 2.5 : 2}
                    style={{ transition: 'r 0.15s ease' }}
                  />
                );
              })}

              {/* Wide invisible click/hover target */}
              <rect
                x={x - (innerWidth / data.length / 2 || 15)}
                y={padding.top}
                width={innerWidth / data.length || 30}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip Popup */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: `${Math.min(82, Math.max(18, (getX(hoveredIndex) / chartWidth) * 100))}%`,
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11.5px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 50,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {data[hoveredIndex][xKey]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {series.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: '#e2e8f0' }}>{s.name || s.key}:</span>
                </div>
                <strong style={{ color: '#ffffff', fontWeight: 700 }}>
                  {data[hoveredIndex][s.key] !== undefined && data[hoveredIndex][s.key] !== null ? data[hoveredIndex][s.key] : '—'}
                  {s.unit || ''}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LineChart;
