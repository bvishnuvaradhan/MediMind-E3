import { useState } from 'react';

/**
 * Reusable Pure-SVG Scatter Plot Component
 * Ideal for paired numerical observations (e.g. Consultation Volume vs On-Time Start Rate)
 */
export function ScatterPlot({
  data = [],
  xKey = 'x',
  yKey = 'y',
  labelKey = 'label',
  subKey = 'subtext',
  categoryKey = 'category',
  xLabel = '',
  yLabel = '',
  height = 240,
  xMin = null,
  xMax = null,
  yMin = null,
  yMax = null,
  referenceLines = [], // [{ axis: 'y', value: 95, label: '95% Benchmark', color: '#16a34a' }]
  pointColor = '#2563eb',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No scatter plot observations available
      </div>
    );
  }

  const padding = { top: 24, right: 30, bottom: 38, left: 48 };
  const chartWidth = 560;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const allX = data.map((d) => Number(d[xKey]) || 0);
  const allY = data.map((d) => Number(d[yKey]) || 0);

  const minX = xMin !== null ? xMin : Math.max(0, Math.floor(Math.min(...allX) * 0.85));
  const maxX = xMax !== null ? xMax : Math.ceil(Math.max(...allX, 10) * 1.15);
  const rangeX = maxX - minX || 1;

  const minY = yMin !== null ? yMin : Math.max(0, Math.floor(Math.min(...allY) * 0.9));
  const maxY = yMax !== null ? yMax : Math.ceil(Math.max(...allY, 100) * 1.05);
  const rangeY = maxY - minY || 1;

  const getX = (val) => padding.left + ((val - minX) / rangeX) * innerWidth;
  const getY = (val) => padding.top + innerHeight - ((val - minY) / rangeY) * innerHeight;

  // Grid ticks
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = Math.round(minX + ratio * rangeX);
    const x = padding.left + ratio * innerWidth;
    return { val, x };
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = Math.round(minY + ratio * rangeY);
    const y = padding.top + innerHeight - ratio * innerHeight;
    return { val, y };
  });

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        {/* Horizontal Gridlines */}
        {yTicks.map((tick, idx) => (
          <g key={`y-${idx}`}>
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
              fontSize="9.5"
              fill="currentColor"
              opacity={0.55}
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* Vertical Gridlines */}
        {xTicks.map((tick, idx) => (
          <g key={`x-${idx}`}>
            <line
              x1={tick.x}
              y1={padding.top}
              x2={tick.x}
              y2={padding.top + innerHeight}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeDasharray={idx === 0 ? 'none' : '3 3'}
            />
            <text
              x={tick.x}
              y={chartHeight - padding.bottom + 16}
              textAnchor="middle"
              fontSize="9.5"
              fill="currentColor"
              opacity={0.55}
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* Reference lines */}
        {referenceLines.map((ref, idx) => {
          if (ref.axis === 'y') {
            const y = getY(ref.value);
            return (
              <g key={`ref-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke={ref.color || '#16a34a'}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartWidth - padding.right}
                  y={y - 4}
                  textAnchor="end"
                  fontSize="9"
                  fill={ref.color || '#16a34a'}
                  fontWeight={700}
                >
                  {ref.label || `${ref.value}`}
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Axis Labels */}
        {yLabel && (
          <text
            x={14}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            opacity={0.65}
            transform={`rotate(-90 14 ${padding.top + innerHeight / 2})`}
            fontWeight={600}
          >
            {yLabel}
          </text>
        )}
        {xLabel && (
          <text
            x={padding.left + innerWidth / 2}
            y={chartHeight - 4}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            opacity={0.65}
            fontWeight={600}
          >
            {xLabel}
          </text>
        )}

        {/* Scatter Points */}
        {data.map((d, i) => {
          const xVal = Number(d[xKey]) || 0;
          const yVal = Number(d[yKey]) || 0;
          const px = getX(xVal);
          const py = getY(yVal);
          const isHovered = hoveredPoint && hoveredPoint.index === i;
          const color = d.color || pointColor;

          return (
            <g key={i}>
              <circle
                cx={px}
                cy={py}
                r={isHovered ? 7 : 5}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
                opacity={isHovered ? 1 : 0.85}
                onMouseEnter={() =>
                  setHoveredPoint({
                    index: i,
                    label: d[labelKey] || `Point ${i + 1}`,
                    sub: d[subKey],
                    category: d[categoryKey],
                    xVal,
                    yVal,
                    px,
                    py,
                  })
                }
                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip Popup */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${Math.min(80, Math.max(15, (hoveredPoint.px / chartWidth) * 100))}%`,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--chair-card, #1e293b)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '12px' }}>{hoveredPoint.label}</div>
          {hoveredPoint.sub && <div style={{ fontSize: '10px', opacity: 0.75 }}>{hoveredPoint.sub}</div>}
          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>
              <span>{xLabel || 'X'}: </span>
              <strong>{hoveredPoint.xVal}</strong>
            </div>
            <div>
              <span>{yLabel || 'Y'}: </span>
              <strong>{hoveredPoint.yVal}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScatterPlot;
