import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { HomeMobileHeroLight } from '#components/home/v2mobile/HomeMobileHeroLight';

import { AccountsMobileMoney } from './AccountsMobileMoney';
import { currencyWithSign, magnitude } from './accountsMoneyFormat';

type AccountsMobileHeroProps = {
  /** The `accounts-balance` cell, or `null` while it loads. */
  total: number | null;
  /** How many open accounts the file has. A count, never a balance. */
  accountCount: number;
  /** Opens the combined register. */
  onOpenAllTransactions: () => void;
};

/**
 * The screen's subject: what every account holds, added up.
 *
 * The figure is the budget engine's own `accounts-balance` cell, not a sum of
 * the rows below — the same cell the previous page bound to its "All accounts"
 * line — so the hero cannot disagree with the groups even while a row is still
 * resolving.
 *
 * The strip under it is the destination the previous page reached from that
 * same line: every transaction, across every account. It stays a real
 * navigation rather than a repeated total, because the figure above already
 * said the number and the reader's next question is where it came from.
 *
 * The reflection is the mobile Home's, imported rather than copied: it is the
 * same object catching the same light, and two SVGs drifting apart is a worse
 * outcome than one import across folders.
 */
export function AccountsMobileHero({
  total,
  accountCount,
  onOpenAllTransactions,
}: AccountsMobileHeroProps) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        position: 'relative',
        borderRadius: 'var(--dfma-radius)',
        border: '1px solid var(--dfl-hero-line)',
        boxShadow: 'var(--dfl-shadow-hero)',
        backgroundImage:
          'linear-gradient(120deg, var(--dfl-hero-from) 0%, var(--dfl-hero-to) 58%, #0d1a2e 100%)',
        overflow: 'hidden',
      }}
    >
      <HomeMobileHeroLight />

      <View style={{ position: 'relative', padding: '18px 18px 16px', gap: 6 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
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
            <Trans>Saldo total</Trans>
          </Text>
          {/* A count of accounts, which is a fact the file carries. Nothing
              here is derived from it. Label and figure are separate elements
              rather than one interpolated sentence, so the line needs no plural
              form to stay grammatical at one account. */}
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                color: 'var(--dfl-text-3)',
              }}
            >
              <Trans>Contas</Trans>
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--dfl-text-2)',
              }}
            >
              {accountCount}
            </Text>
          </View>
        </View>

        <View
          data-testid="accounts-total-balance"
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}
        >
          {/* The symbol is withheld while the cell is unresolved: "R$ —" reads
              as a currency with a missing amount, the dash alone as a figure
              that has not arrived. */}
          {total !== null && (
            <Text
              style={{
                fontSize: 20,
                fontWeight: 600,
                // The symbol carries the minus, so it has to carry the tone
                // with it: half a red figure reads as a rendering fault.
                color: total < 0 ? 'var(--dfl-negative)' : '#ffffff',
              }}
            >
              {currencyWithSign(total)}
            </Text>
          )}
          <AccountsMobileMoney
            value={magnitude(total)}
            style={{
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.1,
              // A positive total is the ordinary state, so the headline stays
              // in the page's own ink; only a file that is genuinely in the red
              // overall takes the negative tone.
              color:
                total !== null && total < 0 ? 'var(--dfl-negative)' : '#ffffff',
            }}
          />
        </View>

        <Text style={{ fontSize: 12.5, color: 'var(--dfl-text-2)' }}>
          <Trans>Soma de todas as contas abertas</Trans>
        </Text>
      </View>

      <Button
        variant="bare"
        aria-label={t('Ver todas as transações')}
        onPress={onOpenAllTransactions}
        className={css({
          position: 'relative',
          width: '100%',
          padding: '13px 16px 13px 18px',
          borderRadius: 0,
          borderTop: '1px solid var(--dfl-hero-line)',
          backgroundColor: 'var(--dfma-hero-strip)',
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
              <Trans>Todas as transações</Trans>
            </Text>
          </View>

          <SvgCheveronRight
            aria-hidden="true"
            width={16}
            height={16}
            style={{ color: 'var(--dfl-text-3)' }}
          />
        </View>
      </Button>
    </View>
  );
}
