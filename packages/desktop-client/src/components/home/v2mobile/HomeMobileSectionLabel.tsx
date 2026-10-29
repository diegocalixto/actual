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
 * It is drawn as a label, not as a heading: small, letter-spaced and
 * upper-cased, so it organises the page without ever competing with the
 * figures below it. It is announced as a heading all the same — the page's
 * title was its only one, which left a screen reader's user no way to move
 * from one section to the next. The trailing slot exists because every section
 * here has one fact that belongs on the title line rather than inside the
 * panel.
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
        role="heading"
        aria-level={2}
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
