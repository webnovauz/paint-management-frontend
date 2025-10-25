'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { paintAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import DateRangePicker from './DateRangePicker';
import { Package, TrendingDown, TrendingUp, ShoppingCart, DollarSign, Users, CreditCard, ArrowRight, BarChart3 } from 'lucide-react';
import Image from 'next/image';

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DashboardProps {
  onNavigate?: (tab: 'customers' | 'debts') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { t } = useTranslation();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedDateRange(range);
  };

  const handleResetFilter = () => {
    setSelectedDateRange(null);
  };

  // Базовые статистики (без фильтрации по датам)
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => paintAPI.getDashboardStats().then(res => res.data),
  });

  // Статистики по периоду
  const { data: periodStats, isLoading: periodLoading } = useQuery({
    queryKey: ['dashboard-period-stats', selectedDateRange],
    queryFn: () => {
      if (!selectedDateRange) return Promise.resolve(null);
      
      return paintAPI.getDashboardStats(selectedDateRange.startDate, selectedDateRange.endDate)
        .then(res => {
          console.log('Period stats response:', res.data);
          return res.data;
        });
    },
    enabled: !!selectedDateRange,
  });

  if (isLoading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Ошибка загрузки данных</h3>
          <p className="text-red-600 text-sm mt-1">
            Не удалось загрузить статистику. Проверьте подключение к серверу.
          </p>
        </div>
      </div>
    );
  }

  // Используем данные за период, если выбран период, иначе обычные данные
  const displayStats = selectedDateRange && periodStats ? periodStats : stats;
  
  // Определяем, какие значения использовать для отображения
  const getSalesCount = () => {
    if (selectedDateRange && periodStats) {
      return periodStats.period_sales_count || periodStats.today_sales_count || 0;
    }
    return displayStats?.today_sales_count || 0;
  };
  
  const getSalesAmount = () => {
    if (selectedDateRange && periodStats) {
      return periodStats.period_sales_amount || periodStats.today_sales_amount || 0;
    }
    return displayStats?.today_sales_amount || 0;
  };
  
  const getProfit = () => {
    if (selectedDateRange && periodStats) {
      return periodStats.period_profit || periodStats.today_profit || 0;
    }
    return displayStats?.today_profit || 0;
  };

  const statsCards = [
    {
      title: t('dashboard.totalProducts'),
      value: displayStats?.total_paints || 0,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: t('dashboard.lowStock'),
      value: displayStats?.low_stock_paints || 0,
      icon: TrendingDown,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      title: selectedDateRange ? t('dashboard.periodSales') : t('dashboard.todaySales'),
      value: getSalesCount(),
      icon: ShoppingCart,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: selectedDateRange ? t('dashboard.periodRevenue') : t('dashboard.todayRevenue'),
      value: formatCurrency(getSalesAmount()),
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: selectedDateRange ? t('dashboard.periodProfit') : t('dashboard.todayProfit'),
      value: formatCurrency(getProfit()),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="w-full px-6 py-6 overflow-visible">
      <div className="mb-8 overflow-visible">
        <div className="flex items-center justify-between mb-4 overflow-visible">
          <div className="flex items-center space-x-3">
            <Image 
              src="/refix.png" 
              alt="Inventory Management Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </div>
          
          {/* Календарь для фильтрации по периоду */}
          <div className="flex items-center space-x-4  relative overflow-visible">
            <DateRangePicker 
              onDateRangeChange={handleDateRangeChange}
              selectedRange={selectedDateRange}
            />
            {selectedDateRange && (
              <button
                onClick={handleResetFilter}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('dashboard.resetFilter')}
              </button>
            )}
          </div>
        </div>

        {/* Показываем информацию о выбранном периоде */}
        {selectedDateRange && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Анализ за период: {selectedDateRange.label}
              </span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Данные ниже отфильтрованы по выбранному периоду
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon;
          const isCardLoading = (selectedDateRange && periodLoading) || (!selectedDateRange && isLoading);
          
          return (
            <div key={index} className={`${card.bgColor} rounded-lg p-6 border border-gray-200 relative`}>
              {isCardLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Быстрый доступ к управлению клиентами */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('dashboard.customerManagement')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('dashboard.customerManagementDesc')}
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigate?.('customers')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {t('dashboard.manageCustomers')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onNavigate?.('debts')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {t('dashboard.manageDebts')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {displayStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💰 {selectedDateRange ? `Финансы за период: ${selectedDateRange.label}` : t('dashboard.financialSummary')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('dashboard.stockValue')}</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(displayStats.total_stock_value)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {selectedDateRange ? 'Выручка за период:' : t('dashboard.todayRevenueLabel')}
                </span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(getSalesAmount())}
                </span>
              </div>
              {selectedDateRange && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Прибыль за период:</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(getProfit())}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 {selectedDateRange ? `Статистика за период` : t('dashboard.briefStats')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('dashboard.activeProducts')}</span>
                <span className="font-semibold">{displayStats.total_paints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('dashboard.needRestock')}</span>
                <span className="font-semibold text-red-600">
                  {displayStats.low_stock_paints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {selectedDateRange ? 'Продаж за период:' : t('dashboard.dailySales')}
                </span>
                <span className="font-semibold">{getSalesCount()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}