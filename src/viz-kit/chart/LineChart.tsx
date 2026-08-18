import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useResizeObserver } from '../map/useResizeObserver';
import { yearTicks } from './ticks';
import './LineChart.css';

export interface LineChartSeries {
  id: string;
  color: string;
  points: (number | null)[];
}

export interface LineChartProps {
  series: LineChartSeries[];
  xLabels: string[];
  /** Reveal each series only through this index; omit to draw the full series statically. */
  currentIndex?: number;
  yFormat?: (v: number) => string;
  /** Rendered at each series' current (last revealed, non-null) point. */
  markerFor?: (seriesId: string) => ReactNode;
  /** Floating tooltip content for the hovered index. Omit to disable hover entirely. */
  renderTooltip?: (index: number) => ReactNode;
  ariaLabel: string;
}

// left is generous enough to fit y-axis labels at the larger reel-mode font
// size (see LineChart.css's .viz-frame--reel override) without clipping.
const MARGIN = { top: 16, right: 16, bottom: 28, left: 80 };

export function LineChart({
  series,
  xLabels,
  currentIndex,
  yFormat,
  markerFor,
  renderTooltip,
  ariaLabel,
}: LineChartProps): ReactNode {
  const [containerRef, { width, height }] = useResizeObserver<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, Math.max(xLabels.length - 1, 1)])
        .range([0, innerWidth]),
    [xLabels.length, innerWidth],
  );

  // Domain is computed once from the full, unsliced series so the axis
  // stays fixed while a progressive reveal grows the line - no rescale jumps.
  const yScale = useMemo(() => {
    const values = series.flatMap((s) => s.points.filter((v): v is number => v !== null));
    const min = values.length ? Math.min(...values, 0) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const padding = (max - min) * 0.08 || 1;
    return scaleLinear()
      .domain([Math.max(min - padding, 0), max + padding])
      .range([innerHeight, 0]);
  }, [series, innerHeight]);

  const lineGenerator = useMemo(
    () =>
      line<number | null>()
        .defined((d) => d !== null)
        .x((_d, i) => xScale(i))
        .y((d) => yScale(d ?? 0)),
    [xScale, yScale],
  );

  const lastIndex = currentIndex ?? xLabels.length - 1;
  const xTicks = useMemo(() => yearTicks(xLabels), [xLabels]);
  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);

  const handleHover = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const index = Math.round(xScale.invert(localX));
    setHoverIndex(Math.min(Math.max(index, 0), lastIndex));
  };

  const tooltipLeft =
    hoverIndex !== null ? Math.min(Math.max(MARGIN.left + xScale(hoverIndex), 70), Math.max(width - 70, 70)) : 0;

  return (
    <div ref={containerRef} className="viz-linechart" role="img" aria-label={ariaLabel}>
      {width > 0 && height > 0 && (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {yTicks.map((t) => (
              <g key={t} transform={`translate(0,${yScale(t)})`}>
                <line className="gridline" x1={0} x2={innerWidth} />
                <text className="axis-label y-label" x={-8} dy="0.32em" textAnchor="end">
                  {yFormat ? yFormat(t) : t}
                </text>
              </g>
            ))}

            {xTicks.map((i) => (
              <text
                key={i}
                className="axis-label x-label"
                x={xScale(i)}
                y={innerHeight + 20}
                textAnchor="middle"
              >
                {xLabels[i].slice(0, 4)}
              </text>
            ))}

            {series.map((s) => {
              const visible = s.points.slice(0, lastIndex + 1);
              const d = lineGenerator(visible) ?? undefined;

              let markerIndex = -1;
              for (let i = visible.length - 1; i >= 0; i--) {
                if (visible[i] !== null) {
                  markerIndex = i;
                  break;
                }
              }

              return (
                <g key={s.id}>
                  {d && <path d={d} className="series-line" stroke={s.color} fill="none" />}
                  {markerIndex >= 0 && markerFor && (
                    <text
                      x={xScale(markerIndex)}
                      y={yScale(visible[markerIndex] as number)}
                      className="series-marker"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {markerFor(s.id)}
                    </text>
                  )}
                </g>
              );
            })}

            {hoverIndex !== null && (
              <g className="hover-layer">
                <line className="hover-guide" x1={xScale(hoverIndex)} x2={xScale(hoverIndex)} y1={0} y2={innerHeight} />
                {series.map((s) => {
                  const v = s.points[hoverIndex];
                  if (v === null) return null;
                  return (
                    <circle
                      key={s.id}
                      className="hover-dot"
                      cx={xScale(hoverIndex)}
                      cy={yScale(v)}
                      r={4}
                      fill={s.color}
                    />
                  );
                })}
              </g>
            )}

            {renderTooltip && (
              <rect
                className="hover-overlay"
                x={0}
                y={0}
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onMouseMove={handleHover}
                onMouseLeave={() => setHoverIndex(null)}
              />
            )}
          </g>
        </svg>
      )}

      {hoverIndex !== null && renderTooltip && (
        <div className="linechart-tooltip" style={{ left: tooltipLeft, top: MARGIN.top }}>
          {renderTooltip(hoverIndex)}
        </div>
      )}
    </div>
  );
}
