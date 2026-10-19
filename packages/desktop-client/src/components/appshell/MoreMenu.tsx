import React, { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useLocation } from 'react-router';

import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { useToggle } from 'usehooks-ts';

import { useNavigate } from '#hooks/useNavigate';

import type { NavItem } from './navigation';
import { isNavItemActive, useSecondaryNav } from './navigation';
import { shellColors, shellLayout } from './shellTheme';

type MoreMenuProps = {
  placement: 'right bottom' | 'top';
  /**
   * Primary destinations the surrounding navigation could not fit. The phone's
   * bar has four slots around the action button, so Reports arrives here — it
   * must still be reachable, just not permanently on screen.
   */
  extraItems?: NavItem[];
  /** Renders the trigger; receives the ref and the toggle to wire up. */
  children: (props: {
    ref: RefObject<HTMLButtonElement | null>;
    onPress: () => void;
    isOpen: boolean;
  }) => ReactNode;
};

/**
 * The secondary destinations, behind one entry point.
 *
 * Every item is a route that already exists — this only changes where they are
 * reached from, never whether they can be. Shared by the desktop rail and the
 * mobile bottom bar so the two navigations cannot drift apart.
 *
 * Opened from the phone's bar it is a list for a finger: rows the height of a
 * touch target and wide enough to aim at, where the rail's menu keeps the
 * density a pointer is comfortable with. The destination the reader is already
 * on is drawn in the accent in both, so the menu answers "where am I" as well
 * as "where can I go".
 */
export function MoreMenu({
  placement,
  extraItems = [],
  children,
}: MoreMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, toggleOpen, setOpen] = useToggle();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const secondary = useSecondaryNav();
  const items = [...extraItems, ...secondary];
  // The bar is the only caller that opens the menu upwards, and the only one
  // that is pressed with a finger.
  const isForTouch = placement === 'top';
  const current = items.find(item =>
    isNavItemActive(item, location.pathname),
  )?.id;

  return (
    <>
      {children({ ref: triggerRef, onPress: toggleOpen, isOpen })}

      <Popover
        placement={placement}
        offset={10}
        triggerRef={triggerRef}
        isOpen={isOpen}
        onOpenChange={() => setOpen(false)}
      >
        <Menu
          onMenuSelect={(id: string) => {
            setOpen(false);
            const item = items.find(candidate => candidate.id === id);
            if (item) {
              void navigate(item.to);
            }
          }}
          style={isForTouch ? { minWidth: 220 } : undefined}
          getItemStyle={item => ({
            ...(isForTouch && {
              minHeight: shellLayout.touchTarget,
              paddingLeft: 16,
              paddingRight: 20,
              fontSize: 15,
            }),
            ...(item.name === current && {
              color: shellColors.accent,
              fontWeight: 600,
            }),
          })}
          items={items.map(item => ({
            name: item.id,
            text: item.label,
            icon: item.Icon,
            iconSize: isForTouch ? 18 : 15,
          }))}
        />
      </Popover>
    </>
  );
}
