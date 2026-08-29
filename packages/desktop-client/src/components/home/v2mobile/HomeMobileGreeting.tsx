import React from 'react';
import { Trans } from 'react-i18next';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

/** Whose build this is. A person's name, so it is never a translation key. */
const OWNER = 'Diego';

type HomeMobileGreetingProps = {
  /** Hours past midnight, read from the clock by the page. */
  hour: number;
};

/**
 * A greeting, kept deliberately quiet.
 *
 * It names the person and the time of day and then gets out of the way: the
 * hero directly below is the screen's subject, and a greeting set any larger
 * would compete with it for the first glance.
 *
 * The mark beside it is drawn here rather than imported because the icon set
 * ships no sun. It is decoration, `aria-hidden`, and carries no action.
 */
export function HomeMobileGreeting({ hour }: HomeMobileGreetingProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 2,
      }}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--dfl-blue)"
        strokeWidth="1.7"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.9 1.9M16.7 16.7l1.9 1.9M18.6 5.4l-1.9 1.9M7.3 16.7l-1.9 1.9" />
      </svg>

      <Text style={{ fontSize: 16, color: 'var(--dfl-text)' }}>
        {hour < 12 ? (
          <Trans>Bom dia, {{ OWNER }}</Trans>
        ) : hour < 18 ? (
          <Trans>Boa tarde, {{ OWNER }}</Trans>
        ) : (
          <Trans>Boa noite, {{ OWNER }}</Trans>
        )}
      </Text>
    </View>
  );
}
