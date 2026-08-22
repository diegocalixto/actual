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
 * Selection is a tinted surface instead of a left bar, so the box model is
 * identical in normal, hover and active states.
 */
export const sidebarItemSelectedStyle: CSSProperties = {
  backgroundColor: `color-mix(in srgb, ${theme.sidebarItemAccentSelected} 18%, ${theme.sidebarItemBackgroundHover})`,
  color: theme.sidebarItemTextSelected,
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
  const hoverStyle = {
    backgroundColor: theme.sidebarItemBackgroundHover,
  };

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
          color: theme.sidebarItemText,
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
