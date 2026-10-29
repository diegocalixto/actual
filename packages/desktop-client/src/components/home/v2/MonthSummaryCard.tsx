import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { isResultComplete } from '@actual-app/core/shared/month-indicators';
import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';

import { shellColors } from '#components/appshell/shellTheme';
import { Money } from '#components/v2/Money';

import { DashboardCard } from './DashboardCard';
import { MetricTile } from './MetricTile';
import { useMonthTotals } from './useMonthTotals';

type MonthSummaryCardProps = {
  /** `YYYY-MM`. */
  month: string;
};

/**
 * The month in three figures — classified receipts, spending, and what the first
 * left after the second — plus one line for whatever those three leave out:
 * extraordinary inflows, inflows still to be categorized, and how much of the
 * spending has no category yet. The rules are `@actual-app/core/shared/month-indicators`, the
 * same ones Relatórios prints.
 */
export function MonthSummaryCard({ month }: MonthSummaryCardProps) {
  const { isNarrowWidth } = useResponsive();
  const { income, spent, net, details } = useMonthTotals(month);

  return (
    <DashboardCard>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: isNarrowWidth ? '16px 4px' : '20px 6px',
        }}
      >
        <Cell>
          <MetricTile
            label={<Trans>Classified receipts</Trans>}
            value={income}
          />
        </Cell>
        <Divider />
        <Cell>
          <MetricTile label={<Trans>Spending</Trans>} value={spent} />
        </Cell>
        <Divider />
        <Cell>
          <MetricTile
            label={<Trans>Result of classified receipts</Trans>}
            value={net}
            emphasized
          />
        </Cell>
      </View>
      {details && <MonthDetails details={details} />}
    </DashboardCard>
  );
}

/**
 * What the three tiles do not say, each only when there is something to say.
 * Exported for the phone, which lays the same facts under its own summary.
 */
export type MonthDetailLine = {
  key: string;
  label: ReactNode;
  /** `null` ⇒ the line is a statement about the figures, not a figure itself. */
  value: number | null;
  /**
   * Something to act on or to keep in mind — an extraordinary inflow, inflows
   * still to be reviewed, a provisional result — which stays in sight. The
   * other lines say how the figures were reached, and a phone keeps them under
   * "Como calculamos".
   */
  isNotice: boolean;
  /** The line opens the transactions it counts. */
  opens?: 'pendingInflows';
};

export function monthDetailLines(details: IndicatorTotals): MonthDetailLine[] {
  const lines: MonthDetailLine[] = [];

  if (details.extraordinaryIncome !== 0) {
    lines.push({
      key: 'extraordinary',
      label: (
        <Trans>Extraordinary inflows, outside the classified receipts</Trans>
      ),
      value: details.extraordinaryIncome,
      isNotice: true,
    });
    lines.push({
      key: 'result-with-extraordinary',
      label: <Trans>Result including extraordinary inflows</Trans>,
      value: details.resultWithExtraordinary,
      isNotice: false,
    });
  }
  if (details.pendingInflows !== 0) {
    lines.push({
      key: 'pending',
      label: <Trans>Inflows awaiting a category, counted nowhere</Trans>,
      value: details.pendingInflows,
      isNotice: true,
      opens: 'pendingInflows',
    });
  }
  // A share of the spending, so it is printed as the spending is: a positive
  // magnitude under a label that says what it is. The signs belong to the
  // registers, where a minus says which way the money went.
  if (details.uncategorizedSpending !== 0) {
    lines.push({
      key: 'uncategorized',
      label: <Trans>Uncategorized, already included in spending</Trans>,
      value: details.uncategorizedSpending,
      isNotice: false,
    });
  }
  // Said here too, and not only in the spending list, because a refund inside
  // a category that still spent more than it gave back leaves no row of its
  // own: without this line the deduction would be invisible.
  if (details.refunds !== 0) {
    lines.push({
      key: 'refunds',
      label: <Trans>Refunds, already deducted from spending</Trans>,
      value: details.refunds,
      isNotice: false,
    });
  }
  // An inflow nobody has named yet is in the balance and in no result, so the
  // result beside it is not the month's last word.
  if (!isResultComplete(details)) {
    lines.push({
      key: 'provisional',
      label: <Trans>Provisional result while inflows await a category</Trans>,
      value: null,
      isNotice: true,
    });
  }

  return lines;
}

function MonthDetails({ details }: { details: IndicatorTotals }) {
  const lines = monthDetailLines(details);
  if (lines.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        gap: 4,
        padding: '0 16px 14px',
        borderTop: `1px solid ${shellColors.border}`,
        paddingTop: 10,
      }}
    >
      {lines.map(line => (
        <View
          key={line.key}
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: shellColors.textSecondary }}>
            {line.label}
          </Text>
          {line.value !== null && (
            <Money
              value={line.value}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: shellColors.textPrimary,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}

function Cell({ children }: { children: ReactNode }) {
  // `flexBasis: 0` lets the three cells share the row evenly however long the
  // formatted amounts turn out to be, instead of the widest one winning.
  // `flex-end` keeps the three amounts on one baseline even when a longer
  // label wraps to two lines in some language at some width — the numbers are
  // what the eye compares, so they are the thing that must stay aligned.
  return (
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: '0 10px',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View
      aria-hidden="true"
      style={{
        width: 1,
        flexShrink: 0,
        alignSelf: 'stretch',
        backgroundColor: shellColors.border,
      }}
    />
  );
}
