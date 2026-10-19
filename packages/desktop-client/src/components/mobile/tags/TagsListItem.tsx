import React from 'react';
import type { GridListItemProps } from 'react-aria-components';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import type { TagEntity } from '@actual-app/core/types/models';
import type { WithRequired } from '@actual-app/core/types/util';

import { ActionableGridListItem } from '#components/mobile/ActionableGridListItem';
import { useTagCSS } from '#hooks/useTagCSS';

type TagsListItemProps = {
  onToggleHidden: () => void;
  onDelete: () => void;
} & WithRequired<GridListItemProps<TagEntity>, 'value'>;

export function TagsListItem({
  value: tag,
  onToggleHidden,
  onDelete,
  ...props
}: TagsListItemProps) {
  const { t } = useTranslation();
  const getTagCSS = useTagCSS({ ellipsis: true });

  return (
    <ActionableGridListItem
      id={tag.id}
      value={tag}
      textValue={`#${tag.tag}`}
      actionsWidth={200}
      actions={({ close }) => (
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <Button
            variant="bare"
            onPress={() => {
              close();
              onToggleHidden();
            }}
            style={{
              color: theme.pillText,
              backgroundColor: theme.pillBackground,
              flex: 1,
              minHeight: 44,
              borderRadius: 0,
            }}
          >
            {tag.hidden ? <Trans>Unhide</Trans> : <Trans>Hide</Trans>}
          </Button>
          <Button
            variant="bare"
            onPress={() => {
              close();
              onDelete();
            }}
            style={{
              color: theme.errorText,
              flex: 1,
              minHeight: 44,
              borderRadius: 0,
            }}
          >
            <Trans>Delete</Trans>
          </Button>
        </View>
      )}
      {...props}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 6, alignItems: 'flex-start' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            maxWidth: '100%',
          }}
        >
          <span
            className={getTagCSS(tag.tag)}
            style={{ fontSize: 15, fontWeight: 500 }}
          >
            #{tag.tag}
          </span>
          {tag.hidden && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 12,
                color: theme.pageTextSubdued,
              }}
            >
              <Trans>Hidden</Trans>
            </span>
          )}
        </View>
        <span
          style={{
            fontSize: 13,
            color: tag.description ? theme.pageText : theme.pageTextSubdued,
            fontStyle: tag.description ? undefined : 'italic',
            opacity: tag.hidden ? 0.6 : undefined,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            textAlign: 'left',
          }}
        >
          {tag.description || t('No description')}
        </span>
      </View>
    </ActionableGridListItem>
  );
}
