import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import type { IndicatorTotals } from '@actual-app/core/shared/month-indicators';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { monthDetailLines } from '#components/home/v2/MonthSummaryCard';
import { PrivacyFilter } from '#components/PrivacyFilter';

import { fittedFontSize } from './amountFit';
import { formatMoney } from './labMoney';
import { LabPanel } from './LabPanel';
import type { LabMonthTotals } from './overviewFixtures';

type LabMonthSummaryProps = {
  totals: LabMonthTotals;
  /**
   * What the three figures leave out, one line each under them. `null` or
   * absent ⇒ no lines: the laboratory's fixtures carry none.
   */
  details?: IndicatorTotals | null;
  /** Opens the month's inflows still without a category. */
  onOpenPendingInflows?: () => void;
};

const FIGURE_TRACKING = -0.5;

/**
 * The classified receipts, the spending, and what the first left after the second.
 *
 * Each figure has a third of the panel. That is ample for the month the design
 * was drawn with and not for one in the millions, which ran past its hairline;
 * the three now give up size together, to what the longest of them fits at.
 *
 * Under them, when there is something to say, one line per thing the three
 * figures leave out: an extraordinary inflow kept apart from the regular
 * income, inflows still without a category, the uncategorized share of the
 * spending. The rules are `@actual-app/core/shared/month-indicators`, the Reports' own.
 */
export function LabMonthSummary({
  totals,
  details,
  onOpenPendingInflows,
}: LabMonthSummaryProps) {
  // The spending is printed as a magnitude under its label, as the Relatórios
  // and the phone print it; the coral and the word already say which way the
  // money went. The registers keep the signs.
  const spent = Math.abs(totals.spent);
  const figures = [totals.income, spent, totals.net].map(formatMoney);
  const lines = details ? monthDetailLines(details) : [];

  return (
    <LabPanel>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '20px 6px',
        }}
      >
        <Cell
          label={<Trans>Classified receipts</Trans>}
          value={totals.income}
          figures={figures}
          color="var(--dfl-positive)"
        />
        <Divider />
        <Cell
          label={<Trans>Spending</Trans>}
          value={spent}
          figures={figures}
          color="var(--dfl-negative)"
        />
        <Divider />
        <Cell
          // The short title the Relatórios and the phone already use; the
          // lines below and the Relatórios' "Como calculamos" define it.
          label={<Trans>Result</Trans>}
          value={totals.net}
          figures={figures}
          // The verdict is the one figure whose sign is a judgement.
          color={
            totals.net > 0
              ? 'var(--dfl-positive)'
              : totals.net < 0
                ? 'var(--dfl-negative)'
                : 'var(--dfl-text-2)'
          }
          emphasized
        />
      </View>

      {lines.length > 0 && (
        <View
          style={{
            gap: 5,
            padding: '10px 22px 14px',
            borderTop: '1px solid var(--dfl-line)',
          }}
        >
          {lines.map(line => {
            const isAttention =
              line.key === 'provisional' || line.opens === 'pendingInflows';
            const content = (
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    textAlign: 'left',
                    color: isAttention
                      ? 'var(--dfl-text)'
                      : 'var(--dfl-text-2)',
                  }}
                >
                  {isAttention && (
                    <Text
                      aria-hidden="true"
                      style={{
                        color: 'var(--dfl-hue-amber)',
                        fontWeight: 700,
                        marginRight: 6,
                      }}
                    >
                      !
                    </Text>
                  )}
                  {line.label}
                </Text>
                {line.value !== null && (
                  <FinancialText
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      color: 'var(--dfl-text)',
                    }}
                  >
                    <PrivacyFilter>{formatMoney(line.value)}</PrivacyFilter>
                  </FinancialText>
                )}
              </View>
            );

            return line.opens === 'pendingInflows' && onOpenPendingInflows ? (
              <Button
                key={line.key}
                variant="bare"
                onPress={onOpenPendingInflows}
                className={css({
                  position: 'relative',
                  // The padding lets the hover tint breathe without moving the
                  // figure off the column the other lines share.
                  width: 'calc(100% + 8px)',
                  // At least the 24px a pointer target needs, taken from the
                  // gap around the line rather than from the lines beside it.
                  minHeight: 26,
                  padding: '4px 4px',
                  margin: '-4px -4px',
                  borderRadius: 6,
                  justifyContent: 'flex-start',
                  '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
                })}
              >
                {content}
                {/* In the panel's margin, so the figure keeps its column. */}
                <SvgCheveronRight
                  aria-hidden="true"
                  width={12}
                  height={12}
                  style={{
                    position: 'absolute',
                    right: -12,
                    top: 'calc(50% - 6px)',
                    color: 'var(--dfl-text-3)',
                  }}
                />
              </Button>
            ) : (
              <View key={line.key}>{content}</View>
            );
          })}
        </View>
      )}
    </LabPanel>
  );
}

type CellProps = {
  label: ReactNode;
  value: number;
  /** The three figures of the panel, which share the fit of the longest. */
  figures: string[];
  color: string;
  emphasized?: boolean;
};

function Cell({ label, value, figures, color, emphasized = false }: CellProps) {
  const designSize = `${emphasized ? 24 : 22}px`;

  return (
    // `flex-end` keeps the three amounts on one baseline even if a label wraps.
    <View
      style={{
        flex: '1 1 0',
        minWidth: 0,
        padding: '0 16px',
        gap: 8,
        justifyContent: 'flex-end',
        // The cell's width is what its figure is fitted to.
        containerType: 'inline-size',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--dfl-text-3)',
        }}
      >
        {label}
      </Text>
      <FinancialText
        style={{
          fontSize: [
            designSize,
            fittedFontSize({
              designSize,
              room: '100cqi',
              floor: '13px',
              letterSpacing: FIGURE_TRACKING,
              figures,
            }),
          ],
          fontWeight: emphasized ? 700 : 600,
          lineHeight: 1.1,
          letterSpacing: FIGURE_TRACKING,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        <PrivacyFilter>{formatMoney(value)}</PrivacyFilter>
      </FinancialText>
    </View>
  );
}

function Divider() {
  return (
    <View
      aria-hidden="true"
      style={{
        width: 1,
        flexShrink: 0,
        alignSelf: 'stretch',
        backgroundColor: 'var(--dfl-line)',
      }}
    />
  );
}
