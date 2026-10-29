import React from 'react';

import { View } from '@actual-app/components/view';

type LeaderLineProps = {
  /**
   * `bright` is the account list's filet — a touch more luminous, since it is
   * the only connector in its panel. `muted` is the activity list, where two
   * runs per row would otherwise add up to more line than content.
   */
  variant?: 'bright' | 'muted';
  /** Small dot terminating the run, just before whatever follows it. */
  withEndDot?: boolean;
};

/**
 * The connector that carries the eye across a wide row.
 *
 * A single continuous hairline that fades in from the name and gains light
 * towards the value, rather than a dotted rule: dots read as a technical
 * annotation, a filet reads as trim. Purely a connector — it fills the gap and
 * guides, it encodes nothing.
 */
export function LeaderLine({
  variant = 'bright',
  withEndDot = false,
}: LeaderLineProps) {
  const isBright = variant === 'bright';
  const line = isBright
    ? 'rgba(126, 178, 255, 0.52)'
    : 'rgba(150, 178, 214, 0.30)';
  const dot = isBright
    ? 'rgba(140, 190, 255, 0.95)'
    : 'rgba(150, 180, 220, 0.65)';

  return (
    <View
      aria-hidden="true"
      style={{
        flex: 1,
        minWidth: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
      }}
    >
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundImage: `linear-gradient(90deg, transparent 0%, ${line} 42%, ${line} 100%)`,
        }}
      />
      {withEndDot && (
        <View
          style={{
            width: isBright ? 5 : 4,
            height: isBright ? 5 : 4,
            flexShrink: 0,
            borderRadius: 999,
            backgroundColor: dot,
            boxShadow: isBright
              ? '0 0 6px rgba(120, 175, 255, 0.7)'
              : '0 0 4px rgba(140, 175, 215, 0.35)',
          }}
        />
      )}
    </View>
  );
}

type MagnitudeLineProps = {
  /** 0–1. The caller is responsible for this being a real ratio. */
  ratio: number;
  hueVar: string;
};

/**
 * A connector whose filled length is proportional to the row's value.
 *
 * Used only where the length means something — the spending list, where each
 * category's run is its share of the largest category. A floor keeps the
 * smallest category from vanishing; everything above it is linear, so the bars
 * can be compared by eye without lying.
 */
export function MagnitudeLine({ ratio, hueVar }: MagnitudeLineProps) {
  const MIN = 0.07;
  const filled = MIN + (1 - MIN) * Math.min(Math.max(ratio, 0), 1);

  return (
    <View
      aria-hidden="true"
      style={{
        flex: 1,
        minWidth: 40,
        height: 10,
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: `${filled * 100}%`,
          height: 2,
          borderRadius: 999,
          backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${hueVar} 20%, transparent) 0%, ${hueVar} 88%, ${hueVar} 100%)`,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: `${filled * 100}%`,
          marginLeft: -3.5,
          width: 7,
          height: 7,
          borderRadius: 999,
          backgroundColor: hueVar,
          boxShadow: `0 0 9px color-mix(in srgb, ${hueVar} 85%, transparent)`,
        }}
      />
    </View>
  );
}
