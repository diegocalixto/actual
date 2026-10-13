import React from 'react';

import type { CSSProperties } from '@actual-app/components/styles';

import { shellColors } from '#components/appshell/shellTheme';
import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useFormat } from '#hooks/useFormat';
import type { FormatType } from '#hooks/useFormat';

type MoneyProps = {
  /** Integer amount as stored by Actual, or `null` while the value loads. */
  value: number | null;
  type?: FormatType;
  style?: CSSProperties;
};

/**
 * The product's only money renderer. Formatting, tabular figures and the
 * privacy blur all live here so no screen has to remember them.
 */
export function Money({ value, type = 'financial', style }: MoneyProps) {
  const format = useFormat();

  if (value === null) {
    return (
      <FinancialText style={{ ...style, color: shellColors.textMuted }}>
        —
      </FinancialText>
    );
  }

  return (
    <FinancialText style={{ whiteSpace: 'nowrap', ...style }}>
      <PrivacyFilter>{format(value, type)}</PrivacyFilter>
    </FinancialText>
  );
}
