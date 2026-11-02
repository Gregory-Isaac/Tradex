export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸', decimals: 2 },
  KES: { code: 'KES', symbol: 'KSh ', name: 'Kenyan Shilling', rate: 129.50, flag: '🇰🇪', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.77, flag: '🇬🇧', decimals: 2 },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', rate: 0.00001482, flag: '⚡', decimals: 6 },
}

export function convertFromUSD(amountUSD, currencyCode = 'USD') {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  return (Number(amountUSD) || 0) * currency.rate
}

export function convertToUSD(amountInCurrency, currencyCode = 'USD') {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  return (Number(amountInCurrency) || 0) / currency.rate
}

export function formatCurrency(amountUSD, currencyCode = 'USD', customDecimals) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  const converted = convertFromUSD(amountUSD, currencyCode)
  const decimals = customDecimals !== undefined ? customDecimals : currency.decimals

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(converted)

  return `${currency.symbol}${formatted}`
}

export function formatCompactCurrency(amountUSD, currencyCode = 'USD') {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  const converted = convertFromUSD(amountUSD, currencyCode)

  if (Math.abs(converted) >= 1_000_000_000) {
    return `${currency.symbol}${(converted / 1_000_000_000).toFixed(2)}B`
  }
  if (Math.abs(converted) >= 1_000_000) {
    return `${currency.symbol}${(converted / 1_000_000).toFixed(2)}M`
  }
  if (Math.abs(converted) >= 10_000) {
    return `${currency.symbol}${(converted / 1_000).toFixed(1)}k`
  }
  return formatCurrency(amountUSD, currencyCode)
}
