import React from 'react';
import type { ReactNode, RefObject } from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabSection } from '#components/v2lab/LabPanel';
import { MonthChip } from '#components/v2lab/MonthChip';

import { BudgetActivity } from './BudgetActivity';
import { BudgetBand } from './BudgetBand';
import { BudgetEnvelopes, ENVELOPES_MIN_WIDTH } from './BudgetEnvelopes';
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
      /** Whatever was pressed: the chevron, or the name. */
      triggerRef: RefObject<HTMLButtonElement | null>;
      /** The chevron asks for the row's actions; the name, for a rename. */
      intent: EnvelopeActionsIntent;
      isOpen: boolean;
      onClose: () => void;
    }) => ReactNode)
  | 'mock';

export type EnvelopeActionsIntent = 'actions' | 'rename';

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
  /**
   * One line under the band saying what its figures are and are not — the
   * engine's own income and categorized spending — and how much of the
   * month's spending has no category and so is not in them. Absent ⇒ the
   * laboratory, which has no month to say it about.
   */
  bandNote?: ReactNode;
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
  /** Bottom-right note: the laboratory's caveat, or production's byline. */
  footnote?: ReactNode;
};

/**
 * The narrowest the context column works at beside the list: an activity row is
 * a tile, an envelope, a date and an amount at fixed widths, and below this the
 * payee's name between them is squeezed to nothing.
 */
const CONTEXT_MIN_WIDTH = 480;
/** Wide enough for a context panel to stand beside its sibling, not under it. */
const CONTEXT_PANEL_BASIS = 420;

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
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: -0.8,
                color: 'var(--dfl-text)',
              }}
            >
              <Trans>Orçamento</Trans>
            </h1>
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

        {data.bandNote && (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 1.45,
              paddingLeft: 2,
              color: 'var(--dfl-text-3)',
            }}
          >
            {data.bandNote}
          </Text>
        )}

        {/* The approved split holds wherever both columns fit. Each carries
            the least width it works at, so a window too narrow for the pair
            wraps the context under the list instead of clipping the list's
            last columns — which are the available balance and the actions. */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            gap: 22,
          }}
        >
          {/* Left, and dominant: the plan itself. */}
          <View style={{ flex: '1.42 1 0', minWidth: ENVELOPES_MIN_WIDTH }}>
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

          {/* Right, and quieter: context around the plan. Its two panels
              stack while the column is a column, and sit side by side once it
              has wrapped under the list and has the whole row to itself. */}
          <View
            style={{
              flex: '1 1 0',
              minWidth: CONTEXT_MIN_WIDTH,
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              gap: 20,
            }}
          >
            <View style={{ flex: `1 1 ${CONTEXT_PANEL_BASIS}px`, minWidth: 0 }}>
              <LabSection label={<Trans>Dicas rápidas</Trans>}>
                <BudgetTips tips={data.tips} />
              </LabSection>
            </View>

            <View style={{ flex: `1 1 ${CONTEXT_PANEL_BASIS}px`, minWidth: 0 }}>
              <LabSection label={<Trans>Transações recentes</Trans>}>
                {data.movements.length === 0 ? (
                  <EmptyPanel>
                    {data.isActivityLoading ? (
                      <Trans>Carregando transações…</Trans>
                    ) : (
                      <Trans>Nenhuma transação neste mês.</Trans>
                    )}
                  </EmptyPanel>
                ) : (
                  <BudgetActivity movements={data.movements} />
                )}
              </LabSection>
            </View>
          </View>
        </View>

        {data.footnote && (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.6,
              // The quietest tier, at full strength: dimmed further it fell
              // under the contrast small type needs.
              color: 'var(--dfl-text-3)',
              textAlign: 'right',
            }}
          >
            {data.footnote}
          </Text>
        )}
      </View>
    </View>
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
