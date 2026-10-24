import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';

import { formatMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import { LabTile } from './LabTile';
import { MagnitudeLine } from './LeaderLine';
import type { LabCategory } from './overviewFixtures';

type LabSpendingProps = {
  categories: LabCategory[];
  /**
   * What the row for outflows with no category opens. Absent ⇒ every row is
   * plain text, which is what the laboratory's fixtures want.
   */
  onReviewUncategorized?: () => void;
};

/**
 * Where the month went, as a ranked list.
 *
 * The row reads tile · name · run · amount. The run's filled length is the
 * category's share of the largest one — a real ratio computed here from the
 * same numbers the row prints, never a decorative length that merely looks
 * like data. The name sits in a fixed column so every run starts on the same
 * vertical, which is what lets the lengths be compared at a glance.
 *
 * One row can be pressed: the month's outflows with no category, which open the
 * transactions still waiting for one. It is the only row with somewhere to go,
 * so it is the only one drawn as a control.
 */
export function LabSpending({
  categories,
  onReviewUncategorized,
}: LabSpendingProps) {
  const { t } = useTranslation();
  const largest = categories.reduce(
    (max, category) => Math.max(max, Math.abs(category.amount)),
    0,
  );

  return (
    <LabPanel>
      <View style={{ padding: '10px 22px' }}>
        {categories.map((category, index) => {
          const review =
            category.isUncategorized && onReviewUncategorized
              ? onReviewUncategorized
              : undefined;

          const row = (
            <View
              key={category.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                minHeight: 54,
                borderBottom:
                  index === categories.length - 1
                    ? 'none'
                    : '1px solid var(--dfl-line)',
              }}
            >
              <LabTile Icon={category.Icon} hue={category.hue} />

              <TextOneLine
                style={{
                  flex: '0 0 128px',
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: 'var(--dfl-text)',
                }}
              >
                {category.name}
              </TextOneLine>

              <MagnitudeLine
                ratio={largest === 0 ? 0 : Math.abs(category.amount) / largest}
                hueVar={`var(--dfl-hue-${category.hue})`}
              />

              <FinancialText
                style={{
                  flex: '0 0 auto',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  color: 'var(--dfl-text)',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                  minWidth: 92,
                }}
              >
                <PrivacyFilter>
                  {formatMoney(Math.abs(category.amount))}
                </PrivacyFilter>
              </FinancialText>
            </View>
          );

          return review ? (
            <Button
              key={category.id}
              variant="bare"
              aria-label={t('Review the transactions without a category')}
              onPress={review}
              className={css({
                width: '100%',
                padding: 0,
                borderRadius: 0,
                textAlign: 'left',
                '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
              })}
            >
              {row}
            </Button>
          ) : (
            row
          );
        })}
      </View>
    </LabPanel>
  );
}
