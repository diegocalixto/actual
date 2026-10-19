import React from 'react';
import { GridList, ListLayout, Virtualizer } from 'react-aria-components';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { AnimatedLoading } from '@actual-app/components/icons/AnimatedLoading';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { TagEntity } from '@actual-app/core/types/models';

import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';

import { TagsListItem } from './TagsListItem';

type TagsListProps = {
  tags: TagEntity[];
  /** True when there are tags, but none pass the filter. */
  isFiltered: boolean;
  isLoading?: boolean;
  onTagPress: (tag: TagEntity) => void;
  onTagToggleHidden: (tag: TagEntity) => void;
  onTagDelete: (tag: TagEntity) => void;
  onAddTag: () => void;
};

export function TagsList({
  tags,
  isFiltered,
  isLoading = false,
  onTagPress,
  onTagToggleHidden,
  onTagDelete,
  onAddTag,
}: TagsListProps) {
  const { t } = useTranslation();

  if (isLoading && tags.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 100,
        }}
      >
        <AnimatedLoading style={{ width: 25, height: 25 }} />
      </View>
    );
  }

  if (tags.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          gap: 12,
          paddingTop: 60,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: `calc(${MOBILE_NAV_SPACER} + 20px)`,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: theme.pageTextSubdued,
            textAlign: 'center',
          }}
        >
          {isFiltered ? (
            <Trans>No tags match your filter.</Trans>
          ) : (
            <Trans>No tags</Trans>
          )}
        </Text>
        {!isFiltered && (
          <>
            <Text
              style={{
                fontSize: 14,
                color: theme.pageTextSubdued,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              <Trans>User defined tags with color and description.</Trans>{' '}
              <Trans>Write #name in a transaction's notes to tag it.</Trans>
            </Text>
            <Button
              variant="primary"
              onPress={onAddTag}
              style={{ minHeight: 44, paddingLeft: 20, paddingRight: 20 }}
            >
              <Trans>Add tag</Trans>
            </Button>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Virtualizer layout={ListLayout}>
        <GridList
          aria-label={t('Tags')}
          aria-busy={isLoading || undefined}
          items={tags}
          style={{
            flex: 1,
            paddingBottom: `calc(${MOBILE_NAV_SPACER} + 16px)`,
            overflow: 'auto',
          }}
        >
          {tag => (
            <TagsListItem
              value={tag}
              onAction={() => onTagPress(tag)}
              onToggleHidden={() => onTagToggleHidden(tag)}
              onDelete={() => onTagDelete(tag)}
            />
          )}
        </GridList>
      </Virtualizer>
    </View>
  );
}
