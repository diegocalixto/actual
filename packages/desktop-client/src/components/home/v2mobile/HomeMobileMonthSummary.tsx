import React from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronRight,
  SvgExclamationOutline,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';
import { css } from '@emotion/css';

import { monthDetailLines } from '#components/home/v2/MonthSummaryCard';
import type { MonthDetailLine } from '#components/home/v2/MonthSummaryCard';
import { HowWeCount } from '#components/v2lab/HowWeCount';
import { fittedFontSize } from '#components/v2lab/LabStyle';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';

import { HomeMobileMoney } from './HomeMobileMoney';
import {
  HomeMobileMonthMetric,
  MONTH_FIGURE_ROOM,
  MONTH_FIGURE_TRACKING,
  shownAmount,
} from './HomeMobileMonthMetric';
import { formatCurrency } from './mobileMoneyFormat';

type HomeMobileMonthSummaryProps = {
  /** Classified receipts: positive integer amount. */
  income: number | null;
  /** Negative integer amount, as Actual stores outflows. */
  spent: number | null;
  /** The result of the classified receipts: `income + spent`. */
  net: number | null;
  /** The facts under the three figures, or `null` while they load. */
  details: IndicatorTotals | null;
  /** Opens the month's inflows still without a category. */
  onOpenPendingInflows?: () => void;
  /**
   * The page lists the inflows to review somewhere else (the attention card),
   * so the summary does not repeat them; the provisional-result notice stays,
   * because it is about these figures.
   */
  hidePendingInflows?: boolean;
};

/**
 * The month in three numbers, on one compact surface.
 *
 * Three columns rather than three cards: what the classified receipts were, what
 * left, and what is left of the two are one thought, and separating them into
 * panels would say they are independent. The dividers are hairlines on the
 * panel's own ground — enough to group the figures, not enough to draw a
 * table.
 *
 * Under them, what needs keeping in mind stays in sight — an extraordinary
 * inflow, inflows still without a category (one press from their list), a
 * result that is provisional because of them — and how the figures were
 * reached waits under "Como calculamos". Nothing is drawn when there is
 * nothing to say.
 *
 * All of it comes from `useMonthTotals`, which reads the rules in
 * `@actual-app/core/shared/month-indicators`, so this card can never disagree with anything
 * else that reads the month.
 *
 * A third of the width has to hold "R$ 15.490,00" and its badge on one line.
 * The figures track the viewport up to the approved size, and all three give
 * up size together when the longest of them would not fit its column — a
 * month in the hundreds of thousands used to push its badge out of the card.
 */
export function HomeMobileMonthSummary({
  income,
  spent,
  net,
  details,
  onOpenPendingInflows,
  hidePendingInflows = false,
}: HomeMobileMonthSummaryProps) {
  const figureSize = fittedFontSize({
    designSize: 'clamp(11px, 3.3vw, 14px)',
    room: MONTH_FIGURE_ROOM,
    floor: '9px',
    letterSpacing: MONTH_FIGURE_TRACKING,
    figures: [
      shownAmount(income, 'in'),
      shownAmount(spent, 'out'),
      shownAmount(net, 'signed'),
    ].map(amount => (amount === null ? null : formatCurrency(amount))),
  });

  const lines = (details ? monthDetailLines(details) : []).filter(
    line => !(hidePendingInflows && line.opens === 'pendingInflows'),
  );
  const notices = lines.filter(line => line.isNotice);
  const reckoning = lines.filter(line => !line.isNotice);

  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius-sm)',
        border: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfl-surface)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: '12px 4px',
        }}
      >
        <HomeMobileMonthMetric
          label={<Trans>Receitas classificadas</Trans>}
          value={income}
          flow="in"
          figureSize={figureSize}
        />
        <View
          aria-hidden="true"
          style={{
            width: 1,
            alignSelf: 'stretch',
            backgroundColor: 'var(--dfl-line)',
          }}
        />
        <HomeMobileMonthMetric
          label={<Trans>Gastos</Trans>}
          value={spent}
          flow="out"
          figureSize={figureSize}
        />
        <View
          aria-hidden="true"
          style={{
            width: 1,
            alignSelf: 'stretch',
            backgroundColor: 'var(--dfl-line)',
          }}
        />
        <HomeMobileMonthMetric
          label={<Trans>Resultado</Trans>}
          value={net}
          flow="signed"
          figureSize={figureSize}
        />
      </View>

      {lines.length > 0 && (
        <View
          style={{
            gap: 2,
            padding: '6px 12px 4px',
            borderTop: '1px solid var(--dfl-line)',
          }}
        >
          {notices.map(line =>
            line.opens === 'pendingInflows' && onOpenPendingInflows ? (
              <Button
                key={line.key}
                variant="bare"
                onPress={onOpenPendingInflows}
                className={css({
                  width: '100%',
                  minHeight: 44,
                  padding: '0 2px',
                  borderRadius: 8,
                  '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
                })}
              >
                <DetailLine line={line} attention trailing />
              </Button>
            ) : (
              <View key={line.key} style={{ padding: '6px 2px' }}>
                <DetailLine
                  line={line}
                  attention={line.key === 'provisional'}
                />
              </View>
            ),
          )}

          {reckoning.length > 0 && (
            <HowWeCount>
              {reckoning.map(line => (
                <View key={line.key} style={{ padding: '0 2px' }}>
                  <DetailLine line={line} />
                </View>
              ))}
            </HowWeCount>
          )}
        </View>
      )}
    </View>
  );
}

type DetailLineProps = {
  line: MonthDetailLine;
  /** Marked as something to act on: the amber of the screen's alerts. */
  attention?: boolean;
  /** Ends in a chevron, because the line opens a list. */
  trailing?: boolean;
};

function DetailLine({
  line,
  attention = false,
  trailing = false,
}: DetailLineProps) {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {attention && (
        <SvgExclamationOutline
          aria-hidden="true"
          width={13}
          height={13}
          style={{ flexShrink: 0, color: 'var(--dfl-hue-amber)' }}
        />
      )}
      <Text
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: MOBILE_TYPE.note,
          lineHeight: 1.3,
          textAlign: 'left',
          color: attention ? 'var(--dfl-text)' : 'var(--dfl-text-2)',
        }}
      >
        {line.label}
      </Text>
      {line.value !== null && (
        <HomeMobileMoney
          value={line.value}
          withCurrency
          style={{
            fontSize: MOBILE_TYPE.note,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: 'var(--dfl-text)',
          }}
        />
      )}
      {trailing && (
        <SvgCheveronRight
          aria-hidden="true"
          width={14}
          height={14}
          style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
        />
      )}
    </View>
  );
}
