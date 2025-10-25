'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paintAPI, Paint, PaintCategory, Supplier } from '@/lib/api';
import { useModalTranslations } from '@/hooks/useTranslations';
import { paintSchema, categorySchema, supplierSchema } from '@/lib/validationSchemas';
import { FormField, Input, Select, Textarea } from '@/components/FormComponents';
import { X, Save } from 'lucide-react';

// Модальное окно для добавления/редактирования краски
interface PaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  paint?: Paint;
  categories: PaintCategory[];
}

export function PaintModal({ isOpen, onClose, paint, categories }: PaintModalProps) {
  const modalTrans = useModalTranslations();
  const [formData, setFormData] = useState({
    name: paint?.name || '',
    category: paint?.category || 0,
    color: paint?.color || '#000000',
    brand: paint?.brand || '',
    unit: paint?.unit || (paint?.product_type === 'piece' ? 'шт' : paint?.product_type === 'measured' ? 'м' : 'l'),
    product_type: paint?.product_type || 'volume' as const,
    cost_price: paint?.cost_price || '',
    selling_price: paint?.selling_price || '',
    density: paint?.density || '',
    description: paint?.description || '',
    sku: paint?.sku || '',
    min_stock_level: paint?.min_stock_level || '0',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // Обновляем форму при изменении paint prop
  useEffect(() => {
    const timer = setTimeout(() => {
      if (paint) {
        setFormData({
          name: paint.name || '',
          category: paint.category || 0,
          color: paint.color || '#000000',
          brand: paint.brand || '',
          unit: paint.unit || (paint.product_type === 'piece' ? 'шт' : paint.product_type === 'measured' ? 'м' : 'l'),
          product_type: paint.product_type || 'volume' as const,
          cost_price: paint.cost_price || '',
          selling_price: paint.selling_price || '',
          density: paint.density || '',
          description: paint.description || '',
          sku: paint.sku || '',
          min_stock_level: paint.min_stock_level || '0',
        });
      } else {
        // Сброс формы для нового элемента
        setFormData({
          name: '',
          category: 0,
          color: '#000000',
          brand: '',
          unit: 'kg',
          product_type: 'volume' as const,
          cost_price: '',
          selling_price: '',
          density: '',
          description: '',
          sku: '',
          min_stock_level: '0',
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [paint]);

  const createMutation = useMutation({
    mutationFn: paintAPI.create,
    onSuccess: (data) => {
      console.log('Товар создан:', data);
      // Инвалидируем все связанные запросы
      queryClient.invalidateQueries({ queryKey: ['paints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Принудительно перезагружаем данные
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['paints'] });
      }, 100);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Paint> }) =>
      paintAPI.update(id, data),
    onSuccess: (data) => {
      console.log('Товар обновлен:', data);
      // Инвалидируем все связанные запросы
      queryClient.invalidateQueries({ queryKey: ['paints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Принудительно перезагружаем данные
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['paints'] });
      }, 100);
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сброс предыдущих ошибок
    setValidationErrors({});
    
    // Валидация формы
    try {
      const validatedData = paintSchema.parse(formData);
      
      // Конвертируем строковые значения в правильные типы для API
      const apiData = {
        ...validatedData,
        category: Number(validatedData.category),
        cost_price: validatedData.cost_price,
        selling_price: validatedData.selling_price,
        min_stock_level: validatedData.min_stock_level,
        unit: validatedData.unit as 'g' | 'kg' | 'l' | 'ml' | 'шт' | 'упак' | 'комп' | 'м' | 'м²',
      };
      
      if (paint) {
        updateMutation.mutate({ id: paint.id, data: apiData });
      } else {
        createMutation.mutate(apiData);
      }
    } catch (error) {
      // Обработка ошибок валидации
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorMap: Record<string, string> = {};
        const errors = error.errors as Array<{ path?: string[]; message: string }>;
        errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errorMap);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {paint ? modalTrans.editPaint : modalTrans.addPaint}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!paint && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 {modalTrans.advice}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField 
            label={modalTrans.name} 
            required 
            error={validationErrors.name}
          >
            <Input
              type="text"
              required
              placeholder={modalTrans.nameExample}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!validationErrors.name}
            />
          </FormField>

          <FormField 
            label={modalTrans.category} 
            required 
            error={validationErrors.category}
          >
            <Select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: Number(e.target.value) })}
              error={!!validationErrors.category}
            >
              <option value="">{modalTrans.selectCategory}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalTrans.productType} <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.product_type}
              onChange={(e) => {
                const newType = e.target.value as 'piece' | 'measured' | 'volume';
                let defaultUnit = 'kg';
                
                if (newType === 'piece') {
                  defaultUnit = 'шт';
                } else if (newType === 'measured') {
                  defaultUnit = 'м';
                } else if (newType === 'volume') {
                  defaultUnit = 'l';
                }
                
                setFormData({ 
                  ...formData, 
                  product_type: newType,
                  unit: defaultUnit as 'g' | 'kg' | 'l' | 'ml' | 'шт' | 'упак' | 'комп' | 'м' | 'м²'
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="piece">📦 {modalTrans.pieceProduct}</option>
              <option value="measured">📏 {modalTrans.measuredProduct}</option>
              <option value="volume">🧪 {modalTrans.volumeProduct}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.color}
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.unit}
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'g' | 'kg' | 'l' | 'ml' | 'шт' | 'упак' | 'комп' | 'м' | 'м²' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {formData.product_type === 'piece' ? (
                  <>
                    <option value="шт">шт (штуки)</option>
                    <option value="упак">упак (упаковки)</option>
                    <option value="комп">комп (комплекты)</option>
                  </>
                ) : formData.product_type === 'measured' ? (
                  <>
                    <option value="м">м (метры)</option>
                    <option value="м²">м² (квадратные метры)</option>
                    <option value="шт">шт (штуки рулонов/листов)</option>
                  </>
                ) : (
                  <>
                    <option value="l">л (литры)</option>
                    <option value="ml">мл (миллилитры)</option>
                    <option value="kg">кг (килограммы)</option>
                    <option value="g">г (граммы)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalTrans.brand}
            </label>
            <input
              type="text"
              placeholder={modalTrans.brandExample}
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.costPrice} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="100.00"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.sellingPrice} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150.50"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.minStock}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="25"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {paint && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текущий остаток
              </label>
              <div className="text-lg font-semibold text-gray-900">
                {paint.current_stock} {paint.unit}
                {Number(paint.current_stock) <= Number(paint.min_stock_level) && (
                  <span className="ml-2 text-sm text-red-600">⚠️ Низкий остаток</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Остаток рассчитывается автоматически на основе пополнений и продаж
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalTrans.sku}
            </label>
            <input
              type="text"
              placeholder="EMF115WH001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalTrans.description}
            </label>
            <textarea
              placeholder={modalTrans.descriptionExample}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {modalTrans.cancel}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>
                {createMutation.isPending || updateMutation.isPending
                  ? modalTrans.save + '...'
                  : modalTrans.save}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно для добавления/редактирования категории  
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: PaintCategory;
}

export function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const modalTrans = useModalTranslations();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: paintAPI.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PaintCategory> }) =>
      paintAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сброс предыдущих ошибок
    setValidationErrors({});
    
    // Валидация формы
    try {
      const validatedData = categorySchema.parse(formData);
      
      if (category) {
        updateMutation.mutate({ id: category.id, data: validatedData });
      } else {
        createMutation.mutate(validatedData);
      }
    } catch (error) {
      // Обработка ошибок валидации
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorMap: Record<string, string> = {};
        const errors = error.errors as Array<{ path?: string[]; message: string }>;
        errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errorMap);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? modalTrans.editCategory : modalTrans.addCategory}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField 
            label={modalTrans.name} 
            required 
            error={validationErrors.name}
          >
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!validationErrors.name}
            />
          </FormField>

          <FormField 
            label={modalTrans.description}
            error={validationErrors.description}
          >
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              error={!!validationErrors.description}
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {modalTrans.cancel}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>
                {createMutation.isPending || updateMutation.isPending
                  ? modalTrans.saving
                  : modalTrans.save}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Модальное окно для добавления/редактирования поставщика
interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier;
}

export function SupplierModal({ isOpen, onClose, supplier }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact_person: supplier?.contact_person || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    is_active: supplier?.is_active ?? true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const modalTrans = useModalTranslations();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: paintAPI.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Supplier> }) =>
      paintAPI.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сброс предыдущих ошибок
    setValidationErrors({});
    
    // Валидация формы
    try {
      const validatedData = supplierSchema.parse(formData);
      
      if (supplier) {
        updateMutation.mutate({ id: supplier.id, data: validatedData });
      } else {
        createMutation.mutate(validatedData);
      }
    } catch (error) {
      // Обработка ошибок валидации
      if (error && typeof error === 'object' && 'errors' in error) {
        const errorMap: Record<string, string> = {};
        const errors = error.errors as Array<{ path?: string[]; message: string }>;
        errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setValidationErrors(errorMap);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {supplier ? modalTrans.editSupplier : modalTrans.addSupplier}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField 
            label={modalTrans.name} 
            required 
            error={validationErrors.name}
          >
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!validationErrors.name}
            />
          </FormField>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalTrans.contactPerson}
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.phone}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modalTrans.email}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalTrans.address}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              {modalTrans.isActive}
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {modalTrans.cancel}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>
                {createMutation.isPending || updateMutation.isPending
                  ? modalTrans.saving
                  : modalTrans.save}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}