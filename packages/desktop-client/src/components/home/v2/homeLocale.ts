import { getLocale } from '@actual-app/core/shared/locale';

/**
 * The date locale this screen writes in.
 *
 * The Home speaks Portuguese — its labels, its money and its month heading all
 * do — so its dates are written the same way: "26 ago", "fev '26". They are
 * deliberately not taken from `useLocale()`, which follows the application's
 * language preference: leaving them on it would print "26 Aug" in the middle of
 * a page that is otherwise entirely pt-BR.
 *
 * This is presentation only, scoped to the cards that import it. It reads the
 * application's own `getLocale` helper rather than reaching into date-fns, and
 * it changes no preference and no other screen.
 */
export const HOME_DATE_LOCALE = getLocale('pt-BR');
