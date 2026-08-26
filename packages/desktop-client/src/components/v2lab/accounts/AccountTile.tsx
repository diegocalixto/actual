import React from 'react';

import { View } from '@actual-app/components/view';

import type { LabIcon } from './accountsFixtures';
import { ACCOUNT_HUE } from './accountsTokens';
import type { AccountHue } from './accountsTokens';

type AccountTileProps = {
  Icon: LabIcon;
  hue: AccountHue;
  size?: number;
};

/**
 * The icon tile at the head of every account row.
 *
 * Lit from inside rather than merely tinted: a radial hot spot at the upper
 * left, a hairline a shade stronger than the fill, and a coloured bloom cast
 * below. That bloom is what gives the column its premium finish at a glance —
 * without it, five dark squares read as placeholders.
 */
export function AccountTile({ Icon, hue, size = 44 }: AccountTileProps) {
  const color = ACCOUNT_HUE[hue];

  return (
    <View
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.26,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        backgroundImage: `linear-gradient(155deg, color-mix(in srgb, ${color} 78%, #ffffff) 0%, ${color} 42%, color-mix(in srgb, ${color} 82%, #0a0f1a) 100%)`,
        border: `1px solid color-mix(in srgb, ${color} 55%, #ffffff)`,
        boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -6px 12px -8px rgba(0, 0, 0, 0.6), 0 8px 20px -8px color-mix(in srgb, ${color} 90%, transparent), 0 0 0 5px color-mix(in srgb, ${color} 9%, transparent)`,
      }}
    >
      <Icon width={size * 0.48} height={size * 0.48} />
    </View>
  );
}
