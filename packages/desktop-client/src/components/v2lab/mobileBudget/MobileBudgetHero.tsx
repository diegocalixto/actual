import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { CURRENCY, formatAmount } from './mobileBudgetMoney';
import { MobileBudgetRing } from './MobileBudgetRing';

type MobileBudgetHeroProps = {
  /** Integer minor units still waiting for a job. */
  toDistribute: number;
  /** Whole percent of the plan already spent. */
  usedPercent: number | null;
};

/**
 * The screen's subject.
 *
 * Two facts on one surface, because they are two halves of the same question:
 * what is still unassigned, and how far into the plan the month already is.
 * Splitting them into two cards would make the reader compare panels instead of
 * reading a sentence.
 *
 * Violet rather than the Home's cold blue. Budget is the destination the bar
 * lights in violet, and the screen is lit by the accent it belongs to — the
 * same product, a different room.
 */
export function MobileBudgetHero({
  toDistribute,
  usedPercent,
}: MobileBudgetHeroProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: '18px 18px',
        borderRadius: 'var(--dfmb-radius)',
        border: '1px solid var(--dfmb-hero-edge)',
        boxShadow: 'var(--dfl-shadow-hero)',
        backgroundImage:
          'linear-gradient(135deg, var(--dfmb-hero-from) 0%, var(--dfmb-hero-to) 62%, #2e1f66 100%)',
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            color: 'var(--dfmb-hero-sub)',
          }}
        >
          <Trans>Para distribuir</Trans>
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: 600, color: '#ffffff' }}>
            {CURRENCY}
          </Text>
          <FinancialText
            style={{
              fontSize: 'clamp(26px, 7.6vw, 33px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1,
              whiteSpace: 'nowrap',
              color: '#ffffff',
            }}
          >
            {formatAmount(toDistribute)}
          </FinancialText>
        </View>

        <Text style={{ fontSize: 12, color: 'var(--dfmb-hero-sub)' }}>
          <Trans>Dinheiro disponível no orçamento</Trans>
        </Text>
      </View>

      {usedPercent !== null && (
        <View
          style={{
            position: 'relative',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MobileBudgetRing percent={usedPercent} size={92} />
          <View
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <FinancialText
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: '#ffffff',
              }}
            >
              {`${usedPercent}%`}
            </FinancialText>
            <Text
              style={{
                fontSize: 8.5,
                lineHeight: 1.2,
                textAlign: 'center',
                color: 'var(--dfmb-hero-sub)',
              }}
            >
              <Trans>do planejado</Trans>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
