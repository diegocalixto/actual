import React from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type DatePillProps = {
  /** Already-localised short label: "Hoje", "Ontem", "24 ago". */
  children: string;
};

/**
 * The date column of the activity list.
 *
 * A fixed-width, centred chip rather than free text: with four different label
 * lengths ("Hoje" to "24 ago") loose text made every row start and end its date
 * somewhere else, and the column read as debris between two connectors. Cold
 * blue on an almost-invisible surface keeps it legible without competing with
 * the amounts.
 */
export function DatePill({ children }: DatePillProps) {
  return (
    <View
      style={{
        flex: '0 0 74px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 0',
        borderRadius: 999,
        backgroundColor: 'rgba(90, 140, 210, 0.10)',
        border: '1px solid rgba(120, 165, 220, 0.16)',
      }}
    >
      <Text
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          letterSpacing: 0.1,
          whiteSpace: 'nowrap',
          color: '#7ba7dd',
        }}
      >
        {children}
      </Text>
    </View>
  );
}
