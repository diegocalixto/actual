import React, { createContext, useContext, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { styles } from '@actual-app/components/styles';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { BrandMark } from '#components/appshell/BrandMark';
import { shellColors } from '#components/appshell/shellTheme';

const HEADER_HEIGHT = 50;

// The app opts into `viewport-fit=cover` and ships `display: standalone`, so on
// an iPhone the web content is laid out *under* the status bar and the Dynamic
// Island. Reserve that strip above the header's useful height rather than
// inside it: the padding pushes the title row down, and the matching extra
// height keeps that row exactly HEADER_HEIGHT tall. Both terms collapse to the
// current layout wherever the inset resolves to 0 (desktop, Android, a plain
// Safari tab).
const SAFE_AREA_TOP = 'env(safe-area-inset-top, 0px)';
const HEADER_BOX_HEIGHT = `calc(${HEADER_HEIGHT}px + ${SAFE_AREA_TOP})`;

// Header buttons drew a ~30px box, well under a comfortable touch target.
// Growing the box to 44px while shrinking the margin by the same amount keeps
// the icon's centre exactly where it was inside a HEADER_HEIGHT-tall header —
// the hit area grows, nothing moves.
const HEADER_BUTTON_SIZE = 44;
const HEADER_BUTTON_MARGIN = (HEADER_HEIGHT - HEADER_BUTTON_SIZE) / 2;

/** Icon-only header buttons: a square target, icon centre unchanged. */
export const mobileHeaderIconButtonStyle: CSSProperties = {
  margin: HEADER_BUTTON_MARGIN,
  minWidth: HEADER_BUTTON_SIZE,
  minHeight: HEADER_BUTTON_SIZE,
};

/**
 * Header buttons that carry a label, or sit against the leading edge, keep
 * their horizontal margin so the content does not shift; only the height grows.
 */
export const mobileHeaderLabelButtonStyle: CSSProperties = {
  marginTop: HEADER_BUTTON_MARGIN,
  marginBottom: HEADER_BUTTON_MARGIN,
  marginLeft: 10,
  marginRight: 10,
  minHeight: HEADER_BUTTON_SIZE,
};

type PageHeaderProps = {
  title: ReactNode;
  style?: CSSProperties;
};

export function PageHeader({ title, style }: PageHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginLeft: 20,
        ...style,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          fontSize: 25,
          fontWeight: 500,
        }}
      >
        {typeof title === 'string' ? <Text>{title}</Text> : title}
      </View>
    </View>
  );
}

type MobilePageHeaderProps = {
  title: ReactNode;
  style?: CSSProperties;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
};

export function MobilePageHeader({
  title,
  style,
  leftContent,
  rightContent,
}: MobilePageHeaderProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        flexShrink: 0,
        height: HEADER_BOX_HEIGHT,
        paddingTop: SAFE_AREA_TOP,
        // The V2 header is chrome that belongs to the page, not a coloured slab
        // sitting on top of it: same ground as the canvas, separated by a
        // hairline. It is what stops the phone reading as the upstream app the
        // moment the screen lights up.
        backgroundColor: shellColors.canvas,
        borderBottom: `1px solid ${shellColors.railBorder}`,
        '& *': {
          color: shellColors.textPrimary,
        },
        '& button[data-pressed]': {
          backgroundColor: shellColors.surfaceSunken,
        },
        ...style,
      }}
    >
      <View
        style={{
          flexBasis: '25%',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
          paddingLeft: leftContent ? 0 : 14,
        }}
      >
        {/* Pages that bring their own leading control (a back button, a month
            picker) keep it; the rest get the product mark, so the brand is
            present on every screen a phone opens on. */}
        {leftContent ?? <BrandMark size={26} />}
      </View>
      <h1
        style={{
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          flexBasis: '50%',
          fontSize: 17,
          fontWeight: 500,
          overflowY: 'auto',
          display: 'flex',
          margin: 0,
          padding: 0,
        }}
      >
        {title}
      </h1>
      <View
        style={{
          flexBasis: '25%',
          justifyContent: 'flex-end',
          flexDirection: 'row',
        }}
      >
        {rightContent}
      </View>
    </View>
  );
}

// On mobile the page header element stays mounted while navigating between
// pages so its background doesn't flash while the next page renders. Pages
// render their header into a single persistent `<MobilePageHeaderSlot />`
// (rendered by the app shell) through a portal. Without a provider (e.g. in
// tests or storybook) the header is rendered inline instead.
const MobilePageHeaderSlotContext = createContext<HTMLElement | null>(null);
const MobilePageHeaderSlotRefContext = createContext<
  ((element: HTMLElement | null) => void) | null
>(null);

export function MobilePageHeaderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <MobilePageHeaderSlotRefContext.Provider value={setSlot}>
      <MobilePageHeaderSlotContext.Provider value={slot}>
        {children}
      </MobilePageHeaderSlotContext.Provider>
    </MobilePageHeaderSlotRefContext.Provider>
  );
}

type MobilePageHeaderSlotProps = {
  style?: CSSProperties;
};

export function MobilePageHeaderSlot({ style }: MobilePageHeaderSlotProps) {
  const slotRef = useContext(MobilePageHeaderSlotRefContext);
  return (
    <View
      ref={slotRef ?? undefined}
      style={{
        flexShrink: 0,
        minHeight: HEADER_BOX_HEIGHT,
        backgroundColor: shellColors.canvas,
        ...style,
      }}
    />
  );
}

type PageProps = {
  header: ReactNode;
  style?: CSSProperties;
  padding?: number;
  children: ReactNode;
  footer?: ReactNode;
};

export function Page({ header, style, padding, children, footer }: PageProps) {
  const { isNarrowWidth } = useResponsive();
  const mobileHeaderSlot = useContext(MobilePageHeaderSlotContext);
  const childrenPadding = padding != null ? padding : isNarrowWidth ? 10 : 20;

  const headerToRender =
    typeof header === 'string' ? (
      isNarrowWidth ? (
        <MobilePageHeader title={header} />
      ) : (
        <PageHeader title={header} />
      )
    ) : (
      header
    );

  const main = (
    <View
      role="main"
      style={{
        flex: 1,
        overflowY: isNarrowWidth ? 'auto' : undefined,
        padding: `0 ${childrenPadding}px`,
      }}
    >
      {children}
    </View>
  );

  if (isNarrowWidth) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.mobilePageBackground,
          ...style,
        }}
      >
        {mobileHeaderSlot
          ? createPortal(headerToRender, mobileHeaderSlot)
          : headerToRender}
        {main}
        {footer}
      </View>
    );
  }

  return (
    <View
      style={{
        ...styles.page,
        flex: 1,
        backgroundColor: theme.pageBackground,
        ...style,
      }}
    >
      {headerToRender}
      {main}
      {footer}
    </View>
  );
}
