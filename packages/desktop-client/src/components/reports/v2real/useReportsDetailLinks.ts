import { useTranslation } from 'react-i18next';

import {
  SvgChartBar,
  SvgChartPie,
  SvgPiggyBank,
  SvgReports,
} from '@actual-app/components/icons/v1';

import type { ReportsDetailLink } from '#components/v2lab/reports/ReportsView';
import { useDashboardPages } from '#hooks/useDashboardPages';
import { useNavigate } from '#hooks/useNavigate';

/**
 * The detailed reports the V2 page is a summary of, and how to open each.
 *
 * All four are the application's own and all four already had an address;
 * what they lacked, once `/reports` became the V2 page, was a way to be
 * reached from it. Cash flow, net worth and spending are fixed routes. The
 * dashboard is the page of widgets and custom reports the phone used to open
 * on, and it lives under its own id — listed only once that id is known.
 */
export function useReportsDetailLinks(): ReportsDetailLink[] {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: dashboards = [] } = useDashboardPages();
  const [dashboard] = dashboards;

  const links: ReportsDetailLink[] = [
    {
      id: 'cash-flow',
      label: t('Cash flow report'),
      Icon: SvgChartBar,
      onOpen: () => void navigate('/reports/cash-flow'),
    },
    {
      id: 'net-worth',
      label: t('Net worth report'),
      Icon: SvgPiggyBank,
      onOpen: () => void navigate('/reports/net-worth'),
    },
    {
      id: 'spending',
      label: t('Spending report'),
      Icon: SvgChartPie,
      onOpen: () => void navigate('/reports/spending'),
    },
  ];

  if (dashboard) {
    links.push({
      id: 'dashboard',
      label: t('Custom dashboard'),
      Icon: SvgReports,
      onOpen: () => void navigate(`/reports/${dashboard.id}`),
    });
  }

  return links;
}
