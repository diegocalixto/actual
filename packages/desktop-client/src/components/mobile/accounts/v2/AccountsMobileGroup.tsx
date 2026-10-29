import React from 'react';
import type { ReactNode } from 'react';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronDown,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { AccountsMobileMoney } from './AccountsMobileMoney';

type AccountsMobileGroupProps = {
  label: ReactNode;
  /** What this side of the file holds. Its own cell, never a sum of the rows. */
  subtotal: number | null;
  /** The dot before the label, in the group's own colour. */
  dotColor: string;
  /** Names the header's action for assistive technology. */
  actionLabel: string;
  onPress: () => void;
  /**
   * A collapsible group draws a chevron that turns; a group that navigates
   * draws one that points onward. `undefined` means the latter.
   */
  isExpanded?: boolean;
  children: ReactNode;
};

/**
 * One group of accounts, as a single surface.
 *
 * Its header carries the group's own subtotal — the budget engine's
 * `onbudget-accounts-balance`, `offbudget-accounts-balance` or
 * `closed-accounts-balance` cell — set quieter than the hero above so the eye
 * still finds the whole first, and right whatever a row below is still doing.
 *
 * The header is pressable because the previous page's group headings were: on
 * budget, off budget and closed each reach a register of their own, and the
 * closed heading opens and shuts its own list instead. Nothing about that
 * changed; only what it looks like did.
 *
 * The finish is the card's only depth: a hairline a step up the ramp, a fill
 * that falls off from its lit top edge, and one dark pixel underneath seating
 * it on the ground.
 */
export function AccountsMobileGroup({
  label,
  subtotal,
  dotColor,
  actionLabel,
  onPress,
  isExpanded,
  children,
}: AccountsMobileGroupProps) {
  const Cheveron =
    isExpanded === undefined || !isExpanded
      ? SvgCheveronRight
      : SvgCheveronDown;

  return (
    <View
      style={{
        borderRadius: 'var(--dfma-radius)',
        border: '1px solid var(--dfl-line-strong)',
        backgroundColor: 'var(--dfl-surface)',
        backgroundImage: 'var(--dfma-panel-sheen)',
        boxShadow: 'var(--dfl-shadow), 0 1px 0 rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
    >
      <Button
        variant="bare"
        aria-label={actionLabel}
        aria-expanded={isExpanded}
        onPress={onPress}
        className={css({
          width: '100%',
          // The header is a control, not a caption: it opens the group's
          // register, or shuts the group. 44px is the touch target both Apple
          // and Google publish as the minimum, and the padding alone left it at
          // 38. The mobile Home's version of this strip is not pressable, which
          // is why it can sit tighter.
          minHeight: 44,
          padding: '12px 14px',
          borderRadius: 0,
          borderBottom: '1px solid var(--dfl-line)',
          backgroundColor: 'var(--dfl-surface-raised)',
          backgroundImage: 'var(--dfma-header-sheen)',
          '&[data-hovered]': { backgroundColor: 'var(--dfl-surface-raised)' },
          '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            minWidth: 0,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                flexShrink: 0,
                borderRadius: 999,
                backgroundColor: dotColor,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: 'var(--dfl-text-2)',
              }}
            >
              {label}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AccountsMobileMoney
              value={subtotal}
              withCurrency
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color:
                  subtotal !== null && subtotal < 0
                    ? 'var(--dfl-negative)'
                    : 'var(--dfl-text-2)',
              }}
            />
            <Cheveron
              aria-hidden="true"
              width={14}
              height={14}
              style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
            />
          </View>
        </View>
      </Button>

      {children}
    </View>
  );
}
