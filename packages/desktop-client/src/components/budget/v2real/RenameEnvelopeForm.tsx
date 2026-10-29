import React, { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type RenameEnvelopeFormProps = {
  /** What is being renamed, e.g. "Category name". Already translated. */
  label: string;
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

/**
 * One name, edited in place inside the row's popover.
 *
 * It decides nothing about the name: the caller hands it to the application's
 * own save mutation, which is where a duplicate is refused. All it owns is the
 * draft, and the one rule a field can enforce by itself — a name cannot be
 * empty.
 *
 * Drawn in the menu's colours, not the page's: the popover is portalled out of
 * the page, and the page's tokens do not reach it.
 */
export function RenameEnvelopeForm({
  label,
  initialName,
  onSubmit,
  onCancel,
}: RenameEnvelopeFormProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(initialName);
  const isEmpty = draft.trim() === '';

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!isEmpty) {
      onSubmit(draft);
    }
  };

  return (
    <form onSubmit={submit} style={{ margin: 0 }}>
      <View style={{ gap: 8, padding: 10, width: 260 }}>
        <label
          htmlFor={inputId}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.menuItemTextHeader,
          }}
        >
          {label}
        </label>
        <Input
          id={inputId}
          autoFocus
          value={draft}
          onChangeValue={setDraft}
          onFocus={event => event.currentTarget.select()}
          onEscape={() => onCancel()}
          aria-invalid={isEmpty}
        />
        {isEmpty && (
          <Text style={{ fontSize: 12, color: theme.errorText }}>
            <Trans>Name is required.</Trans>
          </Text>
        )}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Button onPress={onCancel}>
            <Trans>Cancel</Trans>
          </Button>
          <Button variant="primary" type="submit" isDisabled={isEmpty}>
            <Trans>Save</Trans>
          </Button>
        </View>
      </View>
    </form>
  );
}
