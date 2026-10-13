import React from 'react';

type BudgetMobileRingProps = {
  /** Whole percent of the plan already used. May exceed 100. */
  percent: number;
  size: number;
};

/**
 * How much of the plan has been used, as a ring.
 *
 * The ring is information, not ornament: its swept angle is the percentage
 * beside it, so the two can never disagree. It is drawn as one track and one
 * arc, both with round caps, and the arc is a `stroke-dasharray` fraction of
 * the circumference rather than an animation or a gradient sweep — a shape that
 * says a number, not a light effect.
 *
 * Past 100% the arc saturates at a full turn. A ring that wrapped a second time
 * would read as 20%, not as 120%, and the figure in the middle is what carries
 * the overshoot.
 */
export function BudgetMobileRing({ percent, size }: BudgetMobileRingProps) {
  const stroke = Math.max(5, Math.round(size * 0.085));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const swept = Math.min(Math.max(percent, 0), 100) / 100;

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="dfmbRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c9b6ff" />
          <stop offset="100%" stopColor="var(--dfl-violet)" />
        </linearGradient>
      </defs>

      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.13)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#dfmbRing)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference * swept} ${circumference}`}
        // Starts at twelve o'clock rather than at three, which is where a
        // reader expects a dial to begin.
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
