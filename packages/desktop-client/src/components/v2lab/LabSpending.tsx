import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
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
   * What a row opens: the transactions it is made of. Absent ⇒ every row is
   * plain text, which is what the laboratory's fixtures want.
   */
  onOpenCategory?: (category: LabCategory) => void;
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
 * Every row opens what it is made of — a category, its transactions of the
 * month; "Sem categoria", the month's outflows still waiting for one — and is
 * drawn as the control it is: a hover, a focus ring and a chevron.
 */
export function LabSpending({ categories, onOpenCategory }: LabSpendingProps) {
  const { t } = useTranslation();
  const largest = categories.reduce(
    (max, category) => Math.max(max, Math.abs(category.amount)),
    0,
  );

  return (
    <LabPanel>
      <View style={{ padding: '10px 22px' }}>
        {categories.map((category, index) => {
          const row = (
            <View
              key={category.id}
              style={{
                // The full width of the control around it: a button centres
                // what it holds, which is what pushed "Sem categoria" off the
                // column the other rows share.
                width: '100%',
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

              {onOpenCategory && (
                <SvgCheveronRight
                  aria-hidden="true"
                  width={14}
                  height={14}
                  style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
                />
              )}
            </View>
          );

          return onOpenCategory ? (
            <Button
              key={category.id}
              variant="bare"
              aria-label={
                category.isUncategorized
                  ? t('Review the spending without a category this month')
                  : t('See the transactions of {{name}} this month', {
                      name: category.name,
                    })
              }
              onPress={() => onOpenCategory(category)}
              className={css({
                width: '100%',
                padding: 0,
                borderRadius: 0,
                justifyContent: 'flex-start',
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
