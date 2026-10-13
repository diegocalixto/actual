import React from 'react';

import type { CSSProperties } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useFormat } from '#hooks/useFormat';
import type { FormatType } from '#hooks/useFormat';

type HomeAmountProps = {
  /** Integer amount as stored by Actual, or `null` while the value loads. */
  value: number | null;
  type?: FormatType;
  style?: CSSProperties;
};

export function HomeAmount({
  value,
  type = 'financial',
  style,
}: HomeAmountProps) {
  const format = useFormat();

  if (value === null) {
    return (
      <FinancialText style={{ ...style, color: theme.pageTextSubdued }}>
        {'\u2014'}
      </FinancialText>
    );
  }

  return (
    <FinancialText style={{ whiteSpace: 'nowrap', ...style }}>
      <PrivacyFilter>{format(value, type)}</PrivacyFilter>
    </FinancialText>
  );
}
