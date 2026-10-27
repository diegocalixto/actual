import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { tsToRelativeTime } from '@actual-app/core/shared/util';

import { amountWidthInEm, fittedFontSize } from '#components/v2lab/LabStyle';
import { useLocale } from '#hooks/useLocale';

import { HomeMobileHeroLight } from './HomeMobileHeroLight';
import { HomeMobileMoney } from './HomeMobileMoney';
import { currencySymbol, formatAmount } from './mobileMoneyFormat';

type HeroFactProps = {
  label: ReactNode;
  value: number;
  tone?: 'negative';
};

/** One of the two parts the headline is made of: a label and its figure. */
function HeroFact({ label, value, tone }: HeroFactProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
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
      <HomeMobileMoney
        value={value}
        withCurrency
        style={{
          fontSize: 13,
          fontWeight: 600,
          color:
            tone === 'negative' ? 'var(--dfl-negative)' : 'var(--dfl-text)',
        }}
      />
    </View>
  );
}

/** The symbol is set smaller than the figure it introduces. */
const SYMBOL_SIZE = 20;
const SYMBOL_GAP = 7;
const FIGURE_TRACKING = -1.1;

type HomeMobileHeroProps = {
  /** Sum of the on-budget account balances, or `null` while the cell loads. */
  available: number | null;
  /**
   * Sum of the card accounts' balances (negative for a debt), when the bank's
   * data proves which accounts are cards; `null` otherwise, and the line is
   * not drawn.
   */
  cardsDebt?: number | null;
  /** When the bank was last read, as epoch milliseconds; `null` when never. */
  lastBankRead?: number | null;
};

/**
 * The screen's subject: what there is.
 *
 * The headline is the sum of the on-budget account balances: money that exists
 * and is inside the budget, cards already netted out. Under it the two parts
 * it is made of — what sits in the accounts and what the cards owe — because
 * the question this card answers is "how much do I have", and a reader who
 * sees R$ 1.300 wants to know it is R$ 6.100 in accounts less R$ 4.800 of
 * card bills, not one opaque figure.
 *
 * It is deliberately not relabelled "available to spend", which under an
 * envelope budget means a different figure; the caption states the definition
 * so the headline can stay short without over-claiming.
 *
 * The envelope budget's "to budget" cell used to sit under the headline as a
 * strip. It is not a balance — it is the income not yet given an envelope,
 * added up over the months — and printed on the card that answers "how much do
 * I have" it was read as one. It lives on the Budget now, as "A planejar", with
 * the explanation beside it.
 *
 * An overdrawn headline is written the way every other negative on this
 * screen is: the minus leads, ahead of the symbol, and both take the negative
 * tone.
 */
export function HomeMobileHero({
  available,
  cardsDebt = null,
  lastBankRead = null,
}: HomeMobileHeroProps) {
  const { t } = useTranslation();
  const locale = useLocale();

  // The headline nets the cards out; these two say by how much, and only when
  // both are known, so they always add up to it.
  const inAccounts =
    available !== null && cardsDebt !== null ? available - cardsDebt : null;

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
          <Trans>Saldo nas contas</Trans>
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
          <Trans>Contas no orçamento somadas, cartões já descontados</Trans>
        </Text>

        {inAccounts !== null && cardsDebt !== null && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '4px 14px',
              paddingTop: 4,
            }}
          >
            <HeroFact label={<Trans>In accounts</Trans>} value={inAccounts} />
            <HeroFact
              // A card the holder is owed by (a credit after a refund) is not
              // a debt, so the word is kept for the ordinary case only.
              label={
                cardsDebt < 0 ? <Trans>Card debt</Trans> : <Trans>Cards</Trans>
              }
              value={cardsDebt}
              tone={cardsDebt < 0 ? 'negative' : undefined}
            />
          </View>
        )}

        {lastBankRead !== null && (
          <Text style={{ fontSize: 11.5, color: 'var(--dfl-text-3)' }}>
            {t('Bank data updated {{when}}', {
              when: tsToRelativeTime(String(lastBankRead), locale),
            })}
          </Text>
        )}
      </View>
    </View>
  );
}
