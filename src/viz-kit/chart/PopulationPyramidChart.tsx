import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { scaleLinear } from 'd3-scale';
import { useResizeObserver } from '../map/useResizeObserver';
import './PopulationPyramidChart.css';

export interface PyramidBin {
  id: string;
  leftValue: number;
  rightValue: number;
  /** Shown in the left column of the central axis gutter (e.g. the age). */
  primaryLabel: string;
  /** Shown in the right column of the central axis gutter (e.g. the birth year). */
  secondaryLabel: string;
}

export interface PopulationPyramidChartProps {
  /** Ordered bottom-to-top: index 0 is the bottom row. */
  bins: PyramidBin[];
  leftColor: string;
  rightColor: string;
  /**
   * Darker shade painted over the outer tip of whichever side is ahead in a
   * row - the amount by which it exceeds the other side at the same row.
   * Omit either to disable the surplus highlight on that side.
   */
  leftSurplusColor?: string;
  rightSurplusColor?: string;
  /** Fixed magnitude-axis ceiling so the scale doesn't jump between frames; defaults to the max across bins. */
  maxValue?: number;
  valueFormat?: (v: number) => string;
  /** Floating tooltip content for the hovered row index. Omit to disable hover entirely. */
  renderTooltip?: (index: number) => ReactNode;
  ariaLabel: string;
}

const MARGIN = { top: 16, right: 16, bottom: 28, left: 16 };
const GUTTER_PADDING_PX = 10;
const GUTTER_COLUMN_GAP_PX = 6;
const TICK_LABEL_GAP_PX = 10;
const FALLBACK_ROW_LABEL_HEIGHT_PX = 14;
const FALLBACK_GUTTER_HALF_PX = 30;
const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100];

function niceStep(raw: number): number {
  const found = NICE_STEPS.find((s) => s >= raw);
  if (found !== undefined) return found;
  const last = NICE_STEPS[NICE_STEPS.length - 1];
  return last * Math.ceil(raw / last);
}

const defaultValueFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format;

export function PopulationPyramidChart({
  bins,
  leftColor,
  rightColor,
  leftSurplusColor,
  rightSurplusColor,
  maxValue,
  valueFormat = defaultValueFormat,
  renderTooltip,
  ariaLabel,
}: PopulationPyramidChartProps): ReactNode {
  const [containerRef, { width, height }] = useResizeObserver<HTMLDivElement>();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const primaryProbeRef = useRef<SVGTextElement>(null);
  const secondaryProbeRef = useRef<SVGTextElement>(null);
  const [rowLabelHeight, setRowLabelHeight] = useState(FALLBACK_ROW_LABEL_HEIGHT_PX);
  const [gutterHalfWidths, setGutterHalfWidths] = useState({
    primary: FALLBACK_GUTTER_HALF_PX,
    secondary: FALLBACK_GUTTER_HALF_PX,
  });

  const longestPrimary = useMemo(
    () => bins.reduce((longest, b) => (b.primaryLabel.length > longest.length ? b.primaryLabel : longest), ''),
    [bins],
  );
  const longestSecondary = useMemo(
    () => bins.reduce((longest, b) => (b.secondaryLabel.length > longest.length ? b.secondaryLabel : longest), ''),
    [bins],
  );

  useLayoutEffect(() => {
    const primaryNode = primaryProbeRef.current;
    const secondaryNode = secondaryProbeRef.current;
    if (!primaryNode || !secondaryNode) return;
    const primaryBox = primaryNode.getBBox();
    const secondaryBox = secondaryNode.getBBox();
    setRowLabelHeight(Math.max(primaryBox.height, secondaryBox.height));
    setGutterHalfWidths({ primary: primaryBox.width, secondary: secondaryBox.width });
  }, [longestPrimary, longestSecondary, width]);

  const gutterWidth =
    gutterHalfWidths.primary + gutterHalfWidths.secondary + GUTTER_COLUMN_GAP_PX + GUTTER_PADDING_PX * 2;

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = Math.max(height - MARGIN.top - MARGIN.bottom, 0);
  const halfWidth = Math.max((innerWidth - gutterWidth) / 2, 0);
  const centerX = innerWidth / 2;
  // Fixed boundaries where each side's bars anchor, against the gutter -
  // not against centerX ± halfWidth, which would double-count the gutter.
  const leftEdge = centerX - gutterWidth / 2;
  const rightEdge = centerX + gutterWidth / 2;

  const domainMax = maxValue ?? Math.max(1, ...bins.map((b) => Math.max(b.leftValue, b.rightValue)));
  const magnitudeScale = useMemo(() => scaleLinear().domain([0, domainMax]).range([0, halfWidth]), [domainMax, halfWidth]);

  const rowHeight = bins.length > 0 ? innerHeight / bins.length : 0;
  const rowTop = (i: number) => innerHeight - (i + 1) * rowHeight;
  const rowCenter = (i: number) => innerHeight - (i + 0.5) * rowHeight;

  // Central axis rows are thinned to whatever vertical density actually
  // fits (measured from the real rendered font, so web vs. reel both work);
  // the top and bottom rows are always kept, and any regular-interval row
  // that would crowd against them is dropped instead.
  const visibleRowTicks = useMemo(() => {
    if (bins.length === 0) return [];
    const minGap = rowLabelHeight + TICK_LABEL_GAP_PX;
    const maxTicks = Math.max(1, Math.floor(innerHeight / minGap));
    const lastIdx = bins.length - 1;
    if (bins.length <= maxTicks) return bins.map((_, i) => i);

    const step = niceStep(Math.ceil(bins.length / maxTicks));
    const centerOf = (i: number) => innerHeight - (i + 0.5) * rowHeight;
    const firstY = centerOf(0);
    const lastY = centerOf(lastIdx);
    const stepped = bins
      .map((_, i) => i)
      .filter(
        (i) =>
          i !== 0 &&
          i !== lastIdx &&
          i % step === 0 &&
          Math.abs(centerOf(i) - firstY) >= minGap &&
          Math.abs(centerOf(i) - lastY) >= minGap,
      );
    return [0, ...stepped, lastIdx];
  }, [bins, innerHeight, rowHeight, rowLabelHeight]);

  const magnitudeTicks = useMemo(() => magnitudeScale.ticks(3).filter((t) => t > 0), [magnitudeScale]);

  const handleHover = (e: MouseEvent<SVGRectElement>) => {
    if (rowHeight <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localY = e.clientY - rect.top;
    const fromTop = Math.floor(localY / rowHeight);
    const index = bins.length - 1 - fromTop;
    setHoverIndex(Math.min(Math.max(index, 0), bins.length - 1));
  };

  const tooltipTop = hoverIndex !== null ? Math.min(Math.max(MARGIN.top + rowCenter(hoverIndex) - 40, 0), height - 40) : 0;

  return (
    <div ref={containerRef} className="viz-pyramid" role="img" aria-label={ariaLabel}>
      {width > 0 && height > 0 && (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            <text ref={primaryProbeRef} className="axis-label center-label" x={-9999} y={-9999} aria-hidden="true">
              {longestPrimary}
            </text>
            <text ref={secondaryProbeRef} className="axis-label center-label" x={-9999} y={-9999} aria-hidden="true">
              {longestSecondary}
            </text>

            {magnitudeTicks.map((t) => {
              const dx = magnitudeScale(t);
              return (
                <g key={t}>
                  <line className="gridline" x1={leftEdge - dx} x2={leftEdge - dx} y1={0} y2={innerHeight} />
                  <line className="gridline" x1={rightEdge + dx} x2={rightEdge + dx} y1={0} y2={innerHeight} />
                  <text className="axis-label value-label" x={leftEdge - dx} y={innerHeight + 20} textAnchor="middle">
                    {valueFormat(t)}
                  </text>
                  <text className="axis-label value-label" x={rightEdge + dx} y={innerHeight + 20} textAnchor="middle">
                    {valueFormat(t)}
                  </text>
                </g>
              );
            })}

            {bins.map((b, i) => {
              const top = rowTop(i);
              const leftW = magnitudeScale(b.leftValue);
              const rightW = magnitudeScale(b.rightValue);
              const surplusW = magnitudeScale(Math.abs(b.leftValue - b.rightValue));
              const leftHasSurplus = leftSurplusColor && b.leftValue > b.rightValue && surplusW > 0;
              const rightHasSurplus = rightSurplusColor && b.rightValue > b.leftValue && surplusW > 0;
              return (
                <g key={b.id}>
                  <rect className="bin-rect" x={leftEdge - leftW} y={top} width={leftW} height={rowHeight} fill={leftColor} />
                  {leftHasSurplus && (
                    <rect
                      className="bin-rect"
                      x={leftEdge - leftW}
                      y={top}
                      width={surplusW}
                      height={rowHeight}
                      fill={leftSurplusColor}
                    />
                  )}
                  <rect className="bin-rect" x={rightEdge} y={top} width={rightW} height={rowHeight} fill={rightColor} />
                  {rightHasSurplus && (
                    <rect
                      className="bin-rect"
                      x={rightEdge + rightW - surplusW}
                      y={top}
                      width={surplusW}
                      height={rowHeight}
                      fill={rightSurplusColor}
                    />
                  )}
                </g>
              );
            })}

            <line className="center-line" x1={centerX} x2={centerX} y1={0} y2={innerHeight} />

            {visibleRowTicks.map((i) => (
              <g key={i}>
                <text
                  className="axis-label center-label"
                  x={centerX - GUTTER_COLUMN_GAP_PX / 2}
                  y={rowCenter(i)}
                  dy="0.32em"
                  textAnchor="end"
                >
                  {bins[i].primaryLabel}
                </text>
                <text
                  className="axis-label center-label"
                  x={centerX + GUTTER_COLUMN_GAP_PX / 2}
                  y={rowCenter(i)}
                  dy="0.32em"
                  textAnchor="start"
                >
                  {bins[i].secondaryLabel}
                </text>
              </g>
            ))}

            {hoverIndex !== null && (
              <rect
                className="hover-row"
                x={0}
                y={rowTop(hoverIndex)}
                width={innerWidth}
                height={rowHeight}
                fill="none"
              />
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
        <div className="pyramid-tooltip" style={{ top: tooltipTop, left: width / 2 }}>
          {renderTooltip(hoverIndex)}
        </div>
      )}
    </div>
  );
}
