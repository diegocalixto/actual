import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgPiggyBank } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { MOBILE_NAV_SPACER } from '#components/mobile/MobileNavTabs';

/**
 * A file with no accounts yet.
 *
 * The same three things the previous empty state said — what an account is,
 * what it is for, and the one action that resolves it — repainted in this
 * screen's language and centred in the space the bar leaves. It is not a
 * shrunken copy of the populated screen: with nothing to group there is no
 * hero to draw, and a hero printing R$ 0,00 over an empty list would be the
 * page insisting it has something to report.
 */
export function AccountsMobileEmpty({
  onAddAccount,
}: {
  onAddAccount: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        minHeight: `calc(100vh - ${MOBILE_NAV_SPACER} - 160px)`,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        gap: 14,
      }}
    >
      <View
        aria-hidden="true"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: 999,
          backgroundColor:
            'color-mix(in srgb, var(--dfl-blue) 10%, transparent)',
          border:
            '1px solid color-mix(in srgb, var(--dfl-blue) 20%, transparent)',
        }}
      >
        <SvgPiggyBank
          width={34}
          height={34}
          style={{ color: 'var(--dfl-blue)' }}
        />
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: -0.3,
          textAlign: 'center',
          color: 'var(--dfl-text)',
        }}
      >
        <Trans>Adicione sua primeira conta</Trans>
      </Text>

      <Text
        style={{
          fontSize: 13.5,
          lineHeight: 1.5,
          maxWidth: 320,
          textAlign: 'center',
          color: 'var(--dfl-text-2)',
        }}
      >
        <Trans>
          As contas guardam suas transações — gastos do dia a dia, poupança,
          cartões ou dinheiro. Adicione uma para começar a acompanhar seu
          dinheiro.
        </Trans>
      </Text>

      <Button
        variant="bare"
        aria-label={t('Adicionar conta')}
        onPress={onAddAccount}
        style={{
          marginTop: 6,
          minHeight: 46,
          padding: '13px 22px',
          borderRadius: 999,
          fontSize: 14.5,
          fontWeight: 600,
          color: '#ffffff',
          backgroundColor: 'var(--dfl-blue-deep)',
          border: '1px solid var(--dfl-hero-line)',
        }}
      >
        <Trans>Adicionar conta</Trans>
      </Button>
    </View>
  );
}
