import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

/**
 * The account list before it has arrived.
 *
 * `accountQueries.list` carries `placeholderData: []`, so an empty array is
 * what a loading file and a genuinely empty file both look like. Without this
 * branch every visit opens on "Adicione sua primeira conta" for a frame — the
 * page telling a person with eight accounts that they have none. The mobile
 * Home already draws this distinction; this is the same panel.
 */
export function AccountsMobileLoading() {
  return (
    <View
      style={{
        alignItems: 'center',
        padding: 24,
        borderRadius: 'var(--dfma-radius)',
        border: '1px solid var(--dfl-line)',
        backgroundColor: 'var(--dfl-surface)',
      }}
    >
      <Text style={{ fontSize: 13, color: 'var(--dfl-text-2)' }}>
        <Trans>Carregando contas…</Trans>
      </Text>
    </View>
  );
}
