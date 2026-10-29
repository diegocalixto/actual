import React from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import {
  SvgChartBar,
  SvgChartPie,
  SvgCheveronRight,
  SvgDotsHorizontalTriple,
  SvgHome,
  SvgWallet,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import type { LabIcon } from './accountsFixtures';

/**
 * The wide navigation of the approved Accounts reference.
 *
 * The published shell puts navigation in an 88px rail with a horizontal header
 * above the page. This reference does neither: one full-height column carries
 * the brand, the destinations and the profile, and the content starts right of
 * it. Reproducing that meant giving this route its own navigation rather than
 * widening the shared rail — Overview and Budget are already approved against
 * the rail, and changing it would redesign them by accident.
 */

type NavItem = {
  id: string;
  label: ReactNode;
  Icon: LabIcon;
  active?: boolean;
};

const NAV: NavItem[] = [
  { id: 'overview', label: <Trans>Overview</Trans>, Icon: SvgHome },
  { id: 'budget', label: <Trans>Budget</Trans>, Icon: SvgChartPie },
  {
    id: 'accounts',
    label: <Trans>Accounts</Trans>,
    Icon: SvgWallet,
    active: true,
  },
  { id: 'reports', label: <Trans>Reports</Trans>, Icon: SvgChartBar },
  {
    id: 'more',
    label: <Trans>More</Trans>,
    Icon: SvgDotsHorizontalTriple,
  },
];

export const SIDEBAR_WIDTH = 296;

/** Laboratory fixture, like every other value on this route. */
const PROFILE_NAME = 'Diego Calixto';

export function LabSidebar() {
  return (
    <View
      style={{
        flex: `0 0 ${SIDEBAR_WIDTH}px`,
        height: '100%',
        padding: '26px 20px 22px',
        gap: 22,
        backgroundColor: '#080b12',
        borderRight: '1px solid var(--dfl-line)',
      }}
    >
      <Brand />

      <View
        aria-hidden="true"
        style={{ height: 1, backgroundColor: 'var(--dfl-line)' }}
      />

      <View style={{ gap: 6 }}>
        {NAV.map(item => (
          <NavRow key={item.id} item={item} />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <View
        aria-hidden="true"
        style={{ height: 1, backgroundColor: 'var(--dfl-line)' }}
      />

      <Profile />
    </View>
  );
}

function Brand() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingLeft: 4,
      }}
    >
      <View
        aria-hidden="true"
        style={{
          width: 42,
          height: 42,
          flexShrink: 0,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage:
            'linear-gradient(145deg, #7c4dff 0%, #4d7bf5 55%, #2f63d8 100%)',
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 8px 20px -10px rgba(96, 110, 255, 0.9)',
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.2,
            color: '#ffffff',
          }}
        >
          DF
        </Text>
      </View>

      <Text
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
          color: '#ffffff',
        }}
      >
        <span style={{ color: '#6d9cf8' }}>DIEGO</span> FINANCE
      </Text>
    </View>
  );
}

function NavRow({ item }: { item: NavItem }) {
  const { Icon, label, active } = item;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        height: 52,
        padding: '0 16px',
        borderRadius: 13,
        color: active ? '#ffffff' : 'var(--dfl-text-2)',
        ...(active && {
          backgroundImage:
            'linear-gradient(96deg, #6b3fd4 0%, #4155c8 46%, #1f5cc0 100%)',
          border: '1px solid rgba(150, 190, 255, 0.34)',
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 10px 26px -12px rgba(80, 90, 220, 0.95)',
        }),
      }}
    >
      <Icon aria-hidden="true" width={20} height={20} />
      <Text
        style={{
          fontSize: 15,
          fontWeight: active ? 600 : 500,
          letterSpacing: -0.1,
          whiteSpace: 'nowrap',
          color: 'currentColor',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function Profile() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        padding: '4px 4px',
      }}
    >
      <View
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'linear-gradient(145deg, #8b5cff 0%, #4d7bf5 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        }}
      >
        <Text style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>
          DC
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: '#ffffff',
          }}
        >
          {PROFILE_NAME}
        </Text>
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            color: '#9b7bff',
          }}
        >
          <Trans>Premium</Trans>
        </Text>
      </View>

      <SvgCheveronRight
        aria-hidden="true"
        width={15}
        height={15}
        style={{ flexShrink: 0, color: 'var(--dfl-text-3)' }}
      />
    </View>
  );
}
