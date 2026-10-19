// @ts-strict-ignore
import React, { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgChartPie,
  SvgDotsHorizontalTriple,
  SvgTrash,
} from '@actual-app/components/icons/v1';
import {
  SvgNotesPaper,
  SvgPencil1,
  SvgViewHide,
  SvgViewShow,
} from '@actual-app/components/icons/v2';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { renamedRow } from '#budget/renamedRow';
import { Modal, ModalCloseButton, ModalHeader } from '#components/common/Modal';
import { Notes } from '#components/Notes';
import { useCategory } from '#hooks/useCategory';
import { useCategoryGroup } from '#hooks/useCategoryGroup';
import { useNotes } from '#hooks/useNotes';
import type { Modal as ModalType } from '#modals/modalsSlice';

import { RenameableModalTitle } from './RenameableModalTitle';

/** A finger's height: the upstream buttons here are 40px, short of it. */
const RENAME_BUTTON_HEIGHT = 44;

type CategoryMenuModalProps = Extract<
  ModalType,
  { name: 'category-menu' }
>['options'];

export function CategoryMenuModal({
  categoryId,
  onSave,
  onEditNotes,
  onDelete,
  onToggleVisibility,
  onEditAutomations,
  onClose,
}: CategoryMenuModalProps) {
  const { t } = useTranslation();
  const { data: category } = useCategory(categoryId);
  const { data: categoryGroup } = useCategoryGroup(category?.group);
  const originalNotes = useNotes(category.id);
  const [isRenaming, setIsRenaming] = useState(false);

  // Only the name changes, so the category keeps its id and its transactions.
  const onRename = (typed: string) => {
    const renamed = renamedRow(category, typed);
    if (renamed) {
      onSave?.(renamed);
    }
  };

  const _onToggleVisibility = () => {
    onToggleVisibility?.(category.id);
  };

  const _onEditNotes = () => {
    onEditNotes?.(category.id);
  };

  const _onDelete = () => {
    onDelete?.(category.id);
  };

  const _onEditAutomations = () => {
    onEditAutomations?.(category.id);
  };

  const buttonStyle: CSSProperties = {
    ...styles.mediumText,
    height: styles.mobileMinHeight,
    color: theme.formLabelText,
    // Adjust based on desired number of buttons per row.
    flexBasis: '100%',
  };

  return (
    <Modal
      name="category-menu"
      onClose={onClose}
      containerProps={{
        style: { height: '45vh' },
      }}
    >
      {({ state }) => (
        <>
          <ModalHeader
            leftContent={
              <AdditionalCategoryMenu
                category={category}
                categoryGroup={categoryGroup}
                onDelete={_onDelete}
                onToggleVisibility={_onToggleVisibility}
              />
            }
            title={
              <RenameableModalTitle
                title={category.name}
                label={t('Rename category {{name}}', { name: category.name })}
                isRenaming={isRenaming}
                onRenamingChange={setIsRenaming}
                onRename={onRename}
              />
            }
            rightContent={<ModalCloseButton onPress={() => state.close()} />}
          />
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
            }}
          >
            <View
              style={{
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <Notes
                notes={
                  originalNotes?.length > 0 ? originalNotes : t('No notes')
                }
                editable={false}
                focused={false}
                getStyle={() => ({
                  borderRadius: 6,
                  ...((!originalNotes || originalNotes.length === 0) && {
                    justifySelf: 'center',
                    alignSelf: 'center',
                    color: theme.pageTextSubdued,
                  }),
                })}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignContent: 'space-between',
                gap: 8,
                paddingTop: 10,
              }}
            >
              <Button
                style={{ ...buttonStyle, height: RENAME_BUTTON_HEIGHT }}
                onPress={() => setIsRenaming(true)}
              >
                <SvgPencil1
                  width={16}
                  height={16}
                  style={{ paddingRight: 5 }}
                />
                <Trans>Rename</Trans>
              </Button>
              <Button style={buttonStyle} onPress={_onEditNotes}>
                <SvgNotesPaper
                  width={20}
                  height={20}
                  style={{ paddingRight: 5 }}
                />
                <Trans>Edit notes</Trans>
              </Button>
              {onEditAutomations && (
                <Button style={buttonStyle} onPress={_onEditAutomations}>
                  <SvgChartPie
                    width={20}
                    height={20}
                    style={{ paddingRight: 5 }}
                  />
                  <Trans>Budget automations</Trans>
                </Button>
              )}
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}

function AdditionalCategoryMenu({
  category,
  categoryGroup,
  onDelete,
  onToggleVisibility,
}) {
  const { t } = useTranslation();
  const triggerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemStyle: CSSProperties = {
    ...styles.mediumText,
    height: styles.mobileMinHeight,
  };

  const getItemStyle = item => ({
    ...itemStyle,
    ...(item.name === 'delete' && { color: theme.errorTextMenu }),
  });

  return (
    <View>
      <Button
        ref={triggerRef}
        variant="bare"
        aria-label={t('Menu')}
        onPress={() => {
          setMenuOpen(true);
        }}
      >
        <SvgDotsHorizontalTriple
          width={17}
          height={17}
          style={{ color: 'currentColor' }}
        />
        <Popover
          triggerRef={triggerRef}
          isOpen={menuOpen}
          placement="bottom start"
          onOpenChange={() => setMenuOpen(false)}
        >
          <Menu
            getItemStyle={getItemStyle}
            items={[
              !categoryGroup?.hidden && {
                name: 'toggleVisibility',
                text: category.hidden ? t('Show') : t('Hide'),
                icon: category.hidden ? SvgViewShow : SvgViewHide,
                iconSize: 16,
              },
              !categoryGroup?.hidden && Menu.line,
              {
                name: 'delete',
                text: t('Delete'),
                icon: SvgTrash,
                iconSize: 15,
              },
            ]}
            onMenuSelect={itemName => {
              setMenuOpen(false);
              if (itemName === 'delete') {
                onDelete();
              } else if (itemName === 'toggleVisibility') {
                onToggleVisibility();
              }
            }}
          />
        </Popover>
      </Button>
    </View>
  );
}
