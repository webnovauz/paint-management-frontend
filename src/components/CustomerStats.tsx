'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paintAPI, CustomerSalesStats } from '@/lib/api';
import { useAnalyticsTranslations } from '@/hooks/useTranslations';
import { formatCurrency } from '@/lib/currency';
import DateRangePicker from './DateRangePicker';
import { PageLoading } from './LoadingComponents';
import { 
  Users, 
  TrendingUp,
  BarChart3,
  DollarSign,
  Download,
  Star,
  ShoppingCart
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export default function CustomerStats() {
  const t = useAnalyticsTranslations();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);

  // Получаем статистику по клиентам
  const { data: customerStats, isLoading, error } = useQuery({
    queryKey: ['customer-sales-stats', selectedDateRange],
    queryFn: async () => {
      const params: Record<string, string> = {};
      
      if (selectedDateRange) {
        params.start_date = selectedDateRange.startDate;
        params.end_date = selectedDateRange.endDate;
      }
      
      console.log('Requesting customer stats with params:', params);
      const result = await paintAPI.getCustomerSalesStats(params);
      console.log('Customer stats response:', result);
      return result;
    },
  });

  const stats = customerStats?.data || { customer_stats: [], top_by_orders: [], top_by_amount: [], period: {} };

  // Экспорт в Excel
  const exportToExcel = () => {
    if (!stats.customer_stats?.length) return;

    const exportData = stats.customer_stats.map((stat: CustomerSalesStats) => ({
      'Клиент': stat.customer__name || stat.customer_name,
      'Телефон': stat.customer_phone || '-',
      'Всего покупок': formatCurrency(stat.total_amount || 0),
      'Количество заказов': stat.total_orders || 0,
      'Средний чек': formatCurrency(stat.avg_order_value || 0),
      'Ранг': stat.rank || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика клиентов');
    
    const fileName = `статистика_клиентов_${selectedDateRange?.startDate || 'все'}_${selectedDateRange?.endDate || 'время'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Вычисляем общие показатели
  const customerStatsList = stats?.customer_stats || [];
  const totalSales = customerStatsList.reduce((sum: number, stat: CustomerSalesStats) => sum + (stat.total_amount || 0), 0);
  const totalPurchases = customerStatsList.reduce((sum: number, stat: CustomerSalesStats) => sum + (stat.total_orders || 0), 0);
  const averageCustomerValue = customerStatsList.length > 0 ? totalSales / customerStatsList.length : 0;

  // Сортируем по сумме покупок
  const sortedStats = [...customerStatsList].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));  // Топ клиенты
  const topCustomers = sortedStats.slice(0, 5);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    console.error('Customer stats error:', error);
    return (
      <div className="text-center py-12">
        <div className="text-red-600">Ошибка загрузки статистики клиентов</div>
        <div className="text-gray-500 text-sm mt-2">{error.toString()}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-visible">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Статистика по клиентам
          </h2>
          <p className="text-gray-600">
            Анализ лояльности и активности клиентов
          </p>
        </div>
        
        <button
          onClick={exportToExcel}
          disabled={!stats.customer_stats?.length}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{t.exportExcel}</span>
        </button>
      </div>

      {/* Период */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-visible">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">{t.reportPeriod}</h3>
        </div>
        
        <div className="relative overflow-visible">
          <DateRangePicker
            onDateRangeChange={setSelectedDateRange}
            selectedRange={selectedDateRange}
          />
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalSales)}
              </h3>
              <p className="text-gray-600">{t.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {stats.customer_stats?.length || 0}
              </h3>
              <p className="text-gray-600">{t.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {totalPurchases}
              </h3>
              <p className="text-gray-600">{t.ordersCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatCurrency(averageCustomerValue)}
              </h3>
              <p className="text-gray-600">{t.averageCustomerValue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Топ клиенты */}
      {topCustomers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t.topCustomers}
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topCustomers.map((customer: CustomerSalesStats, index: number) => (
                <div key={customer.customer_id || index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg p-4">
                    <div className="text-2xl font-bold">#{index + 1}</div>
                    <div className="text-sm opacity-90">{customer.customer__name || customer.customer_name}</div>
                    <div className="text-lg font-semibold mt-2">
                      {formatCurrency(customer.total_amount || 0)}
                    </div>
                    <div className="text-xs opacity-75">
                      {customer.total_orders || customer.purchases_count} покупок
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Таблица статистики */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.detailedStats} ({stats.customer_stats?.length || 0})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.customer}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.phone}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.totalAmount}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.orders}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.averageOrder}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.lastPurchase}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.salesPercentage}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStats.map((stat: CustomerSalesStats, index: number) => (
                <tr key={stat.customer_id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{stat.customer__name || stat.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      {stat.customer_phone && <div>{stat.customer_phone}</div>}
                      {!stat.customer_phone && <div>-</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(stat.total_amount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="w-4 h-4 text-blue-500" />
                      <span>{stat.total_orders || stat.purchases_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(stat.avg_order_value || parseFloat(stat.avg_purchase || '0'))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.last_purchase 
                      ? new Date(stat.last_purchase).toLocaleDateString('ru-RU')
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(((stat.total_amount || 0) / totalSales) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {(((stat.total_amount || 0) / totalSales) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stats.customer_stats?.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noCustomerData}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t.noCustomerData}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}