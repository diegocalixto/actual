import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { fittedFontSize } from '#components/v2lab/LabStyle';

import { formatCurrency, formatPercent } from './budgetMoney';
import { BudgetRing } from './BudgetRing';

type BudgetBandProps = {
  income: number;
  budgeted: number;
  spent: number;
  /**
   * What is still free to assign, as the budget engine computes it.
   *
   * Given rather than derived: the engine's figure carries what a local
   * subtraction cannot see — the balance carried from last month, last month's
   * overspending, and anything held back for next month. `null` when the file
   * has no such cell (tracking budgets), and the metric is then omitted rather
   * than guessed at.
   */
  toDistribute: number | null;
};

/**
 * The month in four figures, above everything else.
 *
 * A single horizontal plane rather than four cards: these numbers are one
 * sentence — what came in, what is already promised, what has left, what is
 * still there — and boxing them would ask the eye to re-enter four times. The
 * hairlines between them are the only separation the sentence needs.
 *
 * Only `income` is given; the other three are sums of the envelope list, and
 * the two remainders are computed here so nothing on screen can drift from it.
 */
export function BudgetBand({
  income,
  budgeted,
  spent,
  toDistribute,
}: BudgetBandProps) {
  // The month's own cash flow: what came in, less what left. A statement about
  // this month alone, so unlike `toDistribute` it is honestly a subtraction.
  const available = income - spent;

  // Every figure's caption is its slice of the month's income. A month nothing
  // has come into yet has no such slice — the division is 0 ÷ 0 or n ÷ 0 — so
  // the caption says that instead of printing the arithmetic's "NaN%".
  const shareOf = (value: number) => (income > 0 ? value / income : null);

  // One size for the four figures: the design's, or the size the longest of
  // them still fits its column at. The design's own rule holds a five-digit
  // figure; a month in the millions ran through the hairline and into the
  // figure beside it.
  const figureSize = fittedFontSize({
    designSize: `clamp(22px, 16.2cqw, ${FIGURE_SIZE}px)`,
    room: '100cqi',
    floor: '15px',
    letterSpacing: FIGURE_TRACKING,
    figures: [toDistribute, budgeted, spent, available].map(value =>
      value === null ? null : formatCurrency(value),
    ),
  });

  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 'var(--dfl-radius)',
        border: '1px solid var(--dfl-hero-line)',
        boxShadow:
          'var(--dfl-shadow-hero), inset 0 1px 0 rgba(150, 195, 255, 0.16)',
        backgroundImage:
          'linear-gradient(118deg, var(--dfl-hero-from) 0%, var(--dfl-hero-to) 58%, #0e1d33 100%)',
        overflow: 'hidden',
      }}
    >
      <BandLight />

      <View
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          padding: '18px 32px',
          minHeight: 178,
        }}
      >
        {toDistribute !== null && (
          <>
            <Metric
              label={<Trans>Para distribuir</Trans>}
              value={toDistribute}
              figureSize={figureSize}
              share={shareOf(toDistribute)}
              color="var(--dfl-blue)"
            />
            <Divider />
          </>
        )}
        <Metric
          label={<Trans>Orçado</Trans>}
          value={budgeted}
          figureSize={figureSize}
          share={shareOf(budgeted)}
          // The ramp's lighter violet, not the ring's: as 13px text on this
          // plane `--dfl-violet` measures 3.8:1, short of the 4.5:1 a label
          // needs, and this one clears it while staying the ring's hue.
          color="var(--dfl-hue-violet)"
        />

        <View style={{ flex: '0 0 auto', padding: '0 22px' }}>
          <BudgetRing income={income} budgeted={budgeted} />
        </View>

        <Metric
          label={<Trans>Gasto</Trans>}
          value={spent}
          figureSize={figureSize}
          share={shareOf(spent)}
          color="var(--dfl-positive)"
        />
        <Divider />
        <Metric
          label={<Trans>Saldo do mês</Trans>}
          value={available}
          figureSize={figureSize}
          share={shareOf(available)}
          color="var(--dfl-hue-cyan)"
        />
      </View>
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
        margin: '14px 0',
        backgroundImage:
          'linear-gradient(180deg, transparent 0%, rgba(150, 195, 255, 0.34) 32%, rgba(150, 195, 255, 0.34) 68%, transparent 100%)',
      }}
    />
  );
}

/** The headline figure's size wherever its column has room for it. */
const FIGURE_SIZE = 31;
const FIGURE_TRACKING = -1.1;

type MetricProps = {
  label: ReactNode;
  value: number;
  /** The size the band's figures share, fitted to the longest of them. */
  figureSize: string;
  /** `null` ⇒ the month has no income to be a share of. */
  share: number | null;
  color: string;
};

function Metric({ label, value, figureSize, share, color }: MetricProps) {
  const shareLabel = share === null ? null : formatPercent(share);

  return (
    <View
      style={{
        flex: '1 1 0',
        gap: 10,
        padding: '0 18px',
        minWidth: 0,
        // The column is what the figure below is measured against.
        containerType: 'inline-size',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color,
          /* The label is the only coloured text on the plane; a halo of its own
             hue is what makes it read as lit rather than merely tinted. */
          textShadow: `0 0 18px color-mix(in srgb, ${color} 45%, transparent)`,
        }}
      >
        {label}
      </Text>
      <FinancialText
        style={{
          // Full size wherever the column holds it — every window from about
          // 1400px up. Narrower than that a five-digit figure, some 6.2em at
          // this weight, is wider than its column: it runs through the
          // hairline and into the figure beside it. So the size follows the
          // column down, capped at what still fits one — and further, for a
          // figure longer than five digits. The plain value comes first, for
          // an engine that has no container units.
          fontSize: [`${FIGURE_SIZE}px`, figureSize],
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: FIGURE_TRACKING,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 18px rgba(120, 170, 235, 0.22)',
        }}
      >
        <PrivacyFilter>{formatCurrency(value)}</PrivacyFilter>
      </FinancialText>
      <Text
        style={{
          fontSize: 13,
          color: 'var(--dfl-text-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {shareLabel === null ? (
          <Trans>Sem receitas neste mês</Trans>
        ) : (
          <Trans>{{ shareLabel }} das receitas do mês</Trans>
        )}
      </Text>
    </View>
  );
}

/**
 * The light on the band: a cold reflection entering low from the left, mirroring
 * the Overview hero's without repeating its path.
 */
function BandLight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="dfbArc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--dfl-blue)" stopOpacity="0" />
          <stop offset="26%" stopColor="var(--dfl-blue)" stopOpacity="0.6" />
          <stop offset="52%" stopColor="var(--dfl-blue)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--dfl-blue)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="dfbGlow" cx="0.14" cy="1" r="0.62">
          <stop
            offset="0%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0.34"
          />
          <stop
            offset="55%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0.08"
          />
          <stop
            offset="100%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0"
          />
        </radialGradient>
        <filter id="dfbBlur" x="-40%" y="-160%" width="180%" height="460%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1200" height="200" fill="url(#dfbGlow)" />

      {/* Stops well short of the ring: a highlight that reached across the
          whole plane would read as a scratch on it. */}
      <path
        d="M -40 228 C 120 186, 268 162, 470 138"
        fill="none"
        stroke="url(#dfbArc)"
        strokeWidth="7"
        strokeLinecap="round"
        filter="url(#dfbBlur)"
        opacity="0.55"
      />
      <path
        d="M -40 228 C 120 186, 268 162, 470 138"
        fill="none"
        stroke="url(#dfbArc)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
