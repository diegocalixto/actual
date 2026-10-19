import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { SvgPencil1 } from '@actual-app/components/icons/v2';
import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { LabPanel } from '#components/v2lab/LabPanel';
import {
  currencySymbol,
  fittedFontSize,
  formatDigits,
  parseDigits,
} from '#components/v2lab/LabStyle';
import { usePrivacyMode } from '#hooks/usePrivacyMode';

import { BudgetBar } from './BudgetBar';
import type { LabEnvelope } from './budgetFixtures';
import { formatPercent, formatPlain } from './budgetMoney';
import { BudgetTile } from './BudgetTile';
import type { EnvelopeActions, EnvelopeActionsIntent } from './BudgetView';

type BudgetEnvelopesProps = {
  envelopes: LabEnvelope[];
  /** Sum of all budgeted amounts, so each row can state its share of the plan. */
  totalBudgeted: number;
  /** Absent ⇒ the column is read-only, as in the laboratory. */
  onBudgetedChange?: (envelopeId: string, amount: number) => void;
  envelopeActions?: EnvelopeActions;
};

const AMOUNT_COLUMN = 116;
const ROW_GAP = 18;
const ROW_PADDING_X = 22;
const TILE_SIZE = 40;
const NAME_COLUMN = 158;
const NAME_COLUMN_MIN = 120;
const BAR_MIN = 60;
/** The row's trailing chevron: a 16px glyph in a button padded by 2px. */
const ACTIONS_COLUMN = 20;
/** How the three money columns set their figures. */
const AMOUNT_SIZE = 14.5;
const AMOUNT_TRACKING = -0.2;
/**
 * The gap between the symbol and the figure — and two points to spare, because
 * the editable column is a field, and a field cuts the last digit of a line
 * that comes out a point longer than estimated.
 */
const AMOUNT_GAP = 3;
const AMOUNT_SPARE = 2;

/**
 * The size a money column is set at, symbol and figure alike.
 *
 * A column is 116px whatever it holds, which is a five-digit amount at the
 * design's size. A longer one ran into the column beside it, and in the
 * editable column the field simply cut its last digit off. Each column now
 * takes the size its longest line fits at — one size down the whole column,
 * so the symbols and the digits keep lining up, and the symbol never ends up
 * larger than the figure it introduces.
 */
function columnFigureSize(figures: number[]): string {
  return fittedFontSize({
    designSize: `${AMOUNT_SIZE}px`,
    room: `100cqi - ${AMOUNT_GAP + AMOUNT_SPARE}px`,
    floor: '10px',
    letterSpacing: AMOUNT_TRACKING,
    figures: figures.map(figure => currencySymbol() + formatPlain(figure)),
  });
}

/**
 * The narrowest the list can be before a row stops fitting.
 *
 * Every column but the name and the bar is rigid, so below this the panel can
 * only clip — and what it clips first is the row's far end: the actions, then
 * the available balance. The page reads this to stop squeezing the list and
 * move the context column underneath it instead.
 */
export const ENVELOPES_MIN_WIDTH =
  2 + // the panel's own hairline, left and right
  2 * ROW_PADDING_X +
  TILE_SIZE +
  NAME_COLUMN_MIN +
  BAR_MIN +
  3 * AMOUNT_COLUMN +
  ACTIONS_COLUMN +
  6 * ROW_GAP;

/**
 * The envelope list — the working surface of the page.
 *
 * One panel with hairlines between rows, not one card per envelope: eight cards
 * would give eight equal borders to scan, and the question this list answers
 * ("where am I about to run out?") is answered by comparing rows, which only
 * works when nothing separates them but a line.
 */
export function BudgetEnvelopes({
  envelopes,
  totalBudgeted,
  onBudgetedChange,
  envelopeActions,
}: BudgetEnvelopesProps) {
  const figureSizes = {
    budgeted: columnFigureSize(envelopes.map(envelope => envelope.budgeted)),
    spent: columnFigureSize(envelopes.map(envelope => envelope.spent)),
    available: columnFigureSize(envelopes.map(envelope => envelope.available)),
  };

  return (
    <LabPanel>
      <ColumnHeader />
      {envelopes.map((envelope, index) => (
        <Row
          key={envelope.id}
          envelope={envelope}
          figureSizes={figureSizes}
          share={totalBudgeted > 0 ? envelope.budgeted / totalBudgeted : 0}
          isLast={index === envelopes.length - 1}
          onBudgetedChange={onBudgetedChange}
          envelopeActions={envelopeActions}
        />
      ))}
    </LabPanel>
  );
}

function ColumnHeader() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: ROW_GAP,
        padding: `13px ${ROW_PADDING_X}px 11px`,
        borderBottom: '1px solid var(--dfl-line)',
        backgroundColor: 'rgba(4, 8, 16, 0.35)',
      }}
    >
      {/* Matches the tile + name + bar block below, so the three labels sit
          exactly over the three columns they name. */}
      <View style={{ flex: '1 1 auto' }} />
      <HeaderLabel>
        <Trans>Orçado</Trans>
      </HeaderLabel>
      <HeaderLabel>
        <Trans>Gasto</Trans>
      </HeaderLabel>
      <HeaderLabel>
        <Trans>Disponível</Trans>
      </HeaderLabel>
      <View aria-hidden="true" style={{ flex: `0 0 ${ACTIONS_COLUMN}px` }} />
    </View>
  );
}

function HeaderLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        padding: '0 8px',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        textAlign: 'right',
        color: 'var(--dfl-text-3)',
      }}
    >
      {children}
    </Text>
  );
}

const NAME_STYLE: CSSProperties = {
  minWidth: 0,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: -0.1,
  color: 'var(--dfl-text)',
};

/** The pencil beside a renamable name: quiet until the row is pointed at. */
const RENAME_HINT_CLASS = css({
  flexShrink: 0,
  color: 'var(--dfl-text-3)',
  opacity: 0,
  transition: 'opacity 120ms ease',
});

const ROW_CLASS = css({
  [`&:hover .${RENAME_HINT_CLASS}, &:focus-within .${RENAME_HINT_CLASS}`]: {
    opacity: 1,
  },
});

/**
 * The name as a control. It keeps the figure's type and place — a few pixels
 * of padding are given back by the margin — and shows itself only by the
 * pencil and a faint wash, so the list still reads as a list.
 */
const NAME_BUTTON_CLASS = css({
  alignSelf: 'flex-start',
  // The column's width, plus the padding the margin gives back.
  maxWidth: 'calc(100% + 12px)',
  minWidth: 0,
  flexShrink: 1,
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  gap: 6,
  padding: '2px 6px',
  margin: '-2px -6px',
  borderRadius: 6,
  backgroundColor: 'transparent',
  cursor: 'pointer',
  '&[data-hovered], &[data-pressed]': {
    backgroundColor: 'var(--dfl-inset)',
  },
  '&[data-focus-visible]': {
    outline: '2px solid var(--dfl-blue)',
    outlineOffset: 1,
  },
});

type RowProps = {
  envelope: LabEnvelope;
  /** One size per money column, shared by every row. */
  figureSizes: { budgeted: string; spent: string; available: string };
  share: number;
  isLast: boolean;
  onBudgetedChange?: (envelopeId: string, amount: number) => void;
  envelopeActions?: EnvelopeActions;
};

function Row({
  envelope,
  figureSizes,
  share,
  isLast,
  onBudgetedChange,
  envelopeActions,
}: RowProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const nameRef = useRef<HTMLButtonElement | null>(null);
  // Which control opened the row's popover, if any: the chevron asks for the
  // row's actions, the name for a rename. Rendered only while open, so each
  // opening starts from what was asked for.
  const [openedBy, setOpenedBy] = useState<EnvelopeActionsIntent | null>(null);
  const renderActions =
    typeof envelopeActions === 'function' ? envelopeActions : undefined;
  // The engine's own figure for this envelope, carryover included.
  const remaining = envelope.available;
  // Spending against no plan at all is past the plan by definition, so it
  // reads as overspent rather than as an envelope nobody has touched.
  const ratio =
    envelope.budgeted > 0
      ? envelope.spent / envelope.budgeted
      : envelope.spent > 0
        ? Infinity
        : 0;

  return (
    <View
      className={ROW_CLASS}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: ROW_GAP,
        padding: `14px ${ROW_PADDING_X}px`,
        minHeight: 70,
        borderBottom: isLast ? 'none' : '1px solid var(--dfl-line)',
      }}
    >
      <BudgetTile Icon={envelope.Icon} hue={envelope.hue} size={TILE_SIZE} />

      {/* The one column allowed to give: a long name ends in an ellipsis
          before a figure is ever pushed out of the panel. */}
      <View
        style={{
          flex: `0 1 ${NAME_COLUMN}px`,
          gap: 3,
          minWidth: NAME_COLUMN_MIN,
        }}
      >
        {renderActions ? (
          // The name is where a person looks to change it, as in the classic
          // sidebar: pressing it opens the rename, and the pencil beside it
          // says so on hover and on keyboard focus.
          <Button
            ref={nameRef}
            variant="bare"
            aria-label={t('Rename category {{name}}', { name: envelope.name })}
            onPress={() => setOpenedBy('rename')}
            className={NAME_BUTTON_CLASS}
          >
            <TextOneLine data-testid="category-name" style={NAME_STYLE}>
              {envelope.name}
            </TextOneLine>
            <SvgPencil1
              aria-hidden="true"
              className={RENAME_HINT_CLASS}
              width={11}
              height={11}
            />
          </Button>
        ) : (
          <TextOneLine data-testid="category-name" style={NAME_STYLE}>
            {envelope.name}
          </TextOneLine>
        )}
        <Text style={{ fontSize: 12, color: 'var(--dfl-text-3)' }}>
          {formatPercent(share)}
        </Text>
      </View>

      {/* The bar carries the row's weight — it is what makes Delivery at 99%
          findable without reading a single number. */}
      <View style={{ flex: '1 1 0', minWidth: BAR_MIN }}>
        <BudgetBar ratio={ratio} hue={envelope.hue} />
      </View>

      {onBudgetedChange ? (
        <BudgetedInput
          value={envelope.budgeted}
          figureSize={figureSizes.budgeted}
          label={t('Orçado de {{name}}', { name: envelope.name })}
          onCommit={amount => onBudgetedChange(envelope.id, amount)}
        />
      ) : (
        <Amount
          value={envelope.budgeted}
          figureSize={figureSizes.budgeted}
          muted
        />
      )}
      <Amount value={envelope.spent} figureSize={figureSizes.spent} muted />
      {/* Semantic, not per-category: what is left is the one figure whose sign
          matters, so it is the one figure allowed to be green or red. */}
      <Amount
        value={remaining}
        figureSize={figureSizes.available}
        color={
          remaining > 0
            ? 'var(--dfl-positive)'
            : remaining < 0
              ? 'var(--dfl-negative)'
              : 'var(--dfl-text-3)'
        }
      />

      {/* The reference ended each row with a chevron. It now opens what a
          chevron promises — the category's own actions — and is drawn only when
          there is something behind it. */}
      {envelopeActions && (
        <Button
          ref={triggerRef}
          variant="bare"
          // Named for its row: thirteen controls all called "Ações da
          // categoria" left a screen reader's user counting to know whose.
          aria-label={t('Ações da categoria {{name}}', {
            name: envelope.name,
          })}
          onPress={() =>
            setOpenedBy(opened => (opened === 'actions' ? null : 'actions'))
          }
          style={{
            flex: `0 0 ${ACTIONS_COLUMN}px`,
            padding: 2,
            color: 'var(--dfl-text-3)',
            backgroundColor: 'transparent',
          }}
        >
          <SvgCheveronRight aria-hidden="true" width={16} height={16} />
        </Button>
      )}
      {renderActions &&
        openedBy !== null &&
        renderActions({
          envelopeId: envelope.id,
          triggerRef: openedBy === 'rename' ? nameRef : triggerRef,
          intent: openedBy,
          isOpen: true,
          onClose: () => setOpenedBy(null),
        })}
    </View>
  );
}

/**
 * One money column.
 *
 * The prefix is pinned left and the figure right, rather than living inside one
 * right-aligned string: with the symbol inside the text, a row of "R$ 1.240,00"
 * and "R$ -6,64" pushes each "R$" to a different place and the column reads as
 * ragged. Split, both the symbols and the digits line up, and `FinancialText`
 * keeps the digits tabular so they stay lined up as the numbers change.
 */
function Amount({
  value,
  figureSize,
  muted = false,
  color,
}: {
  value: number;
  figureSize: string;
  muted?: boolean;
  color?: string;
}) {
  const tone = color ?? (muted ? 'var(--dfl-text-2)' : 'var(--dfl-text)');

  return (
    <View
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: AMOUNT_GAP,
        padding: '4px 8px',
        // The cell's width is what its line is fitted to.
        containerType: 'inline-size',
      }}
    >
      <Text
        style={{
          fontSize: [`${AMOUNT_SIZE}px`, figureSize],
          fontWeight: 600,
          color: tone,
        }}
      >
        {currencySymbol()}
      </Text>
      <FinancialText
        style={{
          /* Grows to fill the cell so the symbol stays pinned left and the
             figure stays pinned right — the same split the editable column
             uses, which is what makes all three line up. */
          flex: '1 1 0',
          minWidth: 0,
          fontSize: [`${AMOUNT_SIZE}px`, figureSize],
          fontWeight: 600,
          letterSpacing: AMOUNT_TRACKING,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          color: tone,
        }}
      >
        <PrivacyFilter>{formatPlain(value)}</PrivacyFilter>
      </FinancialText>
    </View>
  );
}

/**
 * The face of the budgeted field.
 *
 * Under privacy mode it follows the app's own rule for a money input
 * (`FinancialInput`): the redaction face at rest, readable while hovered or
 * being edited. A field cannot sit behind `PrivacyFilter` the way a printed
 * figure does — the filter remounts what it wraps, and a field that remounts
 * when it takes focus loses it.
 */
const BUDGETED_FACE = css({ fontFamily: 'inherit' });
const BUDGETED_FACE_PRIVATE = css({
  fontFamily: 'inherit',
  '&:not(:focus):not(:hover)': { fontFamily: 'Redacted Script' },
});

/**
 * The budgeted column, when the page can write.
 *
 * Deliberately not a control: it wears exactly the type, width and alignment of
 * the read-only amount beside it, and only reveals itself on focus. The plan is
 * something you adjust in place, and a row of boxes would turn the panel back
 * into the spreadsheet this design replaced.
 *
 * It looks like a figure and is announced as a field: thirteen of these in a
 * column were thirteen fields named nothing, which left a screen reader's user
 * to count rows to know whose plan they were about to change.
 */
function BudgetedInput({
  value,
  figureSize,
  label,
  onCommit,
}: {
  value: number;
  figureSize: string;
  /** The field's name: which envelope's plan this is. */
  label: string;
  onCommit: (amount: number) => void;
}) {
  const [draft, setDraft] = useState(() => formatDigits(value));
  const [isEditing, setIsEditing] = useState(false);
  // Escape leaves the field by blurring it, and a blur is what commits. The
  // commit that blur runs was built before Escape could put the stored amount
  // back in the draft, so it still held what had been typed — and wrote it.
  // The intention is carried here instead, where that commit can read it.
  const isAbandoned = useRef(false);
  const isPrivate = usePrivacyMode();
  // Like `PrivacyFilter`, redaction is desktop-only.
  const { isNarrowWidth } = useResponsive();

  useEffect(() => {
    if (!isEditing) {
      setDraft(formatDigits(value));
    }
  }, [value, isEditing]);

  const commit = () => {
    setIsEditing(false);
    const parsed = isAbandoned.current ? null : parseDigits(draft);
    isAbandoned.current = false;
    if (parsed !== null && parsed !== value) {
      onCommit(parsed);
    } else {
      setDraft(formatDigits(value));
    }
  };

  return (
    <View
      style={{
        flex: `0 0 ${AMOUNT_COLUMN}px`,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: AMOUNT_GAP,
        borderRadius: 8,
        padding: '4px 8px',
        background: isEditing ? 'rgba(6, 10, 18, 0.85)' : 'transparent',
        border: `1px solid ${isEditing ? 'var(--dfl-blue)' : 'transparent'}`,
        // The cell's width is what its line is fitted to.
        containerType: 'inline-size',
      }}
    >
      <Text
        style={{
          fontSize: [`${AMOUNT_SIZE}px`, figureSize],
          fontWeight: 600,
          color: 'var(--dfl-text-2)',
        }}
      >
        {currencySymbol()}
      </Text>
      <input
        value={draft}
        aria-label={label}
        inputMode="decimal"
        className={
          isPrivate && !isNarrowWidth ? BUDGETED_FACE_PRIVATE : BUDGETED_FACE
        }
        onFocus={event => {
          setIsEditing(true);
          event.currentTarget.select();
        }}
        onChange={event => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            isAbandoned.current = true;
            event.currentTarget.blur();
          }
        }}
        style={{
          flex: '1 1 0',
          minWidth: 0,
          fontSize: figureSize,
          // Pinned to what the app's face gives this size, so the field keeps
          // its height when privacy mode draws it in the redaction face.
          lineHeight: '17px',
          fontWeight: 600,
          letterSpacing: AMOUNT_TRACKING,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--dfl-text-2)',
          background: 'transparent',
          border: 'none',
          padding: 0,
          outline: 'none',
        }}
      />
    </View>
  );
}
