import React from 'react';
import type { ReactNode } from 'react';

import { Button } from '@actual-app/components/button';
import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import type { EntityIcon } from '#components/v2lab/LabStyle';

import { MobileBudgetIconTile } from './MobileBudgetIconTile';
import { formatCurrency } from './mobileBudgetMoney';

type MobileBudgetGroupHeaderProps = {
  label: ReactNode;
  Icon: EntityIcon;
  hue: string;
  /** How many categories the group holds. */
  count: number;
  /** Left figure and its caption; the group's plan, or what it took in. */
  primary: { value: number; caption: ReactNode };
  /** Right figure and its caption. Absent on a group that has only one total. */
  secondary?: { value: number; caption: ReactNode; tone?: string };
  isExpanded: boolean;
  onToggle: () => void;
};

/**
 * The line that opens a group.
 *
 * It carries the group's own totals and the control that folds it. The caret
 * is a real button here rather than an ornament, because the shape of the
 * screen has to prove it can hold the collapse the real Budget already has —
 * a header that only looked foldable would be a promise the layout could not
 * keep once the behaviour arrives.
 *
 * Both figures are captioned. On a screen with a month balance, a group
 * balance and eight category balances, an uncaptioned number is a number the
 * reader has to guess the meaning of.
 */
export function MobileBudgetGroupHeader({
  label,
  Icon,
  hue,
  count,
  primary,
  secondary,
  isExpanded,
  onToggle,
}: MobileBudgetGroupHeaderProps) {
  return (
    <Button
      variant="bare"
      aria-expanded={isExpanded}
      onPress={onToggle}
      className={css({
        width: '100%',
        padding: '11px 10px',
        borderRadius: 0,
        backgroundColor: 'var(--dfl-surface-raised)',
        backgroundImage:
          'linear-gradient(180deg, rgba(150, 185, 225, 0.055), rgba(150, 185, 225, 0.006))',
        '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
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
        <MobileBudgetIconTile Icon={Icon} hue={hue} size={32} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            minWidth: 0,
          }}
        >
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text)',
            }}
          >
            {label}
          </Text>
          <View
            style={{
              flexShrink: 0,
              minWidth: 20,
              padding: '1px 6px',
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor: 'var(--dfl-inset)',
            }}
          >
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--dfl-text-2)',
              }}
            >
              {count}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: 0 }}>
          <FinancialText
            style={{
              fontSize: 'clamp(10.5px, 2.9vw, 13px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              color: 'var(--dfl-text)',
            }}
          >
            {formatCurrency(primary.value)}
          </FinancialText>
          <Text style={{ fontSize: 9.5, color: 'var(--dfl-text-3)' }}>
            {primary.caption}
          </Text>
        </View>

        {secondary && (
          <View style={{ flexShrink: 0, alignItems: 'flex-end', gap: 0 }}>
            <FinancialText
              style={{
                fontSize: 'clamp(10.5px, 2.9vw, 13px)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                color: secondary.tone ?? 'var(--dfl-text)',
              }}
            >
              {formatCurrency(secondary.value)}
            </FinancialText>
            <Text style={{ fontSize: 9.5, color: 'var(--dfl-text-3)' }}>
              {secondary.caption}
            </Text>
          </View>
        )}

        <SvgCheveronDown
          aria-hidden="true"
          width={17}
          height={17}
          style={{
            flexShrink: 0,
            color: 'var(--dfl-text-3)',
            transform: isExpanded ? undefined : 'rotate(-90deg)',
          }}
        />
      </View>
    </Button>
  );
}
