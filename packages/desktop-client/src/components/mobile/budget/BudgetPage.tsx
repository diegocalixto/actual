// @ts-strict-ignore
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GridList, GridListItem } from 'react-aria-components';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedLoading } from '@actual-app/components/icons/AnimatedLoading';
import { SvgExclamationOutline } from '@actual-app/components/icons/v1';
import { SvgArrowButtonDown1 } from '@actual-app/components/icons/v2';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import { groupById } from '@actual-app/core/shared/util';

import { sync } from '#app/appSlice';
import {
  useBudgetActions,
  useCreateCategoryGroupMutation,
  useCreateCategoryMutation,
  useDeleteCategoryGroupMutation,
  useDeleteCategoryMutation,
  useSaveCategoryGroupMutation,
  useSaveCategoryMutation,
  useSortCategoriesMutation,
} from '#budget';
import { closeBudget } from '#budgetfiles/budgetfilesSlice';
import { prewarmMonth } from '#components/budget/util';
import { FinancialText } from '#components/FinancialText';
import { Page } from '#components/Page';
import { SyncRefresh } from '#components/SyncRefresh';
import { useCategories } from '#hooks/useCategories';
import { useFeatureFlag } from '#hooks/useFeatureFlag';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { useLocalPref } from '#hooks/useLocalPref';
import { useNavigate } from '#hooks/useNavigate';
import { useOverspentCategories } from '#hooks/useOverspentCategories';
import { SheetNameProvider } from '#hooks/useSheetName';
import { useSheetValue } from '#hooks/useSheetValue';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { useTransactions } from '#hooks/useTransactions';
import { useUndo } from '#hooks/useUndo';
import { collapseModals, pushModal } from '#modals/modalsSlice';
import { uncategorizedTransactions } from '#queries';
import { useDispatch } from '#redux';
import { envelopeBudget } from '#spreadsheet/bindings';

import { BudgetTable } from './BudgetTable';
import { BudgetMobileAlert } from './v2/BudgetMobileAlert';
import { BudgetMobileAmount } from './v2/BudgetMobileAmount';
import {
  BUDGET_MOBILE_ROOT_CLASS,
  budgetLayout,
  BudgetMobileStyle,
  chromeCanvas,
} from './v2/BudgetMobileStyle';
import { BudgetMobileTopBar } from './v2/BudgetMobileTopBar';

function isBudgetType(input?: string): input is 'envelope' | 'tracking' {
  return ['envelope', 'tracking'].includes(input);
}

export function BudgetPage() {
  const locale = useLocale();
  const {
    data: { list: categories, grouped: categoryGroups } = {
      list: [],
      grouped: [],
    },
  } = useCategories();
  const [budgetTypePref] = useSyncedPref('budgetType');
  const budgetType = isBudgetType(budgetTypePref) ? budgetTypePref : 'envelope';
  const goalTemplatesEnabled = useFeatureFlag('goalTemplatesEnabled');
  const goalTemplatesUIEnabled = useFeatureFlag('goalTemplatesUIEnabled');
  const spreadsheet = useSpreadsheet();

  const currMonth = monthUtils.currentMonth();
  const [startMonth = currMonth, setStartMonthPref] =
    useLocalPref('budget.startMonth');
  const [monthBounds, setMonthBounds] = useState({
    start: startMonth,
    end: startMonth,
  });
  // const [editMode, setEditMode] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const dispatch = useDispatch();
  const applyBudgetAction = useBudgetActions();
  const createCategory = useCreateCategoryMutation();
  const saveCategory = useSaveCategoryMutation();
  const deleteCategory = useDeleteCategoryMutation();
  const createCategoryGroup = useCreateCategoryGroupMutation();
  const saveCategoryGroup = useSaveCategoryGroupMutation();
  const deleteCategoryGroup = useDeleteCategoryGroupMutation();
  const sortCategories = useSortCategoriesMutation();

  useEffect(() => {
    async function init() {
      const { start, end } = await send('get-budget-bounds');
      setMonthBounds({ start, end });

      await prewarmMonth(budgetType, spreadsheet, startMonth);

      setInitialized(true);
    }

    void init();
  }, [budgetType, startMonth, dispatch, spreadsheet]);

  const onBudgetAction = useCallback(
    async (month, type, args) => {
      applyBudgetAction.mutate({ month, type, args });
    },
    [applyBudgetAction],
  );

  const onShowBudgetSummary = useCallback(() => {
    if (budgetType === 'tracking') {
      dispatch(
        pushModal({
          modal: {
            name: 'tracking-budget-summary',
            options: {
              month: startMonth,
            },
          },
        }),
      );
    } else {
      dispatch(
        pushModal({
          modal: {
            name: 'envelope-budget-summary',
            options: {
              month: startMonth,
              onBudgetAction,
            },
          },
        }),
      );
    }
  }, [budgetType, dispatch, onBudgetAction, startMonth]);

  const onOpenNewCategoryGroupModal = useCallback(() => {
    dispatch(
      pushModal({
        modal: {
          name: 'new-category-group',
          options: {
            onValidate: name => (!name ? 'Name is required.' : null),
            onSubmit: async name => {
              createCategoryGroup.mutate(
                { name },
                {
                  onSettled: () => {
                    dispatch(
                      collapseModals({ rootModalName: 'budget-page-menu' }),
                    );
                  },
                },
              );
            },
          },
        },
      }),
    );
  }, [dispatch, createCategoryGroup]);

  const onOpenNewCategoryModal = useCallback(
    (groupId, isIncome) => {
      dispatch(
        pushModal({
          modal: {
            name: 'new-category',
            options: {
              onValidate: name => (!name ? 'Name is required.' : null),
              onSubmit: async name => {
                createCategory.mutate(
                  {
                    name,
                    groupId,
                    isIncome,
                    isHidden: false,
                  },
                  {
                    onSettled: () => {
                      dispatch(
                        collapseModals({
                          rootModalName: 'category-group-menu',
                        }),
                      );
                    },
                  },
                );
              },
            },
          },
        }),
      );
    },
    [dispatch, createCategory],
  );

  const onSaveGroup = useCallback(
    group => {
      saveCategoryGroup.mutate({ group });
    },
    [saveCategoryGroup],
  );

  const onApplyBudgetTemplatesInGroup = useCallback(
    async categories => {
      applyBudgetAction.mutate({
        month: startMonth,
        type: 'apply-multiple-templates',
        args: {
          categories,
        },
      });
    },
    [applyBudgetAction, startMonth],
  );

  const onDeleteGroup = useCallback(
    groupId => {
      dispatch(collapseModals({ rootModalName: 'category-group-menu' }));
      deleteCategoryGroup.mutate({ id: groupId });
    },
    [deleteCategoryGroup, dispatch],
  );

  const onToggleGroupVisibility = useCallback(
    groupId => {
      const group = categoryGroups.find(g => g.id === groupId);
      onSaveGroup({
        ...group,
        hidden: group.hidden ? false : true,
      });
      dispatch(collapseModals({ rootModalName: 'category-group-menu' }));
    },
    [categoryGroups, dispatch, onSaveGroup],
  );

  const onSaveCategory = useCallback(
    category => {
      saveCategory.mutate({ category });
    },
    [saveCategory],
  );

  const onDeleteCategory = useCallback(
    categoryId => {
      dispatch(collapseModals({ rootModalName: 'category-menu' }));
      deleteCategory.mutate({ id: categoryId });
    },
    [deleteCategory, dispatch],
  );

  const onToggleCategoryVisibility = useCallback(
    categoryId => {
      const category = categories.find(c => c.id === categoryId);
      onSaveCategory({
        ...category,
        hidden: category.hidden ? false : true,
      });
      dispatch(collapseModals({ rootModalName: 'category-menu' }));
    },
    [categories, dispatch, onSaveCategory],
  );

  const onPrevMonth = useCallback(async () => {
    const month = monthUtils.subMonths(startMonth, 1);
    await prewarmMonth(budgetType, spreadsheet, month);
    setStartMonthPref(month);
    setInitialized(true);
  }, [budgetType, setStartMonthPref, spreadsheet, startMonth]);

  const onNextMonth = useCallback(async () => {
    const month = monthUtils.addMonths(startMonth, 1);
    await prewarmMonth(budgetType, spreadsheet, month);
    setStartMonthPref(month);
    setInitialized(true);
  }, [budgetType, setStartMonthPref, spreadsheet, startMonth]);

  const onCurrentMonth = useCallback(async () => {
    await prewarmMonth(budgetType, spreadsheet, currMonth);
    setStartMonthPref(currMonth);
    setInitialized(true);
  }, [budgetType, setStartMonthPref, spreadsheet, currMonth]);

  // const onOpenMonthActionMenu = () => {
  //   const options = [
  //     'Copy last month's budget',
  //     'Set budgets to zero',
  //     'Set budgets to 3 month average',
  //     budgetType === 'tracking' && 'Apply to all future budgets',
  //   ].filter(Boolean);

  //   props.showActionSheetWithOptions(
  //     {
  //       options,
  //       cancelButtonIndex: options.length - 1,
  //       title: 'Actions',
  //     },
  //     idx => {
  //       switch (idx) {
  //         case 0:
  //           setEditMode(true);
  //           break;
  //         case 1:
  //           onBudgetAction('copy-last');
  //           break;
  //         case 2:
  //           onBudgetAction('set-zero');
  //           break;
  //         case 3:
  //           onBudgetAction('set-3-avg');
  //           break;
  //         case 4:
  //           if (budgetType === 'tracking') {
  //             onBudgetAction('set-all-future');
  //           }
  //           break;
  //         default:
  //       }
  //     },
  //   );
  // };

  const onSaveNotes = useCallback(async (id, notes) => {
    await send('notes-save', { id, note: notes });
  }, []);

  const onOpenCategoryGroupNotesModal = useCallback(
    id => {
      const group = categoryGroups.find(g => g.id === id);
      dispatch(
        pushModal({
          modal: {
            name: 'notes',
            options: {
              id,
              name: group.name,
              onSave: onSaveNotes,
            },
          },
        }),
      );
    },
    [categoryGroups, dispatch, onSaveNotes],
  );

  const onOpenCategoryNotesModal = useCallback(
    id => {
      const category = categories.find(c => c.id === id);
      dispatch(
        pushModal({
          modal: {
            name: 'notes',
            options: {
              id,
              name: category.name,
              onSave: onSaveNotes,
            },
          },
        }),
      );
    },
    [categories, dispatch, onSaveNotes],
  );

  const onOpenCategoryGroupMenuModal = useCallback(
    id => {
      const group = categoryGroups.find(g => g.id === id);
      dispatch(
        pushModal({
          modal: {
            name: 'category-group-menu',
            options: {
              groupId: group.id,
              onSave: onSaveGroup,
              onAddCategory: onOpenNewCategoryModal,
              onEditNotes: onOpenCategoryGroupNotesModal,
              onDelete: onDeleteGroup,
              onToggleVisibility: onToggleGroupVisibility,
              onApplyBudgetTemplatesInGroup,
              onSortCategories: (groupId, direction) => {
                sortCategories.mutate({ groupId, direction });
              },
            },
          },
        }),
      );
    },
    [
      categoryGroups,
      dispatch,
      onDeleteGroup,
      onOpenCategoryGroupNotesModal,
      onOpenNewCategoryModal,
      onSaveGroup,
      onToggleGroupVisibility,
      onApplyBudgetTemplatesInGroup,
      sortCategories,
    ],
  );

  const onOpenCategoryMenuModal = useCallback(
    id => {
      const category = categories.find(c => c.id === id);
      const canEditAutomations =
        goalTemplatesEnabled &&
        goalTemplatesUIEnabled &&
        !(category.is_income && budgetType !== 'tracking');
      dispatch(
        pushModal({
          modal: {
            name: 'category-menu',
            options: {
              categoryId: category.id,
              onSave: onSaveCategory,
              onEditNotes: onOpenCategoryNotesModal,
              onDelete: onDeleteCategory,
              onToggleVisibility: onToggleCategoryVisibility,
              ...(canEditAutomations && {
                onEditAutomations: (categoryId: string) => {
                  dispatch(collapseModals({ rootModalName: 'category-menu' }));
                  dispatch(
                    pushModal({
                      modal: {
                        name: 'category-automations-edit',
                        options: { categoryId, month: startMonth },
                      },
                    }),
                  );
                },
              }),
            },
          },
        }),
      );
    },
    [
      budgetType,
      categories,
      dispatch,
      goalTemplatesEnabled,
      goalTemplatesUIEnabled,
      onDeleteCategory,
      onOpenCategoryNotesModal,
      onSaveCategory,
      onToggleCategoryVisibility,
      startMonth,
    ],
  );

  const [showHiddenCategories, setShowHiddenCategoriesPref] = useLocalPref(
    'budget.showHiddenCategories',
  );

  const onToggleHiddenCategories = useCallback(() => {
    setShowHiddenCategoriesPref(!showHiddenCategories);
    dispatch(collapseModals({ rootModalName: 'budget-page-menu' }));
  }, [dispatch, setShowHiddenCategoriesPref, showHiddenCategories]);

  const [showSpentColumn, setShowSpentColumnPref] = useLocalPref(
    'mobile.showSpentColumn',
  );

  // Which of a category's two plan figures its row prints. The upstream table
  // swapped them from a column header this composition does not have, so the
  // preference is kept and only its control moved — into the page menu, beside
  // the other preference that decides what the list shows.
  const onToggleSpentColumn = useCallback(() => {
    setShowSpentColumnPref(!showSpentColumn);
    dispatch(collapseModals({ rootModalName: 'budget-page-menu' }));
  }, [dispatch, setShowSpentColumnPref, showSpentColumn]);

  const onOpenBudgetMonthNotesModal = useCallback(
    month => {
      dispatch(
        pushModal({
          modal: {
            name: 'notes',
            options: {
              id: `budget-${month}`,
              name: monthUtils.format(month, "MMMM ''yy", locale),
              onSave: onSaveNotes,
            },
          },
        }),
      );
    },
    [dispatch, onSaveNotes, locale],
  );

  const onSwitchBudgetFile = useCallback(() => {
    void dispatch(closeBudget());
  }, [dispatch]);

  const onOpenBudgetMonthMenu = useCallback(
    month => {
      dispatch(
        pushModal({
          modal: {
            name: `${budgetType}-budget-month-menu`,
            options: {
              month,
              onBudgetAction,
              onEditNotes: onOpenBudgetMonthNotesModal,
            },
          },
        }),
      );
    },
    [budgetType, dispatch, onBudgetAction, onOpenBudgetMonthNotesModal],
  );

  const onOpenBudgetPageMenu = useCallback(() => {
    dispatch(
      pushModal({
        modal: {
          name: 'budget-page-menu',
          options: {
            onAddCategoryGroup: onOpenNewCategoryGroupModal,
            onToggleHiddenCategories,
            onToggleSpentColumn,
            onSwitchBudgetFile,
          },
        },
      }),
    );
  }, [
    dispatch,
    onOpenNewCategoryGroupModal,
    onSwitchBudgetFile,
    onToggleHiddenCategories,
    onToggleSpentColumn,
  ]);

  if (!categoryGroups || !initialized) {
    return (
      <View
        className={BUDGET_MOBILE_ROOT_CLASS}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: chromeCanvas,
        }}
      >
        <BudgetMobileStyle />
        <AnimatedLoading
          width={25}
          height={25}
          style={{ color: 'var(--dfl-violet)' }}
        />
      </View>
    );
  }

  return (
    <Page
      padding={0}
      style={{ backgroundColor: chromeCanvas }}
      header={
        <BudgetMobileTopBar
          month={startMonth}
          monthBounds={monthBounds}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onCurrentMonth={onCurrentMonth}
          onOpenMonthMenu={onOpenBudgetMonthMenu}
          onOpenPageMenu={onOpenBudgetPageMenu}
        />
      }
    >
      <View
        className={BUDGET_MOBILE_ROOT_CLASS}
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: 'var(--dfl-canvas)',
          color: 'var(--dfl-text)',
        }}
      >
        <BudgetMobileStyle />
        <SheetNameProvider name={monthUtils.sheetForMonth(startMonth)}>
          <SyncRefresh
            onSync={async () => {
              void dispatch(sync());
            }}
          >
            {({ onRefresh }) => (
              <BudgetTable
                categoryGroups={categoryGroups}
                month={startMonth}
                onShowBudgetSummary={onShowBudgetSummary}
                onBudgetAction={onBudgetAction}
                onRefresh={onRefresh}
                onEditCategoryGroup={onOpenCategoryGroupMenuModal}
                onEditCategory={onOpenCategoryMenuModal}
                banners={
                  <Banners month={startMonth} onBudgetAction={onBudgetAction} />
                }
              />
            )}
          </SyncRefresh>
        </SheetNameProvider>
      </View>
    </Page>
  );
}

/**
 * What the budget needs a decision about, above everything else on the page.
 *
 * The three banners the upstream page already carried, in the approved alert
 * language: a tinted surface and a matching hairline rather than a saturated
 * block. Their conditions and their actions are untouched — categorise the
 * transactions the budget cannot place, cover an overspend from another
 * envelope, cover what was budgeted past what exists.
 *
 * Each banner reserves its own bottom margin instead of the stack spacing them,
 * so a page with nothing to report starts at the hero rather than 14px below
 * where it should.
 */
function Banners({ month, onBudgetAction }) {
  const { t } = useTranslation();
  const [budgetType = 'envelope'] = useSyncedPref('budgetType');

  return (
    <GridList
      aria-label={t('Avisos')}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <UncategorizedTransactionsBanner />
      <OverspendingBanner
        month={month}
        onBudgetAction={onBudgetAction}
        budgetType={budgetType}
      />
      {budgetType === 'envelope' && (
        <OverbudgetedBanner month={month} onBudgetAction={onBudgetAction} />
      )}
    </GridList>
  );
}

/** The margin every banner reserves under itself. */
const BANNER_ROW_STYLE = { marginBottom: budgetLayout.stackGap };

function UncategorizedTransactionsBanner(props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const transactionsQuery = useMemo(
    () => uncategorizedTransactions().select('*'),
    [],
  );

  const { transactions, isPending: isTransactionsLoading } = useTransactions({
    query: transactionsQuery,
    options: {
      pageSize: 1000,
    },
  });

  if (isTransactionsLoading || transactions.length === 0) {
    return null;
  }

  const totalUncategorizedAmount = transactions.reduce(
    (sum, transaction) => sum + (transaction.amount ?? 0),
    0,
  );

  return (
    <GridListItem
      textValue="Uncategorized transactions banner"
      style={BANNER_ROW_STYLE}
      {...props}
    >
      <BudgetMobileAlert
        tone="watch"
        Icon={SvgExclamationOutline}
        title={
          <Trans count={transactions.length}>
            Você tem {{ count: transactions.length }} transações sem categoria
          </Trans>
        }
        detail={
          <FinancialText style={{ fontSize: 11.5, color: 'var(--dfmb-label)' }}>
            <Trans>
              Total: <BudgetMobileAmount value={totalUncategorizedAmount} />
            </Trans>
          </FinancialText>
        }
        action={{
          label: <Trans>Categorizar</Trans>,
          ariaLabel: t('Categorizar transações sem categoria'),
          onPress: () => navigate('/categories/uncategorized'),
        }}
      />
    </GridListItem>
  );
}

function OverbudgetedBanner({ month, onBudgetAction, ...props }) {
  const { t } = useTranslation();
  const format = useFormat();
  const toBudgetAmount = useSheetValue<
    'envelope-budget',
    typeof envelopeBudget.toBudget
  >(envelopeBudget.toBudget);
  const dispatch = useDispatch();
  const { showUndoNotification } = useUndo();
  const { data: { list: categories } = { list: [] } } = useCategories();
  const categoriesById = useMemo(() => groupById(categories), [categories]);

  const openCoverOverbudgetedModal = useCallback(() => {
    dispatch(
      pushModal({
        modal: {
          name: 'cover',
          options: {
            title: t('Cover overbudgeted'),
            month,
            amount: toBudgetAmount,
            showToBeBudgeted: false,
            onSubmit: (amount, categoryId) => {
              onBudgetAction(month, 'cover-overbudgeted', {
                category: categoryId,
                amount,
                currencyCode: format.currency.code,
              });
              showUndoNotification({
                message: t('Covered overbudgeted from {{categoryName}}', {
                  categoryName: categoriesById[categoryId].name,
                }),
              });
            },
          },
        },
      }),
    );
  }, [
    categoriesById,
    dispatch,
    month,
    onBudgetAction,
    showUndoNotification,
    t,
    toBudgetAmount,
    format.currency.code,
  ]);

  if (!toBudgetAmount || toBudgetAmount >= 0) {
    return null;
  }

  return (
    <GridListItem
      textValue="Overbudgeted banner"
      style={BANNER_ROW_STYLE}
      {...props}
    >
      <BudgetMobileAlert
        tone="critical"
        Icon={SvgArrowButtonDown1}
        title={<Trans>Você orçou mais do que tem disponível</Trans>}
        detail={
          <FinancialText style={{ fontSize: 11.5, color: 'var(--dfmb-label)' }}>
            <Trans>
              Excedente: <BudgetMobileAmount value={Math.abs(toBudgetAmount)} />
            </Trans>
          </FinancialText>
        }
        action={{
          label: <Trans>Cobrir</Trans>,
          ariaLabel: t('Cobrir o valor orçado a mais'),
          onPress: openCoverOverbudgetedModal,
        }}
      />
    </GridListItem>
  );
}

function OverspendingBanner({ month, onBudgetAction, budgetType, ...props }) {
  const { t } = useTranslation();

  const {
    data: { list: categories, grouped: categoryGroups } = {
      list: [],
      grouped: [],
    },
  } = useCategories();
  const categoriesById = useMemo(() => groupById(categories), [categories]);

  const dispatch = useDispatch();
  const format = useFormat();

  const {
    categories: overspentCategories,
    amountsByCategory,
    totalAmount: totalOverspending,
  } = useOverspentCategories({ month });

  const amountsByCategoryRef = useRef(amountsByCategory);
  amountsByCategoryRef.current = amountsByCategory;

  const categoryGroupsToShow = useMemo(
    () =>
      categoryGroups
        .filter(g => overspentCategories.some(c => c.group === g.id))
        .map(g => ({
          ...g,
          categories: overspentCategories.filter(c => c.group === g.id),
        })),
    [categoryGroups, overspentCategories],
  );

  const { showUndoNotification } = useUndo();

  const onOpenCoverCategoryModal = useCallback(
    categoryId => {
      const category = categoriesById[categoryId];
      dispatch(
        pushModal({
          modal: {
            name: 'cover',
            options: {
              title: category.name,
              month,
              amount: amountsByCategoryRef.current.get(category.id),
              categoryId: category.id,
              onSubmit: (amount, fromCategoryId) => {
                onBudgetAction(month, 'cover-overspending', {
                  to: category.id,
                  from: fromCategoryId,
                  amount,
                  currencyCode: format.currency.code,
                });
                showUndoNotification({
                  message: t(
                    `Covered {{toCategoryName}} overspending from {{fromCategoryName}}.`,
                    {
                      toCategoryName: category.name,
                      fromCategoryName:
                        fromCategoryId === 'to-budget'
                          ? t('To Budget')
                          : categoriesById[fromCategoryId].name,
                    },
                  ),
                });
              },
            },
          },
        }),
      );
    },
    [
      categoriesById,
      dispatch,
      month,
      onBudgetAction,
      showUndoNotification,
      t,
      format.currency.code,
    ],
  );

  const onOpenCategorySelectionModal = useCallback(() => {
    dispatch(
      pushModal({
        modal: {
          name: 'category-autocomplete',
          options: {
            title:
              budgetType === 'envelope'
                ? t('Cover overspending')
                : t('Overspent categories'),
            month,
            categoryGroups: categoryGroupsToShow,
            showHiddenCategories: true,
            onSelect:
              budgetType === 'envelope' ? onOpenCoverCategoryModal : null,
            clearOnSelect: true,
            closeOnSelect: false,
          },
        },
      }),
    );
  }, [
    categoryGroupsToShow,
    dispatch,
    month,
    onOpenCoverCategoryModal,
    t,
    budgetType,
  ]);

  const numberOfOverspentCategories = overspentCategories.length;
  if (numberOfOverspentCategories === 0) {
    return null;
  }

  return (
    <GridListItem
      textValue="Overspent banner"
      style={BANNER_ROW_STYLE}
      {...props}
    >
      <BudgetMobileAlert
        tone="critical"
        Icon={SvgExclamationOutline}
        title={
          <Trans count={numberOfOverspentCategories}>
            {{ count: numberOfOverspentCategories }} categorias passaram do
            orçado
          </Trans>
        }
        detail={
          <FinancialText style={{ fontSize: 11.5, color: 'var(--dfmb-label)' }}>
            <Trans>
              Total: <BudgetMobileAmount value={totalOverspending} />
            </Trans>
          </FinancialText>
        }
        action={{
          label:
            budgetType === 'envelope' ? (
              <Trans>Cobrir</Trans>
            ) : (
              <Trans>Ver</Trans>
            ),
          ariaLabel:
            budgetType === 'envelope'
              ? t('Cobrir categorias que passaram do orçado')
              : t('Ver categorias que passaram do orçado'),
          onPress: onOpenCategorySelectionModal,
        }}
      />
    </GridListItem>
  );
}
