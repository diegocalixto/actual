import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { iconForCategory } from '#components/v2lab/LabStyle';

import type { BudgetCategoryFixture } from './mobileBudgetFixtures';
import { MobileBudgetIconTile } from './MobileBudgetIconTile';
import { formatCurrency, usedPercent } from './mobileBudgetMoney';
import { MobileBudgetProgress } from './MobileBudgetProgress';

type MobileBudgetCategoryRowProps = {
  category: BudgetCategoryFixture;
  hue: string;
  /** The last row closes its group, so it draws no divider. */
  isLast: boolean;
};

/**
 * How full a category is, and what is left of it.
 *
 * The row answers two questions in the order a person asks them: how far into
 * this envelope am I, and how much can I still spend. The percentage and its
 * bar are the same fact drawn twice — one for reading, one for scanning a
 * column of eight — and the two amounts are captioned because "Orçado" and
 * "Saldo" are not interchangeable and the screen already carries three other
 * balances.
 *
 * Colour is a statement about *pressure*, never about size. A small balance is
 * not an overspend: 93% used with money still in the envelope is attention,
 * which is amber; only a balance that has actually gone below zero earns the
 * negative tone. Painting R$ 15,00 red because it is a small number would tell
 * the reader something untrue.
 */
export function MobileBudgetCategoryRow({
  category,
  hue,
  isLast,
}: MobileBudgetCategoryRowProps) {
  const { t } = useTranslation();
  const Icon = iconForCategory(category.name);
  const percent = usedPercent(category.spent, category.planned) ?? 0;

  const isOver = category.balance < 0;
  const tone = isOver
    ? 'var(--dfmb-over)'
    : percent >= 90
      ? 'var(--dfmb-tight)'
      : percent >= 70
        ? 'var(--dfmb-watch)'
        : 'var(--dfmb-calm)';

  return (
    <Button
      variant="bare"
      aria-label={t('Abrir {{name}}', { name: category.name })}
      className={css({
        width: '100%',
        padding: '9px 12px',
        borderRadius: 0,
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
        '&[data-hovered]': { backgroundColor: 'var(--dfl-surface-raised)' },
        '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
      })}
    >
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <MobileBudgetIconTile Icon={Icon} hue={hue} />

        <View
          style={{
            flex: 1,
            minWidth: 0,
            gap: 4,
            alignItems: 'flex-start',
          }}
        >
          <TextOneLine
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: -0.2,
              color: 'var(--dfl-text)',
            }}
          >
            {category.name}
          </TextOneLine>

          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <View style={{ flex: 1, minWidth: 20 }}>
              <MobileBudgetProgress percent={percent} tone={tone} />
            </View>
            {/* The plan rides with the percentage instead of holding a column
                of its own. Three money columns in 404px left the name and the
                bar fighting for what was left; as a phrase, the share and the
                plan fit in the space one of them took.

                Both halves are named. "79% de R$ 180,00" is arithmetically
                right but leaves the reader to infer what the amount is — and
                on a row that already carries a second amount labelled "Saldo",
                an unlabelled one is a number to be guessed at. */}
            <FinancialText
              style={{
                flexShrink: 0,
                fontSize: 'clamp(8px, 2.2vw, 11px)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: tone,
              }}
            >
              {`${percent}% usado · Orçado ${formatCurrency(category.planned)}`}
            </FinancialText>
          </View>
        </View>

        <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: 0 }}>
          <FinancialText
            style={{
              fontSize: 'clamp(12px, 3.4vw, 13.5px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              color: tone,
            }}
          >
            {formatCurrency(category.balance)}
          </FinancialText>
          <Text style={{ fontSize: 9, color: 'var(--dfl-text-3)' }}>
            <Trans>Saldo</Trans>
          </Text>
        </View>

        <SvgCheveronRight
          aria-hidden="true"
          width={15}
          height={15}
          style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
        />
      </View>
    </Button>
  );
}
