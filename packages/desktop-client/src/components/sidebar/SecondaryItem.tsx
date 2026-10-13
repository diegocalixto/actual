// @ts-strict-ignore
import React from 'react';
import type {
  ComponentProps,
  ComponentType,
  CSSProperties,
  SVGProps,
} from 'react';

import { Block } from '@actual-app/components/block';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { accountNameStyle } from './Account';
import {
  sidebarItemHoverStyle,
  sidebarItemInset,
  sidebarItemRadius,
  sidebarItemSelectedStyle,
  sidebarItemTextResting,
} from './Item';
import { ItemContent } from './ItemContent';

const fontWeight = 600;

type SecondaryItemProps = {
  title: string;
  to?: string;
  Icon?:
    | ComponentType<SVGProps<SVGElement>>
    | ComponentType<SVGProps<SVGSVGElement>>;
  style?: CSSProperties;
  onClick?: ComponentProps<typeof ItemContent>['onClick'];
  bold?: boolean;
  indent?: number;
  dataTestId?: string;
};

export function SecondaryItem({
  Icon,
  title,
  style,
  to,
  onClick,
  bold,
  indent = 0,
  dataTestId,
}: SecondaryItemProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 16,
      }}
    >
      {Icon && <Icon width={12} height={12} />}
      <Block style={{ marginLeft: Icon ? 8 : 0, color: 'inherit' }}>
        {title}
      </Block>
    </View>
  );

  return (
    <View
      data-testid={dataTestId}
      style={{
        flexShrink: 0,
        margin: `0 ${sidebarItemInset}px 2px`,
        '& > a:focus-visible, & > button:focus-visible': {
          outline: `2px solid ${theme.sidebarItemAccentSelected}`,
          outlineOffset: -2,
        },
        ...style,
      }}
    >
      <ItemContent
        style={{
          ...accountNameStyle,
          marginTop: 0,
          marginBottom: 0,
          color: sidebarItemTextResting,
          paddingLeft: 14 - sidebarItemInset + indent,
          borderRadius: sidebarItemRadius,
          fontWeight: bold ? fontWeight : null,
          ':hover': sidebarItemHoverStyle,
        }}
        to={to}
        onClick={onClick}
        activeStyle={sidebarItemSelectedStyle}
      >
        {content}
      </ItemContent>
    </View>
  );
}
