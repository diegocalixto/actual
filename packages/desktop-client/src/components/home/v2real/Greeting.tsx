import React from 'react';
import { Trans } from 'react-i18next';

/** The line above the page title. Reads the clock, nothing else. */
export function Greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return <Trans>Good morning</Trans>;
  }
  if (hour < 18) {
    return <Trans>Good afternoon</Trans>;
  }
  return <Trans>Good evening</Trans>;
}
