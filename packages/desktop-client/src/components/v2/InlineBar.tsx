import React from 'react';

import { View } from '@actual-app/components/view';

import { shellColors, shellRadius } from '#components/appshell/shellTheme';

type InlineBarProps = {
  /** 0–1. Values above 1 saturate; the caller decides what to say about that. */
  progress: number;
  /** Marks an overrun: the bar keeps its length but changes meaning. */
  isOver?: boolean;
  height?: number;
  /** Track is omitted when the bar sits on an already-recessed strip. */
  showTrack?: boolean;
};

/**
 * The horizontal progress bar the reference uses inline in list rows — the
 * cheapest way to turn a pair of numbers into something readable at a glance.
 */
export function InlineBar({
  progress,
  isOver = false,
  height = 6,
  showTrack = true,
}: InlineBarProps) {
  const width = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      aria-hidden="true"
      style={{
        height,
        flex: 1,
        minWidth: 0,
        borderRadius: shellRadius.pill,
        backgroundColor: showTrack ? shellColors.surfaceSunken : 'transparent',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${width * 100}%`,
          height: '100%',
          borderRadius: shellRadius.pill,
          backgroundColor: isOver
            ? shellColors.negative
            : shellColors.accentBold,
        }}
      />
    </View>
  );
}
