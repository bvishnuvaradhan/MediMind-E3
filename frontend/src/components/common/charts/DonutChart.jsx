import { useState } from 'react';

/**
 * Reusable Pure-SVG Donut / Pie Chart Component
 */
export function DonutChart({
  data = [],
  size = 200,
  innerRadius = 55,
  outerRadius = 85,
  centerLabel = '',
  centerValue = '',
  showLegend = true,
  isPie = false,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No segment data available
      </div>
    );
  }

  const actualInnerRadius = isPie ? 0 : innerRadius;
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  if (total === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        Zero total value
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;

  // Compute angles for each slice cleanly
  const slices = data.reduce((acc, d, index) => {
    const val = Number(d.value) || 0;
    const sliceAngle = (val / total) * 2 * Math.PI;
    const startAngle = acc.prevAngle;
    const endAngle = startAngle + sliceAngle;

    const isHovered = hoveredIndex === index;
    const effOuterRadius = isHovered ? outerRadius + 4 : outerRadius;
    const effInnerRadius = isHovered && !isPie ? Math.max(0, actualInnerRadius - 2) : actualInnerRadius;

    // Outer arc points
    const x1 = cx + effOuterRadius * Math.cos(startAngle);
    const y1 = cy + effOuterRadius * Math.sin(startAngle);
    const x2 = cx + effOuterRadius * Math.cos(endAngle);
    const y2 = cy + effOuterRadius * Math.sin(endAngle);

    // Inner arc points
    const x3 = cx + effInnerRadius * Math.cos(endAngle);
    const y3 = cy + effInnerRadius * Math.sin(endAngle);
    const x4 = cx + effInnerRadius * Math.cos(startAngle);
    const y4 = cy + effInnerRadius * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    let path = '';
    if (isPie) {
      path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${effOuterRadius} ${effOuterRadius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    } else {
      path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${effOuterRadius} ${effOuterRadius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${effInnerRadius} ${effInnerRadius} 0 ${largeArcFlag} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
    }

    const percentage = Math.round((val / total) * 100);

    acc.items.push({
      ...d,
      path,
      percentage,
      val,
      index,
    });
    acc.prevAngle = endAngle;
    return acc;
  }, { prevAngle: -Math.PI / 2, items: [] }).items;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', userSelect: 'none' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
          {slices.map((slice) => (
            <path
              key={slice.index}
              d={slice.path}
              fill={slice.color}
              stroke="var(--chair-card, #ffffff)"
              strokeWidth="2"
              opacity={hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.6}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            />
          ))}

          {/* Center Text for Donut Chart */}
          {!isPie && (
            <g pointerEvents="none">
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill="currentColor"
              >
                {hoveredIndex !== null ? slices[hoveredIndex].val : centerValue || total}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="currentColor"
                opacity={0.6}
              >
                {hoveredIndex !== null
                  ? `${slices[hoveredIndex].percentage}%`
                  : centerLabel || 'Total'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '160px' }}>
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <div
                key={slice.index}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: isHovered ? 'var(--chair-soft, rgba(37,99,235,0.08))' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: slice.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: 'var(--chair-text, #334155)',
                      fontWeight: isHovered ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {slice.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                  <strong style={{ fontSize: '12px' }}>{slice.val}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--chair-muted, #94a3b8)', width: '32px', textAlign: 'right' }}>
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DonutChart;
