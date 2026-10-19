import React, { useRef } from 'react';

import { Button } from '@actual-app/components/button';
import { SvgPencil1 } from '@actual-app/components/icons/v2';
import { Input } from '@actual-app/components/input';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { theme } from '@actual-app/components/theme';
import { css } from '@emotion/css';

/** A finger's width and height, measured as the hit area, not the glyph. */
const TOUCH_TARGET = 44;

type RenameableModalTitleProps = {
  title: string;
  /** The control's accessible name, e.g. "Rename category Food". */
  label: string;
  /** Held by the modal, so a "Rename" button in its body can start it too. */
  isRenaming: boolean;
  onRenamingChange: (isRenaming: boolean) => void;
  /** Called with what was typed; deciding whether it is a change is the caller's. */
  onRename: (typed: string) => void;
};

/**
 * A modal title that says it can be renamed.
 *
 * The menu modals' `ModalTitle isEditable` renamed on a tap of the title text
 * and said so only with an underline — on a phone, nothing a person would read
 * as "tap here to rename", and not reachable by keyboard. This draws the same
 * title as a button with a pencil beside it, and edits it in the same large
 * centred field the old title opened.
 *
 * Enter and leaving the field save; Escape leaves the name as it was.
 */
export function RenameableModalTitle({
  title,
  label,
  isRenaming,
  onRenamingChange,
  onRename,
}: RenameableModalTitleProps) {
  // Enter saves and then blurs the field, and the blur would save again.
  const isSettled = useRef(false);

  const settle = (typed: string | null) => {
    if (isSettled.current) {
      return;
    }
    isSettled.current = true;
    if (typed !== null) {
      onRename(typed);
    }
    onRenamingChange(false);
  };

  if (isRenaming) {
    return (
      <Input
        autoFocus
        aria-label={label}
        defaultValue={title}
        onFocus={event => {
          isSettled.current = false;
          event.currentTarget.select();
        }}
        onEnter={(value, event) => {
          event.preventDefault();
          settle(value);
        }}
        onEscape={() => settle(null)}
        onUpdate={value => settle(value)}
        style={{
          fontSize: 25,
          fontWeight: 700,
          textAlign: 'center',
          minHeight: TOUCH_TARGET,
        }}
      />
    );
  }

  return (
    <Button
      variant="bare"
      aria-label={label}
      onPress={() => onRenamingChange(true)}
      className={css({
        minHeight: TOUCH_TARGET,
        minWidth: TOUCH_TARGET,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 8px',
        color: theme.pageText,
      })}
    >
      <TextOneLine style={{ fontSize: 25, fontWeight: 700, minWidth: 0 }}>
        {title}
      </TextOneLine>
      <SvgPencil1
        aria-hidden="true"
        width={15}
        height={15}
        style={{ flexShrink: 0, color: theme.pageTextSubdued }}
      />
    </Button>
  );
}
