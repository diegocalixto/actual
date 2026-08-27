import React from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabPanel } from '#components/v2lab/LabPanel';

import { formatAxis } from './accountsMoney';
import type { BalanceSeries } from './accountsViewModel';

type BalanceOverTimeProps = {
  /** `null` ⇒ there is no defensible history; the panel says so. */
  series: BalanceSeries | null;
};

const VW = 1000;
const VH = 300;
const PLOT_HEIGHT = 300;
const AXIS_WIDTH = 62;

/**
 * How the balance got to where it is.
 *
 * Drawn by hand in SVG rather than through a chart library: the finish this
 * card needs — a lit line, a deep fill that fades rather than stops, a grid you
 * only notice when you look for it — is all in the layering, and every one of
 * those layers would be a fight against a library's defaults. Nothing new is
 * installed; this is one path, drawn four times.
 *
 * The stroke uses `non-scaling-stroke` so the curve keeps its weight as the
 * card widens, and the end marker is an HTML dot rather than an SVG circle so
 * the non-uniform scale cannot flatten it into an ellipse.
 */
export function BalanceOverTime({ series }: BalanceOverTimeProps) {
  // Two points is the least that can honestly be called a history; one point is
  // a dot the eye reads as a trend, and none is a straight line that says
  // something happened when nothing did.
  const hasHistory = series !== null && series.points.length > 1;

  const axisTicks = series?.axisTicks ?? [];
  const rangeLabel = series?.rangeLabel ?? null;
  const span =
    series === null ? 1 : Math.max(1, series.axisMax - series.axisMin);
  const toY = (value: number) =>
    VH - ((value - (series?.axisMin ?? 0)) / span) * VH;

  const points = hasHistory
    ? series.points.map((value, index) => ({
        x: (index / (series.points.length - 1)) * VW,
        y: toY(value),
      }))
    : [];

  const line = toSmoothPath(points);
  const area = `${line} L ${VW} ${VH} L 0 ${VH} Z`;
  const last = points[points.length - 1];

  return (
    <LabPanel style={{ backgroundColor: 'var(--dfl-surface-raised)' }}>
      <View style={{ padding: '18px 22px 16px', gap: 18 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.3,
              textTransform: 'uppercase',
              color: 'var(--dfl-text)',
            }}
          >
            <Trans>Balance over time</Trans>
          </Text>

          {rangeLabel !== null && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                padding: '6px 11px',
                borderRadius: 'var(--dfl-radius-sm)',
                backgroundColor: 'rgba(6, 10, 18, 0.75)',
                border: '1px solid var(--dfl-line-strong)',
              }}
            >
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  color: 'var(--dfl-text-2)',
                }}
              >
                {rangeLabel}
              </Text>
              {/* The chevron promises a range picker. Only the laboratory,
                  which mocks that control, is allowed to draw it. */}
              {series?.rangeChevron && (
                <SvgCheveronDown
                  aria-hidden="true"
                  width={13}
                  height={13}
                  style={{ color: 'var(--dfl-text-3)' }}
                />
              )}
            </View>
          )}
        </View>

        {!hasHistory && (
          <View
            style={{
              height: PLOT_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 'var(--dfl-radius-sm)',
              border: '1px dashed var(--dfl-line-strong)',
            }}
          >
            <Text
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--dfl-text-2)',
              }}
            >
              <Trans>Not enough history yet</Trans>
            </Text>
            <Text style={{ fontSize: 12.5, color: 'var(--dfl-text-3)' }}>
              <Trans>
                The curve appears once this period has more than one day of
                movement.
              </Trans>
            </Text>
          </View>
        )}

        {hasHistory && (
          <>
            <View style={{ flexDirection: 'row', gap: 0 }}>
              {/* Axis labels live outside the SVG so the non-uniform scale never
              touches the type. */}
              <View
                style={{
                  flex: `0 0 ${AXIS_WIDTH}px`,
                  height: PLOT_HEIGHT,
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingRight: 10,
                }}
              >
                {axisTicks.map(tick => (
                  <Text
                    key={tick}
                    style={{
                      fontSize: 11,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      color: 'var(--dfl-text-3)',
                    }}
                  >
                    {formatAxis(tick)}
                  </Text>
                ))}
              </View>

              <View
                style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}
              >
                <svg
                  viewBox={`0 0 ${VW} ${VH}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  style={{
                    width: '100%',
                    height: PLOT_HEIGHT,
                    display: 'block',
                  }}
                >
                  <defs>
                    <linearGradient id="dfaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#5aa6ff"
                        stopOpacity="0.55"
                      />
                      <stop
                        offset="42%"
                        stopColor="#2f6fd4"
                        stopOpacity="0.24"
                      />
                      <stop offset="100%" stopColor="#1d5fd0" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="dfaLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3f86e8" />
                      <stop offset="70%" stopColor="#5aa6ff" />
                      <stop offset="100%" stopColor="#9ccbff" />
                    </linearGradient>
                    <filter
                      id="dfaLineGlow"
                      x="-10%"
                      y="-40%"
                      width="120%"
                      height="180%"
                    >
                      <feGaussianBlur stdDeviation="7" />
                    </filter>
                  </defs>

                  {/* Grid: present, never assertive. */}
                  {axisTicks.map(tick => {
                    const y = toY(tick);
                    return (
                      <line
                        key={tick}
                        x1="0"
                        y1={y}
                        x2={VW}
                        y2={y}
                        stroke="var(--dfl-line)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}

                  <path d={area} fill="url(#dfaFill)" />

                  {/* Halo, then the line itself. */}
                  <path
                    d={line}
                    fill="none"
                    stroke="#5aa6ff"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#dfaLineGlow)"
                    opacity="0.7"
                  />
                  <path
                    d={line}
                    fill="none"
                    stroke="url(#dfaLine)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* The end of the series, where the eye should land. */}
                <View
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: `${(last.x / VW) * 100}%`,
                    top: (last.y / VH) * PLOT_HEIGHT,
                    width: 11,
                    height: 11,
                    marginLeft: -7,
                    marginTop: -5.5,
                    borderRadius: 999,
                    backgroundColor: '#ffffff',
                    border: '2px solid #5aa6ff',
                    boxShadow:
                      '0 0 0 4px rgba(90, 166, 255, 0.2), 0 0 16px 2px rgba(90, 166, 255, 0.75)',
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: `0 0 ${AXIS_WIDTH}px` }} />
              <View
                style={{
                  flex: '1 1 0',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                {(series?.xLabels ?? []).map((label, index) => (
                  <Text
                    key={index}
                    style={{
                      fontSize: 11.5,
                      whiteSpace: 'nowrap',
                      color: 'var(--dfl-text-3)',
                    }}
                  >
                    {label}
                  </Text>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </LabPanel>
  );
}

type Point = { x: number; y: number };

/**
 * Catmull-Rom through every sample, converted to cubic Béziers.
 *
 * The curve has to pass through the points, not near them — the last one is the
 * total balance printed in the hero, and a spline that merely approximates it
 * would put the end marker somewhere the number is not.
 */
function toSmoothPath(points: Point[]): string {
  if (points.length < 2) {
    return '';
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}
