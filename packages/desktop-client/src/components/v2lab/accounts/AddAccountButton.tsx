import React from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';

/** The header's primary action, lit the way the approved reference lights it. */
export function AddAccountButton({ onPress }: { onPress?: () => void }) {
  return (
    <Button
      variant="bare"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px 10px 15px',
        borderRadius: 'var(--dfl-radius-sm)',
        color: '#ffffff',
        backgroundImage: 'linear-gradient(180deg, #3f86e8 0%, #2a63c4 100%)',
        border: '1px solid rgba(150, 200, 255, 0.4)',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 22px -10px rgba(63, 134, 232, 0.95)',
      }}
    >
      <SvgAdd aria-hidden="true" width={13} height={13} />
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: '#ffffff',
        }}
      >
        <Trans>Add account</Trans>
      </Text>
    </Button>
  );
}
