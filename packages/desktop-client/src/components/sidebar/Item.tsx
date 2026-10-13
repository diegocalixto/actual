// @ts-strict-ignore
import React from 'react';
import type {
  ComponentProps,
  ComponentType,
  CSSProperties,
  ReactNode,
  SVGProps,
} from 'react';

import { Block } from '@actual-app/components/block';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { ItemContent } from './ItemContent';

/** Horizontal inset of the row surface from the sidebar edges. */
export const sidebarItemInset = 8;
export const sidebarItemRadius = 6;

/**
 * Sidebar values are blended against the sidebar's own background rather
 * than hardcoded, so every theme gets a step of the same weight: Light's
 * sidebar is navy, not near-black, and a value tuned for Dark lands darker
 * than the surface it is meant to lift.
 */
const blend = (percent: number) =>
  `color-mix(in srgb, ${theme.sidebarItemText} ${percent}%, ${theme.sidebarBackground})`;

/**
 * The sidebar's only rules: the accounts divider and the on/off-budget
 * underline. A hairline separates the groups without competing with them.
 */
export const sidebarHairline = blend(16);

/**
 * Navigation rests dimmed and comes to full strength on hover and when
 * selected. That contrast step — not the surface alone — is what makes the
 * active row read as selected, and it lets the chrome recede behind the
 * account balances below it.
 */
export const sidebarItemTextResting = blend(62);

export const sidebarItemHoverStyle: CSSProperties = {
  backgroundColor: theme.sidebarItemBackgroundHover,
  color: theme.sidebarItemText,
};

/**
 * Selection is a tinted surface plus an accent rule drawn as an inset
 * shadow, so the box model stays identical in normal, hover and active
 * states. The label goes bright rather than accent-coloured: on a tinted
 * surface the accent is the *least* legible text in the sidebar, which left
 * the selected row weaker than every row around it.
 */
export const sidebarItemSelectedStyle: CSSProperties = {
  backgroundColor: `color-mix(in srgb, ${theme.sidebarItemAccentSelected} 14%, ${theme.sidebarItemBackgroundHover})`,
  color: theme.sidebarItemText,
  fontWeight: 600,
  boxShadow: `inset 3px 0 0 ${theme.sidebarItemAccentSelected}`,
};

type ItemProps = {
  title: string;
  Icon:
    | ComponentType<SVGProps<SVGElement>>
    | ComponentType<SVGProps<SVGSVGElement>>;
  to?: string;
  children?: ReactNode;
  style?: CSSProperties;
  indent?: number;
  onClick?: ComponentProps<typeof ItemContent>['onClick'];
  forceHover?: boolean;
  forceActive?: boolean;
};

export function Item({
  children,
  Icon,
  title,
  style,
  to,
  onClick,
  indent = 0,
  forceHover = false,
  forceActive = false,
}: ItemProps) {
  const hoverStyle = sidebarItemHoverStyle;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 20,
      }}
    >
      <Icon width={15} height={15} />
      <Block style={{ marginLeft: 8 }}>{title}</Block>
      <View style={{ flex: 1 }} />
    </View>
  );

  return (
    <View
      style={{
        flexShrink: 0,
        margin: `0 ${sidebarItemInset}px 2px`,
        // Hover lives here rather than on the row so it reaches the <Button>
        // branch too, whose styles are applied inline and cannot carry a
        // pseudo-class. Skipping the active row keeps its selected surface.
        '&:hover > a:not([aria-current="page"]), &:hover > button': hoverStyle,
        '& > a:focus-visible, & > button:focus-visible': {
          outline: `2px solid ${theme.sidebarItemAccentSelected}`,
          outlineOffset: -2,
        },
        ...style,
      }}
    >
      <ItemContent
        style={{
          ...styles.mediumText,
          paddingTop: 9,
          paddingBottom: 9,
          paddingLeft: 19 - sidebarItemInset + indent,
          paddingRight: 10,
          borderRadius: sidebarItemRadius,
          textDecoration: 'none',
          color: sidebarItemTextResting,
          ...(forceHover ? hoverStyle : {}),
        }}
        forceActive={forceActive}
        activeStyle={sidebarItemSelectedStyle}
        to={to}
        onClick={onClick}
      >
        {content}
      </ItemContent>
      {children ? <View style={{ marginTop: 5 }}>{children}</View> : null}
    </View>
  );
}
