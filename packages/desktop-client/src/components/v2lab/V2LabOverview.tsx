import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { LabAccounts, LabAccountsTotal } from './LabAccounts';
import { LabHero } from './LabHero';
import { LabMonthSummary } from './LabMonthSummary';
import { LabSection } from './LabPanel';
import { LabRecentActivity } from './LabRecentActivity';
import { LabSpending } from './LabSpending';
import {
  labAccounts,
  labBalances,
  labCategories,
  labMonthTotals,
  labMovements,
} from './overviewFixtures';

/**
 * Visual laboratory for the Overview, desktop only.
 *
 * Renders inside the real App Shell so the rail, the header and the content's
 * relationship to the frame can be judged at the real viewport. The structure
 * is the approved one — hero and accounts on the left, month totals, spending
 * and activity on the right; this round is about finish and identity.
 *
 * Every component below takes its data through props in the shapes Actual
 * already uses (integer minor units, plain entities). The disposable part is
 * `overviewFixtures`: swapping it for an adapter over the real spreadsheet
 * cells requires no change here.
 */
export function V2LabOverview() {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--dfl-canvas)',
        color: 'var(--dfl-text)',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 1560,
          alignSelf: 'center',
          flexShrink: 0,
          padding: '26px 40px 56px',
          gap: 26,
        }}
      >
        <View style={{ gap: 4, paddingLeft: 2 }}>
          <Text
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'var(--dfl-text-3)',
            }}
          >
            <Trans>Good afternoon</Trans>
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -0.8,
              color: 'var(--dfl-text)',
            }}
          >
            <Trans>Overview</Trans>
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 26,
          }}
        >
          {/* Left: the money you have. */}
          <View style={{ flex: '1.05 1 0', minWidth: 0, gap: 26 }}>
            <LabHero
              available={labBalances.available}
              toBudget={labBalances.toBudget}
            />

            <LabSection
              label={<Trans>Accounts</Trans>}
              action={<LabAccountsTotal accounts={labAccounts} />}
            >
              <LabAccounts accounts={labAccounts} />
            </LabSection>
          </View>

          {/* Right: what the month did with it. */}
          <View style={{ flex: '1 1 0', minWidth: 0, gap: 26 }}>
            <LabSection
              label={<Trans>This month</Trans>}
              action={
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: 1.1,
                    textTransform: 'uppercase',
                    color: 'var(--dfl-text-3)',
                  }}
                >
                  {labMonthTotals.label}
                </Text>
              }
            >
              <LabMonthSummary totals={labMonthTotals} />
            </LabSection>

            <LabSection label={<Trans>Spending this month</Trans>}>
              <LabSpending categories={labCategories} />
            </LabSection>

            <LabSection label={<Trans>Recent activity</Trans>}>
              <LabRecentActivity movements={labMovements} />
            </LabSection>
          </View>
        </View>

        <Text
          style={{
            fontSize: 11,
            letterSpacing: 0.6,
            color: 'var(--dfl-text-3)',
            textAlign: 'right',
            opacity: 0.7,
          }}
        >
          {t('Visual laboratory — demonstration data')}
        </Text>
      </View>
    </View>
  );
}
