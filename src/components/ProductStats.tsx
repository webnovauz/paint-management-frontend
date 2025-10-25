'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paintAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useAnalyticsTranslations } from '@/hooks/useTranslations';
import DateRangePicker from './DateRangePicker';
import { PageLoading } from './LoadingComponents';
import { 
  Package, 
  TrendingUp,
  BarChart3,
  DollarSign,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface ProductStatsData {
  product_id: number;
  product_name: string;
  product_color?: string;
  product_unit: string;
  total_quantity: string;
  total_amount: string;
  average_price: string;
  sales_count: number;
  percentage_of_total_sales: number;
}

export default function ProductStats() {
  const t = useAnalyticsTranslations();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);

  // Получаем статистику по товарам
  const { data: productStats, isLoading } = useQuery({
    queryKey: ['product-sales-stats', selectedDateRange],
    queryFn: async () => {
      const params: Record<string, string> = {};
      
      if (selectedDateRange) {
        params.start_date = selectedDateRange.startDate;
        params.end_date = selectedDateRange.endDate;
      }
      
      return paintAPI.getProductSalesStats(params);
    },
  });

  const stats: ProductStatsData[] = productStats?.data || [];

  // Экспорт в Excel
  const exportToExcel = () => {
    if (!stats.length) return;

    const exportData = stats.map((stat: ProductStatsData) => ({
      'Товар': stat.product_name,
      'Цвет': stat.product_color || '-',
      'Единица измерения': stat.product_unit,
      'Всего продано': stat.total_quantity,
      'Всего на сумму': stat.total_amount,
      'Средняя цена': stat.average_price,
      'Количество продаж': stat.sales_count,
      'Доля в общих продажах (%)': stat.percentage_of_total_sales
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика товаров');
    
    const fileName = `статистика_товаров_${selectedDateRange?.startDate || 'все'}_${selectedDateRange?.endDate || 'время'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Вычисляем общие показатели
  const totalSales = stats.reduce((sum: number, stat: ProductStatsData) => sum + parseFloat(stat.total_amount), 0);
  const totalQuantity = stats.reduce((sum: number, stat: ProductStatsData) => sum + parseFloat(stat.total_quantity), 0);
  const totalTransactions = stats.reduce((sum: number, stat: ProductStatsData) => sum + stat.sales_count, 0);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 overflow-visible">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t.productStatsTitle}
          </h2>
          <p className="text-gray-600">
            {t.productAnalysis}
          </p>
        </div>
        
        <button
          onClick={exportToExcel}
          disabled={!stats.length}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalSales)}
              </h3>
              <p className="text-gray-600">{t.totalRevenue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {totalQuantity.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}
              </h3>
              <p className="text-gray-600">{t.totalQuantitySold}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {totalTransactions}
              </h3>
              <p className="text-gray-600">{t.totalTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Таблица статистики */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t.detailedProductStats} ({stats.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.product}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.quantitySold}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.revenue}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.averagePrice}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.salesCount}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.percentage}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map((stat: ProductStatsData) => (
                <tr key={stat.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{stat.product_name}</div>
                      {stat.product_color && (
                        <div className="text-gray-500">{stat.product_color}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>
                        {parseFloat(stat.total_quantity).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {stat.product_unit}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(parseFloat(stat.total_amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(parseFloat(stat.average_price))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span>{stat.sales_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(stat.percentage_of_total_sales, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {stat.percentage_of_total_sales.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {stats.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noProductData}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t.noProductData}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}