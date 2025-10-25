import { z } from 'zod';

// Схема валидации для краски
export const paintSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов')
    .trim(),
  
  category: z.number()
    .min(1, 'Выберите категорию'),
  
  product_type: z.enum(['piece', 'measured', 'volume'], {
    message: 'Выберите тип товара'
  }),
  
  color: z.string()
    .min(1, 'Укажите цвет')
    .max(50, 'Цвет не должен превышать 50 символов')
    .trim(),
  
  unit: z.enum(['g', 'kg', 'l', 'ml', 'шт', 'упак', 'комп', 'м', 'м²'], {
    message: 'Выберите единицу измерения'
  }),
  
  brand: z.string()
    .max(50, 'Бренд не должен превышать 50 символов')
    .trim()
    .optional()
    .or(z.literal('')),
  
  cost_price: z.string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Себестоимость должна быть положительным числом'),
  
  selling_price: z.string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Цена продажи должна быть положительным числом'),
  
  min_stock_level: z.string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Минимальный остаток должен быть положительным числом'),
  
  sku: z.string()
    .max(50, 'SKU не должен превышать 50 символов')
    .trim()
    .optional()
    .or(z.literal('')),
  
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .trim()
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  const costPrice = parseFloat(data.cost_price);
  const sellingPrice = parseFloat(data.selling_price);
  return sellingPrice >= costPrice;
}, {
  message: 'Цена продажи не может быть меньше себестоимости',
  path: ['selling_price']
});

// Схема валидации для категории
export const categorySchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов')
    .trim(),
  
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Схема валидации для поставщика
export const supplierSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов')
    .trim(),
  
  contact_person: z.string()
    .max(100, 'Контактное лицо не должно превышать 100 символов')
    .trim()
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .refine((val) => {
      if (!val) return true; // Необязательное поле
      // Простая проверка на номер телефона (можно усложнить)
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
      return phoneRegex.test(val);
    }, 'Введите корректный номер телефона')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .refine((val) => {
      if (!val) return true; // Необязательное поле
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(val);
    }, 'Введите корректный email адрес')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(200, 'Адрес не должен превышать 200 символов')
    .trim()
    .optional()
    .or(z.literal('')),
  
  is_active: z.boolean()
});

// Типы для TypeScript
export type PaintFormData = z.infer<typeof paintSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type SupplierFormData = z.infer<typeof supplierSchema>;