import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { MobileBackButton } from '#components/mobile/MobileBackButton';
import { MobilePageHeader, Page } from '#components/Page';
import { SchedulesProvider } from '#hooks/useCachedSchedules';
import { getSchedulesQuery } from '#hooks/useSchedules';
import { tagQueries } from '#tags';

import { getTagTransactionsFilter } from './tagRules';
import { TagTransactionList } from './TagTransactionList';
import { useGoBack } from './useGoBack';

const MESSAGE_STYLE = {
  paddingTop: 40,
  alignItems: 'center',
} satisfies CSSProperties;

/**
 * The transactions that carry a tag, on a phone (`/tags/:id/transactions`).
 * The desktop opens the register with a "has tags" filter; the phone
 * register has no filters, so this page asks the server for the same filter
 * the desktop register applies and lists the matching transactions with the
 * phone's own list. Like an account's page, it has no tab bar: the back
 * button returns to the tag.
 */
export function MobileTagTransactionsPage() {
  const { t } = useTranslation();
  const { id: tagId = '' } = useParams();
  const goBack = useGoBack(`/tags?tag=${encodeURIComponent(tagId)}`);

  // Hidden tags included: the tag's own screen opens hidden tags too.
  const { data: allTags = [], isPlaceholderData } = useQuery(tagQueries.list());
  const tag = allTags.find(candidate => candidate.id === tagId);
  const { data: filters } = useQuery(tagTransactionsFilterQuery(tag?.tag));
  const schedulesQuery = getSchedulesQuery();

  let content;
  if (!tag) {
    content = (
      <View style={MESSAGE_STYLE}>
        <Text style={{ color: theme.pageTextSubdued, fontSize: 15 }}>
          {isPlaceholderData ? (
            <Trans>Loading…</Trans>
          ) : (
            <Trans>This tag no longer exists.</Trans>
          )}
        </Text>
      </View>
    );
  } else if (!filters) {
    content = (
      <View style={MESSAGE_STYLE}>
        <Text style={{ color: theme.pageTextSubdued, fontSize: 15 }}>
          <Trans>Loading transactions...</Trans>
        </Text>
      </View>
    );
  } else {
    content = (
      <SchedulesProvider query={schedulesQuery}>
        <TagTransactionList key={tag.tag} tag={tag} filters={filters} />
      </SchedulesProvider>
    );
  }

  return (
    <Page
      header={
        <MobilePageHeader
          title={tag ? `#${tag.tag}` : t('Tags')}
          leftContent={<MobileBackButton onPress={goBack} />}
        />
      }
      padding={0}
    >
      {content}
    </Page>
  );
}

/**
 * The AQL filter for the desktop's "has tags" condition, made by the server
 * exactly as for the desktop register. It depends only on the tag's name,
 * so it never goes stale.
 */
function tagTransactionsFilterQuery(tagName: string | undefined) {
  return queryOptions({
    queryKey: [...tagQueries.all(), 'transactions-filter', tagName],
    queryFn: async () => {
      const { filters } = await send('make-filters-from-conditions', {
        conditions: getTagTransactionsFilter(tagName ?? ''),
      });
      return filters;
    },
    enabled: tagName !== undefined,
    staleTime: Infinity,
  });
}
