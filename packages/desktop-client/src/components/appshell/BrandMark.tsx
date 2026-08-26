import React from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { shellColors } from './shellTheme';

/**
 * The product's identity mark.
 *
 * `Diego Finance` is the product; the budget file's name — "My Finances" or
 * whatever the user called it — is a workspace, and is rendered separately by
 * `WorkspaceChip`. Actual's shell conflated the two by putting the budget name
 * where a logo goes, which is the single biggest reason the app read as
 * somebody else's product.
 */
const PRODUCT_NAME = 'Diego Finance';
const MONOGRAM = 'DF';
/** Split once so the two rail lines stay in sync with the name above. */
const [PRODUCT_FIRST, PRODUCT_SECOND] = PRODUCT_NAME.split(' ');

type BrandMarkProps = {
  size?: number;
  /** Renders the wordmark beside the monogram. */
  withWordmark?: boolean;
  /** Stacks the wordmark under the monogram, for the narrow rail. */
  stacked?: boolean;
};

export function BrandMark({
  size = 34,
  withWordmark = false,
  stacked = false,
}: BrandMarkProps) {
  const monogram = (
    <View
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: shellColors.brandGradient,
        // A hairline of the page's own ink keeps the tile from looking pasted
        // onto the rail at small sizes.
        boxShadow: `inset 0 0 0 1px ${shellColors.borderStrong}`,
      }}
    >
      <Text
        style={{
          fontSize: size * 0.4,
          fontWeight: 800,
          letterSpacing: -0.4,
          color: '#08121c',
        }}
      >
        {MONOGRAM}
      </Text>
    </View>
  );

  if (!withWordmark) {
    return (
      <View aria-label={PRODUCT_NAME} role="img">
        {monogram}
      </View>
    );
  }

  return (
    <View
      role="img"
      aria-label={PRODUCT_NAME}
      style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? 7 : 10,
      }}
    >
      {monogram}
      {stacked ? (
        // Two lines at the rail's width. Uppercase and letterspaced so it reads
        // as a wordmark rather than as a truncated label.
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Text style={WORDMARK_STACKED}>{PRODUCT_FIRST}</Text>
          <Text style={WORDMARK_STACKED}>{PRODUCT_SECOND}</Text>
        </View>
      ) : (
        <Text
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: -0.2,
            color: shellColors.textPrimary,
            whiteSpace: 'nowrap',
          }}
        >
          {PRODUCT_NAME}
        </Text>
      )}
    </View>
  );
}

const WORDMARK_STACKED = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 1.1,
  lineHeight: 1.15,
  textTransform: 'uppercase',
  color: shellColors.textSecondary,
} as const;

/**
 * The product name on its own, for places that already sit next to the app
 * mark — the desktop header, which the rail's tile is directly above.
 */
export function BrandWordmark() {
  return (
    <Text
      style={{
        fontSize: 15.5,
        fontWeight: 700,
        letterSpacing: -0.2,
        color: shellColors.textPrimary,
        whiteSpace: 'nowrap',
      }}
    >
      {PRODUCT_NAME}
    </Text>
  );
}
