'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paintAPI, Paint, StockMovement } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useInventoryTranslations, useProductTranslations } from '@/hooks/useTranslations';
import { Package, Search, Plus, ArrowUp, ArrowDown, Minus, X } from 'lucide-react';
import Image from 'next/image';

export default function StockManagement() {
  const t = useInventoryTranslations();
  const productT = useProductTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Валидация количества
  const getQuantityValidation = () => {
    if (!adjustmentQuantity) return null;
    const num = parseFloat(adjustmentQuantity);
    if (isNaN(num)) return { type: 'error', message: t.enterValidNumber };
    if (num < 0) return { type: 'error', message: t.quantityCannotBeNegative };
    return null;
  };

  // Мутация для корректировки остатка
  const adjustmentMutation = useMutation({
    mutationFn: paintAPI.createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paints'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeAdjustmentModal();
      alert(t.adjustmentSuccess);
    },
    onError: (error) => {
      console.error('Ошибка корректировки остатка:', error);
      alert(t.adjustmentError);
    }
  });

  const handleStockAdjustment = (paint: Paint) => {
    if (adjustmentMutation.isPending) {
      return;
    }
    
    setSelectedPaint(paint);
    setAdjustmentQuantity(paint.current_stock);
    setAdjustmentNotes('');
    setShowAdjustmentModal(true);
  };

  // Фокус на поле ввода при открытии модального окна
  useEffect(() => {
    if (showAdjustmentModal && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current?.select();
      }, 100);
    }
  }, [showAdjustmentModal]);

  const handleAdjustmentSubmit = () => {
    if (!selectedPaint) return;
    
    // Проверяем валидацию
    const validation = getQuantityValidation();
    if (validation?.type === 'error') {
      return;
    }
    
    const currentStock = parseFloat(selectedPaint.current_stock) || 0;
    const newQuantity = parseFloat(adjustmentQuantity);
    const difference = newQuantity - currentStock;
    
    if (difference === 0) {
      alert('Количество не изменилось');
      return;
    }
    
    // Определяем тип движения в зависимости от разницы
    const movementType = difference > 0 ? 'in' : 'out';
    const notes = adjustmentNotes || `Корректировка остатка с ${currentStock} до ${newQuantity} ${selectedPaint.unit}`;
    
    adjustmentMutation.mutate({
      paint: selectedPaint.id,
      quantity: Math.abs(difference).toString(),
      movement_type: movementType,
      notes: notes
    });
  };

  const closeAdjustmentModal = () => {
    setShowAdjustmentModal(false);
    setSelectedPaint(null);
    setAdjustmentQuantity('');
    setAdjustmentNotes('');
  };

  // Queries
  const { data: paintsResponse, isLoading: paintsLoading } = useQuery({
    queryKey: ['paints', searchTerm],
    queryFn: () => paintAPI.getAll({ search: searchTerm }),
  });

  const paints = paintsResponse?.data?.results || [];

  // Статистика остатков
  const stockStats = {
    totalPaints: paints.length,
    lowStock: paints.filter(p => p.is_low_stock).length,
    totalValue: paints.reduce((sum, paint) => sum + (Number(paint.current_stock) * Number(paint.selling_price)), 0),
    outOfStock: paints.filter(p => Number(p.current_stock) === 0).length,
  };

  return (
    <div className="w-full">
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Image 
            src="/refix.png" 
            alt="Stock Management Logo" 
            width={40} 
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-3xl font-bold text-gray-900">
            {t.title}
          </h1>
        </div>
        
        <p className="text-gray-600">
          {t.subtitle}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.totalProducts}</p>
                <p className="text-2xl font-bold text-gray-900">{stockStats.totalPaints}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.lowStock}</p>
                <p className="text-2xl font-bold text-red-600">{stockStats.lowStock}</p>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.outOfStock}</p>
                <p className="text-2xl font-bold text-gray-600">{stockStats.outOfStock}</p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t.totalValue}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stockStats.totalValue)}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Поиск */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
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

        {/* Таблица остатков */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t.stockTable}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.product}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.currentStockCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.minStock}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.value}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {productT.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paintsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Загрузка...
                    </td>
                  </tr>
                ) : paints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {productT.notFound}
                    </td>
                  </tr>
                ) : (
                  paints.map((paint) => (
                    <tr key={paint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full mr-3 border-2 border-gray-300"
                            style={{ backgroundColor: paint.color || '#666' }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {paint.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {paint.category_name} • {paint.brand}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{paint.current_stock}</span> {paint.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {paint.min_stock_level} {paint.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          Number(paint.current_stock) === 0
                            ? 'bg-gray-100 text-gray-800'
                            : Number(paint.current_stock) <= Number(paint.min_stock_level) 
                            ? 'bg-red-100 text-red-800'
                            : Number(paint.current_stock) <= Number(paint.min_stock_level) * 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {Number(paint.current_stock) === 0
                            ? 'Нет в наличии'
                            : Number(paint.current_stock) <= Number(paint.min_stock_level)
                            ? 'Низкий остаток'
                            : Number(paint.current_stock) <= Number(paint.min_stock_level) * 2
                            ? 'Средний остаток'
                            : 'Достаточно'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(Number(paint.current_stock) * Number(paint.selling_price))}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStockAdjustment(paint)}
                          disabled={adjustmentMutation.isPending}
                          className={`inline-flex items-center space-x-2 px-3 py-1 text-white text-sm rounded-lg transition-colors ${
                            adjustmentMutation.isPending 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>{adjustmentMutation.isPending ? 'Обработка...' : 'Движение'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* История движений товара */}
        <StockMovements />
      </div>

      {/* Модальное окно корректировки остатка */}
      {showAdjustmentModal && selectedPaint && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeAdjustmentModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t.stockAdjustment}
              </h3>
              <button
                onClick={closeAdjustmentModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div
                  className="w-6 h-6 rounded-full mr-3 border"
                  style={{ backgroundColor: selectedPaint.color || '#666' }}
                />
                <div>
                  <div className="font-medium text-gray-900">{selectedPaint.name}</div>
                  <div className="text-sm text-gray-500">{selectedPaint.color}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t.currentStock}: <span className="font-medium">{selectedPaint.current_stock} {selectedPaint.unit}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="adjustment-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.newQuantity} ({selectedPaint.unit})
                </label>
                <input
                  ref={quantityInputRef}
                  id="adjustment-quantity"
                  type="number"
                  step="0.001"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent ${
                    getQuantityValidation()?.type === 'error' 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder={t.enterNewQuantity}
                />
                {getQuantityValidation()?.type === 'error' && (
                  <div className="mt-1 text-sm text-red-600">
                    {getQuantityValidation()?.message}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="adjustment-notes" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.reason} (необязательно)
                </label>
                <textarea
                  id="adjustment-notes"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.specifyReason}
                />
              </div>

              {/* Предпросмотр изменений */}
              {adjustmentQuantity && !isNaN(parseFloat(adjustmentQuantity)) && (
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">Предпросмотр изменений:</div>
                  {(() => {
                    const currentStock = parseFloat(selectedPaint.current_stock) || 0;
                    const newQuantity = parseFloat(adjustmentQuantity);
                    const difference = newQuantity - currentStock;
                    
                    if (difference === 0) {
                      return (
                        <div className="text-sm text-gray-600">
                          Количество не изменится
                        </div>
                      );
                    }
                    
                    return (
                      <div className="text-sm">
                        <div className="text-gray-600">
                          {currentStock} → {newQuantity} {selectedPaint.unit}
                        </div>
                        <div className={`font-medium ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {difference > 0 ? 'Увеличение' : 'Уменьшение'}: {difference > 0 ? '+' : ''}{difference.toFixed(3)} {selectedPaint.unit}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeAdjustmentModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAdjustmentSubmit}
                disabled={adjustmentMutation.isPending || !adjustmentQuantity || getQuantityValidation()?.type === 'error'}
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors ${
                  adjustmentMutation.isPending || !adjustmentQuantity || getQuantityValidation()?.type === 'error'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {adjustmentMutation.isPending ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент для отображения движений товара
function StockMovements() {
  const t = useInventoryTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [movementTypeFilter, setMovementTypeFilter] = useState<'in' | 'out' | 'adjustment' | ''>('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: movementsResponse, isLoading } = useQuery({
    queryKey: ['stock-movements', currentPage, movementTypeFilter, dateFilter],
    queryFn: () => paintAPI.getStockMovements({ 
      page: currentPage,
      movement_type: movementTypeFilter || undefined,
      date_from: dateFilter || undefined
    }),
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const movements = movementsResponse?.data?.results || [];
  const totalPages = movementsResponse?.data?.count 
    ? Math.ceil(movementsResponse.data.count / 20) 
    : 1;

  // Сброс на первую страницу при изменении фильтров
  const handleFilterChange = (filterType: 'type' | 'date', value: string) => {
    setCurrentPage(1);
    if (filterType === 'type') {
      setMovementTypeFilter(value as 'in' | 'out' | 'adjustment' | '');
    } else {
      setDateFilter(value);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'out':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <Minus className="w-4 h-4 text-yellow-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementTypeText = (type: string) => {
    switch (type) {
      case 'in':
        return t.inbound;
      case 'out':
        return t.outbound;
      case 'adjustment':
        return t.adjustment;
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.stockMovements}</h3>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>{t.noMovements}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Фильтры */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <label htmlFor="movement-type" className="block text-sm font-medium text-gray-700 mb-1">
                Тип движения
              </label>
              <select
                id="movement-type"
                value={movementTypeFilter}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t.allTypes}</option>
                <option value="in">{t.replenishment}</option>
                <option value="out">{t.sale}</option>
                <option value="adjustment">{t.adjustment}</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t.dateFrom}
              </label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setMovementTypeFilter('');
                  setDateFilter('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Сбросить
              </button>
            </div>
          </div>

          {/* Список движений */}
          <div className="space-y-3">
            {movements.map((movement: StockMovement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  {getMovementIcon(movement.movement_type)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {movement.paint_name || `Товар #${movement.paint}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getMovementTypeText(movement.movement_type)} • {new Date(movement.created_at).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${movement.movement_type === 'out' ? 'text-red-600' : 'text-green-600'}`}>
                    {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity} {movement.paint_unit}
                  </div>
                  {movement.notes && (
                    <div className="text-xs text-gray-500">
                      {movement.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Страница {currentPage} из {totalPages}
                {movementsResponse?.data?.count && (
                  <span className="ml-2">
                    (всего записей: {movementsResponse.data.count})
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Назад
                </button>
                
                {/* Номера страниц */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}