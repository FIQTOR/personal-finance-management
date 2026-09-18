export const getCurrencySymbol = (currency: string = 'USD'): string => {
  switch (currency.toUpperCase()) {
    case 'IDR':
      return 'Rp ';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'USD':
    default:
      return '$';
  }
};

export const formatAmountWithCurrency = (amount: number | string, currency: string = 'USD'): string => {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toLocaleString()}`;
};
