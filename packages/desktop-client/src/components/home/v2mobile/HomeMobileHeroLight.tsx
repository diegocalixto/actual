import React from 'react';

/**
 * The reflection on the hero, exactly as approved in the laboratory.
 *
 * One highlight, not a family of them. Light landing on a curved, machined
 * surface makes a single elongated specular sweep: a wide, soft body of light
 * with one crisp edge where the surface turns away, sitting inside a bloom that
 * has no edge at all. Drawing several thin concentric curves instead produces
 * rays — a head-up display, not metal — so the arc here is stroked four times
 * along the same path at falling widths and rising sharpness, and only the last
 * of those is thin enough to read as a line.
 *
 * The bright part of the gradient is deliberately short. A highlight that runs
 * the whole length of the curve reads as a drawn stroke; one that arrives,
 * peaks and leaves reads as light.
 *
 * `preserveAspectRatio="none"` lets the card set the shape: the arc stretches
 * with the surface instead of keeping a circle's geometry at every width.
 */
export function HomeMobileHeroLight() {
  // The path every layer shares. One curve, entering top-centre-right and
  // leaving through the bottom-right corner.
  const arc = 'M 196 -26 C 286 22, 350 70, 412 158';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 170"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {/* The body of the light: cold, dim, and never white. */}
        <linearGradient id="dfmSheen" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="var(--dfl-blue)" stopOpacity="0" />
          <stop offset="38%" stopColor="#9cc4f5" stopOpacity="0.5" />
          <stop offset="72%" stopColor="var(--dfl-blue)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--dfl-blue)" stopOpacity="0" />
        </linearGradient>

        {/* The edge where the surface turns away. Brighter, and brief. */}
        <linearGradient id="dfmEdge" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#cfe4ff" stopOpacity="0" />
          <stop offset="30%" stopColor="#dcebff" stopOpacity="0.72" />
          <stop offset="48%" stopColor="#cfe4ff" stopOpacity="0.34" />
          <stop offset="76%" stopColor="var(--dfl-blue)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--dfl-blue)" stopOpacity="0" />
        </linearGradient>

        {/* Ambient bloom: wide, shallow, centred where the light arrives. */}
        <radialGradient id="dfmGlow" cx="0.8" cy="0.16" r="0.95">
          <stop
            offset="0%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0.42"
          />
          <stop
            offset="46%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0.13"
          />
          <stop
            offset="100%"
            stopColor="var(--dfl-blue-deep)"
            stopOpacity="0"
          />
        </radialGradient>

        <filter id="dfmWide" x="-60%" y="-90%" width="220%" height="320%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
        <filter id="dfmMid" x="-50%" y="-80%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="dfmNear" x="-30%" y="-60%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <rect x="0" y="0" width="400" height="170" fill="url(#dfmGlow)" />

      {/* Four passes along one curve: the sweep, its falloff, the halo, and
          finally the edge itself. Each is narrower and sharper than the last. */}
      <path
        d={arc}
        fill="none"
        stroke="url(#dfmSheen)"
        strokeWidth="38"
        strokeLinecap="round"
        filter="url(#dfmWide)"
        opacity="0.5"
      />
      <path
        d={arc}
        fill="none"
        stroke="url(#dfmSheen)"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#dfmMid)"
        opacity="0.62"
      />
      <path
        d={arc}
        fill="none"
        stroke="url(#dfmEdge)"
        strokeWidth="4.5"
        strokeLinecap="round"
        filter="url(#dfmNear)"
        opacity="0.7"
      />
      <path
        d={arc}
        fill="none"
        stroke="url(#dfmEdge)"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
