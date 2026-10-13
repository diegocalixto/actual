import { useEffect, useState } from 'react';

import { useSpreadsheet } from '#hooks/useSpreadsheet';

/**
 * Reads a single numeric cell from an explicitly named sheet.
 *
 * The Home dashboard mixes global cells (account balances) with month cells
 * (budget totals), so it deliberately avoids `SheetNameProvider` — a provider
 * would also capture the global bindings and resolve them against the month
 * sheet. Naming the sheet per read keeps the two kinds of cells separate.
 */
export function useHomeSheetCell(
  sheetName: string,
  /** Pass `null` to skip the subscription, e.g. for a cell the active budget
   * type does not define. */
  cellName: string | null,
): number | null {
  const spreadsheet = useSpreadsheet();
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    setValue(null);

    if (cellName === null) {
      return;
    }

    return spreadsheet.bind(sheetName, cellName, result => {
      setValue(typeof result.value === 'number' ? result.value : null);
    });
  }, [spreadsheet, sheetName, cellName]);

  return value;
}
