'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paintAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useAnalyticsTranslations } from '@/hooks/useTranslations';
import DateRangePicker from './DateRangePicker';
import { PageLoading } from './LoadingComponents';
import { 
  Search, 
  Calendar, 
  Package, 
  User, 
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface SaleItemData {
  paint_name?: string;
  quantity: string;
  paint_unit?: string;
}

interface SaleData {
  id?: number;
  sale_number?: string;
  customer_name?: string;
  total_amount?: string;
  notes?: string;
  created_at?: string;
  items?: SaleItemData[];
}

export default function SalesHistory() {
  const t = useAnalyticsTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);

  // Получаем историю продаж
  const { data: salesResponse, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-history', selectedDateRange, selectedProduct, selectedCustomer, searchTerm],
    queryFn: async () => {
      const params: Record<string, string | number> = { page_size: 100 };
      
      if (selectedDateRange) {
        params.created_at__date__gte = selectedDateRange.startDate;
        params.created_at__date__lte = selectedDateRange.endDate;
      }
      
      if (selectedProduct) {
        params.items__paint = selectedProduct;
      }
      
      if (selectedCustomer) {
        params.customer = selectedCustomer;
      }
      
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      return paintAPI.getSales(params);
    },
  });

  // Получаем список товаров для фильтра
  const { data: paintsResponse } = useQuery({
    queryKey: ['paints-for-filter'],
    queryFn: () => paintAPI.getAllPaints(),
  });

  // Получаем список клиентов для фильтра
  const { data: customersResponse } = useQuery({
    queryKey: ['customers-for-filter'],
    queryFn: () => paintAPI.getAllCustomers(),
  });

  const sales: SaleData[] = salesResponse?.data?.results || [];
  const paints = paintsResponse?.data?.results || [];
  const customers = customersResponse?.data?.results || [];

  // Экспорт в Excel
  const exportToExcel = () => {
    if (!sales.length) return;

    const exportData = sales.map(sale => ({
      'Дата': new Date(sale.created_at || '').toLocaleDateString('ru-RU'),
      'Номер продажи': sale.sale_number || '',
      'Клиент': sale.customer_name || 'Наличные',
      'Товары': sale.items?.map(item => 
        `${item.paint_name} (${item.quantity} ${item.paint_unit})`
      ).join(', ') || '',
      'Общая сумма': sale.total_amount,
      'Примечания': sale.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'История продаж');
    
    const fileName = `история_продаж_${selectedDateRange?.startDate || 'все'}_${selectedDateRange?.endDate || 'время'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (salesLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6 overflow-visible">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t.salesHistoryTitle}
          </h2>
          <p className="text-gray-600">
            {t.salesHistoryDescription}
          </p>
        </div>
        
        <button
          onClick={exportToExcel}
          disabled={!sales.length}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{t.exportExcel}</span>
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-visible">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">{t.filters}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Период */}
          <div className="relative overflow-visible">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.reportPeriod}
            </label>
            <DateRangePicker
              onDateRangeChange={setSelectedDateRange}
              selectedRange={selectedDateRange}
            />
          </div>

          {/* Товар */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.product}
            </label>
            <select
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t.allProducts}</option>
              {paints.map((paint) => (
                <option key={paint.id} value={paint.id}>
                  {paint.name} {paint.color}
                </option>
              ))}
            </select>
          </div>

          {/* Клиент */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.customer}
            </label>
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t.allCustomers}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.searchPlaceholder.split('...')[0]}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Кнопка сброса фильтров */}
        {(selectedDateRange || selectedProduct || selectedCustomer || searchTerm) && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                setSelectedDateRange(null);
                setSelectedProduct(null);
                setSelectedCustomer(null);
                setSearchTerm('');
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Сбросить все фильтры
            </button>
          </div>
        )}
      </div>

      {/* Результаты */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Найдено продаж: {sales.length}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>
                  Общая сумма: {formatCurrency(
                    sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || '0'), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.date}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.number}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.customerName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.productName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.totalPrice}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.notes}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.created_at || '').toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.sale_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{sale.customer_name || 'Наличные'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {sale.items?.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span>
                            {item.paint_name} ({item.quantity} {item.paint_unit})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(parseFloat(sale.total_amount || '0'))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sales.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noSalesData}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t.noSalesData}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}