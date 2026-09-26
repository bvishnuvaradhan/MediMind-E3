/**
 * Reusable Pure-SVG Radial Gauge Component
 * Semi-circular (180°) or 240° arc gauge with target zones and needle / arc fill
 */
export function RadialGauge({
  value = 0,
  min = 0,
  max = 100,
  unit = '',
  label = '',
  subtext = '',
  size = 180,
  color = '#2563eb',
  trackColor = 'rgba(0,0,0,0.08)',
  arcType = 'half', // 'half' (180°) or 'full' (240°)
}) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const clamped = Math.max(min, Math.min(max, numValue));
  const ratio = (clamped - min) / (max - min || 1);

  const cx = size / 2;
  const cy = arcType === 'half' ? size * 0.7 : size / 2;
  const radius = size * 0.38;
  const strokeWidth = 14;

  const startAngle = arcType === 'half' ? -Math.PI : -Math.PI * 1.15;
  const endAngle = arcType === 'half' ? 0 : Math.PI * 0.15;
  const totalAngle = endAngle - startAngle;

  const currentAngle = startAngle + ratio * totalAngle;

  // Background arc path
  const xStart = cx + radius * Math.cos(startAngle);
  const yStart = cy + radius * Math.sin(startAngle);
  const xEnd = cx + radius * Math.cos(endAngle);
  const yEnd = cy + radius * Math.sin(endAngle);
  const bgLargeArc = totalAngle > Math.PI ? 1 : 0;
  const bgPath = `M ${xStart.toFixed(2)} ${yStart.toFixed(2)} A ${radius} ${radius} 0 ${bgLargeArc} 1 ${xEnd.toFixed(2)} ${yEnd.toFixed(2)}`;

  // Value arc path
  const xVal = cx + radius * Math.cos(currentAngle);
  const yVal = cy + radius * Math.sin(currentAngle);
  const valLargeArc = (currentAngle - startAngle) > Math.PI ? 1 : 0;
  const valPath = `M ${xStart.toFixed(2)} ${yStart.toFixed(2)} A ${radius} ${radius} 0 ${valLargeArc} 1 ${xVal.toFixed(2)} ${yVal.toFixed(2)}`;

  const svgHeight = arcType === 'half' ? size * 0.75 : size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      <svg viewBox={`0 0 ${size} ${svgHeight}`} style={{ width: size, height: svgHeight, display: 'block', overflow: 'visible' }}>
        {/* Background Track */}
        <path
          d={bgPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value Arc */}
        {ratio > 0.01 && (
          <path
            d={valPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        )}

        {/* Center Text Readout */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={size * 0.16}
          fontWeight="800"
          fill="currentColor"
        >
          {value}{unit}
        </text>

        {label && (
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fontSize={size * 0.075}
            fontWeight="600"
            fill="currentColor"
            opacity={0.65}
          >
            {label}
          </text>
        )}
      </svg>

      {subtext && (
        <div style={{ fontSize: '11px', color: 'var(--chair-muted, #94a3b8)', marginTop: '4px', textAlign: 'center' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

export default RadialGauge;
