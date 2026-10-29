import React from 'react';
import type { ReactNode } from 'react';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { shellColors, shellRadius } from '#components/appshell/shellTheme';

export type Segment<T extends string> = {
  id: T;
  label: ReactNode;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
};

/**
 * A pill-shaped switch for the small, mutually exclusive choices these pages
 * make — the reference's "Agosto ⌄" control belongs to the same family. Used
 * instead of a row of bordered buttons, which is what made the upstream report
 * toolbars read as an admin panel.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      role="group"
      aria-label={ariaLabel}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        flexShrink: 0,
        borderRadius: shellRadius.pill,
        backgroundColor: shellColors.surfaceSunken,
      }}
    >
      {segments.map(segment => {
        const isActive = segment.id === value;
        return (
          <Button
            key={segment.id}
            variant="bare"
            aria-pressed={isActive}
            onPress={() => onChange(segment.id)}
            className={css({
              padding: '5px 13px',
              borderRadius: shellRadius.pill,
              backgroundColor: isActive
                ? shellColors.surfaceHover
                : 'transparent',
              color: isActive ? shellColors.textPrimary : shellColors.textMuted,
              '&[data-hovered]': {
                color: shellColors.textPrimary,
              },
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: 600 }}>
              {segment.label}
            </Text>
          </Button>
        );
      })}
    </View>
  );
}
