import React from 'react';

import { View } from '@actual-app/components/view';

import type { EntityIcon } from '#components/v2lab/LabStyle';

type HomeMobileIconTileProps = {
  Icon: EntityIcon;
  /** One of the shared `--dfl-hue-*` tokens. */
  hue: string;
};

/**
 * The glyph that opens a row.
 *
 * A rounded tile built from a single hue: a very dark tint for the surface, a
 * stronger one for the hairline, and the hue itself, luminous, for the glyph.
 * Kept a step below full saturation so five of them down a list still read as
 * one interface rather than as a colour chart.
 */
export function HomeMobileIconTile({ Icon, hue }: HomeMobileIconTileProps) {
  return (
    <View
      aria-hidden="true"
      style={{
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 'var(--dfm-radius-tile)',
        backgroundColor: `color-mix(in srgb, ${hue} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${hue} 22%, transparent)`,
      }}
    >
      <Icon width={18} height={18} style={{ color: hue }} />
    </View>
  );
}
