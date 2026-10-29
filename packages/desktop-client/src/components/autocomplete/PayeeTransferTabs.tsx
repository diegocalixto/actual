import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type PayeeTransferTabsProps = {
  isTransfer: boolean;
  onChange: (isTransfer: boolean) => void;
};

/**
 * The two things the other side of a transaction can be: somebody who was paid
 * or who paid, or another account of one's own.
 *
 * It is the payee field's "Make transfer" switch, drawn as a choice of two for
 * the phone's picker. There the list fills the sheet, and a switch under it —
 * where the desktop's popover has it — would sit below every payee there is.
 * Above the search field it is in sight before anything is typed, and says
 * which of the two the list is offering.
 */
export function PayeeTransferTabs({
  isTransfer,
  onChange,
}: PayeeTransferTabsProps) {
  const choose = (wantsTransfer: boolean) => {
    if (wantsTransfer !== isTransfer) {
      onChange(wantsTransfer);
    }
  };

  // The one chosen is filled with the colour of the form's own action; the
  // other is bare, in the sheet's text colour — the sheet is dark in every
  // theme, and a bare button's own colour is not.
  const tabStyle = (isChosen: boolean) => ({
    flex: 1,
    height: styles.mobileMinHeight,
    fontSize: 15,
    ...(!isChosen && { color: theme.menuAutoCompleteText }),
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        flexShrink: 0,
        gap: 4,
        padding: 3,
        marginBottom: 8,
        borderRadius: 7,
        border: `1px solid ${theme.pillBorder}`,
      }}
    >
      <Button
        variant={isTransfer ? 'bare' : 'primary'}
        aria-pressed={!isTransfer}
        style={tabStyle(!isTransfer)}
        onPress={() => choose(false)}
      >
        <Trans>Payee</Trans>
      </Button>
      <Button
        variant={isTransfer ? 'primary' : 'bare'}
        aria-pressed={isTransfer}
        style={tabStyle(isTransfer)}
        onPress={() => choose(true)}
      >
        <Trans>Transfer</Trans>
      </Button>
    </View>
  );
}
