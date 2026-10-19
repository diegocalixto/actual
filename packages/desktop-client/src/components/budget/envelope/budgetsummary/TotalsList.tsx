import React from 'react';
import type { CSSProperties } from 'react';
import { Trans } from 'react-i18next';

import { AlignedText } from '@actual-app/components/aligned-text';
import { styles } from '@actual-app/components/styles';
import { Tooltip } from '@actual-app/components/tooltip';
import { View } from '@actual-app/components/view';

import { EnvelopeCellValue } from '#components/budget/envelope/EnvelopeBudgetComponents';
import { CellValueText } from '#components/spreadsheet/CellValue';
import { useFormat } from '#hooks/useFormat';
import type { FormatType } from '#hooks/useFormat';
import { envelopeBudget } from '#spreadsheet/bindings';

/**
 * Creates a formatter that displays values with explicit +/- signs.
 * Uses Math.abs to avoid double-negative display (e.g., "--$0.00").
 *
 * @param format - The format function from useFormat hook
 * @param invert - If true, shows '-' for positive and '+' for negative
 */
function makeSignedFormatter(
  format: ReturnType<typeof useFormat>,
  invert = false,
) {
  return (value: number, type?: FormatType) => {
    const v = format(Math.abs(value), type);
    if (value === 0) {
      return '-' + v;
    }
    const isPositive = value > 0;
    return invert
      ? isPositive
        ? '-' + v
        : '+' + v
      : isPositive
        ? '+' + v
        : '-' + v;
  };
}

type TotalsListProps = {
  prevMonthName: string;
  style?: CSSProperties;
};

export function TotalsList({ prevMonthName, style }: TotalsListProps) {
  const format = useFormat();
  const signedFormatter = makeSignedFormatter(format);
  const invertedSignedFormatter = makeSignedFormatter(format, true);
  return (
    <View
      style={{
        lineHeight: 1.5,
        ...styles.smallText,
        ...style,
      }}
    >
      <AlignedText
        left={<Trans>Available funds</Trans>}
        right={
          <Tooltip
            style={{ ...styles.tooltip, lineHeight: 1.5, padding: '6px 10px' }}
            content={
              <>
                <AlignedText
                  left="Income:"
                  right={
                    <EnvelopeCellValue
                      binding={envelopeBudget.totalIncome}
                      type="financial"
                    />
                  }
                />
                <AlignedText
                  left="From Last Month:"
                  right={
                    <EnvelopeCellValue
                      binding={envelopeBudget.fromLastMonth}
                      type="financial"
                    />
                  }
                />
              </>
            }
            placement="bottom end"
          >
            <EnvelopeCellValue
              binding={envelopeBudget.incomeAvailable}
              type="financial"
            >
              {props => (
                <CellValueText {...props} style={{ fontWeight: 600 }} />
              )}
            </EnvelopeCellValue>
          </Tooltip>
        }
      />

      <AlignedText
        left={<Trans>Overspent in {{ prevMonthName }}</Trans>}
        right={
          <EnvelopeCellValue
            binding={envelopeBudget.lastMonthOverspent}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                style={{ fontWeight: 600 }}
                formatter={signedFormatter}
              />
            )}
          </EnvelopeCellValue>
        }
      />

      <AlignedText
        left={<Trans>Budgeted</Trans>}
        right={
          <EnvelopeCellValue
            binding={envelopeBudget.totalBudgeted}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                style={{ fontWeight: 600 }}
                formatter={signedFormatter}
              />
            )}
          </EnvelopeCellValue>
        }
      />

      <AlignedText
        left={<Trans>For next month</Trans>}
        right={
          <EnvelopeCellValue
            binding={envelopeBudget.forNextMonth}
            type="financial"
          >
            {props => (
              <CellValueText
                {...props}
                style={{ fontWeight: 600 }}
                formatter={invertedSignedFormatter}
              />
            )}
          </EnvelopeCellValue>
        }
      />
    </View>
  );
}
