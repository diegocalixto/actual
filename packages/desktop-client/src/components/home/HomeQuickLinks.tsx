import React from 'react';
import type { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgPiggyBank,
  SvgReports,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useNavigate } from '#hooks/useNavigate';

import { homeLayout } from './homeStyles';

type QuickLinkIcon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Shortcuts into the existing Actual pages. The Home screen is not part of the
 * mobile tab bar yet, so these keep it from being a dead end on a phone.
 */
export function HomeQuickLinks() {
  const { t } = useTranslation();

  const links: Array<{ label: string; to: string; Icon: QuickLinkIcon }> = [
    { label: t('Orçamento'), to: '/budget', Icon: SvgWallet },
    { label: t('Contas'), to: '/accounts', Icon: SvgPiggyBank },
    { label: t('Relatórios'), to: '/reports', Icon: SvgReports },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {links.map(({ label, to, Icon }) => (
        <QuickLink key={to} label={label} to={to} Icon={Icon} />
      ))}
    </View>
  );
}

type QuickLinkProps = {
  label: string;
  to: string;
  Icon: QuickLinkIcon;
};

function QuickLink({ label, to, Icon }: QuickLinkProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="bare"
      onPress={() => void navigate(to)}
      style={{
        flex: 1,
        minHeight: homeLayout.touchTarget,
        padding: '10px 8px',
        borderRadius: homeLayout.tileRadius,
        border: `1px solid ${theme.tableBorder}`,
        backgroundColor: theme.cardBackground,
        color: theme.pageText,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon width={15} height={15} />
        <Text style={{ fontSize: 13, fontWeight: 600 }}>{label}</Text>
      </View>
    </Button>
  );
}
