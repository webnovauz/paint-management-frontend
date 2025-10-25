import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавим интерцепторы для логирования
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.params);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Типы данных
export interface PaintCategory {
  id: number;
  name: string;
  description: string;
  paints_count: number;
  created_at: string;
}

export interface Paint {
  id: number;
  name: string;
  category: number;
  category_name: string;
  color: string;
  brand: string;  
  unit: 'g' | 'kg' | 'l' | 'ml' | 'шт' | 'упак' | 'комп' | 'м' | 'м²';
  product_type: 'piece' | 'measured' | 'volume';
  cost_price: string;
  selling_price: string;
  profit_margin: string;
  profit_per_unit: string;
  density?: string;
  description: string;
  sku: string;
  min_stock_level: string;
  current_stock: string;
  is_low_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  paint: number;
  paint_name: string;
  paint_color: string;
  paint_unit: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: string;
  price_per_unit?: string;
  total_cost?: string;
  notes: string;
  created_at: string;
  created_by: string;
}

export interface SaleItem {
  id?: number;
  paint: number;
  paint_name?: string;
  paint_color?: string;
  paint_unit?: string;
  quantity: string;
  unit_price: string;
  total_price?: string;
}

export interface Sale {
  id?: number;
  sale_number?: string;
  customer?: number;
  customer_name: string;
  customer_name_display?: string;
  customer_phone: string;
  total_amount?: string;
  paid_amount?: string;
  debt_amount?: string;
  payment_type?: 'cash' | 'transfer' | 'card' | 'debt';
  payment_status?: string;
  is_fully_paid?: boolean;
  notes: string;
  items?: SaleItem[];
  items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  purchases_count: number;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseItem {
  id?: number;
  paint: number;
  paint_name?: string;
  paint_color?: string;
  paint_unit?: string;
  quantity: string;
  unit_cost: string;
  total_cost?: string;
}

export interface Purchase {
  id?: number;
  purchase_number?: string;
  supplier: number;
  supplier_name?: string;
  total_amount?: string;
  notes: string;
  items?: PurchaseItem[];
  items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_paints: number;
  low_stock_paints: number;
  today_sales_count: number;
  today_sales_amount: string;
  today_profit: string;
  total_stock_value: string;
  // Поля для периодной статистики (когда используются start_date и end_date)
  period_sales_count?: number;
  period_sales_amount?: string;
  period_profit?: string;
  start_date?: string;
  end_date?: string;
}

// Статистика продаж по товарам
export interface ProductSalesStats {
  paint_id: number;
  paint_name: string;
  paint_color?: string;
  total_quantity: string;
  total_amount: string;
  total_profit: string;
  sales_count: number;
  avg_price: string;
  period_start?: string;
  period_end?: string;
}

// Статистика продаж по клиентам
export interface CustomerSalesStats {
  customer_id?: number;
  customer_name?: string;
  customer__name?: string;  // Новое поле от Django
  customer?: string;        // Новое поле от Django
  customer_phone?: string;
  total_purchases?: string; // Старое поле
  total_amount?: number;    // Новое поле от Django
  total_quantity?: string;
  purchases_count?: number; // Старое поле
  total_orders?: number;    // Новое поле от Django
  avg_purchase?: string;    // Старое поле
  avg_order_value?: number; // Новое поле от Django
  last_purchase?: string;
  period_start?: string;
  period_end?: string;
  rank?: number;            // Новое поле от Django
  top_products?: {
    paint_name: string;
    quantity: string;
    amount: string;
  }[];
}

export interface CustomerStatsResponse {
  customer_stats: CustomerSalesStats[];
  top_by_orders: CustomerSalesStats[];
  top_by_amount: CustomerSalesStats[];
  period: {
    start_date?: string;
    end_date?: string;
  };
}

export interface PriceHistory {
  id: number;
  paint: number;
  paint_name: string;
  old_cost_price?: string;
  new_cost_price: string;
  old_selling_price?: string;
  new_selling_price: string;
  cost_price_change_percent: string;
  selling_price_change_percent: string;
  changed_by: string;
  reason: string;
  created_at: string;
}

// Типы для параметров запросов
export interface PaintFilters {
  category?: number;
  brand?: string;
  unit?: string;
  is_active?: boolean;
  search?: string;
}

export interface StockMovementFilters {
  paint?: number;
  movement_type?: 'in' | 'out' | 'adjustment';
  created_at?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  search?: string;
}

export interface SaleFilters {
  customer_name?: string;
  created_at?: string;
  page?: number;
}

export interface SupplierFilters {
  is_active?: boolean;
  search?: string;
}

export interface PurchaseFilters {
  supplier?: number;
  created_at?: string;
  page?: number;
}

// Типы для API ответов
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Типы для создания данных
export interface CreateSaleData {
  customer?: number;
  customer_name: string;
  customer_phone: string;
  paid_amount?: string;
  payment_type?: 'cash' | 'transfer' | 'card' | 'debt';
  notes: string;
  items: SaleItem[];
}

export interface CreatePurchaseData {
  supplier: number;
  notes: string;
  items: PurchaseItem[];
}

export interface AdjustStockData {
  quantity: string;
  notes?: string;
}

// Типы для клиентов и платежей
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: string;
  debt_amount: string;
  prepayment_amount: string;
  has_debt: boolean;
  has_prepayment: boolean;
  sales_count: number;
  total_purchases: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  customer: number;
  customer_name: string;
  amount: string;
  payment_type: 'cash' | 'transfer' | 'card';
  payment_date: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface CustomerBalance {
  id: number;
  name: string;
  phone: string;
  balance: string;
  debt_amount: string;
  prepayment_amount: string;
  recent_sales: Array<{
    id: number;
    sale_number: string;
    total_amount: string;
    paid_amount: string;
    debt_amount: string;
    payment_status: string;
    created_at: string;
  }>;
  recent_payments: Payment[];
}

export interface CreatePaymentData {
  customer: number;
  amount: string;
  payment_type: 'cash' | 'transfer' | 'card';
  notes?: string;
  created_by?: string;
}

export interface CustomerFilters {
  search?: string;
  is_active?: boolean;
  has_debt?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaymentFilters {
  customer?: number;
  payment_type?: 'cash' | 'transfer' | 'card';
  search?: string;
  page?: number;
  page_size?: number;
}

// API методы
export const paintAPI = {
  // Категории
  getCategories: () => api.get<PaginatedResponse<PaintCategory>>('/categories/'),
  createCategory: (data: Partial<PaintCategory>) => api.post<PaintCategory>('/categories/', data),
  updateCategory: (id: number, data: Partial<PaintCategory>) => api.put<PaintCategory>(`/categories/${id}/`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}/`),
  
  // Краски
  getAll: (params?: PaintFilters) => api.get<PaginatedResponse<Paint>>('/paints/', { 
    params: { ...params, _t: Date.now() } 
  }),
  getPaints: (params?: PaintFilters) => api.get<PaginatedResponse<Paint>>('/paints/', { params }),
  getAllPaints: (params?: PaintFilters) => api.get<PaginatedResponse<Paint>>('/paints/', { params: { ...params, page_size: 1000 } }), // Получить все краски
  create: (data: Partial<Paint>) => api.post<Paint>('/paints/', data),
  createPaint: (data: Partial<Paint>) => api.post<Paint>('/paints/', data),
  update: (id: number, data: Partial<Paint>) => api.put<Paint>(`/paints/${id}/`, data),
  updatePaint: (id: number, data: Partial<Paint>) => api.put<Paint>(`/paints/${id}/`, data),
  delete: (id: number) => api.delete(`/paints/${id}/`),
  deletePaint: (id: number) => api.delete(`/paints/${id}/`),
  getLowStockPaints: () => api.get<Paint[]>('/paints/low_stock/'),
  adjustStock: (id: number, data: AdjustStockData) => 
    api.post(`/paints/${id}/adjust_stock/`, data),
  
  // Движения товара
  getStockMovements: (params?: StockMovementFilters) => api.get<PaginatedResponse<StockMovement>>('/stock-movements/', { params }),
  createStockAdjustment: (data: { paint: number; quantity: string; movement_type: 'in' | 'out' | 'adjustment'; notes?: string }) => api.post<StockMovement>('/stock-movements/', data),
  
  // Продажи
  getSales: (params?: SaleFilters) => api.get<PaginatedResponse<Sale>>('/sales/', { params }),
  createSale: (data: CreateSaleData) => api.post<Sale>('/sales/', data),
  getTodaySales: () => api.get<Sale[]>('/sales/today/'),
  getSalesStats: () => api.get('/sales/stats/'),
  
  // Статистика продаж
  getSalesHistory: (params?: { 
    start_date?: string; 
    end_date?: string; 
    paint_id?: number; 
    customer_id?: number;
    page?: number;
    page_size?: number;
  }) => api.get<PaginatedResponse<Sale>>('/sales/', { params }),
  
  getProductSalesStats: (params?: {
    start_date?: string;
    end_date?: string;
    paint_id?: number;
  }) => api.get('/sales/product_stats/', { params }),
  
  getCustomerSalesStats: (params?: {
    start_date?: string;
    end_date?: string;
    customer_id?: number;
  }) => api.get<CustomerStatsResponse>('/sales/customer_stats/', { params }),
  
  // Поставщики
  getSuppliers: (params?: SupplierFilters) => api.get<PaginatedResponse<Supplier>>('/suppliers/', { params }),
  createSupplier: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers/', data),
  updateSupplier: (id: number, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}/`, data),
  deleteSupplier: (id: number) => api.delete(`/suppliers/${id}/`),
  
  // Закупки
  getPurchases: (params?: PurchaseFilters) => api.get<PaginatedResponse<Purchase>>('/purchases/', { params }),
  createPurchase: (data: CreatePurchaseData) => api.post<Purchase>('/purchases/', data),
  getPurchaseStats: () => api.get('/purchases/stats/'),
  
  // Дашборд
  getDashboardStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return api.get<DashboardStats>(`/dashboard/stats/?${params.toString()}`);
  },

  // Клиенты
  getCustomers: (params?: CustomerFilters) => api.get<PaginatedResponse<Customer>>('/customers/', { params }),
  getAllCustomers: () => api.get<PaginatedResponse<Customer>>('/customers/', { params: { page_size: 1000 } }),
  createCustomer: (data: Partial<Customer>) => api.post<Customer>('/customers/', data),
  updateCustomer: (id: number, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}/`, data),
  deleteCustomer: (id: number) => api.delete(`/customers/${id}/`),
  getCustomerBalance: (id: number) => api.get<CustomerBalance>(`/customers/${id}/balance/`),
  getDebtors: () => api.get<Customer[]>('/customers/debtors/'),
  getCustomersWithPrepayment: () => api.get<Customer[]>('/customers/with_prepayment/'),
  addCustomerPayment: (id: number, data: CreatePaymentData) => api.post<Payment>(`/customers/${id}/add_payment/`, data),

  // Платежи
  getPayments: (params?: PaymentFilters) => api.get<PaginatedResponse<Payment>>('/payments/', { params }),
  createPayment: (data: CreatePaymentData) => api.post<Payment>('/payments/', data),
  getPaymentsByCustomer: (customerId: number) => api.get<Payment[]>('/payments/by_customer/', { params: { customer_id: customerId } }),
  getPaymentStatistics: () => api.get('/payments/statistics/'),
};