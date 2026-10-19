import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';

/**
 * The foot of the account list.
 *
 * A dashed outline rather than a filled button, as the desktop Accounts already
 * closes its column: it offers the action without competing with the balances
 * above it. The header keeps its own compact `+` — this is the same action
 * reached from where the reader actually runs out of accounts.
 *
 * Its height clears the 44px platform minimum for a touch target, which the
 * header's icon button also does.
 */
export function AccountsMobileAddPanel({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Button
      variant="bare"
      aria-label={t('Adicionar conta')}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 46,
        padding: '13px 0',
        borderRadius: 'var(--dfma-radius)',
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
        <Trans>Adicionar conta</Trans>
      </Text>
    </Button>
  );
}
