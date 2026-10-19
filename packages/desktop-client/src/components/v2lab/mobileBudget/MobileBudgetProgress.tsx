import React from 'react';

import { View } from '@actual-app/components/view';

type MobileBudgetProgressProps = {
  /** Whole percent. Values above 100 saturate the bar. */
  percent: number;
  /** The fill's colour. The track is the same everywhere. */
  tone: string;
  height?: number;
};

/**
 * A thin bar that restates a percentage.
 *
 * It is the same number as the text beside it, drawn — never a second fact.
 * Deliberately thin and unlit: a thick bar with a glow reads as a health meter
 * in a game, and eight of them down a list would be the loudest thing on a
 * screen whose subject is a set of amounts.
 *
 * The fill saturates at the track's width, so an overspent category cannot
 * paint past its own row; the balance beside it is what says how far over.
 */
export function MobileBudgetProgress({
  percent,
  tone,
  height = 4,
}: MobileBudgetProgressProps) {
  const filled = Math.min(Math.max(percent, 0), 100);

  return (
    <View
      aria-hidden="true"
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        backgroundColor: 'var(--dfmb-track)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${filled}%`,
          height: '100%',
          borderRadius: 999,
          backgroundColor: tone,
        }}
      />
    </View>
  );
}
