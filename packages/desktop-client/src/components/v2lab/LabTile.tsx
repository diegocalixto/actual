import React from 'react';

import { View } from '@actual-app/components/view';

import type { LabIcon } from './overviewFixtures';

export type LabHue =
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'crimson'
  | 'amber';

type LabTileProps = {
  Icon: LabIcon;
  hue: LabHue;
  size?: number;
};

/**
 * The icon tile used at the head of every row.
 *
 * Built entirely from one hue: a dark tinted surface, a hairline a shade
 * stronger, and the glyph itself luminous on top. Giving each row its own hue
 * is what lets the eye find "the transport one" without reading; keeping every
 * surface dark is what stops six of them from turning the panel into a strip of
 * stickers.
 */
export function LabTile({ Icon, hue, size = 34 }: LabTileProps) {
  const color = `var(--dfl-hue-${hue})`;

  return (
    <View
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.29,
        alignItems: 'center',
        justifyContent: 'center',
        color,
        backgroundImage: `linear-gradient(145deg, color-mix(in srgb, ${color} 24%, #0a0f18) 0%, color-mix(in srgb, ${color} 9%, #06080e) 100%)`,
        border: `1px solid color-mix(in srgb, ${color} 26%, transparent)`,
        boxShadow: `inset 0 1px 0 color-mix(in srgb, ${color} 22%, transparent), 0 2px 8px -5px color-mix(in srgb, ${color} 55%, transparent)`,
      }}
    >
      <Icon width={size * 0.47} height={size * 0.47} />
    </View>
  );
}
