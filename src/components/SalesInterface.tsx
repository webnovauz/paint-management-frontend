'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { paintAPI, Paint, SaleItem, Customer } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { Plus, Trash2, ShoppingCart, Calculator } from 'lucide-react';
import Image from 'next/image';
import { useSalesTranslations, useProductTranslations } from '@/hooks/useTranslations';

interface SaleForm {
  customer?: number;
  customer_name: string;
  customer_phone: string;
  paid_amount: string;
  payment_type: 'cash' | 'transfer' | 'card' | 'debt';
  notes: string;
  items: SaleItem[];
}

export default function SalesInterface() {
  const t = useSalesTranslations();
  const productT = useProductTranslations();
  const queryClient = useQueryClient();
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  
  const { register, control, handleSubmit, reset, setValue, getValues } = useForm<SaleForm>({
    defaultValues: {
      customer: undefined,
      customer_name: '',
      customer_phone: '',
      paid_amount: '',
      payment_type: 'cash',
      notes: '',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Функция для расчета общей суммы
  const calculateTotal = useCallback(() => {
    const currentItems = getValues('items');
    return currentItems.reduce((total: number, item: SaleItem) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return total + (quantity * price);
    }, 0);
  }, [getValues]);

  // Функция для обновления общей суммы
  const updateTotal = useCallback(() => {
    const total = calculateTotal();
    setTotalAmount(total);
  }, [calculateTotal]);



  // Загрузка красок
  const { data: paintsResponse, isLoading: paintsLoading } = useQuery({
    queryKey: ['paints'],
    queryFn: () => paintAPI.getAllPaints({ is_active: true }).then(res => res.data),
  });

  // Извлекаем массив красок из пагинированного ответа
  const paints: Paint[] = paintsResponse?.results || [];

  // Загрузка клиентов
  const { data: customersResponse } = useQuery({
    queryKey: ['customers'],
    queryFn: () => paintAPI.getAllCustomers().then(res => res.data),
  });

  // Извлекаем массив клиентов из пагинированного ответа
  const customers: Customer[] = customersResponse?.results || [];

  // Создание продажи
  const createSaleMutation = useMutation({
    mutationFn: paintAPI.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['paints'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      reset();
      setTotalAmount(0);
      alert('Продажа успешно создана!');
    },
    onError: (error: unknown) => {
      console.error('Ошибка создания продажи:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert('Ошибка при создании продажи: ' + errorMessage);
    }
  });

  const addPaintToSale = () => {
    if (!selectedPaint) return;
    
    const currentItems = getValues('items');
    // Проверяем, не добавлен ли уже этот товар
    const existingItemIndex = currentItems.findIndex((item: SaleItem) => item.paint === selectedPaint.id);
    
    if (existingItemIndex >= 0) {
      // Если товар уже добавлен, увеличиваем количество
      const currentQuantity = parseFloat(currentItems[existingItemIndex].quantity) || 0;
      setValue(`items.${existingItemIndex}.quantity`, (currentQuantity + 0.1).toString());
    } else {
      // Добавляем новую позицию
      append({
        paint: selectedPaint.id,
        quantity: '0.1',
        unit_price: selectedPaint.selling_price,
      });
    }
    // Обновляем итоговую сумму
    setTimeout(updateTotal, 0);
  };

  const getPaintInfo = (paintId: number) => {
    return paints.find(p => p.id === paintId);
  };

  const onSubmit = (data: SaleForm) => {
    if (data.items.length === 0) {
      alert('Добавьте хотя бы одну позицию в продажу');
      return;
    }

    // Проверяем наличие товара на складе
    for (const item of data.items) {
      const paint = getPaintInfo(item.paint);
      if (paint && parseFloat(paint.current_stock) < parseFloat(item.quantity)) {
        alert(`Недостаточно товара "${paint.name} - ${paint.color}" на складе. Доступно: ${paint.current_stock} ${paint.unit}`);
        return;
      }
    }

    // Подготавливаем данные для отправки
    const submitData = {
      ...data,
      // Если customer пустой, отправляем undefined вместо пустой строки
      customer: data.customer || undefined,
      // Если paid_amount пустой, отправляем undefined вместо пустой строки
      paid_amount: data.paid_amount && data.paid_amount.trim() !== '' ? data.paid_amount : undefined,
    };

    createSaleMutation.mutate(submitData);
  };

  if (paintsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
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
        <p className="text-gray-600">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Выбор товара */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.selectProduct}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {paints.map((paint) => (
                <div
                  key={paint.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaint?.id === paint.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaint(paint)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{paint.name}</p>
                      <p className="text-xs text-gray-600">{paint.color} - {paint.brand}</p>
                      <p className="text-xs text-green-600">
                        {t.available}: {paint.current_stock} {paint.unit}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 mt-1 text-xs font-medium rounded-full ${
                        paint.product_type === 'piece' 
                          ? 'bg-blue-100 text-blue-800'
                          : paint.product_type === 'measured'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {paint.product_type === 'piece' 
                          ? productT.piece 
                          : paint.product_type === 'measured'
                          ? productT.measured
                          : productT.volume
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(paint.selling_price)} / {paint.unit}
                      </p>
                      {paint.is_low_stock && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          {productT.lowStock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedPaint && (
              <button
                type="button"
                onClick={addPaintToSale}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.addToSale}
              </button>
            )}
          </div>
        </div>

        {/* Форма продажи */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Информация о покупателе */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t.customerInfo}
              </h3>
              
              {/* Выбор клиента */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.selectCustomer}
                </label>
                <select
                  {...register('customer')}
                  onChange={(e) => {
                    const customerId = e.target.value ? parseInt(e.target.value) : undefined;
                    setValue('customer', customerId);
                    
                    if (customerId) {
                      const selectedCustomer = customers.find(c => c.id === customerId);
                      if (selectedCustomer) {
                        setValue('customer_name', selectedCustomer.name);
                        setValue('customer_phone', selectedCustomer.phone);
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.newCustomer}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                      {customer.has_debt ? ` - Долг: ${formatCurrency(customer.debt_amount)}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.customerName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('customer_name', { required: 'Имя покупателя обязательно' })}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.enterName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.customerPhone}
                  </label>
                  <input
                    {...register('customer_phone')}
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.phoneFormat}
                  />
                </div>
              </div>

              {/* Информация об оплате */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentType} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('payment_type', { required: 'Тип оплаты обязателен' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="transfer">{t.transfer}</option>
                    <option value="card">{t.card}</option>
                    <option value="debt">{t.debtPayment}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentAmount}
                  </label>
                  <input
                    {...register('paid_amount')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.leaveEmptyForFull}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t.notSpecifiedForFull}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.notes}
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.additionalInfo}
                />
              </div>
            </div>

            {/* Позиции продажи */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t.saleItems}
              </h3>
              
              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{t.noItems}</p>
                  <p className="text-sm">{t.selectProductDesc}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const paint = getPaintInfo(field.paint);
                    const currentItems = getValues('items');
                    const quantity = parseFloat(currentItems[index]?.quantity) || 0;
                    const price = parseFloat(currentItems[index]?.unit_price) || 0;
                    const total = quantity * price;

                    return (
                      <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{paint?.name}</h4>
                            <p className="text-sm text-gray-600">{paint?.color} - {paint?.brand}</p>
                            <p className="text-xs text-green-600">
                              {t.available}: {paint?.current_stock} {paint?.unit}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              remove(index);
                              setTimeout(updateTotal, 0);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Количество ({paint?.unit}) {
                                paint?.product_type === 'piece' 
                                  ? productT.piece 
                                  : paint?.product_type === 'measured'
                                  ? productT.measured
                                  : productT.volume
                              }
                            </label>
                            <input
                              {...register(`items.${index}.quantity`)}
                              type="number"
                              step={paint?.product_type === 'piece' ? '1' : '0.001'}
                              min={paint?.product_type === 'piece' ? '1' : '0.001'}
                              onChange={(e) => {
                                // Обновляем значение в форме
                                setValue(`items.${index}.quantity`, e.target.value);
                                // Обновляем сумма с небольшой задержкой
                                setTimeout(updateTotal, 10);
                              }}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={
                                paint?.product_type === 'piece' 
                                  ? 'Целое число' 
                                  : 'Например: 2.5'
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t.unitPrice.replace('(₽)', `${paint?.unit} (сум)`)}
                            </label>
                            <input
                              {...register(`items.${index}.unit_price`)}
                              type="number"
                              step="0.01"
                              min="0.01"
                              onChange={(e) => {
                                // Обновляем значение в форме
                                setValue(`items.${index}.unit_price`, e.target.value);
                                // Обновляем сумму с небольшой задержкой
                                setTimeout(updateTotal, 10);
                              }}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t.total}
                            </label>
                            <input
                              type="text"
                              value={total.toFixed(2)}
                              disabled
                              className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-900 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Итого */}
              {fields.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          <span>{t.orderTotal}</span>
                        </div>
                        <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                      </div>
                      
                      {/* Расчет оплаты и долга */}
                      {(() => {
                        const paidAmount = parseFloat(getValues('paid_amount')) || (getValues('payment_type') === 'debt' ? 0 : totalAmount);
                        const debtAmount = Math.max(totalAmount - paidAmount, 0);
                        
                        return (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>{t.paid}</span>
                              <span className="text-green-600 font-medium">{formatCurrency(paidAmount)}</span>
                            </div>
                            {debtAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>{t.debt}</span>
                                <span className="text-red-600 font-medium">{formatCurrency(debtAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span>{t.paymentType}:</span>
                              <span className="font-medium">
                                {getValues('payment_type') === 'cash' ? t.cash :
                                 getValues('payment_type') === 'transfer' ? t.transfer :
                                 getValues('payment_type') === 'card' ? t.card :
                                 t.debtPayment}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t.clear}
              </button>
              <button
                type="submit"
                disabled={createSaleMutation.isPending || fields.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {createSaleMutation.isPending ? t.creating : t.createSale}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}