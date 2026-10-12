import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';

import { fittedFontSize } from './amountFit';
import { formatMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import type { LabMonthTotals } from './overviewFixtures';

type LabMonthSummaryProps = {
  totals: LabMonthTotals;
};

const FIGURE_TRACKING = -0.5;

/**
 * Money in, money out, and the month's verdict.
 *
 * Each figure has a third of the panel. That is ample for the month the design
 * was drawn with and not for one in the millions, which ran past its hairline;
 * the three now give up size together, to what the longest of them fits at.
 */
export function LabMonthSummary({ totals }: LabMonthSummaryProps) {
  const figures = [totals.income, totals.spent, totals.net].map(formatMoney);

  return (
    <LabPanel>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '20px 6px',
        }}
      >
        <Cell
          label={<Trans>Money in</Trans>}
          value={totals.income}
          figures={figures}
          color="var(--dfl-positive)"
        />
        <Divider />
        <Cell
          label={<Trans>Money out</Trans>}
          value={totals.spent}
          figures={figures}
          color="var(--dfl-negative)"
        />
        <Divider />
        <Cell
          label={<Trans>Monthly net</Trans>}
          value={totals.net}
          figures={figures}
          // The verdict is the one figure whose sign is a judgement.
          color={
            totals.net > 0
              ? 'var(--dfl-positive)'
              : totals.net < 0
                ? 'var(--dfl-negative)'
                : 'var(--dfl-text-2)'
          }
          emphasized
        />
      </View>
    </LabPanel>
  );
}

type CellProps = {
  label: ReactNode;
  value: number;
  /** The three figures of the panel, which share the fit of the longest. */
  figures: string[];
  color: string;
  emphasized?: boolean;
};

function Cell({ label, value, figures, color, emphasized = false }: CellProps) {
  const designSize = `${emphasized ? 24 : 22}px`;

  return (
    // `flex-end` keeps the three amounts on one baseline even if a label wraps.
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: '0 16px',
        gap: 8,
        justifyContent: 'flex-end',
        // The cell's width is what its figure is fitted to.
        containerType: 'inline-size',
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--dfl-text-3)',
        }}
      >
        {label}
      </Text>
      <FinancialText
        style={{
          fontSize: [
            designSize,
            fittedFontSize({
              designSize,
              room: '100cqi',
              floor: '13px',
              letterSpacing: FIGURE_TRACKING,
              figures,
            }),
          ],
          fontWeight: emphasized ? 700 : 600,
          lineHeight: 1.1,
          letterSpacing: FIGURE_TRACKING,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        <PrivacyFilter>{formatMoney(value)}</PrivacyFilter>
      </FinancialText>
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
        backgroundColor: 'var(--dfl-line)',
      }}
    />
  );
}
