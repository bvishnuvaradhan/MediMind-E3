import { useState } from 'react';

/**
 * Reusable Pure-SVG 2D Matrix Activity Heatmap Component
 * Displays grid matrix of intensity values (e.g. Weekday vs Hourly Appointment Volume)
 */
export function HeatmapChart({
  xLabels = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM'],
  yLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  matrix = [], // 2D array matrix[yIdx][xIdx] = number
  color = '#2563eb',
  title = '',
  height = 180,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!matrix || matrix.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No heatmap matrix available
      </div>
    );
  }

  const chartWidth = 560;
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 28, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const numCols = xLabels.length;
  const numRows = yLabels.length;
  const cellWidth = innerWidth / numCols;
  const cellHeight = innerHeight / numRows;

  // Flatten matrix to find max value
  const allVals = matrix.flatMap((row) => row);
  const maxVal = Math.max(...allVals, 1);

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {title && (
        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--chair-text, #334155)' }}>
          {title}
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Y-axis Labels */}
        {yLabels.map((yLabel, yIdx) => {
          const y = padding.top + yIdx * cellHeight + cellHeight / 2 + 4;
          return (
            <text
              key={`y-${yIdx}`}
              x={padding.left - 8}
              y={y}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              opacity={0.7}
              fontWeight={600}
            >
              {yLabel}
            </text>
          );
        })}

        {/* X-axis Labels */}
        {xLabels.map((xLabel, xIdx) => {
          const x = padding.left + xIdx * cellWidth + cellWidth / 2;
          return (
            <text
              key={`x-${xIdx}`}
              x={x}
              y={chartHeight - padding.bottom + 16}
              textAnchor="middle"
              fontSize="9.5"
              fill="currentColor"
              opacity={0.7}
              fontWeight={600}
            >
              {xLabel}
            </text>
          );
        })}

        {/* Matrix Grid Cells */}
        {matrix.map((row, yIdx) =>
          row.map((val, xIdx) => {
            const x = padding.left + xIdx * cellWidth + 2;
            const y = padding.top + yIdx * cellHeight + 2;
            const w = cellWidth - 4;
            const h = cellHeight - 4;

            const intensity = val > 0 ? Math.max(0.12, val / maxVal) : 0.04;
            const isHovered =
              hoveredCell && hoveredCell.xIdx === xIdx && hoveredCell.yIdx === yIdx;

            return (
              <g key={`c-${yIdx}-${xIdx}`}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={4}
                  fill={color}
                  opacity={isHovered ? 1 : intensity}
                  onMouseEnter={() =>
                    setHoveredCell({
                      xIdx,
                      yIdx,
                      xLabel: xLabels[xIdx],
                      yLabel: yLabels[yIdx],
                      val,
                      x: x + w / 2,
                    })
                  }
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                />
                {w > 26 && h > 14 && val > 0 && (
                  <text
                    x={x + w / 2}
                    y={y + h / 2 + 3.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={intensity > 0.55 ? '#ffffff' : 'currentColor'}
                    opacity={intensity > 0.55 ? 1 : 0.85}
                    fontWeight={700}
                    pointerEvents="none"
                  >
                    {val}
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: `${Math.min(82, Math.max(18, (hoveredCell.x / chartWidth) * 100))}%`,
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11.5px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 50,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <span style={{ color: '#94a3b8' }}>{hoveredCell.yLabel} · {hoveredCell.xLabel}: </span>
          <strong style={{ color: '#38bdf8' }}>{hoveredCell.val}</strong>
          <span style={{ color: '#e2e8f0', marginLeft: '4px' }}>consultations</span>
        </div>
      )}
    </div>
  );
}

export default HeatmapChart;
