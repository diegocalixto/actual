// @ts-strict-ignore
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ComponentType,
  CSSProperties,
  ReactElement,
  ReactNode,
  SVGProps,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import {
  SvgAdd,
  SvgBookmark,
  SvgLocation,
} from '@actual-app/components/icons/v1';
import { styles } from '@actual-app/components/styles';
import { TextOneLine } from '@actual-app/components/text-one-line';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { formatDistance } from '@actual-app/core/shared/location-utils';
import { getNormalisedString } from '@actual-app/core/shared/normalisation';
import type {
  AccountEntity,
  NearbyPayeeEntity,
  PayeeEntity,
} from '@actual-app/core/types/models';
import { css, cx } from '@emotion/css';
import { Fzf } from 'fzf';

import { useAccounts } from '#hooks/useAccounts';
import { useCommonPayees } from '#hooks/useCommonPayees';
import { useLocationPermission } from '#hooks/useLocationPermission';
import { useNearbyPayees } from '#hooks/useNearbyPayees';
import { usePayees } from '#hooks/usePayees';
import {
  getActivePayees,
  useCreatePayeeMutation,
  useDeletePayeeLocationMutation,
} from '#payees';

import { Autocomplete, AutocompleteFooter } from './Autocomplete';
import { ItemHeader } from './ItemHeader';
import { PayeeTransferTabs } from './PayeeTransferTabs';

type PayeeAutocompleteItem = PayeeEntity &
  PayeeItemType & {
    nearbyLocationId?: string;
    distance?: number;
    // Set by the filter on an account whose name is what was typed.
    isTypedName?: boolean;
    // Set by the filter on what the search ranks first for what was typed.
    isBestMatch?: boolean;
  };

const MAX_AUTO_SUGGESTIONS = 5;

// Stands in the list for "create a payee called what was typed".
const NEW_PAYEE = {
  id: 'new',
  favorite: false,
  name: '',
} as PayeeAutocompleteItem;

function getPayeeSuggestions(
  commonPayees: PayeeEntity[],
  payees: PayeeEntity[],
): PayeeAutocompleteItem[] {
  const favoritePayees: PayeeAutocompleteItem[] = payees
    .filter(p => p.favorite)
    .map(p => {
      return { ...p, itemType: determineItemType(p, true) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  let additionalCommonPayees: PayeeAutocompleteItem[] = [];
  if (commonPayees?.length > 0) {
    if (favoritePayees.length < MAX_AUTO_SUGGESTIONS) {
      additionalCommonPayees = commonPayees
        .filter(
          p => !(p.favorite || favoritePayees.map(fp => fp.id).includes(p.id)),
        )
        .slice(0, MAX_AUTO_SUGGESTIONS - favoritePayees.length)
        .map(p => {
          return { ...p, itemType: determineItemType(p, true) };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  if (favoritePayees.length + additionalCommonPayees.length) {
    const filteredPayees: PayeeAutocompleteItem[] = payees
      .filter(p => !favoritePayees.find(fp => fp.id === p.id))
      .filter(p => !additionalCommonPayees.find(fp => fp.id === p.id))
      .map<PayeeAutocompleteItem>(p => {
        return { ...p, itemType: determineItemType(p, false) };
      });

    return favoritePayees.concat(additionalCommonPayees).concat(filteredPayees);
  }

  return payees.map(p => {
    return { ...p, itemType: determineItemType(p, false) };
  });
}

// The list is drawn group by group — whoever is nearby, whoever is suggested,
// then the other payees, then the accounts a transfer can go to — whatever
// order the items arrive in; see `PayeeList`. The keyboard walks the list by an
// item's place on screen, and what it lands on is saved by the item's place in
// the array, so the two have to be one order. This is that order.
function inDrawnOrder(items: PayeeAutocompleteItem[]): PayeeAutocompleteItem[] {
  const isNew = (item: PayeeAutocompleteItem) => item.id === 'new';
  const ofType = (type: ItemTypes) =>
    items.filter(item => !isNew(item) && item.itemType === type);

  return [
    ...items.filter(isNew),
    ...ofType('nearby_payee'),
    ...ofType('common_payee'),
    ...ofType('payee'),
    ...ofType('account'),
  ];
}

function filterActivePayees<T extends PayeeEntity>(
  payees: T[],
  accounts: AccountEntity[],
): T[] {
  return accounts ? (getActivePayees(payees, accounts) as T[]) : payees;
}

function filterTransferPayees<T extends PayeeEntity>(payees: T[]): T[] {
  return payees.filter(payee => !!payee.transfer_acct);
}

// Orders what the search found when what was typed is, letter for letter, the
// name of an account. That is how a transfer is asked for — by the name of the
// account the money goes to or comes from — so the account goes first, and the
// offer to create a payee of that name last: picked by mistake, it records an
// expense or an income where a transfer was meant.
//
// The order is the one the list is drawn in, group by group, because the list
// is walked by its place on screen and saved by its place here. Returns
// nothing when no account has that name.
function putTypedAccountFirst(
  found: PayeeAutocompleteItem[],
  newItem: PayeeAutocompleteItem,
  typed: string,
): PayeeAutocompleteItem[] | undefined {
  const typedName = getNormalisedString(typed);
  const hasTypedName = (item: PayeeAutocompleteItem) =>
    getNormalisedString(item.name) === typedName;
  const isTypedAccount = (item: PayeeAutocompleteItem) =>
    item.itemType === 'account' && hasTypedName(item);

  if (!found.some(isTypedAccount)) {
    return undefined;
  }

  const rest = found.filter(item => !isTypedAccount(item));
  // A payee of that name there already is needs no making.
  const isPayeeOnFile = rest.some(
    item => item.itemType !== 'account' && hasTypedName(item),
  );

  return [
    ...found
      .filter(isTypedAccount)
      .map(item => ({ ...item, isTypedName: true })),
    ...rest.filter(item => item.itemType === 'account'),
    ...rest.filter(item => item.itemType === 'nearby_payee'),
    ...rest.filter(item => item.itemType === 'common_payee'),
    ...rest.filter(item => item.itemType === 'payee'),
    ...(isPayeeOnFile ? [] : [newItem]),
  ];
}

function makeNew(id, rawPayee) {
  if (id === 'new' && !rawPayee.startsWith('new:')) {
    return 'new:' + rawPayee;
  }
  return id;
}

// Convert the fully resolved new value into the 'new' id that can be
// looked up in the suggestions
function stripNew(value) {
  if (typeof value === 'string' && value.startsWith('new:')) {
    return 'new';
  }
  return value;
}

type PayeeListProps = {
  items: (PayeeAutocompleteItem & PayeeItemType)[];
  commonPayees: PayeeEntity[];
  getItemProps: (arg: {
    item: PayeeAutocompleteItem;
  }) => ComponentProps<typeof View>;
  highlightedIndex: number;
  embedded: boolean;
  inputValue: string;
  renderCreatePayeeButton?: (
    props: ComponentPropsWithoutRef<typeof CreatePayeeButton>,
  ) => ReactNode;
  renderPayeeItemGroupHeader?: (
    props: ComponentPropsWithoutRef<typeof ItemHeader>,
  ) => ReactNode;
  renderPayeeItem?: (
    props: ComponentPropsWithoutRef<typeof PayeeItem>,
  ) => ReactNode;
  footer: ReactNode;
  onForgetLocation?: (locationId: string) => void;
};

type ItemTypes = 'account' | 'payee' | 'common_payee' | 'nearby_payee';
type PayeeItemType = {
  itemType: ItemTypes;
};

function determineItemType(
  item: PayeeEntity,
  isCommon: boolean,
  isNearby: boolean = false,
): ItemTypes {
  if (item.transfer_acct) {
    return 'account';
  }
  if (isNearby) {
    return 'nearby_payee';
  }
  if (isCommon) {
    return 'common_payee';
  } else {
    return 'payee';
  }
}

function PayeeList({
  items,
  getItemProps,
  highlightedIndex,
  embedded,
  inputValue,
  renderCreatePayeeButton = defaultRenderCreatePayeeButton,
  renderPayeeItemGroupHeader = defaultRenderPayeeItemGroupHeader,
  renderPayeeItem = defaultRenderPayeeItem,
  footer,
  onForgetLocation,
}: PayeeListProps) {
  const { t } = useTranslation();

  // If the "new payee" item exists, create it as a special-cased item
  // with the value of the input so it always shows whatever the user
  // entered

  // The transfers lead, and the offer to create a payee of the same name
  // trails, when what was typed is the name of an account: the order the
  // filter gave the items in (see `putTypedAccountFirst`).
  const transfersFirst = items.some(item => item.isTypedName);

  const { newPayee, suggestedPayees, payees, transferPayees, nearbyPayees } =
    useMemo(() => {
      let currentIndex = 0;
      const result = items.reduce(
        (acc, item) => {
          if (item.id === 'new') {
            acc.newPayee = { ...item };
          } else if (item.itemType === 'common_payee') {
            acc.suggestedPayees.push({ ...item });
          } else if (item.itemType === 'payee') {
            acc.payees.push({ ...item });
          } else if (item.itemType === 'account') {
            acc.transferPayees.push({ ...item });
          } else if (item.itemType === 'nearby_payee') {
            acc.nearbyPayees.push({ ...item });
          }
          return acc;
        },
        {
          newPayee: null as PayeeAutocompleteItem | null,
          nearbyPayees: [] as Array<PayeeAutocompleteItem>,
          suggestedPayees: [] as Array<PayeeAutocompleteItem>,
          payees: [] as Array<PayeeAutocompleteItem>,
          transferPayees: [] as Array<PayeeAutocompleteItem>,
        },
      );

      // assign indexes in render order
      const leadingTransferPayees = transfersFirst
        ? result.transferPayees.map(item => ({
            ...item,
            highlightedIndex: currentIndex++,
          }))
        : null;

      const leadingNewPayee =
        result.newPayee && !transfersFirst
          ? { ...result.newPayee, highlightedIndex: currentIndex++ }
          : null;

      const nearbyPayeesWithIndex = result.nearbyPayees.map(item => ({
        ...item,
        highlightedIndex: currentIndex++,
      }));

      const suggestedPayeesWithIndex = result.suggestedPayees.map(item => ({
        ...item,
        highlightedIndex: currentIndex++,
      }));

      const payeesWithIndex = result.payees.map(item => ({
        ...item,
        highlightedIndex: currentIndex++,
      }));

      const transferPayeesWithIndex =
        leadingTransferPayees ??
        result.transferPayees.map(item => ({
          ...item,
          highlightedIndex: currentIndex++,
        }));

      const newPayeeWithIndex =
        leadingNewPayee ??
        (result.newPayee
          ? { ...result.newPayee, highlightedIndex: currentIndex++ }
          : null);

      return {
        newPayee: newPayeeWithIndex,
        nearbyPayees: nearbyPayeesWithIndex,
        suggestedPayees: suggestedPayeesWithIndex,
        payees: payeesWithIndex,
        transferPayees: transferPayeesWithIndex,
      };
    }, [items, transfersFirst]);

  // Both are called where they are drawn, not ahead of it: the items take
  // their place in the list from the order `getItemProps` is called in.
  const renderCreatePayee = () =>
    newPayee &&
    renderCreatePayeeButton({
      ...(getItemProps ? getItemProps({ item: newPayee }) : {}),
      payeeName: inputValue,
      highlighted: newPayee.highlightedIndex === highlightedIndex,
      embedded,
    });

  const renderTransferPayees = () => (
    <>
      {transferPayees.length > 0 &&
        renderPayeeItemGroupHeader({ title: t('Transfer To/From') })}
      {transferPayees.map(item => (
        <Fragment key={item.id}>
          {renderPayeeItem({
            ...(getItemProps ? getItemProps({ item }) : {}),
            item,
            highlighted: highlightedIndex === item.highlightedIndex,
            embedded,
          })}
        </Fragment>
      ))}
    </>
  );

  // We limit the number of payees shown to 100.
  // So we show a hint that more are available via search.
  const showSearchForMore = items.length >= 100;

  return (
    <View>
      <View
        style={{
          overflow: 'auto',
          padding: '5px 0',
          ...(!embedded && { maxHeight: 175 }),
        }}
      >
        {transfersFirst ? renderTransferPayees() : renderCreatePayee()}

        {nearbyPayees.length > 0 &&
          renderPayeeItemGroupHeader({ title: t('Nearby Payees') })}
        {nearbyPayees.map(item => (
          <Fragment key={item.id}>
            <NearbyPayeeItem
              {...(getItemProps ? getItemProps({ item }) : {})}
              item={item}
              highlighted={highlightedIndex === item.highlightedIndex}
              embedded={embedded}
              onForgetLocation={onForgetLocation}
            />
          </Fragment>
        ))}

        {suggestedPayees.length > 0 &&
          renderPayeeItemGroupHeader({ title: t('Suggested Payees') })}
        {suggestedPayees.map(item => (
          <Fragment key={item.id}>
            {renderPayeeItem({
              ...(getItemProps ? getItemProps({ item }) : {}),
              item,
              highlighted: highlightedIndex === item.highlightedIndex,
              embedded,
            })}
          </Fragment>
        ))}

        {payees.length > 0 &&
          renderPayeeItemGroupHeader({ title: t('Payees') })}
        {payees.map(item => (
          <Fragment key={item.id}>
            {renderPayeeItem({
              ...(getItemProps ? getItemProps({ item }) : {}),
              item,
              highlighted: highlightedIndex === item.highlightedIndex,
              embedded,
            })}
          </Fragment>
        ))}

        {transfersFirst ? renderCreatePayee() : renderTransferPayees()}

        {showSearchForMore && (
          <div
            style={{
              fontSize: 11,
              padding: 5,
              color: theme.pageTextLight,
              textAlign: 'center',
            }}
          >
            <Trans>More payees are available, search to find them</Trans>
          </div>
        )}
      </View>
      {footer}
    </View>
  );
}

export type PayeeAutocompleteProps = ComponentProps<
  typeof Autocomplete<PayeeAutocompleteItem>
> & {
  showInactivePayees?: boolean;
  showMakeTransfer?: boolean;
  showManagePayees?: boolean;
  embedded?: boolean;
  onManagePayees?: () => void;
  renderCreatePayeeButton?: (
    props: ComponentPropsWithoutRef<typeof CreatePayeeButton>,
  ) => ReactElement<typeof CreatePayeeButton>;
  renderPayeeItemGroupHeader?: (
    props: ComponentPropsWithoutRef<typeof ItemHeader>,
  ) => ReactElement<typeof ItemHeader>;
  renderPayeeItem?: (
    props: ComponentPropsWithoutRef<typeof PayeeItem>,
  ) => ReactElement<typeof PayeeItem>;
  accounts?: AccountEntity[];
  payees?: PayeeEntity[];
  nearbyPayees?: NearbyPayeeEntity[];
};

export function PayeeAutocomplete({
  value,
  inputProps,
  showInactivePayees = false,
  showMakeTransfer = true,
  showManagePayees = false,
  clearOnBlur = true,
  closeOnBlur,
  embedded,
  onUpdate,
  onSelect,
  onManagePayees,
  renderCreatePayeeButton = defaultRenderCreatePayeeButton,
  renderPayeeItemGroupHeader = defaultRenderPayeeItemGroupHeader,
  renderPayeeItem = defaultRenderPayeeItem,
  accounts,
  payees,
  nearbyPayees,
  ...props
}: PayeeAutocompleteProps) {
  const { t } = useTranslation();
  const { data: commonPayees } = useCommonPayees();
  const { data: retrievedPayees = [] } = usePayees();
  const { isGranted } = useLocationPermission();
  const { data: retrievedNearbyPayees = [] } = useNearbyPayees({
    enabled: isGranted,
  });
  if (!payees) {
    payees = retrievedPayees;
  }
  const createPayeeMutation = useCreatePayeeMutation();
  const deletePayeeLocationMutation = useDeletePayeeLocationMutation();

  if (!nearbyPayees) {
    nearbyPayees = retrievedNearbyPayees;
  }

  const { data: cachedAccounts = [] } = useAccounts();
  if (!accounts) {
    accounts = cachedAccounts;
  }

  const [focusTransferPayees, setFocusTransferPayees] = useState(false);
  // The phone's picker is a sheet with the whole list in it, and a footer
  // there sits under every payee there is. The choice between a payee and a
  // transfer goes above the search field instead, in sight before anything is
  // typed.
  const { isNarrowWidth } = useResponsive();
  const showTransferTabs = showMakeTransfer && embedded && isNarrowWidth;
  const [rawPayee, setRawPayee] = useState('');
  const hasPayeeInput = !!rawPayee;
  // Whoever is near, as an item of the list. One of them may be on the list
  // twice: here, and again where their name would be anyway.
  const nearbyPayeesWithType: PayeeAutocompleteItem[] = useMemo(() => {
    if (!nearbyPayees?.length) {
      return [];
    }

    const processed: PayeeAutocompleteItem[] = nearbyPayees.map(result => ({
      ...result.payee,
      itemType: 'nearby_payee' as const,
      nearbyLocationId: result.location.id,
      distance: result.location.distance,
    }));
    return processed;
  }, [nearbyPayees]);

  const payeeSuggestions: PayeeAutocompleteItem[] = useMemo(() => {
    const suggestions = getPayeeSuggestions(commonPayees, payees);

    let filteredSuggestions: PayeeAutocompleteItem[] = [...suggestions];

    if (!showInactivePayees) {
      filteredSuggestions = filterActivePayees(filteredSuggestions, accounts);
    }

    if (focusTransferPayees) {
      filteredSuggestions = filterTransferPayees(filteredSuggestions);
    } else {
      // Among the suggestions, not beside them: drawn from a list of its own,
      // the nearby group took places on screen that the array did not have,
      // and the keyboard saved a row other than the one it stood on.
      filteredSuggestions = [...nearbyPayeesWithType, ...filteredSuggestions];
    }

    // Until something is typed the list is drawn from these as they are.
    filteredSuggestions = inDrawnOrder(filteredSuggestions);

    if (!hasPayeeInput) {
      return filteredSuggestions;
    }

    return [NEW_PAYEE, ...filteredSuggestions];
  }, [
    commonPayees,
    payees,
    nearbyPayeesWithType,
    focusTransferPayees,
    accounts,
    hasPayeeInput,
    showInactivePayees,
  ]);

  const handleForgetLocation = useCallback(
    async (locationId: string) => {
      try {
        await deletePayeeLocationMutation.mutateAsync(locationId);
      } catch (error) {
        console.error('Failed to delete payee location', { error });
      }
    },
    [deletePayeeLocationMutation],
  );

  async function handleSelect(idOrIds, rawInputValue) {
    if (!clearOnBlur) {
      onSelect?.(makeNew(idOrIds, rawInputValue), rawInputValue);
    } else {
      const create = payeeName =>
        createPayeeMutation.mutateAsync({ name: payeeName });

      if (Array.isArray(idOrIds)) {
        idOrIds = await Promise.all(
          idOrIds.map(v => (v === 'new' ? create(rawInputValue) : v)),
        );
      } else {
        if (idOrIds === 'new') {
          idOrIds = await create(rawInputValue);
        }
      }
      onSelect?.(idOrIds, rawInputValue);
    }
  }

  const [payeeFieldFocused, setPayeeFieldFocused] = useState(false);

  const filterSuggestions = (
    suggestions: PayeeAutocompleteItem[],
    value: string,
  ) => {
    // The offer to create a payee does not wait for the suggestions to carry
    // it. They gain it a render after the first letter is typed, and what that
    // letter highlights is worked out before then: counted on a list one item
    // short, the highlight was drawn one row above what would be saved.
    const newItem = suggestions.find(s => s.id === 'new') ?? NEW_PAYEE;
    const realSuggestions = suggestions.filter(s => s.id !== 'new');

    // Whoever is nearby is listed over and above the hundred the rest is cut
    // to, as they were when their group was drawn from a list of its own. One
    // of them is on the list twice on purpose — near, and again where their
    // name would be anyway — so a count shared with the rest would cost the
    // list a payee for each of them.
    const isNearby = (item: PayeeAutocompleteItem) =>
      item.itemType === 'nearby_payee';
    const nearby = realSuggestions.filter(isNearby);
    const others = realSuggestions.filter(item => !isNearby(item));
    const search = (items: PayeeAutocompleteItem[]) =>
      new Fzf(items, {
        selector: item => item.name ?? '',
        limit: 100,
        casing: 'case-insensitive',
      })
        .find(value)
        .map(result => result.item);

    const filtered = value
      ? [...search(nearby), ...search(others)]
      : [...nearby, ...others.slice(0, 100)];

    // Offer to create a payee once the user has typed something
    const showNew = !!value && !focusTransferPayees;

    if (showNew) {
      const typedAccountFirst = putTypedAccountFirst(filtered, newItem, value);
      if (typedAccountFirst) {
        return typedAccountFirst;
      }
    }

    // Somebody of exactly that name is on file: they are who was meant,
    // whoever else the search ranks beside them — it ranks "Uber" and "Uber
    // Eats" alike for "uber" — and there is nobody to create.
    const typedName = getNormalisedString(value);
    const exactMatch = value
      ? filtered.find(
          item =>
            !item.transfer_acct && getNormalisedString(item.name) === typedName,
        )
      : undefined;

    // The best match is what the keyboard picks, whichever group it is drawn
    // in: it is marked here, while the ranking is still at hand, and found
    // again by `getHighlightedIndex`.
    const bestMatch = exactMatch ?? filtered[0];
    const drawn = inDrawnOrder(
      value && bestMatch
        ? filtered.map(item =>
            item === bestMatch ? { ...item, isBestMatch: true } : item,
          )
        : filtered,
    );

    return showNew && !exactMatch ? [newItem, ...drawn] : drawn;
  };

  const autocomplete = (
    <Autocomplete
      key={focusTransferPayees ? 'transfers' : 'all'}
      strict
      embedded={embedded}
      value={stripNew(value)}
      suggestions={payeeSuggestions}
      clearOnBlur={clearOnBlur}
      closeOnBlur={closeOnBlur}
      itemToString={item => {
        if (!item) {
          return '';
        } else if (item.id === 'new') {
          return rawPayee;
        }
        return item.name;
      }}
      focused={payeeFieldFocused}
      inputProps={{
        ...inputProps,
        autoCapitalize: 'words',
        onBlur: () => {
          setRawPayee('');
          setPayeeFieldFocused(false);
        },
        'aria-label': t('Payee'),
        onFocus: () => setPayeeFieldFocused(true),
        onChangeValue: setRawPayee,
      }}
      onUpdate={(id, inputValue) => onUpdate?.(id, makeNew(id, inputValue))}
      onSelect={handleSelect}
      getHighlightedIndex={suggestions => {
        if (suggestions.length === 0) {
          return null;
        }

        // An account asked for by its name is the transfer that was meant,
        // whoever else is near or ranks beside it; see `putTypedAccountFirst`.
        const typedAccount = suggestions.findIndex(item => item.isTypedName);
        if (typedAccount !== -1) {
          return typedAccount;
        }

        // If we have nearby payees, highlight the first nearby payee
        const firstNearby = suggestions.findIndex(
          item => item.itemType === 'nearby_payee',
        );
        if (firstNearby !== -1) {
          return firstNearby;
        }

        // The best match of what was typed, wherever its group puts it.
        const bestMatch = suggestions.findIndex(item => item.isBestMatch);
        if (bestMatch !== -1) {
          return bestMatch;
        } else if (suggestions[0].id === 'new') {
          // Highlight the first payee since the create payee option is at index 0.
          return suggestions.length > 1 ? 1 : 0;
        }
        return 0;
      }}
      filterSuggestions={filterSuggestions}
      renderItems={(items, getItemProps, highlightedIndex, inputValue) => (
        <PayeeList
          items={items}
          commonPayees={commonPayees}
          getItemProps={getItemProps}
          highlightedIndex={highlightedIndex}
          inputValue={inputValue}
          embedded={embedded}
          renderCreatePayeeButton={renderCreatePayeeButton}
          renderPayeeItemGroupHeader={renderPayeeItemGroupHeader}
          renderPayeeItem={renderPayeeItem}
          footer={
            <AutocompleteFooter embedded={embedded}>
              {showMakeTransfer && !showTransferTabs && (
                <Button
                  variant={focusTransferPayees ? 'menuSelected' : 'menu'}
                  style={showManagePayees && { marginBottom: 5 }}
                  onPress={() => {
                    onUpdate?.(null, null);
                    setFocusTransferPayees(!focusTransferPayees);
                  }}
                >
                  <Trans>Make transfer</Trans>
                </Button>
              )}
              {showManagePayees && (
                <Button variant="menu" onPress={() => onManagePayees()}>
                  <Trans>Manage payees</Trans>
                </Button>
              )}
            </AutocompleteFooter>
          }
          onForgetLocation={handleForgetLocation}
        />
      )}
      {...props}
    />
  );

  if (!showTransferTabs) {
    return autocomplete;
  }

  return (
    <>
      <PayeeTransferTabs
        isTransfer={focusTransferPayees}
        onChange={isTransfer => {
          onUpdate?.(null, null);
          setFocusTransferPayees(isTransfer);
        }}
      />
      {autocomplete}
    </>
  );
}

type CreatePayeeButtonProps = {
  Icon?: ComponentType<SVGProps<SVGElement>>;
  payeeName: string;
  highlighted?: boolean;
  embedded?: boolean;
  style?: CSSProperties;
};

export function CreatePayeeButton({
  Icon,
  payeeName,
  highlighted,
  embedded,
  style,
  ...props
}: CreatePayeeButtonProps) {
  const { isNarrowWidth } = useResponsive();
  const narrowStyle = isNarrowWidth
    ? {
        ...styles.mobileMenuItem,
      }
    : {};
  const iconSize = isNarrowWidth ? 14 : 8;

  return (
    <View
      data-testid="create-payee-button"
      style={{
        display: 'block',
        flex: '1 0',
        color: highlighted
          ? theme.menuAutoCompleteTextHover
          : theme.noticeTextMenu,
        borderRadius: embedded ? 4 : 0,
        fontSize: 11,
        fontWeight: 500,
        padding: '6px 9px',
        backgroundColor: highlighted
          ? theme.menuAutoCompleteBackgroundHover
          : 'transparent',
        ':active': {
          backgroundColor: 'rgba(100, 100, 100, .25)',
        },
        ...narrowStyle,
        ...style,
      }}
      {...props}
    >
      {Icon ? (
        <Icon style={{ marginRight: 5, display: 'inline-block' }} />
      ) : (
        <SvgAdd
          width={iconSize}
          height={iconSize}
          style={{ marginRight: 5, display: 'inline-block' }}
        />
      )}
      <Trans>Create payee "{{ payeeName }}"</Trans>
    </View>
  );
}

function defaultRenderCreatePayeeButton(
  props: ComponentPropsWithoutRef<typeof CreatePayeeButton>,
): ReactElement<typeof CreatePayeeButton> {
  return <CreatePayeeButton {...props} />;
}

function defaultRenderPayeeItemGroupHeader(
  props: ComponentPropsWithoutRef<typeof ItemHeader>,
): ReactElement<typeof ItemHeader> {
  return <ItemHeader {...props} type="payee" />;
}

type PayeeItemProps = {
  item: PayeeAutocompleteItem;
  className?: string;
  style?: CSSProperties;
  highlighted?: boolean;
  embedded?: boolean;
};

function PayeeItem({
  item,
  className,
  highlighted,
  embedded,
  ...props
}: PayeeItemProps) {
  const { isNarrowWidth } = useResponsive();
  const narrowStyle = isNarrowWidth
    ? {
        ...styles.mobileMenuItem,
        borderRadius: 0,
        borderTop: `1px solid ${theme.pillBorder}`,
      }
    : {};
  const iconSize = isNarrowWidth ? 14 : 8;
  let paddingLeftOverFromIcon = 20;
  let itemIcon = undefined;
  if (item.favorite) {
    itemIcon = (
      <SvgBookmark
        width={iconSize}
        height={iconSize}
        style={{ marginRight: 5, display: 'inline-block' }}
      />
    );
    paddingLeftOverFromIcon -= iconSize + 5;
  }
  return (
    <button
      type="button"
      // Downshift calls `setTimeout(..., 250)` in the `onMouseMove`
      // event handler they set on this element. When this code runs
      // in WebKit on touch-enabled devices, taps on this element end
      // up not triggering the `onClick` event (and therefore delaying
      // response to user input) until after the `setTimeout` callback
      // finishes executing. This is caused by content observation code
      // that implements various strategies to prevent the user from
      // accidentally clicking content that changed as a result of code
      // run in the `onMouseMove` event.
      //
      // Long story short, we don't want any delay here between the user
      // tapping and the resulting action being performed. It turns out
      // there's some "fast path" logic that can be triggered in various
      // ways to force WebKit to bail on the content observation process.
      // One of those ways is setting `role="button"` (or a number of
      // other aria roles) on the element. Now we use a semantic button
      // element instead which provides the same fast path behavior.
      //
      // ref:
      // * https://github.com/WebKit/WebKit/blob/447d90b0c52b2951a69df78f06bb5e6b10262f4b/LayoutTests/fast/events/touch/ios/content-observation/400ms-hover-intent.html
      // * https://github.com/WebKit/WebKit/blob/58956cf59ba01267644b5e8fe766efa7aa6f0c5c/Source/WebCore/page/ios/ContentChangeObserver.cpp
      // * https://github.com/WebKit/WebKit/blob/58956cf59ba01267644b5e8fe766efa7aa6f0c5c/Source/WebKit/WebProcess/WebPage/ios/WebPageIOS.mm#L783
      className={cx(
        className,
        css({
          backgroundColor: highlighted
            ? theme.menuAutoCompleteBackgroundHover
            : 'transparent',
          color: highlighted
            ? theme.menuAutoCompleteItemTextHover
            : theme.menuAutoCompleteItemText,
          borderRadius: embedded ? 4 : 0,
          padding: 4,
          paddingLeft: paddingLeftOverFromIcon,
          border: 'none',
          font: 'inherit',
          textAlign: 'left',
          ...narrowStyle,
        }),
      )}
      data-testid={`${item.name}-payee-item`}
      data-highlighted={highlighted || undefined}
      {...props}
    >
      <TextOneLine>
        {itemIcon}
        {item.name}
      </TextOneLine>
    </button>
  );
}

function defaultRenderPayeeItem(
  props: ComponentPropsWithoutRef<typeof PayeeItem>,
): ReactElement<typeof PayeeItem> {
  return <PayeeItem {...props} />;
}

type NearbyPayeeItemProps = PayeeItemProps & {
  onForgetLocation?: (locationId: string) => void;
};

function NearbyPayeeItem({
  item,
  className,
  highlighted,
  embedded,
  onForgetLocation,
  ...props
}: NearbyPayeeItemProps) {
  const { isNarrowWidth } = useResponsive();
  const narrowStyle = isNarrowWidth
    ? {
        ...styles.mobileMenuItem,
        borderRadius: 0,
        borderTop: `1px solid ${theme.pillBorder}`,
      }
    : {};
  const iconSize = isNarrowWidth ? 14 : 8;
  let paddingLeftOverFromIcon = 20;
  let itemIcon = undefined;
  if (item.favorite) {
    itemIcon = (
      <SvgBookmark
        width={iconSize}
        height={iconSize}
        style={{ marginRight: 5, display: 'inline-block' }}
      />
    );
    paddingLeftOverFromIcon -= iconSize + 5;
  }

  // Extract location ID and distance from the nearby payee item
  const locationId = item.nearbyLocationId;
  const distance = item.distance;
  const distanceText = distance !== undefined ? formatDistance(distance) : '';

  const handleForgetClick = () => {
    if (locationId && onForgetLocation) {
      onForgetLocation(locationId);
    }
  };

  return (
    <div
      className={cx(
        className,
        css({
          backgroundColor: highlighted
            ? theme.menuAutoCompleteBackgroundHover
            : 'transparent',
          color: highlighted
            ? theme.menuAutoCompleteItemTextHover
            : theme.menuAutoCompleteItemText,
          borderRadius: embedded ? 4 : 0,
          padding: 4,
          paddingLeft: paddingLeftOverFromIcon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          ...narrowStyle,
        }),
      )}
      data-testid={`${item.name}-payee-item`}
      data-highlighted={highlighted || undefined}
    >
      <button
        type="button"
        className={css({
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          background: 'none',
          border: 'none',
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          padding: 0,
          cursor: 'pointer',
        })}
        {...props}
      >
        <TextOneLine>
          {itemIcon}
          {item.name}
        </TextOneLine>
        {distanceText && (
          <div
            style={{
              fontSize: '10px',
              color: highlighted
                ? theme.menuAutoCompleteItemTextHover
                : theme.pageTextSubdued,
              marginLeft: itemIcon ? iconSize + 5 : 0,
            }}
          >
            {distanceText}
          </div>
        )}
      </button>
      {locationId && (
        <Button
          variant="menu"
          onPress={handleForgetClick}
          style={{
            backgroundColor: theme.errorBackground,
            border: `1px solid ${theme.errorBorder}`,
            color: theme.pageText,
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          <Trans i18nKey="forget">Forget</Trans>
          <SvgLocation width={10} height={10} style={{ marginLeft: 4 }} />
        </Button>
      )}
    </div>
  );
}
