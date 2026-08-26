import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  SvgCheveronDown,
  SvgDotsHorizontalTriple,
} from '@actual-app/components/icons/v1';
import { SvgInformationCircle } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { LabCard } from './LabCard';
import type { DayPoint } from './reportsFixtures';
import { formatAxis, formatBRL } from './reportsMoney';
import { SERIES } from './reportsTokens';
import type { SeriesKey } from './reportsTokens';

type ReportsHeroChartProps = {
  series: DayPoint[];
  axisMin: number;
  axisMax: number;
  axisTicks: number[];
  xTicks: number[];
  totals: { income: number; expenses: number; net: number };
  defaultHoverIndex: number;
};

const VW = 1000;
const VH = 420;
const PLOT_HEIGHT = 212;

const ORDER: SeriesKey[] = ['income', 'expenses', 'net'];

const LABEL: Record<SeriesKey, ReactNode> = {
  income: <Trans>Income</Trans>,
  expenses: <Trans>Expenses</Trans>,
  net: <Trans>Net Result</Trans>,
};

/**
 * The centre of the page: what came in, what went out, and what stayed.
 *
 * Drawn by hand in SVG rather than through a chart library. The finish this
 * card needs is all in the layering — a translucent field under each curve, a
 * blurred twin beneath each line, a sample dot on every point, a brighter one
 * at the end — and every one of those would be a fight against a library's
 * defaults. Nothing new is installed.
 *
 * The three fields are painted largest first so they stack instead of hiding
 * each other, and each fades to nothing before the baseline: three opaque
 * blocks would turn the card into a flag.
 */
export function ReportsHeroChart({
  series,
  axisMin,
  axisMax,
  axisTicks,
  xTicks,
  totals,
  defaultHoverIndex,
}: ReportsHeroChartProps) {
  const { t } = useTranslation();
  const [hover, setHover] = useState<number | null>(defaultHoverIndex);

  const span = axisMax - axisMin;
  const toX = (index: number) => (index / (series.length - 1)) * VW;
  const toY = (value: number) => VH - ((value - axisMin) / span) * VH;

  const paths = ORDER.map(key => {
    const points = series.map((point, index) => ({
      x: toX(index),
      y: toY(point[key]),
    }));

    return { key, points, line: toSmoothPath(points) };
  });

  const baseline = toY(axisMin);
  const active = hover === null ? null : series[hover];

  return (
    <LabCard>
      <View style={{ padding: '16px 22px 14px', gap: 13 }}>
        <Header />

        <Legend />

        <View style={{ flexDirection: 'row' }}>
          {/* Axis labels live outside the SVG so the non-uniform scale never
              touches the type. */}
          <View
            style={{
              flex: '0 0 66px',
              height: PLOT_HEIGHT,
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingRight: 12,
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

          <View style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}>
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ width: '100%', height: PLOT_HEIGHT, display: 'block' }}
              onMouseLeave={() => setHover(null)}
              onMouseMove={event => {
                const box = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientX - box.left) / box.width;
                const index = Math.round(ratio * (series.length - 1));
                setHover(Math.max(0, Math.min(series.length - 1, index)));
              }}
            >
              <defs>
                {ORDER.map(key => (
                  <linearGradient
                    key={key}
                    id={`dfrFill-${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={SERIES[key]}
                      stopOpacity="0.34"
                    />
                    <stop
                      offset="58%"
                      stopColor={SERIES[key]}
                      stopOpacity="0.08"
                    />
                    <stop
                      offset="100%"
                      stopColor={SERIES[key]}
                      stopOpacity="0"
                    />
                  </linearGradient>
                ))}
                <filter
                  id="dfrGlow"
                  x="-6%"
                  y="-30%"
                  width="112%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              {/* Grid: present, never assertive. Zero reads a shade stronger,
                  because a negative result has to be legible as negative. */}
              {axisTicks.map(tick => (
                <line
                  key={tick}
                  x1="0"
                  y1={toY(tick)}
                  x2={VW}
                  y2={toY(tick)}
                  stroke={
                    tick === 0 ? 'var(--dfl-line-strong)' : 'var(--dfl-line)'
                  }
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {paths.map(({ key, line }) => (
                <path
                  key={key}
                  d={`${line} L ${VW} ${baseline} L 0 ${baseline} Z`}
                  fill={`url(#dfrFill-${key})`}
                />
              ))}

              {/* Halo, then the line. */}
              {paths.map(({ key, line }) => (
                <path
                  key={`glow-${key}`}
                  d={line}
                  fill="none"
                  stroke={SERIES[key]}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  filter="url(#dfrGlow)"
                  opacity="0.6"
                />
              ))}
              {paths.map(({ key, line }) => (
                <path
                  key={`line-${key}`}
                  d={line}
                  fill="none"
                  stroke={SERIES[key]}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {hover !== null && (
                <line
                  x1={toX(hover)}
                  y1="0"
                  x2={toX(hover)}
                  y2={VH}
                  stroke="rgba(170, 200, 240, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {/* Sample dots and the endpoint are HTML, not SVG: the plot scales
                non-uniformly and a circle drawn inside it would flatten. */}
            {paths.map(({ key, points }) =>
              points.map((point, index) => (
                <Dot
                  key={`${key}-${index}`}
                  color={SERIES[key]}
                  left={(point.x / VW) * 100}
                  top={(point.y / VH) * PLOT_HEIGHT}
                  size={
                    index === points.length - 1 ? 10 : hover === index ? 8 : 4.5
                  }
                  emphasised={index === points.length - 1 || hover === index}
                />
              )),
            )}

            {active && (
              <ChartTooltip
                point={active}
                left={(toX(hover as number) / VW) * 100}
              />
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: '0 0 66px' }} />
          <View
            style={{
              flex: '1 1 0',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            {xTicks.map(day => (
              <Text
                key={day}
                style={{
                  fontSize: 11.5,
                  whiteSpace: 'nowrap',
                  color: 'var(--dfl-text-3)',
                }}
              >
                {t('May {{ day }}', { day })}
              </Text>
            ))}
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 4,
            paddingTop: 12,
            borderTop: '1px solid var(--dfl-line)',
          }}
        >
          <Total
            label={<Trans>Total income</Trans>}
            value={totals.income}
            color={SERIES.income}
          />
          <Divider />
          <Total
            label={<Trans>Total expenses</Trans>}
            value={totals.expenses}
            color={SERIES.expenses}
          />
          <Divider />
          <Total
            label={<Trans>Total net result</Trans>}
            value={totals.net}
            color={SERIES.net}
          />
        </View>
      </View>
    </LabCard>
  );
}

function Header() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
            color: 'var(--dfl-text)',
          }}
        >
          <Trans>Income, Expenses &amp; Net Result</Trans>
        </Text>
        <SvgInformationCircle
          aria-hidden="true"
          width={14}
          height={14}
          style={{ color: 'var(--dfl-text-3)' }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text-2)',
            }}
          >
            <Trans>This month</Trans>
          </Text>
          <SvgCheveronDown
            aria-hidden="true"
            width={13}
            height={13}
            style={{ color: 'var(--dfl-text-3)' }}
          />
        </View>
        <View
          style={{
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--dfl-radius-sm)',
            color: 'var(--dfl-text-3)',
            border: '1px solid var(--dfl-line)',
          }}
        >
          <SvgDotsHorizontalTriple aria-hidden="true" width={14} height={14} />
        </View>
      </View>
    </View>
  );
}

function Legend() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
      {ORDER.map(key => (
        <View
          key={key}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <View
            aria-hidden="true"
            style={{
              width: 22,
              height: 2,
              borderRadius: 999,
              backgroundColor: SERIES[key],
              boxShadow: `0 0 8px -1px ${SERIES[key]}`,
            }}
          />
          <View
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              marginLeft: -18,
              borderRadius: 999,
              backgroundColor: SERIES[key],
            }}
          />
          <Text
            style={{
              fontSize: 12.5,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text-2)',
            }}
          >
            {LABEL[key]}
          </Text>
        </View>
      ))}
    </View>
  );
}

type DotProps = {
  color: string;
  left: number;
  top: number;
  size: number;
  emphasised: boolean;
};

function Dot({ color, left, top, size, emphasised }: DotProps) {
  return (
    <View
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `${left}%`,
        top,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: 999,
        pointerEvents: 'none',
        backgroundColor: emphasised ? '#ffffff' : color,
        border: emphasised ? `2px solid ${color}` : 'none',
        boxShadow: emphasised
          ? `0 0 0 4px color-mix(in srgb, ${color} 18%, transparent), 0 0 14px 2px color-mix(in srgb, ${color} 70%, transparent)`
          : `0 0 6px -1px ${color}`,
      }}
    />
  );
}

/**
 * The tooltip flips to the left of the cursor once past the middle, so it never
 * covers the part of the curve the pointer is asking about.
 */
function ChartTooltip({ point, left }: { point: DayPoint; left: number }) {
  const flip = left > 58;

  return (
    <View
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: 12,
        marginLeft: flip ? -186 : 14,
        width: 172,
        padding: '11px 13px',
        gap: 9,
        borderRadius: 'var(--dfl-radius-sm)',
        pointerEvents: 'none',
        backgroundColor: 'rgba(9, 14, 23, 0.96)',
        border: '1px solid var(--dfl-line-strong)',
        boxShadow: '0 20px 40px -22px rgba(0, 0, 0, 1)',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-2)',
        }}
      >
        {point.label}
      </Text>

      {ORDER.map(key => (
        <View
          key={key}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <View
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              flexShrink: 0,
              borderRadius: 999,
              backgroundColor: SERIES[key],
              boxShadow: `0 0 7px -1px ${SERIES[key]}`,
            }}
          />
          <Text
            style={{
              flex: '1 1 0',
              fontSize: 11.5,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text-2)',
            }}
          >
            {LABEL[key]}
          </Text>
          <FinancialText
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text)',
            }}
          >
            {formatBRL(point[key])}
          </FinancialText>
        </View>
      ))}
    </View>
  );
}

function Divider() {
  return (
    <View
      aria-hidden="true"
      style={{
        flex: '0 0 1px',
        alignSelf: 'stretch',
        margin: '2px 0',
        backgroundColor: 'var(--dfl-line)',
      }}
    />
  );
}

function Total({
  label,
  value,
  color,
}: {
  label: ReactNode;
  value: number;
  color: string;
}) {
  return (
    <View style={{ flex: '1 1 0', alignItems: 'center', gap: 7 }}>
      <Text
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text-3)',
        }}
      >
        {label}
      </Text>
      <FinancialText
        style={{
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: -0.4,
          whiteSpace: 'nowrap',
          color,
        }}
      >
        {formatBRL(value)}
      </FinancialText>
    </View>
  );
}

type Point = { x: number; y: number };

/** Catmull-Rom through every sample, converted to cubic Béziers. */
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
