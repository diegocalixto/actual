import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { LabPanel } from '#components/v2lab/LabPanel';

import { BudgetBar } from './BudgetBar';
import type { LabEnvelope } from './budgetFixtures';
import { formatBRL, formatPercent } from './budgetMoney';
import { BudgetTile } from './BudgetTile';

type BudgetEnvelopesProps = {
  envelopes: LabEnvelope[];
  /** Sum of all budgeted amounts, so each row can state its share of the plan. */
  totalBudgeted: number;
};

const AMOUNT_COLUMN = 116;

/**
 * The envelope list — the working surface of the page.
 *
 * One panel with hairlines between rows, not one card per envelope: eight cards
 * would give eight equal borders to scan, and the question this list answers
 * ("where am I about to run out?") is answered by comparing rows, which only
 * works when nothing separates them but a line.
 */
export function BudgetEnvelopes({
  envelopes,
  totalBudgeted,
}: BudgetEnvelopesProps) {
  return (
    <LabPanel>
      <ColumnHeader />
      {envelopes.map((envelope, index) => (
        <Row
          key={envelope.id}
          envelope={envelope}
          share={totalBudgeted > 0 ? envelope.budgeted / totalBudgeted : 0}
          isLast={index === envelopes.length - 1}
        />
      ))}
    </LabPanel>
  );
}

function ColumnHeader() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        padding: '13px 22px 11px',
        borderBottom: '1px solid var(--dfl-line)',
        backgroundColor: 'rgba(4, 8, 16, 0.35)',
      }}
    >
      {/* Matches the tile + name + bar block below, so the three labels sit
          exactly over the three columns they name. */}
      <View style={{ flex: '1 1 auto' }} />
      <HeaderLabel>
        <Trans>Orçado</Trans>
      </HeaderLabel>
      <HeaderLabel>
        <Trans>Gasto</Trans>
      </HeaderLabel>
      <HeaderLabel>
        <Trans>Disponível</Trans>
      </HeaderLabel>
      <View aria-hidden="true" style={{ flex: '0 0 16px' }} />
    </View>
  );
}

function HeaderLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        textAlign: 'right',
        color: 'var(--dfl-text-3)',
      }}
    >
      {children}
    </Text>
  );
}

type RowProps = {
  envelope: LabEnvelope;
  share: number;
  isLast: boolean;
};

function Row({ envelope, share, isLast }: RowProps) {
  const remaining = envelope.budgeted - envelope.spent;
  const ratio = envelope.budgeted > 0 ? envelope.spent / envelope.budgeted : 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        padding: '14px 22px',
        minHeight: 70,
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
      }}
    >
      <BudgetTile Icon={envelope.Icon} hue={envelope.hue} />

      <View style={{ flex: '0 0 158px', gap: 3, minWidth: 0 }}>
        <TextOneLine
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.1,
            color: 'var(--dfl-text)',
          }}
        >
          {envelope.name}
        </TextOneLine>
        <Text style={{ fontSize: 12, color: 'var(--dfl-text-3)' }}>
          {formatPercent(share)}
        </Text>
      </View>

      {/* The bar carries the row's weight — it is what makes Delivery at 99%
          findable without reading a single number. */}
      <View style={{ flex: '1 1 0', minWidth: 60 }}>
        <BudgetBar ratio={ratio} hue={envelope.hue} />
      </View>

      <Amount value={envelope.budgeted} muted />
      <Amount value={envelope.spent} muted />
      {/* Semantic, not per-category: what is left is the one figure whose sign
          matters, so it is the one figure allowed to be green or red. */}
      <Amount
        value={remaining}
        color={
          remaining > 0
            ? 'var(--dfl-positive)'
            : remaining < 0
              ? 'var(--dfl-negative)'
              : 'var(--dfl-text-3)'
        }
      />

      <SvgCheveronRight
        aria-hidden="true"
        width={16}
        height={16}
        style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
      />
    </View>
  );
}

function Amount({
  value,
  muted = false,
  color,
}: {
  value: number;
  muted?: boolean;
  color?: string;
}) {
  return (
    <FinancialText
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        fontSize: 14.5,
        fontWeight: 600,
        letterSpacing: -0.2,
        textAlign: 'right',
        whiteSpace: 'nowrap',
        color: color ?? (muted ? 'var(--dfl-text-2)' : 'var(--dfl-text)'),
      }}
    >
      {formatBRL(value)}
    </FinancialText>
  );
}
