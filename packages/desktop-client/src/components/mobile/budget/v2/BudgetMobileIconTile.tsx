import React from 'react';
import type { ReactNode } from 'react';

import { View } from '@actual-app/components/view';

import type { EntityIcon } from '#components/v2lab/LabStyle';

type BudgetMobileIconTileProps = {
  Icon: EntityIcon;
  /** One of the shared `--dfl-hue-*` tokens. */
  hue: string;
  size?: number;
  /** Degrees to turn the glyph by, for icons the library ships rotated. */
  rotation?: number;
  /**
   * A small status glyph pinned to the tile's corner.
   *
   * The upstream row hung the schedule indicator off its Spent cell, which this
   * composition no longer draws. The corner keeps that signal on the row
   * without giving it a column, and without competing with the amounts.
   */
  badge?: ReactNode;
};

/**
 * The glyph that opens a row.
 *
 * A rounded tile built from a single hue: a very dark tint for the surface, a
 * stronger one for the hairline, and the hue itself, luminous, for the glyph.
 * Kept a step below full saturation so a column of them still reads as one
 * interface rather than as a colour chart.
 */
export function BudgetMobileIconTile({
  Icon,
  hue,
  size = 34,
  rotation,
  badge,
}: BudgetMobileIconTileProps) {
  return (
    <View
      style={{
        position: 'relative',
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
        aria-hidden="true"
        width={Math.round(size * 0.5)}
        height={Math.round(size * 0.5)}
        style={{
          color: hue,
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        }}
      />
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            padding: 2,
            backgroundColor: 'var(--dfl-surface)',
          }}
        >
          {badge}
        </View>
      )}
    </View>
  );
}
