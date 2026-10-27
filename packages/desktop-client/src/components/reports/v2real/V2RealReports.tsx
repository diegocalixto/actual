import React from 'react';
import { useTranslation } from 'react-i18next';

import { viewStyles } from '@actual-app/components/view';
import { UNCATEGORIZED_ID } from '@actual-app/core/shared/month-indicators';
import { css, cx } from '@emotion/css';

import { useRegionalFormatKey } from '#components/v2lab/LabStyle';
import { ReportsView } from '#components/v2lab/reports/ReportsView';
import {
  sliceForSpendingEntry,
  useOpenIndicatorTransactions,
} from '#reports/useOpenIndicatorTransactions';

import { REPORTS_ROOT_CLASS, ReportsStyle } from './ReportsStyle';
import { useRealReportsData } from './useRealReportsData';
import { useReportsDetailLinks } from './useReportsDetailLinks';
import { useReportsPeriod } from './useReportsPeriod';

/** A person's name. Not copy, so never a translation key. */
const AUTHOR = 'Diego Calixto';

/**
 * The real Reports.
 *
 * It contributes no layout of its own: `ReportsView` is the approved
 * composition, shared with `/v2-lab/reports`, and this file only supplies real
 * data and the token scope. Anything that looks different between the two
 * routes is a difference in the data, never in the design.
 *
 * It is also what gives the composition's controls something to do: the month
 * comes from the address, and the links lead to the application's own detailed
 * reports. The laboratory supplies neither, and draws none of them.
 */
export function V2RealReports() {
  // Redrawn whole when the file's number format or currency changes.
  const regionalFormat = useRegionalFormatKey();
  const { t } = useTranslation();
  const openTransactions = useOpenIndicatorTransactions();
  const period = useReportsPeriod();
  const data = useRealReportsData(period.month);
  const detailReports = useReportsDetailLinks();
  // The monthly comparison is the cash-flow report, six months of it.
  const cashFlow = detailReports.find(report => report.id === 'cash-flow');

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
      <ReportsView
        data={{
          ...data,
          period,
          detailReports,
          onOpenFullComparison: cashFlow?.onOpen,
          // The period on screen, under the indicators' rules.
          onOpenCategory: category =>
            openTransactions(
              period.month,
              sliceForSpendingEntry(category.id),
              category.id === UNCATEGORIZED_ID
                ? t('Uncategorized spending')
                : category.name,
            ),
          onOpenPendingInflows: () =>
            openTransactions(
              period.month,
              { kind: 'pendingInflows' },
              t('Inflows to review'),
            ),
          footnote: AUTHOR,
        }}
      />
    </main>
  );
}
