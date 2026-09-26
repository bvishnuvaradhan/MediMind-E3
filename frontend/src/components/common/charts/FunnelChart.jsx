import { useState } from 'react';

/**
 * Reusable Pure-SVG Workflow Funnel Component
 * Displays progressive clinical / operational stages with drop-off & conversion rates
 */
export function FunnelChart({
  stages = [], // [{ stage: 'Waiting Room', count: 18, pct: 100, color: '#3b82f6', subtext: 'Arrived & Checked In' }]
  height = 180,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!stages || stages.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No pipeline stages available
      </div>
    );
  }

  const chartWidth = 560;
  const chartHeight = height;
  const stageCount = stages.length;
  const stageWidth = chartWidth / stageCount;

  // Maximum value for scaling top/bottom trapezoid heights
  const maxCount = Math.max(...stages.map((s) => Number(s.count) || 0), 1);

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {stages.map((st, i) => {
          const currentCount = Number(st.count) || 0;
          const nextCount = i < stageCount - 1 ? Number(stages[i + 1].count) || 0 : currentCount * 0.85;

          const currentH = Math.max(28, (currentCount / maxCount) * (chartHeight - 70));
          const nextH = Math.max(24, (nextCount / maxCount) * (chartHeight - 70));

          const xStart = i * stageWidth + 3;
          const xEnd = (i + 1) * stageWidth - 3;
          const cy = (chartHeight - 40) / 2 + 10;

          const yTopLeft = cy - currentH / 2;
          const yBottomLeft = cy + currentH / 2;
          const yTopRight = cy - nextH / 2;
          const yBottomRight = cy + nextH / 2;

          const isHovered = hoveredIndex === i;
          const color = st.color || '#2563eb';

          const pathD = `M ${xStart} ${yTopLeft} L ${xEnd} ${yTopRight} L ${xEnd} ${yBottomRight} L ${xStart} ${yBottomLeft} Z`;

          return (
            <g key={i}>
              <path
                d={pathD}
                fill={color}
                opacity={isHovered ? 0.95 : 0.8}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
              />

              {/* Stage Count */}
              <text
                x={(xStart + xEnd) / 2}
                y={cy + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="800"
                fill="#ffffff"
                pointerEvents="none"
              >
                {st.count}
              </text>

              {/* Stage Name below */}
              <text
                x={(xStart + xEnd) / 2}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight={isHovered ? 700 : 600}
                fill="currentColor"
                opacity={isHovered ? 1 : 0.75}
              >
                {st.stage}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover/Tap Tooltip Popup */}
      {hoveredIndex !== null && stages[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: `${Math.min(80, Math.max(20, ((hoveredIndex + 0.5) / stageCount) * 100))}%`,
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '11.5px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 50,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '12px', color: '#ffffff' }}>{stages[hoveredIndex].stage}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ color: '#94a3b8' }}>Active Volume:</span>
            <strong style={{ color: '#38bdf8' }}>{stages[hoveredIndex].count} encounters</strong>
          </div>
          {stages[hoveredIndex].pct && (
            <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '2px' }}>
              {stages[hoveredIndex].pct}% clinical throughput
            </div>
          )}
          {stages[hoveredIndex].subtext && (
            <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px', opacity: 0.9 }}>
              {stages[hoveredIndex].subtext}
            </div>
          )}
        </div>
      )}

      {/* Detail row below */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stageCount}, 1fr)`, gap: '6px', marginTop: '4px', textAlign: 'center' }}>
        {stages.map((st, i) => (
          <div key={i} style={{ fontSize: '10.5px', color: 'var(--chair-muted, #94a3b8)' }}>
            {st.subtext || (st.pct ? `${st.pct}% throughput` : '')}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FunnelChart;
