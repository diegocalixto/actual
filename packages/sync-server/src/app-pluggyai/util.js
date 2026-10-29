// Pure helpers of the Pluggy adapter, kept apart from the Express app so they
// can be unit-tested without a server or credentials.

/**
 * Calendar day (YYYY-MM-DD) of an instant in the given IANA time zone.
 *
 * Pluggy sends `date` as an instant. Checking-account entries carry the
 * operation time, so a Pix sent at 22:00 in Brasília is already the next day
 * in UTC; card entries come at local midnight. Reading the day in the bank's
 * zone keeps both on the day the statement shows.
 */
export function getDate(date, timeZone = 'UTC') {
  const instant = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = type => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function dayToUtcDate(day) {
  return new Date(`${day}T00:00:00Z`);
}

/**
 * Adds months to a YYYY-MM-DD day, clamping to the last day of the target
 * month (so the 31st plus one month does not spill into the month after).
 */
export function addMonthsClamped(day, months) {
  const result = dayToUtcDate(day);
  const dayOfMonth = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(dayOfMonth, lastDay));
  return result.toISOString().slice(0, 10);
}

const BILL_MONTH = /^\d{4}-\d{2}$/;

/** Whole months from `fromMonth` to `toMonth` (both `YYYY-MM`). */
function monthsBetween(fromMonth, toMonth) {
  const [fy, fm] = fromMonth.split('-').map(Number);
  const [ty, tm] = toMonth.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/**
 * Installment series the bank dates one by one.
 *
 * For an ordinary purchase in n installments Pluggy repeats the original
 * `purchaseDate` on every installment. A yearly fee split in twelve is
 * different: each part carries its own `purchaseDate`, one per month. The two
 * cannot be told apart from a single entry, but they can from the batch — a
 * series whose installments disagree about the purchase date is self-dated.
 * Returns the set of series keys (description without the counter, total
 * installments and amount) that are self-dated.
 */
export function selfDatedInstallmentSeries(transactions, timeZone = 'UTC') {
  const series = new Map();
  for (const trans of transactions) {
    const meta = trans?.creditCardMetadata;
    if (meta?.installmentNumber == null || !meta.purchaseDate) continue;
    const key = installmentSeriesKey(trans);
    const entry = series.get(key) ?? { days: new Set(), ownDated: true };
    const purchaseDay = getDate(meta.purchaseDate, timeZone);
    entry.days.add(purchaseDay);
    // In a self-dated series every part is posted within days of its own
    // purchase date; in an ordinary series only the first part is. Two
    // different purchases that happen to share a key fail this test, since
    // their later parts post months after their purchase dates.
    const postedDay = getDate(meta.billPostDate ?? trans.date, timeZone);
    if (daysApart(purchaseDay, postedDay) > SELF_DATED_SLACK_DAYS) {
      entry.ownDated = false;
    }
    series.set(key, entry);
  }
  return new Set(
    [...series.entries()]
      .filter(([, entry]) => entry.days.size > 1 && entry.ownDated)
      .map(([key]) => key),
  );
}

const SELF_DATED_SLACK_DAYS = 7;

function daysApart(a, b) {
  return Math.abs(Math.round((dayToUtcDate(a) - dayToUtcDate(b)) / 86_400_000));
}

/** Card, description without the counter, total installments and amount. */
export function installmentSeriesKey(trans) {
  const description = String(trans.description ?? trans.descriptionRaw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(INSTALLMENT_SUFFIX, '');
  const meta = trans.creditCardMetadata ?? {};
  return `${meta.cardNumber ?? ''}|${description}|${meta.totalInstallments ?? ''}|${Math.abs(trans.amount ?? 0)}`;
}

/**
 * Day to record an entry on.
 *
 * For an installment k/n of a purchase, Pluggy usually repeats the original
 * `purchaseDate` on every installment while `date` is the statement posting;
 * installment k then belongs k−1 months after the purchase, and that is what
 * the bank files it under. Some issuers date each installment on its own
 * (a yearly fee split in twelve): there `purchaseDate` ≈ `date`, and shifting
 * would throw the charge months ahead. A series the batch proves self-dated
 * (`selfDated`, from `selfDatedInstallmentSeries`) keeps each part's own day.
 * When only one part is visible, the bill the bank files the entry under
 * decides: the shifted day has to fall in the two months before that bill;
 * if it does not and the purchase day does, the part is self-dated.
 */
export function getTransactionDateCorrected(
  trans,
  timeZone = 'UTC',
  selfDated = new Set(),
) {
  const day = getDate(trans.date, timeZone);
  const meta = trans.creditCardMetadata;
  // Without a purchase date the entry's own date is the installment's date;
  // shifting it would move a part that is already where it belongs.
  if (meta?.installmentNumber == null || !meta.purchaseDate) {
    return day;
  }

  const purchaseDay = getDate(meta.purchaseDate, timeZone);
  if (selfDated.has(installmentSeriesKey(trans))) {
    return purchaseDay;
  }

  const shifted = addMonthsClamped(purchaseDay, meta.installmentNumber - 1);
  const bill =
    typeof meta.billForecastDate === 'string' &&
    BILL_MONTH.test(meta.billForecastDate)
      ? meta.billForecastDate
      : null;
  if (!bill) {
    return shifted;
  }
  const fitsBill = candidate => {
    const months = monthsBetween(candidate.slice(0, 7), bill);
    return months >= 0 && months <= 2;
  };
  if (fitsBill(shifted)) return shifted;
  if (fitsBill(purchaseDay)) return purchaseDay;
  return day;
}

export function flattenObject(obj, prefix = '') {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null) {
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

// Leading operation labels the banks prepend to the counterparty in the
// description ("Pix enviado FULANO", "Pagamento de Pix QR Code FULANO",
// "Compra débito LOJA", "TED recebida EMPRESA").
const OPERATION_PREFIXES = [
  /^pix\s+(enviado|recebido)\b/i,
  // "Pagamento de Pix QR Code X", "Pagamento de boleto X", "Pagamento de seguro X"
  /^pagamento\s+de\s+\S+(\s+qr\s+code)?\b/i,
  /^compra\s+(no\s+)?(d[eé]bito|cr[eé]dito)\b/i,
  /^(ted|doc)\s+(recebid[ao]|enviad[ao])\b/i,
  /^transfer[eê]ncia\s+(enviada|recebida)(\s+pelo\s+pix)?\b/i,
];

// Some banks (Nubank) put the operation label before a bar and the
// counterparty after it, followed by its institution: "Transferência enviada
// pelo Pix|Fulano de Tal - Banco X (0260) Agência: 1 Conta: 2-3".
const LABEL_BAR = /^[^|]*\|\s*/;
const INSTITUTION_SUFFIX = /\s+[-–]\s+.*$/;

// Installment counter card issuers append to the description ("LOJA 02/12",
// sometimes glued to the name: "LOJA02/12").
const INSTALLMENT_SUFFIX = /(?<!\d)\s*\d{1,2}\/\d{1,2}$/;

// CPF/CNPJ (plain, formatted or partially masked) and nothing else.
const DOCUMENT_NUMBER_ONLY = /^[\d.\-/*•\s]+$/;

export function isDocumentNumber(value) {
  const text = String(value ?? '').trim();
  return text !== '' && DOCUMENT_NUMBER_ONLY.test(text);
}

/**
 * Counterparty taken from the bank's description: the operation label in
 * front and the installment counter at the end are dropped when something
 * remains; otherwise the description stands. The full text stays in the notes.
 */
export function cleanPayeeName(description) {
  const text = String(description ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (LABEL_BAR.test(text)) {
    const counterparty = text
      .replace(LABEL_BAR, '')
      .replace(INSTITUTION_SUFFIX, '')
      .trim();
    if (counterparty) {
      return counterparty;
    }
  }
  const withoutInstallment = text.replace(INSTALLMENT_SUFFIX, '').trim();
  const base = withoutInstallment || text;
  for (const prefix of OPERATION_PREFIXES) {
    if (!prefix.test(base)) {
      continue;
    }
    const rest = base
      .replace(prefix, '')
      .replace(/^[\s\-:–]+/, '')
      .trim();
    if (rest) {
      return rest;
    }
  }
  return base;
}

/**
 * Payee for an entry: the named counterparty of a transfer, then the bank's
 * own description (what the statement prints, so it matches entries typed
 * from statements and the schedules built from them), then the merchant
 * record — usually the legal name ("SBF COMERCIO DE PRODUTOS ESPORTIVOS S.A."
 * for a sports shop), which the statement never shows. A document number is
 * never used as a name: a CPF is not who the money went to, and it would
 * expose third parties in the payee list.
 */
export function getPayeeName(trans) {
  if (trans.paymentData) {
    const { receiver, payer } = trans.paymentData;
    const counterparty = trans.type === 'DEBIT' ? receiver : payer;
    if (counterparty?.name && !isDocumentNumber(counterparty.name)) {
      return counterparty.name;
    }
  }

  const fromDescription = cleanPayeeName(
    trans.description || trans.descriptionRaw,
  );
  if (fromDescription && !isDocumentNumber(fromDescription)) {
    return fromDescription;
  }

  if (trans.merchant && (trans.merchant.name || trans.merchant.businessName)) {
    return trans.merchant.name || trans.merchant.businessName;
  }

  return '';
}
