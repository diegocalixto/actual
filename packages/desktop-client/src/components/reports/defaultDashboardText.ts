import type { useTranslation } from 'react-i18next';

import { DEFAULT_DASHBOARD_STATE } from '@actual-app/core/shared/dashboard';
import type { DashboardWidgetEntity } from '@actual-app/core/types/models';

type TFunc = ReturnType<typeof useTranslation>['t'];

/**
 * The dashboard ships with a set of widgets whose names — and one markdown
 * body — are written into the database the first time a budget is created
 * (`DEFAULT_DASHBOARD_STATE` and the dashboard migrations). Being persisted
 * does not make them the user's words: they are system defaults, so they are
 * translated when displayed.
 *
 * Neither `dashboard` nor `dashboard_pages` stores where a row came from — the
 * columns are only id/name/tombstone (+ layout and `meta` for widgets) and the
 * ids are random uuids, regenerated on every reset. So the default text itself
 * is the only signal available, and it is narrowed with the one structural
 * field that is trustworthy: the widget's `type`. A name is translated only
 * when it is a default *for that type* — renaming a net worth card to
 * "Budget Overview" leaves it untouched, because that name is a default of
 * `spending-card`.
 *
 * The translation happens at render time only; the stored value is never
 * rewritten, and the rename/edit inputs are deliberately left on the raw stored
 * value so that saving one can never persist a translation.
 */

/**
 * `type -> default names`, derived from the shipped defaults so it cannot drift
 * away from what the app actually writes to the database.
 */
const DEFAULT_NAMES_BY_TYPE = DEFAULT_DASHBOARD_STATE.reduce<
  Map<string, Set<string>>
>((acc, widget) => {
  const name =
    widget.meta && 'name' in widget.meta ? widget.meta.name : undefined;
  if (typeof name === 'string' && name) {
    const names = acc.get(widget.type) ?? new Set<string>();
    names.add(name);
    acc.set(widget.type, names);
  }
  return acc;
}, new Map());

/** The name the dashboard migration gives the first dashboard page. */
const DEFAULT_DASHBOARD_PAGE_NAME = 'Main';

/** The markdown widget shipped in `DEFAULT_DASHBOARD_STATE`, read from it. */
const DEFAULT_TIPS_MARKDOWN = DEFAULT_DASHBOARD_STATE.reduce<
  string | undefined
>((acc, widget) => {
  if (acc !== undefined || widget.type !== 'markdown-card') {
    return acc;
  }
  return widget.meta && 'content' in widget.meta
    ? (widget.meta.content as string)
    : acc;
}, undefined);

function translateDefaultWidgetName(name: string, t: TFunc) {
  switch (name) {
    case 'Total Income (YTD)':
      return t('Total Income (YTD)');
    case 'Total Expenses (YTD)':
      return t('Total Expenses (YTD)');
    case 'Avg Per Month':
      return t('Avg Per Month');
    case 'Avg Per Transaction':
      return t('Avg Per Transaction');
    case 'This Month':
      return t('This Month');
    case 'Budget Overview':
      return t('Budget Overview');
    case '3-Month Average':
      return t('3-Month Average');
    case 'Transaction Calendar':
      return t('Transaction Calendar');
    case 'Recent Net Worth Change':
      return t('Recent Net Worth Change');
    default:
      return name;
  }
}

/**
 * Translates a widget name that is still the default shipped for this widget
 * type. Without a type nothing is translated, so a caller that does not know
 * the type fails safe.
 */
export function localizeDefaultWidgetName(
  name: string | undefined | null,
  widgetType: DashboardWidgetEntity['type'] | undefined,
  t: TFunc,
) {
  if (!name || !widgetType) {
    return name ?? '';
  }
  return DEFAULT_NAMES_BY_TYPE.get(widgetType)?.has(name)
    ? translateDefaultWidgetName(name, t)
    : name;
}

/**
 * Translates the dashboard page name while it is still the system default.
 *
 * `dashboard_pages` has no field that records where a page came from, so this
 * can only compare the text. The app never generates the name `Main` again —
 * new pages are created as `t('New dashboard')` — so the only way to reach a
 * false positive is for the user to name a page exactly `Main` themselves. The
 * stored value is untouched either way; only the label shown changes.
 */
export function localizeDefaultDashboardPageName(
  name: string | undefined | null,
  t: TFunc,
) {
  if (!name) {
    return name ?? '';
  }
  return name === DEFAULT_DASHBOARD_PAGE_NAME ? t('Main') : name;
}

/** Translates the shipped tips markdown while it is still untouched. */
export function localizeDefaultMarkdown(content: string, t: TFunc) {
  return DEFAULT_TIPS_MARKDOWN !== undefined &&
    content === DEFAULT_TIPS_MARKDOWN
    ? t(
        '## Dashboard Tips\n\nYou can add new widgets or edit existing widgets by using the buttons at the top of the page. Choose a widget type and customize it to fit your needs.\n\n**Moving cards:** Drag any card by its header to reposition it.\n\n**Deleting cards:** Click the three-dot menu on any card and select "Remove".',
      )
    : content;
}
