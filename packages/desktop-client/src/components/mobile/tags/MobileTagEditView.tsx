import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgArrowThinRight } from '@actual-app/components/icons/v1';
import { styles } from '@actual-app/components/styles';
import type { CSSProperties } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { useQuery } from '@tanstack/react-query';

import { MobileBackButton } from '#components/mobile/MobileBackButton';
import { FieldLabel, InputField } from '#components/mobile/MobileForms';
import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';
import { MobilePageHeader, Page } from '#components/Page';
import { useNavigate } from '#hooks/useNavigate';
import { useTagCSS } from '#hooks/useTagCSS';
import { useUndo } from '#hooks/useUndo';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';
import {
  tagQueries,
  useCreateTagMutation,
  useDeleteTagsMutation,
  useHideTagsMutation,
  useUnhideTagsMutation,
  useUpdateTagMutation,
} from '#tags';

import { TagColorField } from './TagColorField';
import {
  getTagNameProblem,
  isValidTagColor,
  stripTagWhitespace,
} from './tagRules';
import { useGoBack } from './useGoBack';

const ACTION_BUTTON_STYLE = {
  minHeight: 44,
  margin: '0 8px',
  justifyContent: 'flex-start',
  paddingLeft: 12,
  gap: 8,
  backgroundColor: theme.tableBackground,
  border: `1px solid ${theme.tableBorder}`,
} satisfies CSSProperties;

const FIELD_ERROR_STYLE = {
  color: theme.errorText,
  fontSize: 13,
  marginTop: 5,
  padding: `0 ${styles.mobileEditingPadding}px`,
} satisfies CSSProperties;

type MobileTagEditViewProps = {
  /** The tag being edited, or `null` to create a new one. */
  tagId: string | null;
};

/**
 * Create a tag, or edit one, on a phone. The fields and rules are the
 * desktop table's: a new tag gets a name, a description and a colour; an
 * existing tag keeps its name (the desktop does not rename tags) and can
 * change its colour and description, be hidden or shown, deleted, or list
 * its transactions (`MobileTagTransactionsPage`).
 */
export function MobileTagEditView({ tagId }: MobileTagEditViewProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const goBack = useGoBack('/tags');
  const { showUndoNotification } = useUndo();
  const getTagCSS = useTagCSS();

  // Every tag, hidden ones included: a hidden tag can still be opened here,
  // and a new name must not collide with one.
  const { data: allTags = [], isPlaceholderData } = useQuery(tagQueries.list());
  const tag = tagId ? allTags.find(candidate => candidate.id === tagId) : null;
  const isNew = tagId === null;

  const [name, setName] = useState('');
  const [draftDescription, setDraftDescription] = useState<string | null>(null);
  // `undefined` = untouched, so the stored colour shows until one is picked.
  const [draftColor, setDraftColor] = useState<string | null | undefined>(
    undefined,
  );

  const { mutate: createTag, isPending: isCreating } = useCreateTagMutation();
  const { mutate: updateTag, isPending: isUpdating } = useUpdateTagMutation();
  const { mutate: deleteTags } = useDeleteTagsMutation();
  const { mutate: hideTags } = useHideTagsMutation();
  const { mutate: unhideTags } = useUnhideTagsMutation();

  const description = draftDescription ?? tag?.description ?? '';
  const color = draftColor !== undefined ? draftColor : (tag?.color ?? null);

  const header = (title: string) => (
    <MobilePageHeader
      title={title}
      leftContent={<MobileBackButton onPress={goBack} />}
    />
  );

  if (!isNew && !tag) {
    return (
      <Page header={header(t('Edit tag'))}>
        <View style={{ paddingTop: 40, alignItems: 'center' }}>
          <Text style={{ color: theme.pageTextSubdued, fontSize: 15 }}>
            {isPlaceholderData ? (
              <Trans>Loading…</Trans>
            ) : (
              <Trans>This tag no longer exists.</Trans>
            )}
          </Text>
        </View>
      </Page>
    );
  }

  const nameProblem = isNew
    ? getTagNameProblem(
        name,
        allTags.map(existing => existing.tag),
      )
    : null;
  const canSave =
    nameProblem === null &&
    isValidTagColor(color) &&
    !isCreating &&
    !isUpdating;

  const onSave = () => {
    if (!canSave) {
      return;
    }
    if (tag) {
      updateTag({ tag: { ...tag, color, description } }, { onSuccess: goBack });
    } else {
      createTag(
        { tag: { tag: name, color, description } },
        { onSuccess: goBack },
      );
    }
  };

  const onViewTransactions = () => {
    if (!tag) {
      return;
    }
    void navigate(`/tags/${encodeURIComponent(tag.id)}/transactions`);
  };

  const onToggleHidden = () => {
    if (!tag) {
      return;
    }
    const mutate = tag.hidden ? unhideTags : hideTags;
    mutate({ ids: [tag.id] });
  };

  const onDelete = () => {
    if (!tag) {
      return;
    }
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
                  onSuccess: () => {
                    showUndoNotification({
                      message: t('Tag #{{tag}} deleted', { tag: tag.tag }),
                    });
                    goBack();
                  },
                },
              );
            },
          },
        },
      }),
    );
  };

  const shownName = tag ? tag.tag : name;

  return (
    <Page header={header(isNew ? t('New tag') : t('Edit tag'))}>
      <View
        style={{
          // The page scrolls; the form never squeezes its fields to fit.
          flexShrink: 0,
          paddingBottom: `calc(${MOBILE_NAV_SPACER} + 24px)`,
        }}
      >
        <View
          style={{
            paddingTop: 20,
            alignItems: 'center',
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <span
            className={getTagCSS(tag ? tag.tag : '', { color })}
            style={{ fontSize: 16, fontWeight: 500, maxWidth: '100%' }}
          >
            #{shownName || t('New tag')}
          </span>
        </View>

        <FieldLabel title={t('Name')} />
        <InputField
          aria-label={t('Name')}
          style={{ height: 44 }}
          placeholder={t('New tag')}
          value={shownName}
          disabled={!isNew}
          autoFocus={isNew}
          aria-invalid={
            nameProblem === 'invalid' || nameProblem === 'duplicate'
              ? true
              : undefined
          }
          onChangeValue={value => setName(stripTagWhitespace(value))}
          onEnter={onSave}
        />
        {nameProblem === 'invalid' && (
          <Text style={FIELD_ERROR_STYLE}>
            <Trans>A tag name cannot contain # or spaces.</Trans>
          </Text>
        )}
        {nameProblem === 'duplicate' && (
          <Text style={FIELD_ERROR_STYLE}>
            <Trans>A tag with this name already exists.</Trans>
          </Text>
        )}

        <FieldLabel title={t('Description')} />
        <InputField
          aria-label={t('Description')}
          style={{ height: 44 }}
          placeholder={t('Tag description')}
          value={description}
          onChangeValue={setDraftDescription}
          onEnter={onSave}
        />

        <FieldLabel title={t('Color')} />
        <TagColorField
          value={color}
          onChange={setDraftColor}
          allowDefault={isNew}
        />

        <View style={{ margin: '28px 8px 0' }}>
          <Button
            variant="primary"
            onPress={onSave}
            isDisabled={!canSave}
            style={{ minHeight: 44 }}
          >
            {isNew ? <Trans>Add tag</Trans> : <Trans>Save</Trans>}
          </Button>
        </View>

        {tag && (
          <View style={{ gap: 10, marginTop: 28 }}>
            <Button
              variant="bare"
              onPress={onViewTransactions}
              style={{ ...ACTION_BUTTON_STYLE, color: theme.pageText }}
            >
              <Text>
                <Trans>View Transactions</Trans>
              </Text>
              <SvgArrowThinRight style={{ width: 10, height: 10 }} />
            </Button>
            <Button
              variant="bare"
              onPress={onToggleHidden}
              style={{ ...ACTION_BUTTON_STYLE, color: theme.pageText }}
            >
              {tag.hidden ? <Trans>Unhide tag</Trans> : <Trans>Hide tag</Trans>}
            </Button>
            <Button
              variant="bare"
              onPress={onDelete}
              style={{ ...ACTION_BUTTON_STYLE, color: theme.errorText }}
            >
              <Trans>Delete tag</Trans>
            </Button>
            {tag.hidden && (
              <Text
                style={{
                  fontSize: 13,
                  color: theme.pageTextSubdued,
                  padding: `0 ${styles.mobileEditingPadding}px`,
                }}
              >
                <Trans>
                  Hidden tags only appear in this list when 'Show hidden tags'
                  is on.
                </Trans>
              </Text>
            )}
          </View>
        )}
      </View>
    </Page>
  );
}
