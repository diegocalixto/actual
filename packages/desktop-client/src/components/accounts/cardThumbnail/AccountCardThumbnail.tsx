import React, { useId } from 'react';

import { View } from '@actual-app/components/view';

import type { AccountCardBrand } from '#accounts/accountCardBrand';

type AccountCardThumbnailProps = {
  brand: AccountCardBrand;
  /**
   * The footprint of the icon tile this replaces. The card spans its full
   * width and sits centred in a square of that size, so the name beside it
   * starts where it always did and the row keeps its height.
   */
  size: number;
};

type CardLook = {
  /** Top-left and bottom-right of the card's face. */
  face: [string, string];
  edge: string;
  chip: [string, string];
  ink: string;
  wordmark: string;
};

/**
 * Stylised cards, not reproductions: a gradient face, a chip and the bank's
 * name set in the interface's own font. No logo artwork, no number, no holder.
 */
const LOOKS: Record<AccountCardBrand, CardLook> = {
  // Graphite falling to black, with a warm metallic ink — the segment's
  // dark-and-gold reading, kept quiet enough to sit on the dark surface.
  'itau-personnalite': {
    face: ['#34373e', '#0d0e11'],
    edge: 'rgba(214, 178, 116, 0.42)',
    chip: ['#e3c48a', '#a9834a'],
    ink: '#d9b77a',
    wordmark: 'Itaú',
  },
  itau: {
    face: ['#f2801f', '#b84d02'],
    edge: 'rgba(255, 214, 170, 0.35)',
    chip: ['#f6dfae', '#c9a465'],
    ink: '#ffffff',
    wordmark: 'Itaú',
  },
  nubank: {
    face: ['#9b3fe0', '#4f0d88'],
    edge: 'rgba(214, 180, 255, 0.35)',
    chip: ['#eee3c8', '#bba57a'],
    ink: '#ffffff',
    wordmark: 'Nu',
  },
};

/**
 * A small picture of the account's card, drawn where the icon tile would be.
 *
 * Decorative: the account's name, right beside it, is the row's label, so the
 * picture is hidden from assistive technology and says nothing new to it.
 */
export function AccountCardThumbnail({
  brand,
  size,
}: AccountCardThumbnailProps) {
  const look = LOOKS[brand];
  // Gradient ids must be unique per instance; React's ids carry colons, which
  // a `url(#…)` reference does not need to deal with.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const faceId = `${id}-face`;
  const shineId = `${id}-shine`;
  const chipId = `${id}-chip`;

  return (
    <View
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width={size}
        height={Math.round(size * 0.625)}
        viewBox="0 0 48 30"
        style={{
          display: 'block',
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45))',
        }}
      >
        <defs>
          <linearGradient id={faceId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={look.face[0]} />
            <stop offset="1" stopColor={look.face[1]} />
          </linearGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={chipId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={look.chip[0]} />
            <stop offset="1" stopColor={look.chip[1]} />
          </linearGradient>
        </defs>

        <rect
          x="0.5"
          y="0.5"
          width="47"
          height="29"
          rx="4.5"
          fill={`url(#${faceId})`}
          stroke={look.edge}
        />
        <rect
          x="0.5"
          y="0.5"
          width="47"
          height="29"
          rx="4.5"
          fill={`url(#${shineId})`}
        />

        <rect
          x="6"
          y="12"
          width="9"
          height="7"
          rx="1.6"
          fill={`url(#${chipId})`}
        />
        <path
          d="M6 15.5h9M10.5 12v7"
          stroke="rgba(0, 0, 0, 0.28)"
          strokeWidth="0.6"
        />

        <text
          x="42"
          y="11.5"
          textAnchor="end"
          fill={look.ink}
          fontSize="10"
          fontWeight="700"
          letterSpacing="-0.2"
          fontFamily="inherit"
        >
          {look.wordmark}
        </text>
      </svg>
    </View>
  );
}
