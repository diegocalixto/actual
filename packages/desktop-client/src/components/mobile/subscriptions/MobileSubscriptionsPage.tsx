import React from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import * as monthUtils from '@actual-app/core/shared/months';
import type { RecurConfig } from '@actual-app/core/types/models';
import { css } from '@emotion/css';

import { HomeMobileMoney } from '#components/home/v2mobile/HomeMobileMoney';
import {
  chromeAccent,
  chromeCanvas,
  chromeInk,
  chromeLine,
} from '#components/home/v2mobile/HomeMobileStyle';
import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { MobilePrivacyToggle } from '#components/mobile/MobilePrivacyToggle';
import {
  mobileHeaderIconButtonStyle,
  MobilePageHeader,
  Page,
} from '#components/Page';
import { tokensCssFor } from '#components/v2lab/LabStyle';
import { MOBILE_TYPE } from '#components/v2lab/typeScale';
import { useLocale } from '#hooks/useLocale';
import { useNavigate } from '#hooks/useNavigate';
import { usePayees } from '#hooks/usePayees';
import { useRecurring } from '#hooks/useRecurring';
import type { RecurringItem } from '#util/recurring';

const ROOT_CLASS = 'df-subscriptions-mobile-v2';

/**
 * Recurring charges, in one list, with what they add up to in a month.
 *
 * Two sources and no new data: the schedules the user keeps, and the
 * repeating patterns Actual's own "Find schedules" sees in the transactions.
 * The two never mix: the total is the schedules' alone, and a detected pattern
 * sits in its own section as a suggestion, is never turned into a schedule
 * here and never added to the total — nothing is posted, so no expense is
 * counted twice; the user decides on the Schedules screen. A pattern the
 * bank's own record rules out (a tax or fee, an installment plan, money moved
 * between own accounts) is left out and counted as such. The amounts are the
 * charges the file already holds, converted to a month so a yearly fee and a
 * weekly one can be read side by side.
 */
export function MobileSubscriptionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    scheduled,
    discovered,
    scheduledMonthlyTotal,
    discoveredMonthlyTotal,
    leftOut,
    isLoading,
    isDiscovering,
  } = useRecurring({ includeDiscovered: true });
  const { data: payees = [] } = usePayees();
  const leftOutParts = [
    leftOut.installments > 0
      ? t('{{count}} installment plans', { count: leftOut.installments })
      : null,
    leftOut['bank-charge'] > 0
      ? t('{{count}} bank charges (IOF, interest, fees)', {
          count: leftOut['bank-charge'],
        })
      : null,
    leftOut['own-transfer'] > 0
      ? t('{{count}} transfers between your own accounts', {
          count: leftOut['own-transfer'],
        })
      : null,
  ].filter((part): part is string => part !== null);
  const leftOutText = leftOutParts.length > 0 ? leftOutParts.join(' · ') : null;
  const payeeName = (id: string | null) =>
    id ? (payees.find(payee => payee.id === id)?.name ?? null) : null;
  // A total that adds an estimated charge is itself an estimate, and says so.
  const isTotalApproximate = scheduled.some(item => item.isApproximate);

  return (
    <Page
      header={
        <MobilePageHeader
          title={<Trans>Subscriptions</Trans>}
          style={{
            backgroundColor: chromeCanvas,
            borderBottom: `1px solid ${chromeLine}`,
          }}
          ink={chromeInk}
          rightContent={
            <MobilePrivacyToggle
              style={mobileHeaderIconButtonStyle}
              accent={chromeAccent}
            />
          }
        />
      }
      padding={0}
      style={{ backgroundColor: chromeCanvas }}
    >
      <style>{`${tokensCssFor(ROOT_CLASS)}
.${ROOT_CLASS} { --dfm-radius: 16px; }`}</style>
      <View
        className={ROOT_CLASS}
        style={{
          width: '100%',
          flexShrink: 0,
          padding: '14px 16px',
          paddingBottom: `calc(${MOBILE_NAV_SPACER} + 14px)`,
          gap: 18,
          backgroundColor: 'var(--dfl-canvas)',
          color: 'var(--dfl-text)',
        }}
      >
        <View
          style={{
            borderRadius: 'var(--dfm-radius)',
            border: '1px solid var(--dfl-hero-line)',
            boxShadow: 'var(--dfl-shadow-hero)',
            backgroundImage:
              'linear-gradient(120deg, var(--dfl-hero-from) 0%, var(--dfl-hero-to) 58%, #0d1a2e 100%)',
            padding: '18px 18px 16px',
            gap: 6,
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
            <Trans>Scheduled charges per month</Trans>
          </Text>
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
          >
            {!isLoading && isTotalApproximate && (
              <Text
                aria-hidden="true"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--dfl-text-2)',
                }}
              >
                ≈
              </Text>
            )}
            <HomeMobileMoney
              value={isLoading ? null : Math.abs(scheduledMonthlyTotal)}
              withCurrency
              style={{
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: -1,
                color: '#ffffff',
              }}
            />
          </View>
          {scheduled.length > 0 && (
            // The figure is the schedules' sum and nothing else: it says so,
            // so it is not read as everything the user subscribes to.
            <Text
              style={{
                fontSize: 12.5,
                lineHeight: 1.4,
                color: 'var(--dfl-text-2)',
              }}
            >
              {t('Sum of the {{count}} scheduled charges only', {
                count: scheduled.length,
              })}
              {isTotalApproximate
                ? ` · ${t('Includes estimated amounts')}`
                : ''}
              {' · '}
              <Trans>Suggestions are not in it</Trans>
            </Text>
          )}
        </View>

        <RecurringSection>
          {scheduled.length === 0 ? (
            <SectionNote>
              {isLoading ? (
                <Trans>Looking for recurring charges…</Trans>
              ) : (
                <Trans>No scheduled charges yet.</Trans>
              )}
            </SectionNote>
          ) : (
            scheduled.map((item, index) => (
              <RecurringRow
                key={item.id}
                item={item}
                title={item.name || payeeName(item.payeeId) || t('Unnamed')}
                isLast={index === scheduled.length - 1}
                onPress={() => void navigate(`/schedules/${item.id}`)}
              />
            ))
          )}
        </RecurringSection>

        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              padding: '0 2px',
            }}
          >
            <Text
              style={{
                fontSize: MOBILE_TYPE.label,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--dfl-text-2)',
              }}
            >
              <Trans>Suggestions, not confirmed</Trans>
            </Text>
            {discovered.length > 0 && (
              <View
                style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}
              >
                <HomeMobileMoney
                  value={Math.abs(discoveredMonthlyTotal)}
                  withCurrency
                  style={{
                    fontSize: MOBILE_TYPE.note,
                    fontWeight: 600,
                    color: 'var(--dfl-text-2)',
                  }}
                />
                <Text
                  style={{
                    fontSize: MOBILE_TYPE.caption,
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  <Trans>per month</Trans>
                </Text>
              </View>
            )}
          </View>
          <RecurringSection>
            {discovered.length === 0 ? (
              <View style={{ gap: 6 }}>
                <SectionNote>
                  {isDiscovering ? (
                    <Trans>Looking for recurring charges…</Trans>
                  ) : (
                    <Trans>No new recurring charges detected.</Trans>
                  )}
                </SectionNote>
                {!isDiscovering && (
                  <Text
                    style={{
                      fontSize: MOBILE_TYPE.caption,
                      textAlign: 'center',
                      color: 'var(--dfl-text-3)',
                      padding: '0 14px 16px',
                    }}
                  >
                    <Trans>
                      A charge is detected after it repeats at least three times
                      with the same payee and amount.
                    </Trans>
                  </Text>
                )}
              </View>
            ) : (
              discovered.map((item, index) => (
                <RecurringRow
                  key={item.id}
                  item={item}
                  title={payeeName(item.payeeId) || t('Unnamed')}
                  isLast={index === discovered.length - 1}
                />
              ))
            )}
          </RecurringSection>
          {leftOutText !== null && (
            <Text
              style={{
                fontSize: MOBILE_TYPE.caption,
                lineHeight: 1.4,
                color: 'var(--dfl-text-3)',
                padding: '0 2px',
              }}
            >
              {t('Left out, from the bank record: {{list}}', {
                list: leftOutText,
              })}
            </Text>
          )}
        </View>

        <Button
          variant="bare"
          onPress={() => void navigate('/schedules')}
          className={css({
            minHeight: 46,
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--dfm-radius)',
            border: '1px solid var(--dfl-line-strong)',
            backgroundColor: 'var(--dfl-surface)',
            color: 'var(--dfl-text)',
            '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
          })}
        >
          <Text style={{ fontSize: MOBILE_TYPE.row, fontWeight: 600 }}>
            <Trans>Manage schedules</Trans>
          </Text>
          <SvgCheveronRight
            aria-hidden="true"
            width={16}
            height={16}
            style={{ color: 'var(--dfl-text-3)' }}
          />
        </Button>

        <View style={{ gap: 6, padding: '0 2px' }}>
          <Text style={footnoteStyle}>
            <Trans>
              Schedules are reminders and post nothing: the expense that counts
              is the one the bank brings. Arriving with the expected amount on
              the expected day, or up to two days before or after, it is linked
              to its schedule; outside that window the schedule shows as missed
              until it is linked or skipped. Nothing is counted twice.
            </Trans>
          </Text>
          <Text style={footnoteStyle}>
            <Trans>
              Suggestions are read from your transactions, are not posted
              anywhere and are not in the total above; turn one into a schedule
              to confirm it and be reminded before it is due.
            </Trans>
          </Text>
        </View>
      </View>
    </Page>
  );
}

const footnoteStyle = {
  fontSize: MOBILE_TYPE.caption,
  lineHeight: 1.4,
  color: 'var(--dfl-text-3)',
};

function RecurringSection({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 'var(--dfm-radius)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

function SectionNote({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: MOBILE_TYPE.note,
        textAlign: 'center',
        color: 'var(--dfl-text-2)',
        padding: '18px 14px 6px',
      }}
    >
      {children}
    </Text>
  );
}

type RecurringRowProps = {
  item: RecurringItem;
  title: string;
  isLast: boolean;
  onPress?: () => void;
};

function RecurringRow({ item, title, isLast, onPress }: RecurringRowProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const parts = [
    frequencyLabel(item.frequency, item.interval, t),
    // A schedule's next date is a forecast, read from its rule, not a fact.
    item.nextDate
      ? t('expected {{date}}', {
          date: monthUtils.format(item.nextDate, 'd MMM', locale),
        })
      : null,
    item.isApproximate ? t('estimated') : null,
    item.source === 'discovered' ? t('suggestion') : null,
  ].filter(Boolean);

  const content = (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <TextOneLine
          style={{
            fontSize: MOBILE_TYPE.row,
            fontWeight: 600,
            letterSpacing: -0.2,
            color: 'var(--dfl-text)',
          }}
        >
          {title}
        </TextOneLine>
        <TextOneLine
          style={{ fontSize: MOBILE_TYPE.label, color: 'var(--dfl-text-3)' }}
        >
          {parts.join(' · ')}
        </TextOneLine>
      </View>
      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          {item.isApproximate && (
            <Text
              aria-hidden="true"
              style={{
                fontSize: MOBILE_TYPE.row,
                fontWeight: 600,
                color: 'var(--dfl-text-3)',
              }}
            >
              ≈
            </Text>
          )}
          <HomeMobileMoney
            value={Math.abs(item.monthlyEquivalent)}
            withCurrency
            style={{
              fontSize: MOBILE_TYPE.row,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: 'var(--dfl-text)',
            }}
          />
        </View>
        <Text
          style={{ fontSize: MOBILE_TYPE.caption, color: 'var(--dfl-text-3)' }}
        >
          <Trans>per month</Trans>
        </Text>
      </View>
      {onPress && (
        <SvgCheveronRight
          aria-hidden="true"
          width={15}
          height={15}
          style={{ color: 'var(--dfl-text-3)' }}
        />
      )}
    </View>
  );

  const rowStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 0,
    borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
  };

  if (!onPress) {
    return <View style={{ ...rowStyle, flexDirection: 'row' }}>{content}</View>;
  }

  return (
    <Button
      variant="bare"
      aria-label={t('Edit the schedule {{name}}', { name: title })}
      onPress={onPress}
      className={css({
        ...rowStyle,
        minHeight: 46,
        justifyContent: 'flex-start',
        textAlign: 'left',
        '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
      })}
    >
      {content}
    </Button>
  );
}

function frequencyLabel(
  frequency: RecurConfig['frequency'],
  interval: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (interval > 1) {
    switch (frequency) {
      case 'daily':
        return t('Every {{count}} days', { count: interval });
      case 'weekly':
        return t('Every {{count}} weeks', { count: interval });
      case 'yearly':
        return t('Every {{count}} years', { count: interval });
      case 'monthly':
      default:
        return t('Every {{count}} months', { count: interval });
    }
  }
  switch (frequency) {
    case 'daily':
      return t('Daily');
    case 'weekly':
      return t('Weekly');
    case 'yearly':
      return t('Yearly');
    case 'monthly':
    default:
      return t('Monthly');
  }
}
