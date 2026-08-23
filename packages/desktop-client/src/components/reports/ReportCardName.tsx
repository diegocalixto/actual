import React from 'react';
import { useTranslation } from 'react-i18next';

import { InitialFocus } from '@actual-app/components/initial-focus';
import { Input } from '@actual-app/components/input';
import { styles } from '@actual-app/components/styles';
import type { DashboardWidgetEntity } from '@actual-app/core/types/models';

import { NON_DRAGGABLE_AREA_CLASS_NAME } from './constants';
import { localizeDefaultWidgetName } from './defaultDashboardText';

type ReportCardNameProps = {
  name: string;
  /**
   * Used to tell a still-default name apart from one the user typed. Omitting
   * it means nothing is translated, which is the safe outcome.
   */
  widgetType?: DashboardWidgetEntity['type'];
  isEditing: boolean;
  onChange: (newName: string) => void;
  onClose: () => void;
};

export const ReportCardName = ({
  name,
  widgetType,
  isEditing,
  onChange,
  onClose,
}: ReportCardNameProps) => {
  const { t } = useTranslation();

  const displayName = localizeDefaultWidgetName(name, widgetType, t);

  // The editor shows the same text the card shows, so a still-default name is
  // not suddenly in English here. `Input` calls `onUpdate` on every blur, so
  // leaving the field untouched would otherwise persist the translation as if
  // the user had typed it: when the value comes back unchanged, save the raw
  // stored name instead, which is exactly what the field did before.
  const onSave = (newName: string) =>
    onChange(newName === displayName ? name : newName);

  if (isEditing) {
    return (
      <InitialFocus>
        <Input
          className={NON_DRAGGABLE_AREA_CLASS_NAME}
          defaultValue={displayName}
          onEnter={onSave}
          onUpdate={onSave}
          onEscape={onClose}
          style={{
            ...styles.mediumText,
            marginTop: -6,
            marginBottom: -1,
            marginLeft: -6,
            width: Math.max(20, displayName.length) + 'ch',
          }}
        />
      </InitialFocus>
    );
  }

  return (
    <h2
      style={{
        display: 'block',
        margin: 0,
        padding: 0,
        ...styles.mediumText,
        marginBottom: 5,
      }}
    >
      {displayName}
    </h2>
  );
};
