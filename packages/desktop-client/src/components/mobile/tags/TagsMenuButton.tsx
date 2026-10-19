import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgDotsHorizontalTriple } from '@actual-app/components/icons/v1';
import {
  SvgSearchAlternate,
  SvgViewHide,
  SvgViewShow,
} from '@actual-app/components/icons/v2';
import { Menu } from '@actual-app/components/menu';
import { Popover } from '@actual-app/components/popover';
import { theme } from '@actual-app/components/theme';

import { useSyncedPref } from '#hooks/useSyncedPref';
import { useDiscoverTagsMutation } from '#tags';

const TOUCH_TARGET = 44;

/**
 * The phone's copy of the desktop Tags menu (`components/tags/TagsMenuButton`):
 * the same two entries, through the same pref and mutation, with rows sized
 * for a finger.
 */
export function TagsMenuButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: discoverTags } = useDiscoverTagsMutation();
  const [showHidden, setShowHidden] = useSyncedPref('show-hidden-tags');
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="bare"
        aria-label={t('Menu')}
        onPress={() => setIsOpen(true)}
        style={{
          width: TOUCH_TARGET,
          height: TOUCH_TARGET,
          minWidth: TOUCH_TARGET,
          flexShrink: 0,
          color: theme.pageText,
        }}
      >
        <SvgDotsHorizontalTriple width={18} height={18} />
      </Button>
      <Popover
        triggerRef={triggerRef}
        placement="bottom end"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Menu
          style={{ minWidth: 220 }}
          getItemStyle={() => ({
            minHeight: TOUCH_TARGET,
            paddingLeft: 16,
            paddingRight: 20,
            fontSize: 15,
          })}
          items={[
            showHidden === 'true'
              ? {
                  name: 'set-dont-show-hidden',
                  text: t("Don't show hidden tags"),
                  icon: SvgViewHide,
                  iconSize: 18,
                }
              : {
                  name: 'set-show-hidden',
                  text: t('Show hidden tags'),
                  icon: SvgViewShow,
                  iconSize: 18,
                },
            {
              name: 'discover-tags',
              text: t('Discover new tags'),
              icon: SvgSearchAlternate,
              iconSize: 18,
            },
          ]}
          onMenuSelect={name => {
            setIsOpen(false);
            switch (name) {
              case 'set-dont-show-hidden':
                setShowHidden('false');
                break;
              case 'set-show-hidden':
                setShowHidden('true');
                break;
              case 'discover-tags':
                discoverTags();
                break;
              default:
                break;
            }
          }}
        />
      </Popover>
    </>
  );
}
