import React, { useRef, useState } from 'react';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { debounce } from 'es-toolkit/compat';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { useFormat } from '#hooks/useFormat';
import { useMergedRefs } from '#hooks/useMergedRefs';
import { usePrivacyMode } from '#hooks/usePrivacyMode';
import { useResizeObserver } from '#hooks/useResizeObserver';

import { ReportCardValueSkeleton } from './ReportCardValueSkeleton';

const FONT_SIZE_SCALE_FACTOR = 1.6;
const CONTAINER_MARGIN = 8;
/**
 * The figure is sized to fill its widget, which on a phone means a full-width
 * card turns one number into half a screen. Capping it keeps the number the
 * loudest thing in its own card without letting it dominate the page; on a
 * desktop dashboard the computed size lands below this anyway.
 */
const MAX_FONT_SIZE = 44;

type SummaryNumberProps = {
  value: number;
  contentType: string;
  animate?: boolean;
  suffix?: string;
  loading?: boolean;
  initialFontSize?: number;
  fontSizeChanged?: (fontSize: number) => void;
};

export function SummaryNumber({
  value,
  contentType,
  animate = false,
  suffix = '',
  loading = true,
  initialFontSize = 14,
  fontSizeChanged,
}: SummaryNumberProps) {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [hasSized, setHasSized] = useState(false);
  const refDiv = useRef<HTMLDivElement>(null);
  const format = useFormat();
  const isPrivacyEnabled = usePrivacyMode();
  const isNumericValue = Number.isFinite(value);

  let displayAmount =
    contentType === 'percentage'
      ? format(Math.abs(value), 'number')
      : format(Math.abs(Math.round(value)), 'financial');

  displayAmount += suffix;

  const handleResize = debounce(() => {
    if (!refDiv.current) return;

    const { clientWidth, clientHeight } = refDiv.current;
    const width = clientWidth; // no margin required on left and right
    const height = clientHeight - CONTAINER_MARGIN * 2; // account for margin top and bottom

    const calculatedFontSize = Math.min(
      (width * FONT_SIZE_SCALE_FACTOR) / displayAmount.toString().length,
      height, // Ensure the text fits vertically by using the height as the limiting factor
      MAX_FONT_SIZE,
    );

    if (calculatedFontSize > 0) {
      setFontSize(calculatedFontSize);
      setHasSized(true);
    }

    if (calculatedFontSize !== initialFontSize && fontSizeChanged) {
      fontSizeChanged(calculatedFontSize);
    }
  }, 100);

  const ref = useResizeObserver(handleResize);
  const mergedRef = useMergedRefs(ref, refDiv);

  return (
    <>
      {loading && <ReportCardValueSkeleton />}
      {!loading && (
        <View
          ref={mergedRef as Ref<HTMLDivElement>}
          // The figure below is hidden from assistive technology and this
          // label speaks for it, so under privacy mode the label must not
          // spell out what the screen is hiding — zero included.
          aria-label={
            !isNumericValue
              ? t('Unknown amount')
              : isPrivacyEnabled
                ? t('Hidden amount')
                : value === 0
                  ? t('Zero amount')
                  : value < 0
                    ? t('Negative amount: {{amount}}', {
                        amount: displayAmount,
                      })
                    : t('Positive amount: {{amount}}', {
                        amount: displayAmount,
                      })
          }
          style={{
            alignItems: 'center',
            flexGrow: 1,
            flexShrink: 1,
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            fontSize,
            lineHeight: 1,
            margin: `${CONTAINER_MARGIN}px 0`,
            justifyContent: 'center',
            transition: animate ? 'font-size 0.3s ease' : '',
            color: !isNumericValue
              ? theme.reportsNumberNeutral
              : value === 0
                ? theme.reportsNumberNeutral
                : value < 0
                  ? theme.reportsNumberNegative
                  : theme.reportsNumberPositive,
          }}
        >
          {!hasSized ? (
            <ReportCardValueSkeleton />
          ) : (
            <FinancialText aria-hidden="true">
              <PrivacyFilter>{displayAmount}</PrivacyFilter>
            </FinancialText>
          )}
        </View>
      )}
    </>
  );
}
