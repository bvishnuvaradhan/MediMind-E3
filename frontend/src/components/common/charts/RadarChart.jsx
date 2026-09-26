import { useState } from 'react';

/**
 * Reusable Pure-SVG Radar / Spider Chart Component
 * Supports:
 * - Combined 4-Model Multidimensional Calibration Radar with interactive focus & dimming
 * - Synchronized 4-Panel Grid Mode (one dedicated radar per model on identical 0-100% scale)
 */
export function RadarChart({
  metrics = ['Accuracy', 'Sensitivity', 'Specificity', 'Uptime'],
  data = [], // [{ name: 'Fracture Detection', values: [98.4, 98.1, 98.8, 99.9], color: '#2563eb' }]
  size = 230,
  maxVal = 100,
  showLegend = true,
  allowModeToggle = true,
  initialMode = 'combined', // 'combined' | 'grid'
}) {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [selectedSeries, setSelectedSeries] = useState(null); // click-pinned or hovered series
  const [hoveredVertex, setHoveredVertex] = useState(null); // { seriesName, metric, value, color }

  if (!metrics || metrics.length === 0 || !data || data.length === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chair-muted, #94a3b8)', fontSize: '12px' }}>
        No radar metrics available
      </div>
    );
  }

  const numAxes = metrics.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Single radar geometry generator
  const getCoordinates = (centerXY, rRadius, axisIdx, value) => {
    const angle = axisIdx * angleStep - Math.PI / 2;
    const r = (value / maxVal) * rRadius;
    return {
      x: centerXY + r * Math.cos(angle),
      y: centerXY + r * Math.sin(angle),
    };
  };

  const levels = [0.33, 0.66, 1.0];

  // Render a single standalone or mini radar
  const renderRadarSvg = (seriesList, svgSize, isMini = false) => {
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const radius = isMini ? svgSize * 0.32 : svgSize * 0.35;

    return (
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ width: svgSize, height: svgSize, display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHoveredVertex(null)}
      >
        {/* Concentric Grid Web Polygons */}
        {levels.map((lvl, lIdx) => {
          const polyPoints = metrics
            .map((_, i) => {
              const pt = getCoordinates(cx, radius, i, maxVal * lvl);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <polygon
              key={`lvl-${lIdx}`}
              points={polyPoints}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray={lIdx < 2 ? '2 2' : 'none'}
            />
          );
        })}

        {/* Radial Axis Spokes & Metric Labels */}
        {metrics.map((metric, i) => {
          const edgePt = getCoordinates(cx, radius, i, maxVal);
          const labelDist = isMini ? maxVal * 1.3 : maxVal * 1.22;
          const labelPt = getCoordinates(cx, radius, i, labelDist);

          return (
            <g key={`axis-${i}`}>
              <line
                x1={cx}
                y1={cy}
                x2={edgePt.x}
                y2={edgePt.y}
                stroke="currentColor"
                strokeOpacity={0.14}
              />
              <text
                x={labelPt.x}
                y={labelPt.y + 3.5}
                textAnchor="middle"
                fontSize={isMini ? '8.5' : '9.5'}
                fontWeight="700"
                fill="currentColor"
                opacity={0.8}
              >
                {metric}
              </text>
            </g>
          );
        })}

        {/* Series Polygons */}
        {seriesList.map((series, sIdx) => {
          const polyPoints = series.values
            .map((val, i) => {
              const pt = getCoordinates(cx, radius, i, val);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');

          const isFocused = selectedSeries === null || selectedSeries === series.name;
          const isDirectlyHovered = selectedSeries === series.name;

          const fillOpacity = isDirectlyHovered ? 0.38 : isFocused ? (isMini ? 0.3 : 0.16) : 0.04;
          const strokeOpacity = isFocused ? 1 : 0.2;
          const strokeWidth = isDirectlyHovered ? 3 : isFocused ? 2.2 : 1.2;

          return (
            <g key={`s-${sIdx}`} style={{ transition: 'all 0.2s ease' }}>
              <polygon
                points={polyPoints}
                fill={series.color}
                fillOpacity={fillOpacity}
                stroke={series.color}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinejoin="round"
                onMouseEnter={() => setSelectedSeries(series.name)}
                style={{ cursor: 'pointer' }}
              />
              {/* Vertex Dots */}
              {series.values.map((val, i) => {
                const pt = getCoordinates(cx, radius, i, val);
                const isVertexHovered =
                  hoveredVertex &&
                  hoveredVertex.seriesName === series.name &&
                  hoveredVertex.metric === metrics[i];

                return (
                  <circle
                    key={`p-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isVertexHovered ? 6 : isFocused ? (isMini ? 3.5 : 4) : 2.5}
                    fill="#ffffff"
                    stroke={series.color}
                    strokeWidth={isVertexHovered ? 2.5 : 1.8}
                    strokeOpacity={strokeOpacity}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setSelectedSeries(series.name);
                      setHoveredVertex({
                        seriesName: series.name,
                        metric: metrics[i],
                        value: val,
                        color: series.color,
                      });
                    }}
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      {/* Controls & Mode Toggle Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
        {allowModeToggle && (
          <div style={{ display: 'inline-flex', padding: '2px', backgroundColor: 'var(--chair-bg, rgba(0,0,0,0.06))', borderRadius: '6px', border: '1px solid var(--chair-border, rgba(0,0,0,0.1))' }}>
            <button
              type="button"
              onClick={() => { setActiveMode('combined'); setSelectedSeries(null); }}
              style={{
                border: 'none',
                background: activeMode === 'combined' ? 'var(--chair-card, #ffffff)' : 'transparent',
                color: activeMode === 'combined' ? 'var(--chair-indigo, #2563eb)' : 'var(--chair-muted, #64748b)',
                fontWeight: activeMode === 'combined' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: activeMode === 'combined' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Unified Overlay
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('grid'); setSelectedSeries(null); }}
              style={{
                border: 'none',
                background: activeMode === 'grid' ? 'var(--chair-card, #ffffff)' : 'transparent',
                color: activeMode === 'grid' ? 'var(--chair-indigo, #2563eb)' : 'var(--chair-muted, #64748b)',
                fontWeight: activeMode === 'grid' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: activeMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              4-Panel Grid
            </button>
          </div>
        )}

        {/* Legend / Interactive Filter Pills */}
        {showLegend && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {data.map((d) => {
              const isSelected = selectedSeries === d.name;
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => setSelectedSeries(isSelected ? null : d.name)}
                  onMouseEnter={() => setSelectedSeries(d.name)}
                  onMouseLeave={() => { if (!selectedSeries || selectedSeries === d.name) setSelectedSeries(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1.5px solid ${isSelected ? d.color : 'transparent'}`,
                    backgroundColor: isSelected ? 'rgba(37,99,235,0.08)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '11px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: isSelected ? 800 : 600, color: 'var(--chair-text, #334155)', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* COMBINED OVERLAY MODE */}
      {activeMode === 'combined' && (
        <div style={{ position: 'relative', width: size, height: size, margin: '6px auto' }}>
          {renderRadarSvg(data, size, false)}

          {/* Interactive Vertex Tooltip Popup */}
          {hoveredVertex && (
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '7px 12px',
                borderRadius: '7px',
                fontSize: '11px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none',
                zIndex: 60,
                whiteSpace: 'nowrap',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hoveredVertex.color }} />
              <div>
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{hoveredVertex.seriesName}</span>
                <span style={{ color: '#94a3b8', margin: '0 4px' }}>·</span>
                <span style={{ color: '#cbd5e1' }}>{hoveredVertex.metric}:</span>
              </div>
              <strong style={{ color: '#38bdf8', fontSize: '12px' }}>{hoveredVertex.value}%</strong>
            </div>
          )}
        </div>
      )}

      {/* SYNCHRONIZED 4-PANEL GRID MODE */}
      {activeMode === 'grid' && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginTop: '8px' }}>
          {data.map((series) => (
            <div
              key={series.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'var(--chair-card, #ffffff)',
                border: '1px solid var(--chair-border, #e2e8f0)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: series.color }} />
                <strong style={{ fontSize: '11.5px', color: 'var(--chair-text, #1e293b)' }}>{series.name}</strong>
              </div>
              {renderRadarSvg([series], 140, true)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RadarChart;
