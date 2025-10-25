'use client';

import { useEffect } from 'react';
import '../lib/i18n'; // Импортируем конфигурацию i18n

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n уже инициализирован при импорте
  }, []);

  return <>{children}</>;
}