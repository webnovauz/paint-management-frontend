// Утилиты для работы с валютой
export const CURRENCY = {
  symbol: 'сум', // Узбекский сум
  code: 'UZS',
  locale: 'uz-UZ' // Узбекская локаль
};

// Очистка данных от рублевых символов
export function cleanCurrencyData(data: unknown): unknown {
  if (typeof data === 'string') {
    return data.replace(/₽/g, '').replace(/RUB/g, 'UZS').replace(/рубл/g, 'сум');
  }
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => cleanCurrencyData(item));
    } else {
      const cleaned: Record<string, unknown> = {};
      for (const key in data) {
        cleaned[key] = cleanCurrencyData((data as Record<string, unknown>)[key]);
      }
      return cleaned;
    }
  }
  return data;
}

// Форматирование суммы в узбекских сумах
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[₽\s]/g, '')) : amount;
  
  if (isNaN(numAmount)) {
    return `0 ${CURRENCY.symbol}`;
  }
  
  // Форматируем число с разделителями тысяч для узбекской локали
  return `${numAmount.toLocaleString('uz-UZ')} ${CURRENCY.symbol}`;
}

// Форматирование суммы без символа валюты (только число)
export function formatNumber(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  return numAmount.toLocaleString('uz-UZ');
}

// Краткое форматирование для больших сумм
export function formatCurrencyShort(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `0 ${CURRENCY.symbol}`;
  }
  
  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}М ${CURRENCY.symbol}`;
  } else if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}К ${CURRENCY.symbol}`;
  }
  
  return `${numAmount.toLocaleString('uz-UZ')} ${CURRENCY.symbol}`;
}

// Форматирование с фиксированным количеством знаков после запятой
export function formatCurrencyFixed(amount: number | string, decimals: number = 2): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `0 ${CURRENCY.symbol}`;
  }
  
  return `${numAmount.toFixed(decimals)} ${CURRENCY.symbol}`;
}