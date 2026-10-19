import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd } from '@actual-app/components/icons/v1';

import { mobileHeaderIconButtonStyle } from '#components/Page';
import { useNavigate } from '#hooks/useNavigate';

export function AddScheduleButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleAddSchedule = useCallback(() => {
    void navigate('/schedules/new');
  }, [navigate]);

  return (
    <Button
      variant="bare"
      aria-label={t('Add new schedule')}
      style={mobileHeaderIconButtonStyle}
      onPress={handleAddSchedule}
    >
      <SvgAdd width={20} height={20} />
    </Button>
  );
}
