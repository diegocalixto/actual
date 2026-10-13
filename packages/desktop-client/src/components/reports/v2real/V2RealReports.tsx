import React from 'react';

import { viewStyles } from '@actual-app/components/view';
import { css, cx } from '@emotion/css';

import { useRegionalFormatKey } from '#components/v2lab/LabStyle';
import { ReportsView } from '#components/v2lab/reports/ReportsView';

import { REPORTS_ROOT_CLASS, ReportsStyle } from './ReportsStyle';
import { useRealReportsData } from './useRealReportsData';

/** A person's name. Not copy, so never a translation key. */
const AUTHOR = 'Diego Calixto';

/**
 * The real Reports.
 *
 * It contributes no layout of its own: `ReportsView` is the approved
 * composition, shared with `/v2-lab/reports`, and this file only supplies real
 * data and the token scope. Anything that looks different between the two
 * routes is a difference in the data, never in the design.
 */
export function V2RealReports() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const data = useRealReportsData();

  return (
    // The page's landmark. The upstream pages get theirs from `Page`; these
    // are drawn outside it, and without one a screen reader has no way to jump
    // past the navigation to the content.
    <main
      key={regionalFormat}
      className={cx(
        viewStyles,
        REPORTS_ROOT_CLASS,
        css({ flex: 1, minHeight: 0 }),
      )}
    >
      <ReportsStyle />
      {/*
        Authorship goes in the slot the approved composition already ends with:
        small, muted, right-aligned, in the normal flow of the page.
      */}
      <ReportsView data={{ ...data, footnote: AUTHOR }} />
    </main>
  );
}
