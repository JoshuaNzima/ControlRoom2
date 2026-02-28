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

export function formatDistanceToNow(date?: Date | string | number): string {
  const d = date ? new Date(date) : new Date();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

export const LOCALE_MW = 'en-MW';

