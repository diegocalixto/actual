import React from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { FinancialText } from '#components/FinancialText';

import { MobileHeroLight } from './MobileHeroLight';
import { CURRENCY, formatAmount } from './mobileHomeMoney';

type MobileHomeHeroProps = {
  /** Integer minor units, as Actual stores money. */
  available: number;
  toDistribute: number;
};

/**
 * The screen's subject.
 *
 * One surface carrying two related answers: what there is, and how much of it
 * has no job yet. They share a card rather than sitting in two, because the
 * second is a property of the first — splitting them would make the phone look
 * like a stack of unrelated tiles before it has said anything.
 *
 * The strip is a darker plane under the same border, so the division reads as
 * depth. The symbol is its own element at its own size: at 36px the digits are
 * the sentence and "R$" is punctuation.
 */
export function MobileHomeHero({
  available,
  toDistribute,
}: MobileHomeHeroProps) {
  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 'var(--dfm-radius)',
        border: '1px solid var(--dfl-hero-line)',
        boxShadow: 'var(--dfl-shadow-hero)',
        backgroundImage:
          'linear-gradient(120deg, var(--dfl-hero-from) 0%, var(--dfl-hero-to) 58%, #0d1a2e 100%)',
        overflow: 'hidden',
      }}
    >
      <MobileHeroLight />

      <View
        style={{
          position: 'relative',
          padding: '18px 18px 16px',
          gap: 6,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.3,
            textTransform: 'uppercase',
            color: 'var(--dfl-text-2)',
          }}
        >
          <Trans>Saldo disponível</Trans>
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            {CURRENCY}
          </Text>
          <FinancialText
            style={{
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.1,
              color: '#ffffff',
              whiteSpace: 'nowrap',
            }}
          >
            {formatAmount(available)}
          </FinancialText>
        </View>

        <Text style={{ fontSize: 12.5, color: 'var(--dfl-text-2)' }}>
          <Trans>Soma das contas no orçamento</Trans>
        </Text>
      </View>

      <View
        style={{
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '13px 16px 13px 18px',
          borderTop: '1px solid var(--dfl-hero-line)',
          backgroundColor: 'var(--dfm-hero-strip)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              flexShrink: 0,
              borderRadius: 999,
              backgroundColor: 'var(--dfl-blue)',
            }}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              color: 'var(--dfl-text-2)',
            }}
          >
            <Trans>Para distribuir</Trans>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <FinancialText
            style={{
              fontSize: 16.5,
              fontWeight: 700,
              letterSpacing: -0.2,
              color: 'var(--dfm-hero-value)',
              whiteSpace: 'nowrap',
            }}
          >
            {`${CURRENCY} ${formatAmount(toDistribute)}`}
          </FinancialText>
          <SvgCheveronRight
            aria-hidden="true"
            width={16}
            height={16}
            style={{ color: 'var(--dfl-text-3)' }}
          />
        </View>
      </View>
    </View>
  );
}
