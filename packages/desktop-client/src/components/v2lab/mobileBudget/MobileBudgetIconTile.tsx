import React from 'react';

import { View } from '@actual-app/components/view';

import type { EntityIcon } from '#components/v2lab/LabStyle';

type MobileBudgetIconTileProps = {
  Icon: EntityIcon;
  /** One of the shared `--dfl-hue-*` tokens. */
  hue: string;
  size?: number;
  /** Degrees to turn the glyph by, for icons the library ships rotated. */
  rotation?: number;
};

/**
 * The glyph that opens a row.
 *
 * A rounded tile built from a single hue: a very dark tint for the surface, a
 * stronger one for the hairline, and the hue itself, luminous, for the glyph.
 * Kept a step below full saturation so eight of them down a list still read as
 * one interface rather than as a colour chart.
 */
export function MobileBudgetIconTile({
  Icon,
  hue,
  size = 34,
  rotation,
}: MobileBudgetIconTileProps) {
  return (
    <View
      aria-hidden="true"
      style={{
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 'var(--dfmb-radius-tile)',
        backgroundColor: `color-mix(in srgb, ${hue} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${hue} 24%, transparent)`,
      }}
    >
      <Icon
        width={Math.round(size * 0.5)}
        height={Math.round(size * 0.5)}
        style={{
          color: hue,
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        }}
      />
    </View>
  );
}
