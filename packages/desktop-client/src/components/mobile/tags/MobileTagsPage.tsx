import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { listen } from '@actual-app/core/platform/client/connection';
import { getNormalisedString } from '@actual-app/core/shared/normalisation';
import type { TagEntity } from '@actual-app/core/types/models';

import { Search } from '#components/common/Search';
import { MobileBackButton } from '#components/mobile/MobileBackButton';
import {
  mobileHeaderIconButtonStyle,
  MobilePageHeader,
  Page,
} from '#components/Page';
import { useNavigate } from '#hooks/useNavigate';
import { useTags } from '#hooks/useTags';
import { useUndo } from '#hooks/useUndo';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';
import {
  useDeleteTagsMutation,
  useHideTagsMutation,
  useUnhideTagsMutation,
} from '#tags';

import { MobileTagEditView } from './MobileTagEditView';
import { TagsList } from './TagsList';
import { TagsMenuButton } from './TagsMenuButton';
import { useGoBack } from './useGoBack';

/**
 * Tags on a phone. The list, its filter and its menu live at `/tags`; a tag
 * opens at `/tags?tag=<id>` and a new one at `/tags?new=1`, so the system
 * back gesture closes the form and returns to the list.
 */
export function MobileTagsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // "Mais" is a menu, not a screen: back returns wherever it was opened from,
  // and a page opened cold falls back to the home screen.
  const goBack = useGoBack('/home');
  const { showUndoNotification } = useUndo();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('');
  const { data: tags = [], isPlaceholderData, refetch } = useTags();
  const { mutate: deleteTags } = useDeleteTagsMutation();
  const { mutate: hideTags } = useHideTagsMutation();
  const { mutate: unhideTags } = useUnhideTagsMutation();

  // Same as the desktop table: an undo elsewhere can bring a tag back.
  useEffect(() => listen('undo-event', () => refetch({ cancelRefetch: true })));

  const editingTagId = searchParams.get('tag');
  const isCreating = searchParams.has('new');

  if (editingTagId !== null || isCreating) {
    return (
      <MobileTagEditView key={editingTagId ?? 'new'} tagId={editingTagId} />
    );
  }

  const normalisedFilter = getNormalisedString(filter);
  const filteredTags =
    filter === ''
      ? tags
      : tags.filter(tag =>
          getNormalisedString(tag.tag).includes(normalisedFilter),
        );

  const onAddTag = () => {
    void navigate('/tags?new=1');
  };

  const onTagPress = (tag: TagEntity) => {
    void navigate(`/tags?tag=${encodeURIComponent(tag.id)}`);
  };

  const onTagToggleHidden = (tag: TagEntity) => {
    if (tag.hidden) {
      unhideTags({ ids: [tag.id] });
    } else {
      hideTags({ ids: [tag.id] });
    }
  };

  const onTagDelete = (tag: TagEntity) => {
    dispatch(
      pushModal({
        modal: {
          name: 'confirm-delete',
          options: {
            message: t('Are you sure you want to delete the tag #{{tag}}?', {
              tag: tag.tag,
            }),
            onConfirm: () => {
              deleteTags(
                { ids: [tag.id] },
                {
                  onSuccess: () =>
                    showUndoNotification({
                      message: t('Tag #{{tag}} deleted', { tag: tag.tag }),
                    }),
                },
              );
            },
          },
        },
      }),
    );
  };

  return (
    <Page
      header={
        <MobilePageHeader
          title={t('Tags')}
          leftContent={<MobileBackButton onPress={goBack} />}
          rightContent={
            <Button
              variant="bare"
              aria-label={t('Add tag')}
              style={mobileHeaderIconButtonStyle}
              onPress={onAddTag}
            >
              <SvgAdd width={20} height={20} />
            </Button>
          }
        />
      }
      padding={0}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: theme.mobilePageBackground,
          padding: 10,
          paddingRight: 4,
          width: '100%',
          borderBottomWidth: 2,
          borderBottomStyle: 'solid',
          borderBottomColor: theme.tableBorder,
        }}
      >
        <View style={{ flex: 1 }}>
          <Search
            placeholder={t('Filter tags...')}
            value={filter}
            onChange={setFilter}
            width="100%"
            height={44}
            style={{
              backgroundColor: theme.tableBackground,
              borderColor: theme.formInputBorder,
            }}
          />
        </View>
        <TagsMenuButton />
      </View>
      <TagsList
        tags={filteredTags}
        isFiltered={filter !== '' && tags.length > 0}
        isLoading={isPlaceholderData}
        onTagPress={onTagPress}
        onTagToggleHidden={onTagToggleHidden}
        onTagDelete={onTagDelete}
        onAddTag={onAddTag}
      />
    </Page>
  );
}
