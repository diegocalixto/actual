import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { useHomeAccounts } from './homeData';
import { HomeMobileAccountGroup } from './HomeMobileAccountGroup';
import { HomeMobileMoney } from './HomeMobileMoney';
import { HomeMobileSectionLabel } from './HomeMobileSectionLabel';

type HomeMobileAccountsProps = {
  /** The three account balance cells, read once by the page. */
  onBudget: number | null;
  offBudget: number | null;
  total: number | null;
};

/**
 * Where the money sits.
 *
 * Two grouped surfaces under one section label, with the whole on the label's
 * line: the reader asks "how much do I have" before "how is it split", and the
 * page answers in that order.
 *
 * Each group gets one hue, shared by every tile inside it. A ramp across the
 * rows would give five accounts five colours and imply a difference between
 * them that the data does not contain; a hue per group says only what the
 * header already says, and keeps the screen the cold, restrained thing the
 * approved composition is rather than a row of competing badges.
 *
 * A group with no accounts is not drawn. Naming a division the file does not
 * have would be the screen inventing structure.
 */
export function HomeMobileAccounts({
  onBudget,
  offBudget,
  total,
}: HomeMobileAccountsProps) {
  const { accounts, isLoading } = useHomeAccounts();

  const onBudgetAccounts = accounts.filter(entry => entry.kind === 'onBudget');
  const offBudgetAccounts = accounts.filter(
    entry => entry.kind === 'offBudget',
  );

  return (
    <View style={{ gap: 10 }}>
      <HomeMobileSectionLabel
        label={<Trans>Contas</Trans>}
        trailing={
          accounts.length > 0 ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'var(--dfl-text-3)',
                }}
              >
                <Trans>Total</Trans>
              </Text>
              <HomeMobileMoney
                value={total}
                withCurrency
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color: 'var(--dfl-text)',
                }}
              />
            </View>
          ) : null
        }
      />

      {accounts.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            padding: 24,
            borderRadius: 'var(--dfm-radius)',
            border: '1px solid var(--dfl-line)',
            backgroundColor: 'var(--dfl-surface)',
          }}
        >
          <Text style={{ fontSize: 13, color: 'var(--dfl-text-2)' }}>
            {isLoading ? (
              <Trans>Carregando contas…</Trans>
            ) : (
              <Trans>Nenhuma conta ainda.</Trans>
            )}
          </Text>
        </View>
      ) : (
        <>
          {onBudgetAccounts.length > 0 && (
            <HomeMobileAccountGroup
              label={<Trans>No orçamento</Trans>}
              subtotal={onBudget}
              tone="positive"
              hue="var(--dfl-hue-violet)"
              accounts={onBudgetAccounts}
            />
          )}
          {offBudgetAccounts.length > 0 && (
            <HomeMobileAccountGroup
              label={<Trans>Fora do orçamento</Trans>}
              subtotal={offBudget}
              tone="negative"
              hue="var(--dfl-hue-blue)"
              accounts={offBudgetAccounts}
            />
          )}
        </>
      )}
    </View>
  );
}
