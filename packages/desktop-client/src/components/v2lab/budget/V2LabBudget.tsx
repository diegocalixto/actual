import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabSection } from '#components/v2lab/LabPanel';

import { BudgetActivity } from './BudgetActivity';
import { BudgetBand } from './BudgetBand';
import { BudgetEnvelopes } from './BudgetEnvelopes';
import {
  labEnvelopes,
  labIncome,
  labMovements,
  labTips,
} from './budgetFixtures';
import { BudgetTips } from './BudgetTips';

/**
 * Visual laboratory for the Budget, desktop only.
 *
 * Renders inside the real App Shell, at `/v2-lab/budget`, so the page can be
 * judged against the rail and header already approved. The real `/budget` route
 * is untouched; this one is not reachable from any navigation.
 *
 * Every total on screen is derived from `labEnvelopes` and `labIncome` rather
 * than written out again, so the band, the bars and the rows cannot disagree.
 * That is also what makes the fixtures replaceable: an adapter producing the
 * same two inputs from real spreadsheet cells changes nothing below.
 */
export function V2LabBudget() {
  const { t } = useTranslation();

  const totalBudgeted = labEnvelopes.reduce(
    (sum, envelope) => sum + envelope.budgeted,
    0,
  );
  const totalSpent = labEnvelopes.reduce(
    (sum, envelope) => sum + envelope.spent,
    0,
  );

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

          <MonthChip />
        </View>

        <BudgetBand
          income={labIncome}
          budgeted={totalBudgeted}
          spent={totalSpent}
        />

        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 22 }}
        >
          {/* Left, and dominant: the plan itself. */}
          <View style={{ flex: '1.42 1 0', minWidth: 0 }}>
            <LabSection label={<Trans>Seus envelopes</Trans>}>
              <BudgetEnvelopes
                envelopes={labEnvelopes}
                totalBudgeted={totalBudgeted}
              />
            </LabSection>
          </View>

          {/* Right, and quieter: context around the plan. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 20 }}>
            <LabSection label={<Trans>Dicas rápidas</Trans>}>
              <BudgetTips tips={labTips} />
            </LabSection>

            <LabSection label={<Trans>Atividade recente</Trans>}>
              <BudgetActivity movements={labMovements} />
            </LabSection>
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            letterSpacing: 0.6,
            color: 'var(--dfl-text-3)',
            textAlign: 'right',
            opacity: 0.7,
          }}
        >
          {t('Laboratório visual — dados de demonstração')}
        </Text>
      </View>
    </View>
  );
}

/**
 * The month this page is about.
 *
 * Rendered as a label rather than a stepper: the laboratory has one month of
 * fixtures, and arrows that changed the caption without changing a single
 * number would be worse than no arrows at all. The control gains its chevrons
 * when it gains a month to move to.
 */
function MonthChip() {
  return (
    <View
      style={{
        flex: '0 0 auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        padding: '9px 16px',
        borderRadius: 999,
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line-strong)',
        boxShadow: 'var(--dfl-shadow)',
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
        <Trans>Agosto de 2026</Trans>
      </Text>
    </View>
  );
}
