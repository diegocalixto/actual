import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { BrandMark } from '#components/appshell/BrandMark';

import { mobileLayout } from './MobileHomeStyle';

/**
 * The bar the screen opens on: the product mark, and the name of the place.
 *
 * The reference puts a bell on the right. There is no notification centre in
 * this application, and a bell that opens nothing is worse than no bell, so the
 * slot is left empty and the title stays centred by its own margins rather than
 * by being balanced against a control that does nothing.
 */
export function MobileTopBar() {
  return (
    <View
      style={{
        flexShrink: 0,
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        padding: `0 ${mobileLayout.gutter}px`,
        borderBottom: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfl-canvas)',
      }}
    >
      <BrandMark size={28} />

      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: -0.2,
          color: 'var(--dfl-text)',
          // The mark is 28 wide; the same amount on the right keeps the title
          // optically centred without an invisible spacer element.
          paddingRight: 28,
        }}
      >
        <Trans>Início</Trans>
      </Text>
    </View>
  );
}
