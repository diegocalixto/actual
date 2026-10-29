import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { css } from '@emotion/css';

import { capitaliseMonth } from './reportsPeriodControl';
import type { ReportsPeriodControl } from './reportsPeriodControl';

type ReportsPeriodMenuProps = {
  period: ReportsPeriodControl;
  /**
   * The phone's trigger and list: a finger's height each, and type a size up.
   * Absent ⇒ the density a pointer is comfortable with.
   */
  isForTouch?: boolean;
};

/** What a trigger answers a pointer and a keyboard with, in this scope's own colours. */
const TRIGGER = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 7,
  padding: '6px 11px',
  borderRadius: 'var(--dfl-radius-sm)',
  backgroundColor: 'rgba(6, 10, 18, 0.75)',
  border: '1px solid var(--dfl-line-strong)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12.5,
  whiteSpace: 'nowrap',
  color: 'var(--dfl-text-2)',
  '&:hover': { color: 'var(--dfl-text)' },
  '&:focus-visible': {
    outline: '2px solid var(--dfl-blue)',
    outlineOffset: 2,
  },
});

const TOUCH_TRIGGER = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minWidth: 0,
  minHeight: 44,
  padding: '0 12px',
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 15.5,
  fontWeight: 600,
  letterSpacing: -0.2,
  whiteSpace: 'nowrap',
  color: 'var(--dfl-text)',
  '&:active': { backgroundColor: 'var(--dfl-inset)' },
  '&:focus-visible': {
    outline: '2px solid var(--dfl-blue)',
    outlineOffset: -2,
  },
});

/**
 * The period, as something that can be chosen.
 *
 * It names the month on screen — "This month" while that is the current one —
 * and opens the months there is something to show for, latest first. Choosing
 * one redraws every panel of the page: they all read the same period.
 */
export function ReportsPeriodMenu({
  period,
  isForTouch = false,
}: ReportsPeriodMenuProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const nameOf = (option: { label: string; isCurrentMonth: boolean }) =>
    option.isCurrentMonth ? t('This month') : capitaliseMonth(option.label);
  const current = nameOf({
    label: period.monthLabel,
    isCurrentMonth: period.isCurrentMonth,
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={isForTouch ? TOUCH_TRIGGER : TRIGGER}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('Period: {{period}}', { period: current })}
        data-month={period.month}
        onClick={() => setIsOpen(!isOpen)}
      >
        {current}
        <SvgCheveronDown
          aria-hidden="true"
          width={isForTouch ? 16 : 13}
          height={isForTouch ? 16 : 13}
          style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
        />
      </button>

      <Popover
        triggerRef={triggerRef}
        placement={isForTouch ? 'bottom' : 'bottom end'}
        offset={6}
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(false)}
      >
        <Menu
          onMenuSelect={(month: string) => {
            setIsOpen(false);
            period.onSelect(month);
          }}
          style={{ minWidth: isForTouch ? 220 : 180 }}
          getItemStyle={item => ({
            ...(isForTouch && {
              minHeight: 44,
              paddingLeft: 16,
              paddingRight: 20,
              fontSize: 15,
            }),
            // The month on screen, so the list also says where you are.
            ...(item.name === period.month && { fontWeight: 700 }),
          })}
          items={period.options.map(option => ({
            name: option.month,
            text: nameOf(option),
          }))}
        />
      </Popover>
    </>
  );
}
