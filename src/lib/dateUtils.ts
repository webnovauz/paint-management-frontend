// Утилиты для работы с датами в узбекской локали

export const UZBEK_LOCALE = 'uz-UZ';
export const RUSSIAN_LOCALE = 'ru-RU'; // Сохраняем для совместимости

// Форматирование даты в узбекской локали
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(UZBEK_LOCALE);
}

// Форматирование времени в узбекской локали
export function formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  return dateObj.toLocaleTimeString(UZBEK_LOCALE, { ...defaultOptions, ...options });
}

// Форматирование даты и времени в узбекской локали
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(dateObj)} ${formatTime(dateObj)}`;
}