import React from 'react';

import { View } from '@actual-app/components/view';

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
  const data = useRealReportsData();

  return (
    <View className={REPORTS_ROOT_CLASS} style={{ flex: 1, minHeight: 0 }}>
      <ReportsStyle />
      {/*
        Authorship goes in the slot the approved composition already ends with:
        small, muted, right-aligned, in the normal flow of the page.
      */}
      <ReportsView data={{ ...data, footnote: AUTHOR }} />
    </View>
  );
}
