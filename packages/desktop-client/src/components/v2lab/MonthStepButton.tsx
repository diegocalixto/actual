import React from 'react';
import type { ComponentType, SVGProps } from 'react';

type MonthStepButtonProps = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** The button is a bare glyph, so this is the only name it has. */
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
};

/** One of the two arrows of a `MonthChip`. */
export function MonthStepButton({
  Icon,
  label,
  onPress,
  isDisabled = false,
}: MonthStepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      disabled={isDisabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        borderRadius: 999,
        cursor: isDisabled ? 'default' : 'pointer',
        color: 'var(--dfl-text-2)',
        background: 'transparent',
        // Still there, so the chip keeps its shape; plainly not on offer.
        opacity: isDisabled ? 0.35 : 1,
      }}
    >
      <Icon aria-hidden="true" width={16} height={16} />
    </button>
  );
}
