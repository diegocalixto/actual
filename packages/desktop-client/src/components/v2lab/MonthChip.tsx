import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { SvgCalendar3 } from '@actual-app/components/icons/v2';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

import { MonthStepButton } from './MonthStepButton';

type MonthChipProps = {
  label: string;
  onPrevious?: () => void;
  onNext?: () => void;
  /**
   * Whether there is a month to step to on each side. Absent ⇒ there is,
   * which is how the Budget uses the chip. The Reports stop at the first
   * transaction and at the current month, and an arrow that led nowhere is
   * shown as one that cannot be pressed.
   */
  canGoPrevious?: boolean;
  canGoNext?: boolean;
};

/**
 * The month a page is about.
 *
 * The arrows appear only when there is somewhere to go: in the laboratory there
 * is one month of fixtures, and a chevron that changed the caption without
 * changing a single number would be worse than no chevron at all.
 *
 * Shared by the Budget and the Reports, so the two pages step through months
 * with one control.
 */
export function MonthChip({
  label,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
}: MonthChipProps) {
  const { t } = useTranslation();
  const steppable = onPrevious != null && onNext != null;

  return (
    <View
      style={{
        flex: '0 0 auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: steppable ? 4 : 9,
        padding: steppable ? '5px 8px' : '9px 16px',
        borderRadius: 999,
        backgroundColor: 'var(--dfl-surface-raised)',
        border: '1px solid var(--dfl-line-strong)',
        boxShadow: 'var(--dfl-shadow)',
      }}
    >
      {steppable && (
        <MonthStepButton
          Icon={SvgCheveronLeft}
          label={t('Mês anterior')}
          onPress={onPrevious}
          isDisabled={!canGoPrevious}
        />
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          padding: steppable ? '0 6px' : 0,
        }}
      >
        <SvgCalendar3
          aria-hidden="true"
          width={15}
          height={15}
          style={{ color: 'var(--dfl-blue)' }}
        />
        <Text
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: -0.1,
            whiteSpace: 'nowrap',
            color: 'var(--dfl-text)',
          }}
        >
          {label}
        </Text>
      </View>

      {steppable && (
        <MonthStepButton
          Icon={SvgCheveronRight}
          label={t('Próximo mês')}
          onPress={onNext}
          isDisabled={!canGoNext}
        />
      )}
    </View>
  );
}
