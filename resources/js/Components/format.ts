export function formatCurrencyMWK(amount: number | string): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (!isFinite(numeric as number)) {
    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: 'MWK',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0);
  }
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric as number);
}

export function formatDateMW(locale: string = 'en-MW', date?: Date | string | number): string {
  const d = date ? new Date(date) : new Date();
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export const LOCALE_MW = 'en-MW';

