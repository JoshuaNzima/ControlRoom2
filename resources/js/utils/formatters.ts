/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency: string = 'MWK', locale: string = 'en-MW'): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch (e) {
    return `MWK ${(Number(amount) || 0).toFixed(2)}`;
  }
};

/**
 * Format a date string
 */
export const formatDate = (dateString: string, format: 'short' | 'long' = 'short'): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    if (format === 'short') {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format a time duration
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

/**
 * Format a number with commas
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a percentage
 */
export const formatPercent = (num: number, decimals: number = 1): string => {
  return `${formatNumber(num, decimals)}%`;
};
