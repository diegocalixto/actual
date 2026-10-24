import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';

import { LabCard } from './LabCard';
import { formatCurrency } from './reportsMoney';

export type ReportsBreakdownData = {
  /** Net of the income categories marked extraordinary. */
  extraordinaryIncome: number;
  /** The regular result plus the extraordinary inflows. */
  resultWithExtraordinary: number;
  /** Inflows with no category: unknown money, counted in no result. */
  pendingInflows: number;
  /** Outflows with no category, already inside the period's spending. */
  uncategorizedSpending: number;
  /** Refunds into expense categories, already deducted from the spending. */
  refunds: number;
  /** The outflow side of the period: what the category list adds up to. */
  outflows: number;
  /**
   * How much of the refunds fell in categories that ended the period in
   * credit. While this is not zero the category list cannot add up to the
   * spending tile, so the strip says what the difference is.
   */
  credited: number;
};

type ReportsBreakdownProps = {
  breakdown: ReportsBreakdownData;
  compact?: boolean;
};

/**
 * What the four tiles leave out, and what they are made of.
 *
 * The tiles judge the period by its classified receipts. This strip says, in
 * figures, what was kept apart from that judgement and why: an extraordinary
 * inflow that is real money but no proof of a living, inflows nobody has named
 * yet, the share of the spending that has no category, the refunds already
 * netted, and — when a category ended in credit — the outflow total the list
 * below adds up to. A line appears only when its figure is not zero; the
 * sentence under them is always there, because it is the definition the whole
 * page runs on.
 */
export function ReportsBreakdown({
  breakdown,
  compact = false,
}: ReportsBreakdownProps) {
  const lines: Array<{ key: string; label: ReactNode; value: number }> = [];

  if (breakdown.extraordinaryIncome !== 0) {
    lines.push({
      key: 'extraordinary',
      label: (
        <Trans>Extraordinary inflows, outside the classified receipts</Trans>
      ),
      value: breakdown.extraordinaryIncome,
    });
    lines.push({
      key: 'with-extraordinary',
      label: <Trans>Result including extraordinary inflows</Trans>,
      value: breakdown.resultWithExtraordinary,
    });
  }
  if (breakdown.pendingInflows !== 0) {
    lines.push({
      key: 'pending',
      label: <Trans>Inflows awaiting a category, counted nowhere</Trans>,
      value: breakdown.pendingInflows,
    });
  }
  if (breakdown.uncategorizedSpending !== 0) {
    lines.push({
      key: 'uncategorized',
      label: <Trans>Uncategorized, already included in spending</Trans>,
      value: -breakdown.uncategorizedSpending,
    });
  }
  if (breakdown.refunds !== 0) {
    lines.push({
      key: 'refunds',
      label: <Trans>Refunds, already deducted from spending</Trans>,
      value: breakdown.refunds,
    });
  }
  if (breakdown.credited > 0) {
    lines.push({
      key: 'outflows',
      label: <Trans>Outflows listed by category</Trans>,
      value: -breakdown.outflows,
    });
  }

  return (
    <LabCard>
      <View
        style={{
          padding: compact ? '12px 14px' : '12px 18px',
          gap: 8,
        }}
      >
        {lines.length > 0 && (
          <View
            style={{
              display: 'grid',
              gridTemplateColumns: compact ? '1fr' : '1fr 1fr',
              columnGap: 24,
              rowGap: 6,
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
                  minWidth: 0,
                }}
              >
                <Text style={{ fontSize: 12.5, color: 'var(--dfl-text-2)' }}>
                  {line.label}
                </Text>
                <FinancialText
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color: 'var(--dfl-text)',
                  }}
                >
                  <PrivacyFilter>{formatCurrency(line.value)}</PrivacyFilter>
                </FinancialText>
              </View>
            ))}
          </View>
        )}
        <Text
          style={{
            fontSize: 11.5,
            lineHeight: 1.45,
            color: 'var(--dfl-text-3)',
          }}
        >
          <Trans>
            How this page counts: transfers between your own accounts and
            starting balances are neither income nor spending; a refund lowers
            the spending it undoes, and a category refunded more than it was
            spent lowers the total; spending without a category is counted and
            shown as such; an inflow without a category is listed for review and
            counted nowhere; income in a category or group whose note carries
            the #extraordinária tag stays outside the classified receipts.
            "Resultado" is the classified receipts less the spending: neither
            the extraordinary inflows nor the inflows awaiting a category are in
            it, and it is not the growth of your net worth.
          </Trans>
        </Text>
      </View>
    </LabCard>
  );
}
