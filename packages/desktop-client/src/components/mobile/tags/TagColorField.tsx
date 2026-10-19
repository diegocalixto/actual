import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { InputField } from '#components/mobile/MobileForms';

import { isValidTagColor } from './tagRules';

// The saturated half of the desktop colour picker's palette
// (`@actual-app/components/color-picker`). Any other colour is still one hex
// code away in the field below the swatches, as it is on the desktop.
const TAG_COLORS = [
  '#690CB0',
  '#D32F2F',
  '#C2185B',
  '#7B1FA2',
  '#512DA8',
  '#303F9F',
  '#1976D2',
  '#0288D1',
  '#0097A7',
  '#00796B',
  '#388E3C',
  '#689F38',
  '#AFB42B',
  '#FBC02D',
  '#FFA000',
  '#F57C00',
  '#E64A19',
  '#5D4037',
  '#616161',
  '#455A64',
];

const SWATCH_SIZE = 44;

type TagColorFieldProps = {
  value: string | null;
  onChange: (color: string | null) => void;
  /**
   * Creating a tag may keep the theme's default colour; the desktop editor of
   * an existing tag only ever sets a colour, so editing offers the same.
   */
  allowDefault: boolean;
};

export function TagColorField({
  value,
  onChange,
  allowDefault,
}: TagColorFieldProps) {
  const { t } = useTranslation();
  const [hexText, setHexText] = useState<string | null>(null);
  const shownHex = hexText ?? value ?? '';
  const isHexInvalid =
    hexText !== null && hexText !== '' && !isValidHex(hexText);

  const choose = (color: string | null) => {
    setHexText(null);
    onChange(color);
  };

  return (
    // Never shrunk by the form's column: a squeezed swatch grid let the field
    // below cover its last row on a 375px-wide phone.
    <View style={{ gap: 12, flexShrink: 0 }}>
      {allowDefault && (
        <Button
          variant="bare"
          aria-pressed={value === null}
          onPress={() => choose(null)}
          style={{
            minHeight: SWATCH_SIZE,
            margin: '0 8px',
            justifyContent: 'flex-start',
            gap: 10,
            paddingLeft: 10,
            border: `1px solid ${
              value === null ? theme.formInputBorderSelected : theme.tableBorder
            }`,
            backgroundColor: theme.tableBackground,
            color: theme.pageText,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: theme.noteTagBackground,
              border: `1px solid ${theme.tableBorder}`,
            }}
          />
          <Text>
            <Trans>Default color</Trans>
          </Text>
        </Button>
      )}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          flexShrink: 0,
          gap: 8,
          margin: '0 8px',
        }}
      >
        {TAG_COLORS.map(color => {
          const isSelected = value?.toUpperCase() === color;
          return (
            <Button
              key={color}
              variant="bare"
              aria-label={color}
              aria-pressed={isSelected}
              onPress={() => choose(color)}
              style={({ isPressed }) => ({
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                minWidth: SWATCH_SIZE,
                padding: 0,
                borderRadius: 8,
                backgroundColor: color,
                opacity: isPressed ? 0.8 : 1,
                boxShadow: isSelected
                  ? `0 0 0 3px ${theme.tableBackground}, 0 0 0 5px ${theme.pageText}`
                  : 'inset 0 0 0 1px rgba(0, 0, 0, 0.1)',
              })}
            />
          );
        })}
      </View>
      <View>
        <InputField
          aria-label={t('Hex color')}
          style={{ height: 44 }}
          placeholder="#RRGGBB"
          value={shownHex}
          aria-invalid={isHexInvalid || undefined}
          onChangeValue={text => {
            const next = text.trim();
            setHexText(next);
            if (isValidHex(next)) {
              onChange(next);
            }
          }}
        />
        {isHexInvalid && (
          <Text
            style={{
              color: theme.errorText,
              fontSize: 13,
              marginTop: 5,
              padding: '0 8px',
            }}
          >
            <Trans>Use a six-digit hex color, like #690CB0.</Trans>
          </Text>
        )}
      </View>
    </View>
  );
}

function isValidHex(text: string) {
  return text !== '' && isValidTagColor(text);
}
