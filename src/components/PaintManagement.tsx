'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paintAPI, Paint, PaintCategory, Supplier } from '@/lib/api';
import { PaintModal, CategoryModal, SupplierModal } from '@/components/Modals';
import { PageLoading, PageError, LoadingButton } from '@/components/LoadingComponents';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useProductTranslations } from '@/hooks/useTranslations';
import { formatCurrency } from '@/lib/currency';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';

type ViewMode = 'paints' | 'categories' | 'suppliers';
type ModalType = 'paint' | 'category' | 'supplier' | null;

export default function PaintManagement() {
  const t = useProductTranslations();
  const { handleError } = useErrorHandler();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [viewMode, setViewMode] = useState<ViewMode>('paints');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<Paint | PaintCategory | Supplier | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryClient = useQueryClient();

  // Queries с обработкой ошибок
  const { 
    data: paintsResponse, 
    isLoading: paintsLoading,
    error: paintsError,
    refetch: refetchPaints
  } = useQuery({
    queryKey: ['paints', debouncedSearchTerm, selectedCategory],
    queryFn: async () => {
      console.log('Загружаю товары с параметрами:', { searchTerm: debouncedSearchTerm, selectedCategory });
      const params: { search?: string; category?: number } = {};
      
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      const result = await paintAPI.getAll(params);
      console.log('Получены товары:', result);
      return result;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const { 
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => paintAPI.getCategories(),
    retry: 2,
    retryDelay: 1000,
  });

  const { 
    data: suppliersResponse,
    isLoading: suppliersLoading,
    error: suppliersError,
    refetch: refetchSuppliers
  } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => paintAPI.getSuppliers(),
    retry: 2,
    retryDelay: 1000,
  });

  // Mutations
  const deletePaintMutation = useMutation({
    mutationFn: paintAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paints'] });
      toast.success('Товар удален', 'Товар успешно удален из каталога');
    },
    onError: (error) => {
      const { message } = handleError(error);
      toast.error('Ошибка удаления', message);
    },
  });

  const paints = paintsResponse?.data?.results || [];
  const categories = categoriesResponse?.data?.results || [];
  const suppliers = suppliersResponse?.data?.results || [];

  const handleEdit = (item: Paint | PaintCategory | Supplier) => {
    setEditingItem(item);
    // Правильное определение типа объекта
    if ('current_stock' in item) {
      // Это краска (Paint) - имеет поле current_stock
      setActiveModal('paint');
    } else if ('paints_count' in item) {
      // Это категория (PaintCategory) - имеет поле paints_count
      setActiveModal('category');
    } else {
      // Это поставщик (Supplier)
      setActiveModal('supplier');
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: t.deleteConfirm,
      message: 'Это действие нельзя будет отменить.',
      type: 'danger',
      confirmText: 'Удалить',
      onConfirm: () => {
        if (viewMode === 'paints') {
          deletePaintMutation.mutate(id);
        }
      },
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    if (viewMode === 'paints') {
      setActiveModal('paint');
    } else if (viewMode === 'categories') {
      setActiveModal('category');
    } else if (viewMode === 'suppliers') {
      setActiveModal('supplier');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingItem(null);
  };

  const renderPaintsView = () => (
    <div className="space-y-6">
      {/* Фильтры и поиск */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['paints'] });
                queryClient.refetchQueries({ queryKey: ['paints'] });
              }}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              title={t.refresh}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addProduct}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Таблица товаров */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.product}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.price}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.margin}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.type}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.stock}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paintsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {t.loading}
                  </td>
                </tr>
              ) : paints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {t.notFound}
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
                            {paint.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {paint.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(paint.selling_price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          Number(paint.profit_margin) >= 30 ? 'text-green-600' :
                          Number(paint.profit_margin) >= 20 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {paint.profit_margin}%
                        </div>
                        <div className="text-xs text-gray-500">
                          +{formatCurrency(paint.profit_per_unit)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        paint.product_type === 'piece' 
                          ? 'bg-blue-100 text-blue-800'
                          : paint.product_type === 'measured'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {paint.product_type === 'piece' 
                          ? t.piece 
                          : paint.product_type === 'measured'
                          ? t.measured
                          : t.volume
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        Number(paint.current_stock) <= Number(paint.min_stock_level) 
                          ? 'bg-red-100 text-red-800'
                          : Number(paint.current_stock) <= Number(paint.min_stock_level) * 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {paint.current_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {paint.unit}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(paint)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(paint.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCategoriesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Категории красок</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить категорию</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSuppliersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Поставщики</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить поставщика</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Контакты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Адрес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {supplier.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{supplier.contact_person}</div>
                    <div className="text-sm text-gray-500">{supplier.phone}</div>
                    <div className="text-sm text-gray-500">{supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {supplier.address}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Обработка состояний загрузки и ошибок
  const isLoading = viewMode === 'paints' ? paintsLoading : 
                   viewMode === 'categories' ? categoriesLoading : 
                   suppliersLoading;

  const error = viewMode === 'paints' ? paintsError : 
               viewMode === 'categories' ? categoriesError : 
               suppliersError;

  const refetch = viewMode === 'paints' ? refetchPaints : 
                 viewMode === 'categories' ? refetchCategories : 
                 refetchSuppliers;

  return (
    <div className="w-full">
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Image 
            src="/refix.png" 
            alt="Paint Management Logo" 
            width={40} 
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-3xl font-bold text-gray-900">
            {t.title}
          </h1>
        </div>
        
        {/* Переключатель режимов */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('paints')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'paints'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Товары
          </button>
          <button
            onClick={() => setViewMode('categories')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'categories'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Категории
          </button>
          <button
            onClick={() => setViewMode('suppliers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'suppliers'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Поставщики
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Обработка состояний загрузки и ошибок */}
        {isLoading && <PageLoading text={`Загрузка ${viewMode === 'paints' ? 'товаров' : viewMode === 'categories' ? 'категорий' : 'поставщиков'}...`} />}
        
        {error && !isLoading && (
          <PageError 
            message={handleError(error).message}
            onRetry={refetch}
          />
        )}
        
        {/* Контент в зависимости от режима */}
        {!isLoading && !error && (
          <>
            {viewMode === 'paints' && renderPaintsView()}
            {viewMode === 'categories' && renderCategoriesView()}
            {viewMode === 'suppliers' && renderSuppliersView()}
          </>
        )}
      </div>

      {/* Модальные окна */}
      <PaintModal
        isOpen={activeModal === 'paint'}
        onClose={closeModal}
        paint={editingItem && 'current_stock' in editingItem ? editingItem as Paint : undefined}
        categories={categories}
      />

      <CategoryModal
        isOpen={activeModal === 'category'}
        onClose={closeModal}
        category={editingItem && 'paints_count' in editingItem ? editingItem as PaintCategory : undefined}
      />

      <SupplierModal
        isOpen={activeModal === 'supplier'}
        onClose={closeModal}
        supplier={editingItem && !('current_stock' in editingItem) && !('paints_count' in editingItem) ? editingItem as Supplier : undefined}
      />
      
      {/* Диалог подтверждения */}
      <ConfirmDialog />
    </div>
  );
}