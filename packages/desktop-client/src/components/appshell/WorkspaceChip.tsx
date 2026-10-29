import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgExpandArrow } from '@actual-app/components/icons/v0';
import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { isElectron } from '@actual-app/core/shared/environment';
import { css } from '@emotion/css';

import { closeBudget } from '#budgetfiles/budgetfilesSlice';
import { useContextMenu } from '#hooks/useContextMenu';
import { useMetadataPref } from '#hooks/useMetadataPref';
import { useNavigate } from '#hooks/useNavigate';
import { pushModal } from '#modals/modalsSlice';
import { useDispatch } from '#redux';

import { shellColors, shellRadius } from './shellTheme';

/**
 * The open budget file, presented as context rather than as identity.
 *
 * The name itself is persisted data and is not touched — only where and how
 * loudly it is shown. Actual gave it the top-left slot at 16px semibold, i.e.
 * the logo position, so "My Finances" looked like the name of the product. Here
 * it is a muted chip beside the wordmark, and it keeps the same menu the old
 * sidebar title carried: rename, settings, load backup and switch file.
 */
export function WorkspaceChip() {
  const { t } = useTranslation();
  const [budgetName, setBudgetNamePref] = useMetadataPref('budgetName');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { handleContextMenu } = useContextMenu({
    triggerRef,
    items: [
      {
        name: 'rename',
        text: t('Rename budget'),
        onClick: () => setIsEditing(true),
      },
      {
        name: 'settings',
        text: t('Settings'),
        onClick: () => void navigate('/settings'),
      },
      isElectron() && {
        name: 'loadBackup',
        text: t('Load Backup…'),
        onClick: () =>
          dispatch(pushModal({ modal: { name: 'load-backup', options: {} } })),
      },
      {
        name: 'close',
        text: t('Switch file'),
        onClick: () => void dispatch(closeBudget()),
      },
    ],
  });

  if (isEditing) {
    return (
      <InitialFocus>
        <Input
          style={{ maxWidth: 220, fontSize: 13, fontWeight: 600 }}
          defaultValue={budgetName}
          onEnter={newName => {
            if (newName.trim() !== '') {
              setBudgetNamePref(newName);
              setIsEditing(false);
            }
          }}
          onBlur={() => setIsEditing(false)}
        />
      </InitialFocus>
    );
  }

  return (
    <Button
      ref={triggerRef}
      data-testid="budget-name"
      variant="bare"
      aria-label={t('Budget file options')}
      onPress={handleContextMenu}
      className={css({
        maxWidth: 240,
        padding: '5px 10px',
        borderRadius: shellRadius.pill,
        border: `1px solid ${shellColors.border}`,
        backgroundColor: shellColors.surfaceSunken,
        color: shellColors.textSecondary,
        '&[data-hovered]': {
          backgroundColor: shellColors.surfaceHover,
          borderColor: shellColors.borderStrong,
          color: shellColors.textPrimary,
        },
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
        }}
      >
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {budgetName || t('Unnamed')}
        </Text>
        <SvgExpandArrow width={7} height={7} style={{ flexShrink: 0 }} />
      </View>
    </Button>
  );
}
