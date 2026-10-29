import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { MOBILE_TYPE } from '#components/v2lab/typeScale';
import { useNavigate } from '#hooks/useNavigate';
import { useRecurring } from '#hooks/useRecurring';

import { HomeMobileMoney } from './HomeMobileMoney';

/**
 * One line for the month's recurring charges, opening their screen.
 *
 * Reads only the schedules, which the app already holds: the detection over
 * the transactions is a whole-file scan, and the first screen of the day is
 * not the place to run it — the Subscriptions screen does. Drawn only when
 * there is something recurring, because an empty promise of "subscriptions"
 * on a file that has none would be noise. The figure is the schedules' sum,
 * and the line says so: the detected suggestions are not in it, so it is not
 * read as everything the user subscribes to.
 */
export function HomeMobileSubscriptions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { scheduled, scheduledMonthlyTotal, isLoading } = useRecurring();

  if (isLoading || scheduled.length === 0) {
    return null;
  }

  // A total that adds an estimated charge is itself an estimate, and says so.
  const isTotalApproximate = scheduled.some(item => item.isApproximate);

  return (
    <Button
      variant="bare"
      // The "≈" beside the figure is visual; the accessible name says it.
      aria-label={
        isTotalApproximate
          ? `${t('Open subscriptions and recurring charges')}. ${t('Includes estimated amounts')}`
          : t('Open subscriptions and recurring charges')
      }
      onPress={() => void navigate('/subscriptions')}
      className={css({
        minHeight: 46,
        padding: '10px 14px',
        justifyContent: 'space-between',
        borderRadius: 'var(--dfm-radius)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
        color: 'var(--dfl-text)',
        '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
      })}
    >
      <View style={{ gap: 1, alignItems: 'flex-start', minWidth: 0 }}>
        <Text
          style={{
            fontSize: MOBILE_TYPE.label,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'var(--dfl-text-2)',
          }}
        >
          <Trans>Scheduled subscriptions</Trans>
        </Text>
        <Text
          style={{ fontSize: MOBILE_TYPE.note, color: 'var(--dfl-text-3)' }}
        >
          {t('{{count}} confirmed; suggestions not included', {
            count: scheduled.length,
          })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {isTotalApproximate && (
          <Text
            aria-hidden="true"
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--dfl-text-3)',
            }}
          >
            ≈
          </Text>
        )}
        <HomeMobileMoney
          value={Math.abs(scheduledMonthlyTotal)}
          withCurrency
          style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--dfl-text)' }}
        />
        <Text
          style={{ fontSize: MOBILE_TYPE.caption, color: 'var(--dfl-text-3)' }}
        >
          <Trans>per month</Trans>
        </Text>
        <SvgCheveronRight
          aria-hidden="true"
          width={15}
          height={15}
          style={{ color: 'var(--dfl-text-3)' }}
        />
      </View>
    </Button>
  );
}
