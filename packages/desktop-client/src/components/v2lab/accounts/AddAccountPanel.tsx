import React from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';

/**
 * The foot of the account list.
 *
 * A dashed outline rather than a filled button: it closes the column without
 * competing with the accounts above it.
 */
export function AddAccountPanel({ onPress }: { onPress?: () => void }) {
  return (
    <Button
      variant="bare"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '17px 0',
        borderRadius: 'var(--dfl-radius)',
        color: 'var(--dfl-blue)',
        backgroundColor: 'rgba(90, 166, 255, 0.04)',
        border: '1px dashed rgba(122, 168, 224, 0.34)',
      }}
    >
      <SvgAdd aria-hidden="true" width={13} height={13} />
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: 'var(--dfl-blue)',
        }}
      >
        <Trans>Add account</Trans>
      </Text>
    </Button>
  );
}
