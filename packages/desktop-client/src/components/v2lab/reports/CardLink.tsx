import React from 'react';
import type { ReactNode } from 'react';

import {
  SvgCheveronDown,
  SvgCheveronRight,
  SvgCheveronUp,
} from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

type CardLinkProps = {
  children: ReactNode;
  onPress: () => void;
  /**
   * Set when the link opens and closes more of its own card instead of leading
   * somewhere: the chevron then points the way the list will move, and a
   * screen reader is told which state it is in.
   */
  isExpanded?: boolean;
};

/**
 * What the link answers a pointer and a keyboard with. The panels are painted
 * outside the theme, so the focus ring is this scope's own blue.
 */
const LINK = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  // A finger's worth of height. Most of it is the room the row already had:
  // the space above the words, and the card's own padding under them.
  minHeight: 44,
  margin: '0 -8px -12px',
  padding: '0 8px',
  border: 'none',
  borderRadius: 10,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  color: 'var(--dfl-blue)',
  '&:hover': { backgroundColor: 'var(--dfl-inset)' },
  '&:focus-visible': {
    outline: '2px solid var(--dfl-blue)',
    outlineOffset: -2,
  },
});

/**
 * The trailing link a panel closes with.
 *
 * A button, because every one of them does something: it opens the rest of the
 * card's own list, or it leads to the report the card is a summary of. A panel
 * with nothing more to show does not draw one.
 */
export function CardLink({ children, onPress, isExpanded }: CardLinkProps) {
  const Chevron =
    isExpanded === undefined
      ? SvgCheveronRight
      : isExpanded
        ? SvgCheveronUp
        : SvgCheveronDown;

  return (
    <View style={{ borderTop: '1px solid var(--dfl-line)' }}>
      <button
        type="button"
        className={LINK}
        onClick={onPress}
        aria-expanded={isExpanded}
      >
        {children}
        <Chevron aria-hidden="true" width={14} height={14} />
      </button>
    </View>
  );
}
