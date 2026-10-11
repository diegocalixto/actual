import React from 'react';
import type { ReactNode } from 'react';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import type { EntityIcon } from '#components/v2lab/LabStyle';

type BudgetMobileAlertProps = {
  /**
   * `watch` is attention — something is waiting to be done. `critical` is a
   * figure that has actually gone wrong: money spent past an envelope, or
   * budgeted past what exists.
   */
  tone: 'watch' | 'critical';
  Icon: EntityIcon;
  title: ReactNode;
  /** A second line, usually the amount behind the headline. */
  detail?: ReactNode;
  action?: {
    label: ReactNode;
    ariaLabel: string;
    onPress: () => void;
  };
};

/**
 * Something the budget needs a decision about.
 *
 * A tinted surface with a matching hairline rather than a saturated block: the
 * tone still reads instantly, but a warning stops being the brightest thing on
 * a dark screen — and these sit directly above the figure the screen is
 * actually about, which they must not outshout.
 *
 * One shape for all three of the page's banners, so an overspend and an
 * uncategorised transaction differ by colour and wording rather than by being
 * two unrelated widgets.
 */
export function BudgetMobileAlert({
  tone,
  Icon,
  title,
  detail,
  action,
}: BudgetMobileAlertProps) {
  const accent =
    tone === 'critical' ? 'var(--dfl-negative)' : 'var(--dfmb-watch)';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        borderRadius: 'var(--dfmb-radius-sm)',
        border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${accent} 11%, var(--dfl-surface))`,
      }}
    >
      <Icon
        aria-hidden="true"
        width={19}
        height={19}
        style={{ flexShrink: 0, color: accent }}
      />

      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text
          style={{
            fontSize: 'clamp(11.5px, 3vw, 12.5px)',
            fontWeight: 600,
            letterSpacing: -0.1,
            color: 'var(--dfl-text)',
          }}
        >
          {title}
        </Text>
        {detail}
      </View>

      {action && (
        <Button
          variant="bare"
          aria-label={action.ariaLabel}
          onPress={action.onPress}
          className={css({
            flexShrink: 0,
            padding: '7px 12px',
            borderRadius: 999,
            border:
              '1px solid color-mix(in srgb, var(--dfl-violet) 45%, transparent)',
            color: 'var(--dfmb-action)',
            fontSize: 12.5,
            fontWeight: 600,
            '&[data-hovered]': {
              backgroundColor:
                'color-mix(in srgb, var(--dfl-violet) 12%, transparent)',
            },
          })}
        >
          {action.label}
        </Button>
      )}
    </View>
  );
}
