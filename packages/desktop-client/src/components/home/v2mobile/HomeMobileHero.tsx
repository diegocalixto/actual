import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import type { HomeBudgetType } from '#components/home/useHomeMonth';
import { amountWidthInEm, fittedFontSize } from '#components/v2lab/LabStyle';
import { useNavigate } from '#hooks/useNavigate';

import { HomeMobileHeroLight } from './HomeMobileHeroLight';
import { HomeMobileMoney } from './HomeMobileMoney';
import { currencySymbol, formatAmount } from './mobileMoneyFormat';

/** The symbol is set smaller than the figure it introduces. */
const SYMBOL_SIZE = 20;
const SYMBOL_GAP = 7;
const FIGURE_TRACKING = -1.1;

type HomeMobileHeroProps = {
  /** Sum of the on-budget account balances, or `null` while the cell loads. */
  available: number | null;
  /** The envelope budget's "to budget" cell. Absent under a tracking budget. */
  toBudget: number | null;
  budgetType: HomeBudgetType;
};

/**
 * The screen's subject.
 *
 * One surface carrying two related answers: what there is, and how much of it
 * has no job yet. They share a card rather than sitting in two, because the
 * second is a property of the first — splitting them would make the phone look
 * like a stack of unrelated tiles before it has said anything.
 *
 * The headline is the sum of the on-budget account balances: money that exists
 * and is inside the budget. It is deliberately not relabelled "available to
 * spend", which under an envelope budget means a different figure; the caption
 * states the definition so the headline can stay short without over-claiming.
 *
 * The strip appears only under an envelope budget, because a tracking budget
 * publishes no "to budget" cell — an empty row there would imply a figure the
 * budget does not have.
 *
 * An overdrawn headline is written the way every other negative on this
 * screen is: the minus leads, ahead of the symbol, and both take the negative
 * tone. It used to read "R$ -2.324,00", with the strip under it saying
 * "-R$ 1.234,00" — two conventions on one card.
 */
export function HomeMobileHero({
  available,
  toBudget,
  budgetType,
}: HomeMobileHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isOverdrawn = available !== null && available < 0;
  const symbol = isOverdrawn ? `-${currencySymbol()}` : currencySymbol();
  // A positive balance is the ordinary state, so the headline stays in the
  // page's own ink; only an overdrawn budget — a real alert — takes the
  // negative tone.
  const headlineColor = isOverdrawn ? 'var(--dfl-negative)' : '#ffffff';
  // What the symbol and the space after it take out of the line.
  const symbolRoom =
    Math.ceil(amountWidthInEm(symbol) * SYMBOL_SIZE) + SYMBOL_GAP;

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
      <HomeMobileHeroLight />

      <View
        style={{
          position: 'relative',
          padding: '18px 18px 16px',
          gap: 6,
          // The width the headline is fitted to.
          containerType: 'inline-size',
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

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: SYMBOL_GAP,
          }}
        >
          {/* The symbol is withheld while the cell is unresolved: "R$ —" reads
              as a currency with a missing amount, the dash alone as a figure
              that has not arrived. */}
          {available !== null && (
            <Text
              style={{
                flexShrink: 0,
                fontSize: SYMBOL_SIZE,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: headlineColor,
              }}
            >
              {symbol}
            </Text>
          )}
          <HomeMobileMoney
            value={available === null ? null : Math.abs(available)}
            style={{
              // The design's size, or the size at which a longer balance
              // still fits beside its symbol.
              fontSize: fittedFontSize({
                designSize: '36px',
                room: `100cqi - ${symbolRoom}px`,
                floor: '20px',
                letterSpacing: FIGURE_TRACKING,
                figures: [
                  available === null ? null : formatAmount(Math.abs(available)),
                ],
              }),
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: FIGURE_TRACKING,
              color: headlineColor,
            }}
          />
        </View>

        <Text style={{ fontSize: 12.5, color: 'var(--dfl-text-2)' }}>
          <Trans>Soma das contas no orçamento</Trans>
        </Text>
      </View>

      {budgetType === 'envelope' && (
        <Button
          variant="bare"
          aria-label={t('Abrir o orçamento')}
          onPress={() => void navigate('/budget')}
          className={css({
            position: 'relative',
            width: '100%',
            padding: '13px 16px 13px 18px',
            borderRadius: 0,
            borderTop: '1px solid var(--dfl-hero-line)',
            backgroundColor: 'var(--dfm-hero-strip)',
            '&[data-pressed]': { backgroundColor: 'rgba(4, 8, 16, 0.72)' },
          })}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              minWidth: 0,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
            >
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

            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <HomeMobileMoney
                value={toBudget}
                withCurrency
                style={{
                  fontSize: 16.5,
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color:
                    toBudget !== null && toBudget < 0
                      ? 'var(--dfl-negative)'
                      : 'var(--dfm-hero-value)',
                }}
              />
              <SvgCheveronRight
                aria-hidden="true"
                width={16}
                height={16}
                style={{ color: 'var(--dfl-text-3)' }}
              />
            </View>
          </View>
        </Button>
      )}
    </View>
  );
}
