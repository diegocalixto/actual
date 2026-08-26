import React, { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { useToggle } from 'usehooks-ts';

import { useNavigate } from '#hooks/useNavigate';

import type { NavItem } from './navigation';
import { useSecondaryNav } from './navigation';

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
 */
export function MoreMenu({
  placement,
  extraItems = [],
  children,
}: MoreMenuProps) {
  const navigate = useNavigate();
  const [isOpen, toggleOpen, setOpen] = useToggle();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const secondary = useSecondaryNav();
  const items = [...extraItems, ...secondary];

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
          items={items.map(item => ({
            name: item.id,
            text: item.label,
            icon: item.Icon,
            iconSize: 15,
          }))}
        />
      </Popover>
    </>
  );
}
