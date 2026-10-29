import React, { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgCheveronDown } from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { MOBILE_TYPE } from './typeScale';

type HowWeCountProps = {
  children: ReactNode;
};

/**
 * "Como calculamos": the reckoning behind a summary, one press away.
 *
 * On a phone the lines that explain how a month was added up — the result
 * with the extraordinary inflows, the share without a category already inside
 * the spending, the refunds already deducted, the definition of the result —
 * took a third of the screen before the first chart. They are kept, word for
 * word, behind this control: a real button that says whether it is open, tied
 * to the region it opens, and a full 44px tall. What needs attention stays
 * above it, outside.
 */
export function HowWeCount({ children }: HowWeCountProps) {
  const [isOpen, setIsOpen] = useState(false);
  const regionId = useId();

  return (
    <View>
      <Button
        variant="bare"
        aria-expanded={isOpen}
        aria-controls={regionId}
        onPress={() => setIsOpen(open => !open)}
        className={css({
          width: '100%',
          minHeight: 44,
          justifyContent: 'space-between',
          gap: 8,
          padding: '0 2px',
          borderRadius: 8,
          color: 'var(--dfl-text-2)',
          '&[data-pressed]': { backgroundColor: 'var(--dfl-inset)' },
        })}
      >
        <Text style={{ fontSize: MOBILE_TYPE.note, fontWeight: 600 }}>
          <Trans>How we count</Trans>
        </Text>
        <SvgCheveronDown
          aria-hidden="true"
          width={14}
          height={14}
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : undefined,
          }}
        />
      </Button>
      <View id={regionId} style={{ display: isOpen ? 'flex' : 'none', gap: 6 }}>
        {isOpen && children}
      </View>
    </View>
  );
}
