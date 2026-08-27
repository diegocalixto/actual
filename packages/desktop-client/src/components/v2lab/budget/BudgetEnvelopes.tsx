import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';
import { LabPanel } from '#components/v2lab/LabPanel';

import { BudgetBar } from './BudgetBar';
import type { LabEnvelope } from './budgetFixtures';
import { formatPercent, formatPlain } from './budgetMoney';
import { BudgetTile } from './BudgetTile';
import type { EnvelopeActions } from './BudgetView';

type BudgetEnvelopesProps = {
  envelopes: LabEnvelope[];
  /** Sum of all budgeted amounts, so each row can state its share of the plan. */
  totalBudgeted: number;
  /** Absent ⇒ the column is read-only, as in the laboratory. */
  onBudgetedChange?: (envelopeId: string, amount: number) => void;
  envelopeActions?: EnvelopeActions;
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
  onBudgetedChange,
  envelopeActions,
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
          onBudgetedChange={onBudgetedChange}
          envelopeActions={envelopeActions}
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
        padding: '0 8px',
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
  onBudgetedChange?: (envelopeId: string, amount: number) => void;
  envelopeActions?: EnvelopeActions;
};

function Row({
  envelope,
  share,
  isLast,
  onBudgetedChange,
  envelopeActions,
}: RowProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const renderActions =
    typeof envelopeActions === 'function' ? envelopeActions : undefined;
  // The engine's own figure for this envelope, carryover included.
  const remaining = envelope.available;
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

      {onBudgetedChange ? (
        <BudgetedInput
          value={envelope.budgeted}
          onCommit={amount => onBudgetedChange(envelope.id, amount)}
        />
      ) : (
        <Amount value={envelope.budgeted} muted />
      )}
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

      {/* The reference ended each row with a chevron. It now opens what a
          chevron promises — the category's own actions — and is drawn only when
          there is something behind it. */}
      {envelopeActions && (
        <Button
          ref={triggerRef}
          variant="bare"
          aria-label={t('Ações da categoria')}
          onPress={() => setIsOpen(open => !open)}
          style={{
            flexShrink: 0,
            padding: 2,
            color: 'var(--dfl-text-3)',
            backgroundColor: 'transparent',
          }}
        >
          <SvgCheveronRight aria-hidden="true" width={16} height={16} />
        </Button>
      )}
      {renderActions?.({
        envelopeId: envelope.id,
        triggerRef,
        isOpen,
        onClose: () => setIsOpen(false),
      })}
    </View>
  );
}

/**
 * One money column.
 *
 * The prefix is pinned left and the figure right, rather than living inside one
 * right-aligned string: with the symbol inside the text, a row of "R$ 1.240,00"
 * and "R$ -6,64" pushes each "R$" to a different place and the column reads as
 * ragged. Split, both the symbols and the digits line up, and `FinancialText`
 * keeps the digits tabular so they stay lined up as the numbers change.
 */
function Amount({
  value,
  muted = false,
  color,
}: {
  value: number;
  muted?: boolean;
  color?: string;
}) {
  const tone = color ?? (muted ? 'var(--dfl-text-2)' : 'var(--dfl-text)');

  return (
    <View
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 3,
        padding: '4px 8px',
      }}
    >
      <Text style={{ fontSize: 14.5, fontWeight: 600, color: tone }}>R$</Text>
      <FinancialText
        style={{
          /* Grows to fill the cell so the symbol stays pinned left and the
             figure stays pinned right — the same split the editable column
             uses, which is what makes all three line up. */
          flex: '1 1 0',
          minWidth: 0,
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: -0.2,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          color: tone,
        }}
      >
        {formatPlain(value)}
      </FinancialText>
    </View>
  );
}

/**
 * The budgeted column, when the page can write.
 *
 * Deliberately not a control: it wears exactly the type, width and alignment of
 * the read-only amount beside it, and only reveals itself on focus. The plan is
 * something you adjust in place, and a row of boxes would turn the panel back
 * into the spreadsheet this design replaced.
 */
function BudgetedInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (amount: number) => void;
}) {
  const [draft, setDraft] = useState(() => toEditable(value));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(toEditable(value));
    }
  }, [value, isEditing]);

  const commit = () => {
    setIsEditing(false);
    const parsed = fromEditable(draft);
    if (parsed !== null && parsed !== value) {
      onCommit(parsed);
    } else {
      setDraft(toEditable(value));
    }
  };

  return (
    <View
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 3,
        borderRadius: 8,
        padding: '4px 8px',
        background: isEditing ? 'rgba(6, 10, 18, 0.85)' : 'transparent',
        border: `1px solid ${isEditing ? 'var(--dfl-blue)' : 'transparent'}`,
      }}
    >
      <Text
        style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--dfl-text-2)' }}
      >
        R$
      </Text>
      <input
        value={draft}
        inputMode="decimal"
        onFocus={event => {
          setIsEditing(true);
          event.currentTarget.select();
        }}
        onChange={event => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(toEditable(value));
            setIsEditing(false);
            event.currentTarget.blur();
          }
        }}
        style={{
          flex: '1 1 0',
          minWidth: 0,
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: -0.2,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--dfl-text-2)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </View>
  );
}

/** Minor units to the string a person edits, and back. */
function toEditable(value: number): string {
  return (value / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fromEditable(text: string): number | null {
  const normalised = text
    .replace(/\s|R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}
