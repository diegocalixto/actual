import React from 'react';
import type { ReactNode, RefObject } from 'react';
import { Trans } from 'react-i18next';

import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabSection } from '#components/v2lab/LabPanel';

import { BudgetActivity } from './BudgetActivity';
import { BudgetBand } from './BudgetBand';
import { BudgetEnvelopes } from './BudgetEnvelopes';
import type { LabEnvelope, LabMovement, LabTip } from './budgetFixtures';
import { BudgetTips } from './BudgetTips';

/**
 * Re-exported so consumers outside this folder can reach them: the modules that
 * declare these are `.ts`, the `#components/*` subpath only resolves `.tsx`,
 * and parent-relative imports are banned by lint. This file is the folder's
 * door — the production Budget imports its types from here.
 */
export type { LabEnvelope, LabMovement, LabTip } from './budgetFixtures';
export type { BudgetHue } from './budgetTokens';

/**
 * The approved Budget, as one composition.
 *
 * This is the only place the screen's structure exists. The laboratory route
 * feeds it fixtures and the real `/budget` feeds it the application's own
 * cells, so the two can differ in what they say and never in how they look.
 *
 * It reads no data and imports no fixtures — everything arrives as props, and
 * the tokens it paints with come from whichever class the caller has already
 * put on an ancestor.
 */

/**
 * How a row's trailing control behaves.
 *
 * A function renders the caller's own action surface, anchored to the trigger
 * it is handed; `'mock'` draws the control inert, which only the laboratory may
 * do; absent omits it. Spelling the middle case out in the type is what keeps a
 * decorative chevron from reaching production by accident.
 */
export type EnvelopeActions =
  | ((args: {
      envelopeId: string;
      triggerRef: RefObject<HTMLButtonElement | null>;
      isOpen: boolean;
      onClose: () => void;
    }) => ReactNode)
  | 'mock';

export type BudgetViewData = {
  /** Income for the month. `null` while the cell has not resolved. */
  income: number | null;
  /** The engine's own "to budget" cell. `null` ⇒ the metric is omitted. */
  toDistribute: number | null;
  /**
   * The month's whole plan and whole spend, from the engine's own totals.
   *
   * The band speaks for the month, so it prefers these over a sum of the rows:
   * a hidden category still holds budget and still spends, and the summary must
   * say so. `null` ⇒ fall back to the visible rows while the cells resolve.
   */
  totalBudgeted: number | null;
  totalSpent: number | null;
  /** Absent ⇒ rows have no trailing control at all. */
  envelopeActions?: EnvelopeActions;
  envelopes: LabEnvelope[];
  tips: LabTip[];
  movements: LabMovement[];
  /** Already-localised, e.g. "Agosto de 2026". */
  monthLabel: string;
  /** Absent in the laboratory, where there is only one month of fixtures. */
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  /** Called when a row's budgeted amount is edited. Absent ⇒ read-only. */
  onBudgetedChange?: (envelopeId: string, amount: number) => void;
  isEnvelopesLoading: boolean;
  isActivityLoading: boolean;
  /** The laboratory's own note. Absent in production. */
  footnote?: ReactNode;
};

export function BudgetView({ data }: { data: BudgetViewData }) {
  // What the visible list adds up to. The rows' shares stay relative to this,
  // because a row's percentage is its slice of the list it sits in.
  const visibleBudgeted = data.envelopes.reduce(
    (sum, envelope) => sum + envelope.budgeted,
    0,
  );
  const visibleSpent = data.envelopes.reduce(
    (sum, envelope) => sum + envelope.spent,
    0,
  );

  // The band is a statement about the whole month, hidden categories included.
  const bandBudgeted = data.totalBudgeted ?? visibleBudgeted;
  const bandSpent = data.totalSpent ?? visibleSpent;

  return (
    <View
      style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 1560,
          alignSelf: 'center',
          flexShrink: 0,
          padding: '22px 40px 40px',
          gap: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <View style={{ gap: 5, paddingLeft: 2 }}>
            <Text
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: -0.8,
                color: 'var(--dfl-text)',
              }}
            >
              <Trans>Orçamento</Trans>
            </Text>
            <Text style={{ fontSize: 13.5, color: 'var(--dfl-text-2)' }}>
              <Trans>Seu plano para este mês</Trans>
            </Text>
          </View>

          <MonthChip
            label={data.monthLabel}
            onPrevious={data.onPreviousMonth}
            onNext={data.onNextMonth}
          />
        </View>

        <BudgetBand
          income={data.income ?? 0}
          budgeted={bandBudgeted}
          spent={bandSpent}
          toDistribute={data.toDistribute}
        />

        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 22 }}
        >
          {/* Left, and dominant: the plan itself. */}
          <View style={{ flex: '1.42 1 0', minWidth: 0 }}>
            <LabSection label={<Trans>Seus envelopes</Trans>}>
              {data.envelopes.length === 0 ? (
                <EmptyPanel>
                  {data.isEnvelopesLoading ? (
                    <Trans>Carregando envelopes…</Trans>
                  ) : (
                    <Trans>Nenhuma categoria de despesa neste mês.</Trans>
                  )}
                </EmptyPanel>
              ) : (
                <BudgetEnvelopes
                  envelopes={data.envelopes}
                  totalBudgeted={visibleBudgeted}
                  onBudgetedChange={data.onBudgetedChange}
                  envelopeActions={data.envelopeActions}
                />
              )}
            </LabSection>
          </View>

          {/* Right, and quieter: context around the plan. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 20 }}>
            <LabSection label={<Trans>Dicas rápidas</Trans>}>
              <BudgetTips tips={data.tips} />
            </LabSection>

            <LabSection label={<Trans>Atividade recente</Trans>}>
              {data.movements.length === 0 ? (
                <EmptyPanel>
                  {data.isActivityLoading ? (
                    <Trans>Carregando atividade…</Trans>
                  ) : (
                    <Trans>Nenhuma movimentação neste mês.</Trans>
                  )}
                </EmptyPanel>
              ) : (
                <BudgetActivity movements={data.movements} />
              )}
            </LabSection>
          </View>
        </View>

        {data.footnote && (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.6,
              color: 'var(--dfl-text-3)',
              textAlign: 'right',
              opacity: 0.7,
            }}
          >
            {data.footnote}
          </Text>
        )}
      </View>
    </View>
  );
}

type MonthChipProps = {
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
};

/**
 * The month this page is about.
 *
 * The arrows appear only when there is somewhere to go: in the laboratory there
 * is one month of fixtures, and a chevron that changed the caption without
 * changing a single number would be worse than no chevron at all.
 */
function MonthChip({ label, onPrevious, onNext }: MonthChipProps) {
  const steppable = onPrevious != null && onNext != null;

  return (
    <View
      style={{
        flex: '0 0 auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: steppable ? 4 : 9,
        padding: steppable ? '5px 8px' : '9px 16px',
        borderRadius: 999,
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line-strong)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      {steppable && <StepButton Icon={SvgCheveronLeft} onPress={onPrevious} />}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          padding: steppable ? '0 6px' : 0,
        }}
      >
        <SvgCalendar3
          aria-hidden="true"
          width={15}
          height={15}
          style={{ color: 'var(--dfl-blue)' }}
        />
        <Text
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: -0.1,
            whiteSpace: 'nowrap',
            color: 'var(--dfl-text)',
          }}
        >
          {label}
        </Text>
      </View>

      {steppable && <StepButton Icon={SvgCheveronRight} onPress={onNext} />}
    </View>
  );
}

function StepButton({
  Icon,
  onPress,
}: {
  Icon: typeof SvgCheveronLeft;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        borderRadius: 999,
        cursor: 'pointer',
        color: 'var(--dfl-text-2)',
        background: 'transparent',
      }}
    >
      <Icon width={16} height={16} />
    </button>
  );
}

/** What a panel shows when it has nothing to show. */
function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 88,
        padding: '22px 24px',
        backgroundColor: 'var(--dfl-surface)',
        border: '1px solid var(--dfl-line)',
        borderRadius: 'var(--dfl-radius)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      <Text style={{ fontSize: 13, color: 'var(--dfl-text-3)' }}>
        {children}
      </Text>
    </View>
  );
}
