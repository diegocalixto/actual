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

import { BudgetMobileAmount } from './BudgetMobileAmount';
import { BudgetMobileIconTile } from './BudgetMobileIconTile';
import { budgetLayout } from './BudgetMobileStyle';

/** The line's own padding, which the controls on it reach across. */
const PADDING_Y = 11;
const PADDING_X = 10;
/**
 * What every line of the header keeps free at its far end for the caret: the
 * glyph in its 23pt box and the gap before it, where they have always been.
 * The caret's target is wider than that and overlaps the last figure by a few
 * points, which costs nothing — a press on the figure folds the group too.
 */
const CARET_RESERVE = PADDING_X + 23 + 7;
const CARET_TARGET = budgetLayout.touchTarget;

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
 *
 * The name comes first. On one line the two figures took what they needed and
 * the name kept the rest, which on a 390pt screen left "Usual Ex…" — and two
 * groups called "Despesas fixas" and "Despesas variáveis" the same eight
 * letters. So the line folds: while the name and the figures fit side by side
 * they stay as drawn, and when they do not the figures move to a line of their
 * own under it. A name is only ever shortened when it is longer than the card.
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
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 7,
        rowGap: 6,
        padding: `${PADDING_Y}px ${PADDING_X}px`,
        paddingRight: CARET_RESERVE,
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

      {/* The tile and the name fold as one: a name too long for its line is
          shortened beside its tile, never sent to the next line without it. */}
      <View
        style={{
          flex: '0 1 auto',
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <BudgetMobileIconTile Icon={Icon} hue={hue} size={32} />

        <Button
          variant="bare"
          onPress={onEditGroup}
          aria-label={t('Abrir menu do grupo {{name}}', { name })}
          className={css({
            minWidth: 0,
            flexShrink: 1,
            // One line of type, with a target a finger's height around it.
            padding: `${PADDING_Y + 3}px 2px`,
            margin: `-${PADDING_Y + 1}px 0`,
            borderRadius: 8,
            '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
            '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
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
      </View>

      <View
        style={{
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          // To the far end of whichever line they land on.
          marginLeft: 'auto',
        }}
      >
        <GroupFigure figure={primary} />
        {secondary && <GroupFigure figure={secondary} />}
      </View>

      {/* Out of the flow, so it holds the same corner whether the header is
          one line or two; the whole column is its target. */}
      <Button
        variant="bare"
        aria-expanded={!isCollapsed}
        aria-label={t('Recolher ou expandir o grupo {{name}}', { name })}
        onPress={onToggleCollapse}
        className={css({
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: CARET_TARGET,
          padding: 0,
          borderRadius: 0,
          color: 'var(--dfl-text-3)',
          '&[data-hovered]': { backgroundColor: 'var(--dfl-inset)' },
          '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
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
        <BudgetMobileAmount value={figure.value} />
      </FinancialText>
      <Text style={{ fontSize: 9.5, color: 'var(--dfmb-label)' }}>
        {figure.caption}
      </Text>
    </View>
  );
}
