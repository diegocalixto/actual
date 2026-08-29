import React from 'react';
import type { ReactNode } from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type HomeMobileSectionLabelProps = {
  label: ReactNode;
  /** Sits at the far right of the same line: a month, a total. */
  trailing?: ReactNode;
};

/**
 * The line that names a section.
 *
 * It is a label, not a heading: small, letter-spaced and upper-cased, so it
 * organises the page without ever competing with the figures below it. The
 * trailing slot exists because every section here has one fact that belongs on
 * the title line rather than inside the panel.
 */
export function HomeMobileSectionLabel({
  label,
  trailing,
}: HomeMobileSectionLabelProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingLeft: 2,
        paddingRight: 2,
      }}
    >
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: 'var(--dfl-text)',
        }}
      >
        {label}
      </Text>
      {trailing}
    </View>
  );
}
