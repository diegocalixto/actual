import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { HowWeCount } from '#components/v2lab/HowWeCount';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';

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
  /** Opens the period's inflows still without a category. */
  onOpenPendingInflows?: () => void;
};

type BreakdownLine = {
  key: string;
  label: ReactNode;
  /** `null` ⇒ a statement about the figures, not a figure. */
  value: number | null;
  /** Something to keep in mind, which stays in sight on a phone. */
  isNotice: boolean;
};

/**
 * What the four tiles leave out, and what they are made of.
 *
 * The tiles judge the period by its classified receipts. This strip says, in
 * figures, what was kept apart from that judgement and why: an extraordinary
 * inflow that is real money but no proof of a living, inflows nobody has named
 * yet — which make the result provisional and open their own list — the share
 * of the spending that has no category, the refunds already netted, and, when a
 * category ended in credit, the outflow total the list below adds up to. A line
 * appears only when its figure is not zero.
 *
 * On a phone the strip came before the first chart and took a third of the
 * screen. There, what needs keeping in mind stays in sight and the reckoning —
 * the rest of the lines and the definition the page counts by — waits under
 * "Como calculamos". The desktop has the room to show all of it.
 */
export function ReportsBreakdown({
  breakdown,
  compact = false,
  onOpenPendingInflows,
}: ReportsBreakdownProps) {
  const lines: BreakdownLine[] = [];

  if (breakdown.extraordinaryIncome !== 0) {
    lines.push({
      key: 'extraordinary',
      label: (
        <Trans>Extraordinary inflows, outside the classified receipts</Trans>
      ),
      value: breakdown.extraordinaryIncome,
      isNotice: true,
    });
    lines.push({
      key: 'with-extraordinary',
      label: <Trans>Result including extraordinary inflows</Trans>,
      value: breakdown.resultWithExtraordinary,
      isNotice: false,
    });
  }
  if (breakdown.pendingInflows !== 0) {
    lines.push({
      key: 'pending',
      label: <Trans>Inflows awaiting a category, counted nowhere</Trans>,
      value: breakdown.pendingInflows,
      isNotice: true,
    });
    // While money of unknown nature is waiting, the result is not the
    // period's last word — the Início says so, and so does this page.
    lines.push({
      key: 'provisional',
      label: <Trans>Provisional result while inflows await a category</Trans>,
      value: null,
      isNotice: true,
    });
  }
  // A share of the spending, printed as the spending is: a positive magnitude
  // under a label that says what it is. The registers keep the signs.
  if (breakdown.uncategorizedSpending !== 0) {
    lines.push({
      key: 'uncategorized',
      label: <Trans>Uncategorized, already included in spending</Trans>,
      value: breakdown.uncategorizedSpending,
      isNotice: false,
    });
  }
  if (breakdown.refunds !== 0) {
    lines.push({
      key: 'refunds',
      label: <Trans>Refunds, already deducted from spending</Trans>,
      value: breakdown.refunds,
      isNotice: false,
    });
  }
  if (breakdown.credited > 0) {
    lines.push({
      key: 'outflows',
      label: <Trans>Outflows listed by category</Trans>,
      value: breakdown.outflows,
      isNotice: false,
    });
  }

  const renderLine = (line: BreakdownLine) => {
    const isAttention = line.key === 'pending' || line.key === 'provisional';
    const content = (
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          minWidth: 0,
        }}
      >
        <Text
          style={{
            fontSize: compact ? MOBILE_TYPE.note : 12.5,
            lineHeight: 1.3,
            textAlign: 'left',
            color: isAttention ? 'var(--dfl-text)' : 'var(--dfl-text-2)',
          }}
        >
          {isAttention && (
            <Text
              aria-hidden="true"
              style={{
                color: 'var(--dfl-hue-amber)',
                fontWeight: 700,
                marginRight: 6,
              }}
            >
              !
            </Text>
          )}
          {line.label}
        </Text>
        {line.value !== null && (
          <FinancialText
            style={{
              fontSize: compact ? MOBILE_TYPE.note : 12.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text)',
            }}
          >
            <PrivacyFilter>{formatCurrency(line.value)}</PrivacyFilter>
          </FinancialText>
        )}
      </View>
    );

    if (line.key === 'pending' && onOpenPendingInflows) {
      return (
        <Button
          key={line.key}
          variant="bare"
          onPress={onOpenPendingInflows}
          className={css({
            position: 'relative',
            width: compact ? '100%' : 'calc(100% + 8px)',
            // 44 on the phone; on the desktop at least the 24px a pointer
            // target needs, taken from the gap around the line.
            minHeight: compact ? 44 : 26,
            padding: compact ? '0 2px' : '4px 4px',
            margin: compact ? 0 : '-4px -4px',
            borderRadius: 6,
            justifyContent: 'flex-start',
            '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
            '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
          })}
        >
          {content}
          {/* On the phone, after the figure, as every row that opens a list.
              On the desktop, in the gap beside the figure's column, so the
              figures of the strip stay aligned. */}
          <SvgCheveronRight
            aria-hidden="true"
            width={13}
            height={13}
            style={
              compact
                ? { flexShrink: 0, marginLeft: 8, color: 'var(--dfl-text-3)' }
                : {
                    position: 'absolute',
                    right: -12,
                    top: 'calc(50% - 6px)',
                    color: 'var(--dfl-text-3)',
                  }
            }
          />
        </Button>
      );
    }
    return (
      <View key={line.key} style={compact ? { padding: '6px 2px' } : undefined}>
        {content}
      </View>
    );
  };

  const definition = (
    <Text
      style={{
        fontSize: compact ? MOBILE_TYPE.note : 11.5,
        lineHeight: 1.45,
        color: 'var(--dfl-text-3)',
      }}
    >
      <Trans>
        How this page counts: transfers between your own accounts and starting
        balances are neither income nor spending; a refund lowers the spending
        it undoes, and a category refunded more than it was spent lowers the
        total; spending without a category is counted and shown as such; an
        inflow without a category is listed for review and counted nowhere;
        income in a category or group whose note carries the #extraordinária tag
        stays outside the classified receipts. "Resultado" is the classified
        receipts less the spending: neither the extraordinary inflows nor the
        inflows awaiting a category are in it, and it is not the growth of your
        net worth.
      </Trans>
    </Text>
  );

  if (compact) {
    const notices = lines.filter(line => line.isNotice);
    const reckoning = lines.filter(line => !line.isNotice);
    return (
      <LabCard>
        <View style={{ padding: '6px 14px 4px', gap: 2 }}>
          {notices.map(renderLine)}
          <HowWeCount>
            {reckoning.map(renderLine)}
            <View style={{ padding: '4px 2px 10px' }}>{definition}</View>
          </HowWeCount>
        </View>
      </LabCard>
    );
  }

  return (
    <LabCard>
      <View style={{ padding: '12px 18px', gap: 8 }}>
        {lines.length > 0 && (
          <View
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 24,
              rowGap: 6,
            }}
          >
            {lines.map(renderLine)}
          </View>
        )}
        {definition}
      </View>
    </LabCard>
  );
}
