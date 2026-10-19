import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';

import { shellColors, shellLayout } from '#components/appshell/shellTheme';
import { useLocale } from '#hooks/useLocale';

type BudgetPageIntroProps = {
  startMonth: string;
  numMonths: number;
};

/**
 * The Budget's opening.
 *
 * Upstream the page began with a month strip and nothing else — no title, no
 * statement of what the screen is or which period it is showing. Naming the
 * page and its period is what lets the rest of the screen stop being a
 * spreadsheet that has to explain itself through column headers.
 */
export function BudgetPageIntro({
  startMonth,
  numMonths,
}: BudgetPageIntroProps) {
  const locale = useLocale();

  const endMonth = monthUtils.addMonths(startMonth, numMonths - 1);
  const period =
    numMonths === 1
      ? monthUtils.format(startMonth, 'MMMM yyyy', locale)
      : `${monthUtils.format(startMonth, 'MMM', locale)} – ${monthUtils.format(
          endMonth,
          'MMM yyyy',
          locale,
        )}`;

  return (
    <View
      style={{
        flexShrink: 0,
        gap: 3,
        padding: `18px ${shellLayout.desktopGutter}px 12px`,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -0.6,
          color: shellColors.textPrimary,
        }}
      >
        <Trans>Budget</Trans>
      </Text>
      <Text style={{ fontSize: 13.5, color: shellColors.textMuted }}>
        {period}
      </Text>
    </View>
  );
}
