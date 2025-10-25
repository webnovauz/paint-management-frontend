'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paintAPI, Paint } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { 
  Plus, 
  Package, 
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react';
import Image from 'next/image';

interface StockAdjustmentModal {
  isOpen: boolean;
  paint?: Paint;
  onClose: () => void;
}

function StockAdjustmentModal({ isOpen, onClose, paint }: StockAdjustmentModal) {
  const [formData, setFormData] = useState({
    movement_type: 'stock_in' as 'stock_in' | 'stock_out' | 'adjustment',
    quantity: '',
    reason: '',
    selling_price: paint?.selling_price || '',
  });

  const queryClient = useQueryClient();

  const createStockMovement = useMutation({
    mutationFn: (data: { paint: number; quantity: string; notes?: string }) => 
      paintAPI.adjustStock(data.paint, { quantity: data.quantity, notes: data.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paints'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      onClose();
      setFormData({
        movement_type: 'stock_in',
        quantity: '',
        reason: '',
        selling_price: paint?.selling_price || '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paint) return;

    const quantity = formData.movement_type === 'stock_out' 
      ? (-Math.abs(Number(formData.quantity))).toString()
      : formData.quantity;

    const movementData = {
      paint: paint.id,
      quantity: quantity,
      notes: formData.reason,
    };

    createStockMovement.mutate(movementData);
  };

  if (!isOpen || !paint) return null;

  const movementTypes = [
    { value: 'stock_in', label: '📦 Поступление', color: 'text-green-600' },
    { value: 'stock_out', label: '📤 Списание', color: 'text-red-600' },
    { value: 'adjustment', label: '⚖️ Корректировка', color: 'text-blue-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Движение товара
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: paint.color || '#666' }}
            />
            <div>
              <p className="font-medium text-gray-900">{paint.name}</p>
              <p className="text-sm text-gray-600">{paint.category_name}</p>
              <p className="text-sm text-blue-600">
                Текущий остаток: <strong>{paint.current_stock} {paint.unit}</strong>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип операции <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {movementTypes.map((type) => (
                <label key={type.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="movement_type"
                    value={type.value}
                    checked={formData.movement_type === type.value}
                    onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as 'stock_in' | 'stock_out' | 'adjustment' })}
                    className="text-blue-600"
                  />
                  <span className={`font-medium ${type.color}`}>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              required
              placeholder="Введите количество"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Единица измерения: {paint.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цена за единицу
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Цена за единицу"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Причина/Комментарий
            </label>
            <textarea
              placeholder="Укажите причину операции..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createStockMovement.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>
                {createStockMovement.isPending ? 'Сохранение...' : 'Сохранить'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StockManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Queries
  const { data: paintsResponse, isLoading: paintsLoading } = useQuery({
    queryKey: ['paints', searchTerm],
    queryFn: () => paintAPI.getAll({ search: searchTerm }),
  });

  const { data: movementsResponse } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => paintAPI.getStockMovements({}),
  });

  const paints = paintsResponse?.data?.results || [];
  const movements = movementsResponse?.data?.results || [];

  const handleStockAdjustment = (paint: Paint) => {
    setSelectedPaint(paint);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPaint(null);
  };

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
            Управление остатками
          </h1>
        </div>
        
        <p className="text-gray-600">
          Отслеживайте и управляйте остатками красок на складе
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего красок</p>
                <p className="text-2xl font-bold text-gray-900">{stockStats.totalPaints}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Низкий остаток</p>
                <p className="text-2xl font-bold text-red-600">{stockStats.lowStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Нет в наличии</p>
                <p className="text-2xl font-bold text-gray-600">{stockStats.outOfStock}</p>
              </div>
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Стоимость остатков</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stockStats.totalValue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
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
                placeholder="Поиск красок для управления остатками..."
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
            <h3 className="text-lg font-semibold text-gray-900">Остатки красок</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Краска
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Текущий остаток
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Мин. остаток
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стоимость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
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
                      Краски не найдены
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
                          className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Движение</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Последние движения */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Последние движения товара</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Краска
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Причина
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Движений товара пока нет
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(movement.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                            style={{ backgroundColor: movement.paint_color || '#666' }}
                          />
                          <span className="text-sm text-gray-900">{movement.paint_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          movement.movement_type === 'in'
                            ? 'bg-green-100 text-green-800'
                            : movement.movement_type === 'out'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.movement_type === 'in' && '📦 Поступление'}
                          {movement.movement_type === 'out' && '📤 Списание'}
                          {movement.movement_type === 'adjustment' && '⚖️ Корректировка'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          Number(movement.quantity) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Number(movement.quantity) > 0 ? '+' : ''}{movement.quantity} {movement.paint_unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {movement.notes || 'Без комментария'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      <StockAdjustmentModal
        isOpen={isModalOpen}
        paint={selectedPaint || undefined}
        onClose={closeModal}
      />
    </div>
  );
}