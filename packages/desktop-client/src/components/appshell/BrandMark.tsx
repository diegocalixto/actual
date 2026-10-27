import React from 'react';

import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { DiegoFinanceMonogram } from './DiegoFinanceMonogram';
import { shellColors } from './shellTheme';

/**
 * The product's identity mark.
 *
 * `Diego Finance` is the product; the budget file's name — "My Finances" or
 * whatever the user called it — is a workspace, and is rendered separately by
 * `WorkspaceChip`. Actual's shell conflated the two by putting the budget name
 * where a logo goes, which is the single biggest reason the app read as
 * somebody else's product.
 *
 * The mark is the DF monogram itself (`DiegoFinanceMonogram`), with no tile
 * behind it: the symbol carries its own two colors on any surface.
 */
const PRODUCT_NAME = 'Diego Finance';
/** Split once so the two rail lines stay in sync with the name above. */
const [PRODUCT_FIRST, PRODUCT_SECOND] = PRODUCT_NAME.split(' ');
/**
 * The symbol is wider than tall; drawn a little wider than the square slot it
 * replaces so it keeps the slot's visual weight.
 */
const MONOGRAM_WIDTH_PER_SIZE = 1.2;

type BrandMarkProps = {
  /** The square slot the mark sits in, in px (the symbol is drawn to fit it). */
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
  const width = Math.round(size * MONOGRAM_WIDTH_PER_SIZE);

  if (!withWordmark) {
    // Alone, the symbol is the image and carries the name itself.
    return <DiegoFinanceMonogram width={width} label={PRODUCT_NAME} />;
  }

  // Beside the wordmark the text names the brand; the symbol is decorative.
  return (
    <View
      style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? 7 : 10,
      }}
    >
      <DiegoFinanceMonogram width={width} />
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
