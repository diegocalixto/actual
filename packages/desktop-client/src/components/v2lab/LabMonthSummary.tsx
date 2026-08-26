import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { formatMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import type { LabMonthTotals } from './overviewFixtures';

type LabMonthSummaryProps = {
  totals: LabMonthTotals;
};

/** Money in, money out, and the month's verdict. */
export function LabMonthSummary({ totals }: LabMonthSummaryProps) {
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
          color="var(--dfl-positive)"
        />
        <Divider />
        <Cell
          label={<Trans>Money out</Trans>}
          value={totals.spent}
          color="var(--dfl-negative)"
        />
        <Divider />
        <Cell
          label={<Trans>Monthly net</Trans>}
          value={totals.net}
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
  color: string;
  emphasized?: boolean;
};

function Cell({ label, value, color, emphasized = false }: CellProps) {
  return (
    // `flex-end` keeps the three amounts on one baseline even if a label wraps.
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: '0 16px',
        gap: 8,
        justifyContent: 'flex-end',
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
          fontSize: emphasized ? 24 : 22,
          fontWeight: emphasized ? 700 : 600,
          lineHeight: 1.1,
          letterSpacing: -0.5,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {formatMoney(value)}
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
