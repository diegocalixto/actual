import React from 'react';
import type { CSSProperties } from 'react';

/** The symbol's own proportions: 573 × 433 design units. */
export const MONOGRAM_RATIO = 433 / 573;
export const BRAND_PURPLE = '#8F59FB';
export const BRAND_BLUE = '#4DA0F9';
/** The dark ground the mark was drawn on; the app icons use it. */
export const BRAND_INK = '#080C14';

type DiegoFinanceMonogramProps = {
  /** Rendered width, in px; the height follows the symbol's own ratio. */
  width: number;
  /**
   * The accessible name, when the symbol stands alone. Left out, the symbol
   * is decorative and whatever sits beside it (the wordmark) names the brand.
   */
  label?: string;
  style?: CSSProperties;
};

/**
 * The DF monogram, the product's symbol: a purple D in front of a blue F,
 * the F's top bar cut by an arc that follows the D and its lower part set
 * against the D. The geometry is the one measured on the reference artwork
 * and is the same as `public/logo-df.svg`, from which `bin/brand-icons.mjs`
 * renders the favicon and the app icons; the two must change together.
 */
export function DiegoFinanceMonogram({
  width,
  label,
  style,
}: DiegoFinanceMonogramProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 573 433"
      width={width}
      height={Math.round(width * MONOGRAM_RATIO)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <path
        fill={BRAND_BLUE}
        d="M310 230A60 60 0 0 1 370 170H525A18 18 0 0 1 543 188V202A60 60 0 0 1 483 262H393V322A110 110 0 0 1 283 432H174L174 420L304 300V230Z"
      />
      <path
        fill={BRAND_BLUE}
        d="M226 0H551A21 21 0 0 1 572 21A80 80 0 0 1 492 101H317A177 177 0 0 0 226 0Z"
      />
      <path
        fill={BRAND_PURPLE}
        fillRule="evenodd"
        d="M24 0H150A160 160 0 0 1 310 160V296A136 136 0 0 1 174 432H40A40 40 0 0 1 0 392V24A24 24 0 0 1 24 0ZM91 102H148A95 95 0 0 1 243 197V252A76 76 0 0 1 167 328H91Z"
      />
    </svg>
  );
}
