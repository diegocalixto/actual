import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgViewHide, SvgViewShow } from '@actual-app/components/icons/v2';
import type { CSSProperties } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';

import { shellColors } from '#components/appshell/shellTheme';
import { useSyncedPref } from '#hooks/useSyncedPref';

type MobilePrivacyToggleProps = {
  /** The box the bar gives its icon buttons, so the eye lines up with them. */
  className?: string;
  style?: CSSProperties;
  /**
   * The colour the eye takes while it is on. Absent ⇒ the theme's accent,
   * which is right on a bar the theme paints. The V2 pages paint their bar on
   * a ground that is dark in every theme, and bring the accent that reads on
   * it: the light theme's is 2.6:1 there.
   */
  accent?: string;
};

/**
 * The eye in a phone's top bar: hides every amount, or brings them back.
 *
 * It flips the same preference the desktop header's eye does, so there is one
 * privacy mode and it follows the person from screen to screen and from device
 * to device. Nothing is kept here.
 *
 * The name stays "Ocultar valores" and the pressed state says whether it is on.
 * A name that swapped with the state would have a screen reader announce the
 * opposite of what the button currently does. For everyone else the state is
 * carried twice, by the glyph and by the tint, so it does not rest on colour.
 */
export function MobilePrivacyToggle({
  className,
  style,
  accent,
}: MobilePrivacyToggleProps) {
  const { t } = useTranslation();
  const [isPrivacyEnabledPref, setPrivacyEnabledPref] =
    useSyncedPref('isPrivacyEnabled');
  const isPrivacyEnabled = String(isPrivacyEnabledPref) === 'true';
  const Icon = isPrivacyEnabled ? SvgViewHide : SvgViewShow;

  return (
    <Button
      variant="bare"
      aria-label={t('Ocultar valores')}
      aria-pressed={isPrivacyEnabled}
      onPress={() => setPrivacyEnabledPref(String(!isPrivacyEnabled))}
      className={className}
      style={style}
    >
      <View
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          backgroundColor: !isPrivacyEnabled
            ? 'transparent'
            : accent
              ? `color-mix(in srgb, ${accent} 16%, transparent)`
              : shellColors.accentSoft,
        }}
      >
        <Icon
          aria-hidden="true"
          width={19}
          height={19}
          // Inline, because the shared mobile header paints everything inside
          // it in one colour and a class would lose to that rule.
          style={
            isPrivacyEnabled
              ? { color: accent ?? shellColors.accent }
              : undefined
          }
        />
      </View>
    </Button>
  );
}
