// @ts-strict-ignore
import { Children, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
  ComponentPropsWithRef,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from 'react';

import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { usePrivacyMode } from '#hooks/usePrivacyMode';

type ConditionalPrivacyFilterProps = {
  children: ReactNode;
  privacyFilter?: boolean | PrivacyFilterProps;
  defaultPrivacyFilterProps?: PrivacyFilterProps;
};
export function ConditionalPrivacyFilter({
  children,
  privacyFilter,
  defaultPrivacyFilterProps,
}: ConditionalPrivacyFilterProps) {
  const renderPrivacyFilter = (children, mergedProps) => (
    <PrivacyFilter {...mergedProps}>{children}</PrivacyFilter>
  );
  return privacyFilter ? (
    typeof privacyFilter === 'boolean' ? (
      <PrivacyFilter {...defaultPrivacyFilterProps}>{children}</PrivacyFilter>
    ) : (
      renderPrivacyFilter(
        children,
        mergeConditionalPrivacyFilterProps(
          defaultPrivacyFilterProps,
          privacyFilter,
        ),
      )
    )
  ) : (
    <>{Children.toArray(children)}</>
  );
}

type PrivacyFilterProps = ComponentPropsWithRef<typeof View> & {
  activationFilters?: (boolean | (() => boolean))[];
};
export function PrivacyFilter({
  activationFilters,
  children,
  ...props
}: PrivacyFilterProps) {
  const privacyMode = usePrivacyMode();
  const activate =
    privacyMode &&
    (!activationFilters ||
      activationFilters.every(value =>
        typeof value === 'boolean' ? value : value(),
      ));

  return !activate ? (
    <>{Children.toArray(children)}</>
  ) : (
    // Keyed by the figure it prints: a reveal belongs to the value that was
    // shown on purpose, so when another one takes its place — the month was
    // turned, a sync landed — the overlay starts over, hidden.
    <PrivacyOverlay
      key={typeof children === 'string' ? children : undefined}
      {...props}
    >
      {children}
    </PrivacyOverlay>
  );
}

type RedactedContentProps = {
  children: ReactNode;
};

// Component that filters text content to remove non-alphanumeric characters
// This works by intercepting the actual rendered text via a ref and modifying it
function RedactedContent({ children }: RedactedContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      // Walk all text nodes and replace non-alphanumeric characters
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        null,
      );

      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        if (node.textContent) {
          node.textContent = node.textContent.replace(/[^a-zA-Z0-9]/g, '*');
        }
      }
    }
  }, [children]);

  return <div ref={containerRef}>{children}</div>;
}

/** How long a figure shown by a tap stays readable before it hides itself. */
const TOUCH_REVEAL_MS = 5000;

/** The figure itself in place of its redacted twin. */
const REVEALED = {
  ' > div:first-child': {
    opacity: 1,
  },
  ' > div:nth-child(2)': {
    display: 'none',
  },
};

/** A finger or a stylus: a pointer that cannot rest on a figure to read it. */
function isTouchPointer(pointerType: string) {
  return pointerType === 'touch' || pointerType === 'pen';
}

function PrivacyOverlay({ children, ...props }) {
  const { style, ...restProps } = props;
  const [isRevealed, setIsRevealed] = useState(false);
  // What the last pointer to go down on the figure was. The click that follows
  // does not say so in every browser.
  const pointerType = useRef('');

  useEffect(() => {
    if (!isRevealed) {
      return;
    }

    const hide = () => setIsRevealed(false);
    const timer = setTimeout(hide, TOUCH_REVEAL_MS);
    // Timers stand still while the page is in the background, so a figure left
    // showing would still be showing on the way back.
    const onVisibilityChange = () => {
      if (document.hidden) {
        hide();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isRevealed]);

  const onPointerDown = (event: PointerEvent) => {
    pointerType.current = event.pointerType;
    // While it is hidden the figure is its own reveal control, so whatever it
    // sits in — a row that navigates, a cell that opens a menu — must not take
    // this press. Once shown, a tap goes through as it does with the mode off.
    if (isTouchPointer(event.pointerType) && !isRevealed) {
      event.stopPropagation();
    }
  };

  const onClick = (event: MouseEvent) => {
    const wasTouch = isTouchPointer(pointerType.current);
    pointerType.current = '';
    // A mouse reveals by hovering and a keyboard has the mode's own switch.
    if (!wasTouch) {
      return;
    }

    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsRevealed(true);
  };

  return (
    <View
      className={css(
        [
          {
            display: 'inline-flex',
            flexGrow: 1,
            position: 'relative',
            ' > div:first-child': {
              opacity: 0,
            },
            ' > div:nth-child(2)': {
              display: 'flex',
            },
            // Resting the pointer on a figure shows it — where some pointer
            // can rest. A phone reports a hover after every tap and keeps it
            // until the next one, which would leave the figure showing.
            '@media (any-hover: hover)': {
              '&:hover': REVEALED,
            },
            '@media (any-hover: none)': {
              // Two taps in a row are two taps — show, then act — not a zoom.
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              // A finger is aimed at the figure, and some figures are one line
              // of small type. The target reaches a little past the ink on
              // every side; nothing on screen moves for it.
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: '-10px -8px',
              },
              // A long press would otherwise select the figure it cannot see
              // and offer to copy it or look it up.
              '&:not([data-revealed]) > div:first-child': {
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              },
            },
            '&[data-revealed]': REVEALED,
          },
        ],
        style,
      )}
      {...restProps}
      data-revealed={isRevealed || undefined}
      onPointerDown={onPointerDown}
      onPointerCancel={() => {
        pointerType.current = '';
      }}
      onClick={onClick}
    >
      <div
        className={css([
          {
            display: 'flex',
            flexGrow: 1,
          },
        ])}
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        className={css({
          flexDirection: 'column',
          fontFamily: 'Redacted Script',
          height: '100%',
          inset: 0,
          justifyContent: 'center',
          pointerEvents: 'none',
          position: 'absolute',
          width: '100%',
        })}
      >
        <RedactedContent>{children}</RedactedContent>
      </div>
    </View>
  );
}
export function mergeConditionalPrivacyFilterProps(
  defaultPrivacyFilterProps: PrivacyFilterProps = {},
  privacyFilter: ConditionalPrivacyFilterProps['privacyFilter'],
): ConditionalPrivacyFilterProps['privacyFilter'] {
  if (privacyFilter == null || privacyFilter === false) {
    return privacyFilter;
  }

  if (privacyFilter === true) {
    return defaultPrivacyFilterProps;
  }

  return merge(defaultPrivacyFilterProps, privacyFilter);
}

function merge(initialValue, ...objects) {
  return objects.reduce((prev, current) => {
    Object.keys(current).forEach(key => {
      const pValue = prev[key];
      const cValue = current[key];

      if (Array.isArray(pValue) && Array.isArray(cValue)) {
        prev[key] = pValue.concat(...cValue);
      } else if (isObject(pValue) && isObject(cValue)) {
        prev[key] = merge(pValue, cValue);
      } else {
        prev[key] = cValue;
      }
    });
    return prev;
  }, initialValue);
}

function isObject(obj) {
  return obj && typeof obj === 'object';
}
