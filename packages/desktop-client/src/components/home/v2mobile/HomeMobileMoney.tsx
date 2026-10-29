import React from 'react';

import type { CSSProperties } from '@actual-app/components/styles';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';

import { formatAmount, formatCurrency, PENDING } from './mobileMoneyFormat';

type HomeMobileMoneyProps = {
  /** Integer minor units as Actual stores them, or `null` while the cell loads. */
  value: number | null;
  /**
   * Prints the symbol in front of the digits, for the places that set both at
   * one size. Where the symbol has to be smaller than the number — the hero,
   * the account column — the caller draws it itself and leaves this off.
   */
  withCurrency?: boolean;
  style?: CSSProperties;
};

/**
 * A figure on the mobile Home.
 *
 * Loading shows an em dash rather than a zero: zero is a truthful balance for a
 * real account, so printing it before the cell resolves would state a fact the
 * app does not yet know. The privacy blur applies here as it does everywhere
 * else money is printed.
 */
export function HomeMobileMoney({
  value,
  withCurrency = false,
  style,
}: HomeMobileMoneyProps) {
  if (value === null) {
    return (
      <FinancialText style={{ ...style, color: 'var(--dfl-text-3)' }}>
        {PENDING}
      </FinancialText>
    );
  }

  return (
    <FinancialText style={{ whiteSpace: 'nowrap', ...style }}>
      <PrivacyFilter>
        {withCurrency ? formatCurrency(value) : formatAmount(value)}
      </PrivacyFilter>
    </FinancialText>
  );
}
