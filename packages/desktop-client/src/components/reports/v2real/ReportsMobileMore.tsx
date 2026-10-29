import React from 'react';
import { Trans } from 'react-i18next';

import { SvgCheveronRight } from '@actual-app/components/icons/v1';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { CardHeading, LabCard } from '#components/v2lab/reports/LabCard';
import type { ReportsDetailLink } from '#components/v2lab/reports/ReportsView';

/** A row of the list: a finger's height, the whole width of the card. */
const ROW = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  minHeight: 50,
  padding: '0 16px',
  border: 'none',
  borderTop: '1px solid var(--dfl-line)',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 14.5,
  fontWeight: 500,
  textAlign: 'left',
  color: 'var(--dfl-text)',
  '&:active': { backgroundColor: 'var(--dfl-inset)' },
  '&:focus-visible': {
    outline: '2px solid var(--dfl-blue)',
    outlineOffset: -2,
  },
});

/**
 * The way from the summary to the detail, on a phone.
 *
 * The desktop keeps these behind the chart's "more"; a phone has the room to
 * list them and no pointer to discover a small button with. Each row opens a
 * report the application already has, on its own address — among them the
 * dashboard of widgets and custom reports this screen used to open on, so
 * nothing that was reachable from here stops being.
 */
export function ReportsMobileMore({
  reports,
}: {
  reports: ReportsDetailLink[];
}) {
  if (reports.length === 0) {
    return null;
  }

  return (
    <LabCard>
      <View style={{ padding: '14px 16px 12px' }}>
        <CardHeading
          title={<Trans>Detailed reports</Trans>}
          subtitle={<Trans>Open a report with its own filters</Trans>}
        />
      </View>

      {reports.map(({ id, label, Icon, onOpen }) => (
        <button key={id} type="button" className={ROW} onClick={onOpen}>
          <Icon
            aria-hidden="true"
            width={17}
            height={17}
            style={{ flexShrink: 0, color: 'var(--dfl-blue)' }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
          <SvgCheveronRight
            aria-hidden="true"
            width={18}
            height={18}
            style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
          />
        </button>
      ))}
    </LabCard>
  );
}
