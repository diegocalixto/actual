import React from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import type { EntityIcon } from '#components/v2lab/LabStyle';

import { BudgetMobileIconTile } from './BudgetMobileIconTile';
import { formatCurrencyOrPending } from './budgetMobileMoney';

/** A figure the header carries, and the word that says what it means. */
type HeaderFigure = {
  value: number | null;
  caption: ReactNode;
};

type BudgetMobileGroupHeaderProps = {
  name: string;
  Icon: EntityIcon;
  hue: string;
  /** How many categories the group holds, after the hidden filter. */
  count: number;
  /** Left figure: the group's plan, or what it took in. */
  primary: HeaderFigure;
  /** Right figure. Absent on a group that has only one total. */
  secondary?: HeaderFigure;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEditGroup: () => void;
  /** Hidden groups keep the upstream's dimmed treatment. */
  isHidden: boolean;
  /** Expense groups are reorderable; the income group is not. */
  hasDragHandle: boolean;
};

/**
 * The line that opens a group.
 *
 * It carries the group's own totals — the engine's `group-budget` and
 * `group-leftover` cells, never a sum of the visible rows, so the header stays
 * right while a row below it is still resolving — and the two controls the
 * upstream header had: pressing the line folds the group, pressing the name
 * opens the group's menu.
 *
 * The caret keeps its own button so the fold is reachable from a keyboard; the
 * row's click handler is what makes the whole line tappable on a phone. Both
 * were already here and both still are, only laid out the way the approved
 * composition draws them.
 *
 * Both figures are captioned. On a screen carrying a month balance, a group
 * balance and a balance for every category, an uncaptioned number is a number
 * the reader has to guess the meaning of.
 */
export function BudgetMobileGroupHeader({
  name,
  Icon,
  hue,
  count,
  primary,
  secondary,
  isCollapsed,
  onToggleCollapse,
  onEditGroup,
  isHidden,
  hasDragHandle,
}: BudgetMobileGroupHeaderProps) {
  const { t } = useTranslation();

  return (
    <View
      data-testid="category-group-row"
      onClick={onToggleCollapse}
      style={{
        cursor: 'pointer',
        flexDirection: 'row',
        alignItems: 'center',
        // 7px rather than 8: at 375pt the header is exactly at capacity, and
        // the pixel a gap gives back is a pixel the group's name keeps.
        gap: 7,
        padding: '11px 10px',
        opacity: isHidden ? 0.5 : undefined,
        backgroundColor: 'var(--dfl-surface-raised)',
        backgroundImage:
          'linear-gradient(180deg, rgba(150, 185, 225, 0.055), rgba(150, 185, 225, 0.006))',
      }}
    >
      {hasDragHandle && (
        <Button
          slot="drag"
          // Kept exactly as the upstream rows had it: react-aria's drag hooks
          // look for this handle, and its pointer behaviour is what shipped.
          style={{
            opacity: 0,
            width: 1,
            height: 1,
            position: 'absolute',
            overflow: 'hidden',
          }}
        />
      )}

      <BudgetMobileIconTile Icon={Icon} hue={hue} size={32} />

      <Button
        variant="bare"
        onPress={onEditGroup}
        aria-label={t('Abrir menu do grupo {{name}}', { name })}
        className={css({
          minWidth: 0,
          flexShrink: 1,
          padding: '2px 2px',
          borderRadius: 8,
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            minWidth: 0,
          }}
        >
          <TextOneLine
            data-testid="category-group-name"
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              textAlign: 'left',
              color: 'var(--dfl-text)',
            }}
          >
            {name}
          </TextOneLine>
          <View
            style={{
              flexShrink: 0,
              minWidth: 18,
              padding: '1px 5px',
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
      </Button>

      <View style={{ flex: 1, minWidth: 2 }} />

      <GroupFigure figure={primary} />
      {secondary && <GroupFigure figure={secondary} />}

      <Button
        variant="bare"
        aria-expanded={!isCollapsed}
        aria-label={t('Recolher ou expandir o grupo {{name}}', { name })}
        onPress={onToggleCollapse}
        className={css({
          flexShrink: 0,
          padding: 3,
          borderRadius: 999,
          color: 'var(--dfl-text-3)',
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <SvgCheveronDown
          width={17}
          height={17}
          style={{
            flexShrink: 0,
            transition: 'transform .1s',
            transform: isCollapsed ? 'rotate(-90deg)' : undefined,
          }}
        />
      </Button>
    </View>
  );
}

function GroupFigure({ figure }: { figure: HeaderFigure }) {
  return (
    <View style={{ flexShrink: 0, alignItems: 'flex-end' }}>
      <FinancialText
        style={{
          fontSize: 'clamp(10.5px, 2.9vw, 13px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-text)',
        }}
      >
        {formatCurrencyOrPending(figure.value)}
      </FinancialText>
      <Text style={{ fontSize: 9.5, color: 'var(--dfmb-label)' }}>
        {figure.caption}
      </Text>
    </View>
  );
}
