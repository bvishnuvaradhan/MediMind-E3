import { useState } from 'react';

/**
 * Reusable Pure-SVG Bar Chart Component
 * Supports:
 * - Vertical Grouped Bars
 * - Vertical Stacked Bars (100% or absolute)
 * - Horizontal Bars
 */
export function BarChart({
  data = [],
  series = [],
  xKey = 'label',
  layout = 'vertical', // 'vertical' | 'horizontal'
  mode = 'grouped', // 'grouped' | 'stacked' | 'simple'
  height = 220,
  yAxisLabel = '',
  showGrid = true,
  showLegend = true,
  showValues = true,
  yMax = null,
}) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!data || data.length === 0 || !series || series.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No bar chart data available
      </div>
    );
  }

  const chartWidth = 560;
  const chartHeight = height;

  if (layout === 'horizontal') {
    const padding = { top: 16, right: 36, bottom: 24, left: 110 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Find max value across all data items
    const allValues = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0));
    const maxVal = yMax !== null ? yMax : Math.max(...allValues, 10) * 1.12;

    const barGroupHeight = innerHeight / data.length;
    const barHeight = Math.max(8, Math.min(22, (barGroupHeight * 0.7) / series.length));

    return (
      <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
        {showLegend && series.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '8px', fontSize: '11.5px' }}>
            {series.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: s.color }} />
                <span style={{ fontWeight: 600 }}>{s.name || s.key}</span>
              </div>
            ))}
          </div>
        )}

        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Vertical Gridlines */}
          {showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const x = padding.left + ratio * innerWidth;
              const val = Math.round(ratio * maxVal);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + innerHeight}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={x}
                    y={chartHeight - padding.bottom + 14}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="currentColor"
                    opacity={0.5}
                  >
                    {val}
                  </text>
                </g>
              );
            })}

          {/* Rows */}
          {data.map((d, dIdx) => {
            const groupY = padding.top + dIdx * barGroupHeight;
            const centerY = groupY + barGroupHeight / 2;

            return (
              <g key={dIdx}>
                {/* Category label */}
                <text
                  x={padding.left - 10}
                  y={centerY + 4}
                  textAnchor="end"
                  fontSize="10.5"
                  fill="currentColor"
                  opacity={0.85}
                  fontWeight={600}
                >
                  {d[xKey]}
                </text>

                {/* Bars in group */}
                {series.map((s, sIdx) => {
                  const val = Number(d[s.key]) || 0;
                  const barWidth = Math.max(2, (val / maxVal) * innerWidth);
                  const barY =
                    centerY - (series.length * barHeight) / 2 + sIdx * barHeight;

                  const isHovered =
                    hoveredItem &&
                    hoveredItem.dataIndex === dIdx &&
                    hoveredItem.seriesKey === s.key;

                  return (
                    <g key={s.key}>
                      <rect
                        x={padding.left}
                        y={barY}
                        width={barWidth}
                        height={barHeight - 2}
                        rx={3}
                        fill={s.color}
                        opacity={isHovered ? 1 : 0.88}
                        onMouseEnter={() =>
                          setHoveredItem({ dataIndex: dIdx, seriesKey: s.key, val, label: d[xKey], sName: s.name || s.key })
                        }
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                      />
                      {showValues && (
                        <text
                          x={padding.left + barWidth + 5}
                          y={barY + barHeight / 2 + 1}
                          textAnchor="start"
                          fontSize="9.5"
                          fill="currentColor"
                          opacity={0.75}
                          fontWeight={600}
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Horizontal Tooltip */}
        {hoveredItem && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '12px',
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              zIndex: 50,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <span style={{ color: '#94a3b8', marginRight: '6px' }}>{hoveredItem.label}:</span>
            <strong style={{ color: '#ffffff' }}>{hoveredItem.val}</strong>
            <span style={{ color: '#cbd5e1', marginLeft: '4px' }}>({hoveredItem.sName})</span>
          </div>
        )}
      </div>
    );
  }

  // Vertical layout (default)
  const padding = { top: 20, right: 24, bottom: 34, left: 42 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  let maxVal = 10;
  if (mode === 'stacked') {
    const stackSums = data.map((d) =>
      series.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0)
    );
    maxVal = yMax !== null ? yMax : Math.max(...stackSums, 10) * 1.12;
  } else {
    const allVals = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0));
    maxVal = yMax !== null ? yMax : Math.max(...allVals, 10) * 1.15;
  }

  const groupWidth = innerWidth / data.length;
  const barWidth =
    mode === 'stacked'
      ? Math.min(36, groupWidth * 0.5)
      : Math.min(22, (groupWidth * 0.7) / series.length);

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = Math.round(ratio * maxVal);
    const y = padding.top + innerHeight - ratio * innerHeight;
    return { val, y };
  });

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {showLegend && series.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '8px', fontSize: '11.5px' }}>
          {series.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: s.color }} />
              <span style={{ fontWeight: 600 }}>{s.name || s.key}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Horizontal Gridlines */}
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

        {/* Groups */}
        {data.map((d, dIdx) => {
          const groupCenterX = padding.left + dIdx * groupWidth + groupWidth / 2;

          return (
            <g key={dIdx}>
              {/* X-axis category label */}
              <text
                x={groupCenterX}
                y={chartHeight - padding.bottom + 16}
                textAnchor="middle"
                fontSize="10.5"
                fill="currentColor"
                opacity={0.75}
                fontWeight={600}
              >
                {d[xKey]}
              </text>

              {/* Grouped mode */}
              {mode !== 'stacked' &&
                series.map((s, sIdx) => {
                  const val = Number(d[s.key]) || 0;
                  const barH = Math.max(2, (val / maxVal) * innerHeight);
                  const barX =
                    groupCenterX -
                    (series.length * barWidth) / 2 +
                    sIdx * barWidth;
                  const barY = padding.top + innerHeight - barH;

                  const isHovered =
                    hoveredItem &&
                    hoveredItem.dataIndex === dIdx &&
                    hoveredItem.seriesKey === s.key;

                  return (
                    <g key={s.key}>
                      <rect
                        x={barX + 1}
                        y={barY}
                        width={barWidth - 2}
                        height={barH}
                        rx={3}
                        fill={s.color}
                        opacity={isHovered ? 1 : 0.85}
                        onMouseEnter={() =>
                          setHoveredItem({
                            dataIndex: dIdx,
                            seriesKey: s.key,
                            val,
                            label: d[xKey],
                            sName: s.name || s.key,
                            x: groupCenterX,
                          })
                        }
                        style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                      />
                      {showValues && barH > 14 && (
                        <text
                          x={barX + barWidth / 2}
                          y={barY - 4}
                          textAnchor="middle"
                          fontSize="9"
                          fill="currentColor"
                          opacity={0.8}
                          fontWeight={600}
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Stacked mode */}
              {mode === 'stacked' &&
                (() => {
                  let currentY = padding.top + innerHeight;
                  return series.map((s) => {
                    const val = Number(d[s.key]) || 0;
                    const barH = (val / maxVal) * innerHeight;
                    currentY -= barH;
                    const barX = groupCenterX - barWidth / 2;

                    return (
                      <rect
                        key={s.key}
                        x={barX}
                        y={currentY}
                        width={barWidth}
                        height={Math.max(1, barH)}
                        fill={s.color}
                        opacity={0.9}
                        onMouseEnter={() =>
                          setHoveredItem({
                            dataIndex: dIdx,
                            seriesKey: s.key,
                            val,
                            label: d[xKey],
                            sName: s.name || s.key,
                            x: groupCenterX,
                          })
                        }
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  });
                })()}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredItem && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: `${Math.min(82, Math.max(18, (hoveredItem.x / chartWidth) * 100))}%`,
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
          <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{hoveredItem.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ color: '#cbd5e1' }}>{hoveredItem.sName}:</span>
            <strong style={{ color: '#ffffff', fontSize: '12px' }}>{hoveredItem.val}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarChart;
