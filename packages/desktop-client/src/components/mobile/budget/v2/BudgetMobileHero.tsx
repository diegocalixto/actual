import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { amountWidthInEm, fittedFontSize } from '#components/v2lab/LabStyle';

import { currencySymbol, formatAmount, PENDING } from './budgetMobileMoney';
import { BudgetMobileRing } from './BudgetMobileRing';

/** The symbol is set smaller than the figure it introduces. */
const SYMBOL_SIZE = 18;
const SYMBOL_GAP = 6;
const FIGURE_TRACKING = -1;

type BudgetMobileHeroProps = {
  label: ReactNode;
  caption: ReactNode;
  /** Integer minor units, or `null` while the cell is still resolving. */
  amount: number | null;
  /** Whole percent of the plan already spent, or `null` when there is no plan. */
  usedPercent: number | null;
  onPress: () => void;
  ariaLabel: string;
};

/**
 * The screen's subject.
 *
 * Two facts on one surface, because they are two halves of the same question:
 * what the budget's headline figure is, and how far into the plan the month
 * already is. Splitting them into two cards would make the reader compare
 * panels instead of reading a sentence.
 *
 * Violet rather than the Home's cold blue. Budget is the destination the bar
 * lights in violet, and the screen is lit by the accent it belongs to — the
 * same product, a different room.
 *
 * The whole surface is the control that opens the budget summary, which is the
 * affordance the upstream header hung off its "To Budget" figure. The figure is
 * still what you press; it is simply the size of the card now.
 *
 * The figure shares its line with the symbol and its card with the ring, so a
 * long one — a budget in the millions, an overbudget with its minus — had no
 * room left and broke the symbol onto a line of its own. It now gives up size
 * instead: the column it sits in is the measure, and the figure is set at the
 * design's size or at the size that still fits, whichever is smaller.
 */
export function BudgetMobileHero({
  label,
  caption,
  amount,
  usedPercent,
  onPress,
  ariaLabel,
}: BudgetMobileHeroProps) {
  const isNegative = amount !== null && amount < 0;
  const symbol = isNegative ? `-${currencySymbol()}` : currencySymbol();
  const figure = amount === null ? null : formatAmount(Math.abs(amount));
  // What the symbol and the space after it take out of the line.
  const symbolRoom =
    Math.ceil(amountWidthInEm(symbol) * SYMBOL_SIZE) + SYMBOL_GAP;

  return (
    <Button
      variant="bare"
      onPress={onPress}
      aria-label={ariaLabel}
      className={css({
        width: '100%',
        padding: '18px',
        borderRadius: 'var(--dfmb-radius)',
        border: '1px solid var(--dfmb-hero-edge)',
        boxShadow: 'var(--dfl-shadow-hero)',
        backgroundImage:
          'linear-gradient(135deg, var(--dfmb-hero-from) 0%, var(--dfmb-hero-to) 62%, #2e1f66 100%)',
        '&[data-hovered]': {
          backgroundImage:
            'linear-gradient(135deg, #221749 0%, #291e5c 62%, #35236f 100%)',
        },
      })}
    >
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            gap: 5,
            alignItems: 'flex-start',
            // The width the figure is fitted to.
            containerType: 'inline-size',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.3,
              textTransform: 'uppercase',
              textAlign: 'left',
              color: 'var(--dfmb-hero-sub)',
            }}
          >
            {label}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: SYMBOL_GAP,
            }}
          >
            <Text
              style={{
                flexShrink: 0,
                fontSize: SYMBOL_SIZE,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: '#ffffff',
              }}
            >
              {symbol}
            </Text>
            <FinancialText
              style={{
                fontSize: fittedFontSize({
                  designSize: 'clamp(26px, 7.6vw, 33px)',
                  room: `100cqi - ${symbolRoom}px`,
                  floor: '17px',
                  letterSpacing: FIGURE_TRACKING,
                  figures: [figure],
                }),
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: FIGURE_TRACKING,
                whiteSpace: 'nowrap',
                color: '#ffffff',
              }}
            >
              {figure === null ? (
                PENDING
              ) : (
                <PrivacyFilter>{figure}</PrivacyFilter>
              )}
            </FinancialText>
          </View>

          <Text
            style={{
              fontSize: 12,
              textAlign: 'left',
              color: 'var(--dfmb-hero-sub)',
            }}
          >
            {caption}
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
            <BudgetMobileRing percent={usedPercent} size={92} />
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
                <Trans>do orçado</Trans>
              </Text>
            </View>
          </View>
        )}
      </View>
    </Button>
  );
}
