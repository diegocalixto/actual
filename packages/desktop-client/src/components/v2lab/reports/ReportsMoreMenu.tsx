import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SvgDotsHorizontalTriple } from '@actual-app/components/icons/v1';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { css } from '@emotion/css';

import type { ReportsDetailLink } from './reportsPeriodControl';

const TRIGGER = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  padding: 0,
  borderRadius: 'var(--dfl-radius-sm)',
  background: 'transparent',
  border: '1px solid var(--dfl-line)',
  cursor: 'pointer',
  color: 'var(--dfl-text-3)',
  '&:hover': {
    color: 'var(--dfl-text)',
    borderColor: 'var(--dfl-line-strong)',
  },
  '&:focus-visible': {
    outline: '2px solid var(--dfl-blue)',
    outlineOffset: 2,
  },
});

/**
 * The chart's "more": the detailed reports this page summarises.
 *
 * Every entry is a report the application already has — cash flow, net worth,
 * spending, the dashboard of custom reports — and each opens on its own
 * address, with its own controls. Nothing is built here; the menu is only the
 * way from the summary to the detail.
 */
export function ReportsMoreMenu({ reports }: { reports: ReportsDetailLink[] }) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={TRIGGER}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        // The name the phone's list of the same reports has for a title. Not
        // "More reports": the navigation already has a "More", and two
        // controls answering to one word are one too many for a voice.
        aria-label={t('Detailed reports')}
        onClick={() => setIsOpen(!isOpen)}
      >
        <SvgDotsHorizontalTriple aria-hidden="true" width={14} height={14} />
      </button>

      <Popover
        triggerRef={triggerRef}
        placement="bottom end"
        offset={6}
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(false)}
      >
        <Menu
          onMenuSelect={(id: string) => {
            setIsOpen(false);
            reports.find(report => report.id === id)?.onOpen();
          }}
          style={{ minWidth: 220 }}
          items={reports.map(report => ({
            name: report.id,
            text: report.label,
            icon: report.Icon,
            iconSize: 15,
          }))}
        />
      </Popover>
    </>
  );
}
