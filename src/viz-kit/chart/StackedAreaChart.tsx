import { useCallback, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { scaleLinear } from 'd3-scale';
import { area } from 'd3-shape';
import { useResizeObserver } from '../map/useResizeObserver';
import './StackedAreaChart.css';

export interface StackedAreaSeries {
  id: string;
  label: string;
  color: string;
  /** Full, unsliced raw values, one per xLabels entry. */
  values: number[];
}

export interface StackedAreaChartProps {
  series: StackedAreaSeries[];
  xLabels: string[];
  /** Reveal only through this year index; the x-axis itself grows to fit. Omit to show the full range statically. */
  currentIndex?: number;
  /** Floating tooltip content for the hovered year index. Omit to disable hover entirely. */
  renderTooltip?: (index: number) => ReactNode;
  ariaLabel: string;
}

interface Segment {
  y0: number;
  y1: number;
  value: number;
  fraction: number;
}

const MARGIN_BASE = { top: 16, right: 16, bottom: 28, left: 40 };
const MIN_MARGIN_LEFT = 40;
const MAX_MARGIN_LEFT = 60;
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

export function StackedAreaChart({
  series,
  xLabels,
  currentIndex,
  renderTooltip,
  ariaLabel,
}: StackedAreaChartProps): ReactNode {
  const [containerRef, { width, height }] = useResizeObserver<HTMLDivElement>();
  const [hoverPos, setHoverPos] = useState<number | null>(null);

  const MARGIN = useMemo(
    () => ({ ...MARGIN_BASE, left: Math.max(MIN_MARGIN_LEFT, Math.min(MAX_MARGIN_LEFT, width * 0.12)) }),
    [width],
  );

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);

  // Per-year cumulative stacking offsets (as 0-1 fractions of that year's
  // total), computed for every year up front - not just the visible ones -
  // so a series' band position never jumps as more years are revealed.
  const stacked = useMemo<Segment[][]>(
    () =>
      xLabels.map((_, y) => {
        const total = series.reduce((sum, s) => sum + s.values[y], 0);
        let cumulative = 0;
        return series.map((s) => {
          const value = s.values[y];
          const fraction = total > 0 ? value / total : 0;
          const y0 = cumulative;
          const y1 = cumulative + fraction;
          cumulative = y1;
          return { y0, y1, value, fraction };
        });
      }),
    [series, xLabels],
  );

  const lastIndex = currentIndex ?? xLabels.length - 1;
  // At least 2 points are needed for a fillable area; with only one year
  // revealed, that single year's stack is duplicated at both x positions,
  // painting a solid full-width block that "unfurls" as more years appear.
  const pointCount = Math.max(lastIndex + 1, 2);
  const realIndexFor = useCallback((i: number) => Math.min(i, lastIndex), [lastIndex]);

  const xScale = useMemo(
    () => scaleLinear().domain([0, pointCount - 1]).range([0, innerWidth]),
    [pointCount, innerWidth],
  );
  const yScale = useMemo(() => scaleLinear().domain([0, 1]).range([innerHeight, 0]), [innerHeight]);

  const points = useMemo(() => Array.from({ length: pointCount }, (_, i) => i), [pointCount]);

  const areas = useMemo(
    () =>
      series.map((s, si) => {
        const gen = area<number>()
          .x((d) => xScale(d))
          .y0((d) => yScale(stacked[realIndexFor(d)][si].y0))
          .y1((d) => yScale(stacked[realIndexFor(d)][si].y1));
        return { id: s.id, color: s.color, d: gen(points) ?? undefined };
      }),
    [series, stacked, points, xScale, yScale, realIndexFor],
  );

  // Centers each year's tick under the average position of every point that
  // maps to it - only relevant for the single-year case, where positions 0
  // and 1 both map to year 0 and the label should sit in the middle.
  const xTicks = useMemo(() => {
    const positionsByYear = new Map<number, number[]>();
    points.forEach((i) => {
      const real = realIndexFor(i);
      const list = positionsByYear.get(real) ?? [];
      list.push(i);
      positionsByYear.set(real, list);
    });
    return [...positionsByYear.entries()].map(([realIdx, positions]) => ({
      realIdx,
      x: xScale(positions.reduce((a, b) => a + b, 0) / positions.length),
    }));
  }, [points, xScale, realIndexFor]);

  const handleHover = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const pos = Math.round(xScale.invert(localX));
    setHoverPos(Math.min(Math.max(pos, 0), pointCount - 1));
  };

  const hoverRealIndex = hoverPos !== null ? realIndexFor(hoverPos) : null;
  const tooltipLeft =
    hoverPos !== null ? Math.min(Math.max(MARGIN.left + xScale(hoverPos), 70), Math.max(width - 70, 70)) : 0;

  return (
    <div ref={containerRef} className="viz-stackedarea" role="img" aria-label={ariaLabel}>
      {width > 0 && height > 0 && (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {Y_TICKS.map((t) => (
              <g key={t} transform={`translate(0,${yScale(t)})`}>
                <line className="gridline" x1={0} x2={innerWidth} />
                <text className="axis-label y-label" x={-8} dy="0.32em" textAnchor="end">
                  {Math.round(t * 100)}%
                </text>
              </g>
            ))}

            {areas.map((a) => a.d && <path key={a.id} d={a.d} className="area-segment" fill={a.color} />)}

            {xTicks.map(({ realIdx, x }) => (
              <text key={realIdx} className="axis-label x-label" x={x} y={innerHeight + 20} textAnchor="middle">
                {xLabels[realIdx]}
              </text>
            ))}

            {hoverRealIndex !== null && hoverPos !== null && (
              <g className="hover-layer">
                <line className="hover-guide" x1={xScale(hoverPos)} x2={xScale(hoverPos)} y1={0} y2={innerHeight} />
                {series.map((s, si) => {
                  const seg = stacked[hoverRealIndex][si];
                  if (seg.fraction <= 0) return null;
                  return (
                    <circle
                      key={s.id}
                      className="hover-dot"
                      cx={xScale(hoverPos)}
                      cy={yScale((seg.y0 + seg.y1) / 2)}
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
                onMouseLeave={() => setHoverPos(null)}
              />
            )}
          </g>
        </svg>
      )}

      {hoverRealIndex !== null && renderTooltip && (
        <div className="stackedarea-tooltip" style={{ left: tooltipLeft, top: MARGIN.top }}>
          {renderTooltip(hoverRealIndex)}
        </div>
      )}
    </div>
  );
}
