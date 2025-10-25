'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, Filter } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange) => void;
  selectedRange?: DateRange | null;
}

export default function DateRangePicker({ onDateRangeChange, selectedRange }: DateRangePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Обработчик клика вне компонента для закрытия меню
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.date-range-picker')) {
      setIsOpen(false);
    }
  };

  // Добавляем и убираем обработчик при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const predefinedRanges: DateRange[] = [
    {
      startDate: formatDate(today),
      endDate: formatDate(today),
      label: t('analytics.today') || 'Сегодня'
    },
    {
      startDate: formatDate(yesterday),
      endDate: formatDate(yesterday),
      label: t('common.yesterday') || 'Вчера'
    },
    {
      startDate: formatDate(weekAgo),
      endDate: formatDate(today),
      label: t('analytics.last7days') || 'Последние 7 дней'
    },
    {
      startDate: formatDate(monthAgo),
      endDate: formatDate(today),
      label: t('analytics.last30days') || 'Последние 30 дней'
    },
    {
      startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate: formatDate(today),
      label: t('analytics.currentMonth') || 'Текущий месяц'
    },
    {
      startDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      endDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 0)),
      label: t('analytics.lastMonth') || 'Прошлый месяц'
    }
  ];

  const handlePredefinedRange = (range: DateRange) => {
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      const range: DateRange = {
        startDate: customStart,
        endDate: customEnd,
        label: `${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()}`
      };
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative date-range-picker">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {selectedRange?.label || t('dashboard.selectPeriod') || 'Выберите период'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-[80vh] overflow-y-auto max-sm:fixed max-sm:inset-x-4 max-sm:w-auto max-sm:right-4 max-sm:left-4 max-sm:top-16">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{t('analytics.periodAnalysis') || 'Период для анализа'}</span>
            </div>

            {/* Предустановленные периоды */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.quickSelect') || 'Быстрый выбор'}
              </h4>
              {predefinedRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => handlePredefinedRange(range)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Пользовательский период */}
            <div className="border-t pt-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {t('common.customPeriod') || 'Пользовательский период'}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('common.startDate') || 'Дата начала'}
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('common.endDate') || 'Дата окончания'}
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleCustomRange}
                  disabled={!customStart || !customEnd}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.applyPeriod') || 'Применить период'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}