'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paintAPI, Customer } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useCustomerTranslations } from '@/hooks/useTranslations';
import { 
  Users, Plus, Edit, Trash2, Phone, Mail, MapPin, 
  TrendingUp, TrendingDown, AlertCircle, DollarSign 
} from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const queryClient = useQueryClient();
  const customerTrans = useCustomerTranslations();
  
  // Инициализируем форму с данными клиента или пустыми значениями
  const [formData, setFormData] = useState(() => ({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
  }));

  // Сбрасываем форму при закрытии
  const handleClose = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    onClose();
  };

  const createMutation = useMutation({
    mutationFn: paintAPI.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      paintAPI.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (customer) {
      updateMutation.mutate({ id: customer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? customerTrans.editCustomer : customerTrans.addCustomer}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {customerTrans.name} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={customerTrans.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {customerTrans.phone}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+998 (xx) xxx-xx-xx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {customerTrans.email}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {customerTrans.address}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={customerTrans.address}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {customerTrans.cancel}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending || updateMutation.isPending ? customerTrans.loading : customerTrans.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerManagement() {
  const queryClient = useQueryClient();
  const customerTrans = useCustomerTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [filter, setFilter] = useState<'all' | 'debtors' | 'prepaid'>('all');

  // Загрузка клиентов
  const { data: customersResponse, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => paintAPI.getCustomers().then(res => res.data),
  });

  const customers: Customer[] = customersResponse?.results || [];

  // Загрузка должников
  const { data: debtors = [] } = useQuery({
    queryKey: ['debtors'],
    queryFn: () => paintAPI.getDebtors().then(res => res.data),
  });

  // Загрузка клиентов с предоплатой
  const { data: prepaidCustomers = [] } = useQuery({
    queryKey: ['prepaid-customers'],
    queryFn: () => paintAPI.getCustomersWithPrepayment().then(res => res.data),
  });

  // Удаление клиента
  const deleteMutation = useMutation({
    mutationFn: paintAPI.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      queryClient.invalidateQueries({ queryKey: ['prepaid-customers'] });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(customerTrans.deleteConfirm)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(undefined);
  };

  // Фильтрация клиентов
  const getFilteredCustomers = () => {
    switch (filter) {
      case 'debtors':
        return customers.filter(c => c.has_debt);
      case 'prepaid':
        return customers.filter(c => c.has_prepayment);
      default:
        return customers;
    }
  };

  const filteredCustomers = getFilteredCustomers();

  // Общая статистика
  const totalDebt = customers.reduce((sum, c) => sum + parseFloat(c.debt_amount), 0);
  const totalPrepayment = customers.reduce((sum, c) => sum + parseFloat(c.prepayment_amount), 0);

  return (
    <div className="w-full px-6 py-6">
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7" />
              {customerTrans.title}
            </h1>
          <p className="text-gray-600">
            {customerTrans.subtitle}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {customerTrans.addCustomer}
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{customerTrans.totalCustomers}</p>
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{customerTrans.debtors}</p>
              <p className="text-2xl font-semibold text-gray-900">{debtors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{customerTrans.totalDebt}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDebt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{customerTrans.totalPrepayment}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPrepayment)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {customerTrans.allCustomers} ({customers.length})
          </button>
          <button
            onClick={() => setFilter('debtors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'debtors'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {customerTrans.debtors} ({debtors.length})
          </button>
          <button
            onClick={() => setFilter('prepaid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'prepaid'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {customerTrans.withPrepayment} ({prepaidCustomers.length})
          </button>
        </div>
      </div>

      {/* Список клиентов */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {customerTrans.loading}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{customerTrans.noCustomers}</p>
            <p className="text-sm">{customerTrans.addCustomer}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {customerTrans.client}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {customerTrans.contacts}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {customerTrans.balance}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {customerTrans.statistics}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {customerTrans.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.address.length > 30 
                              ? customer.address.substring(0, 30) + '...'
                              : customer.address
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.has_debt ? (
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-red-600">
                              {customerTrans.debt}: {formatCurrency(customer.debt_amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customerTrans.balance}: {formatCurrency(customer.balance)}
                            </div>
                          </div>
                        </div>
                      ) : customer.has_prepayment ? (
                        <div className="flex items-center">
                          <TrendingDown className="w-4 h-4 text-green-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-green-600">
                              {customerTrans.prepayment}: {formatCurrency(customer.prepayment_amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {customerTrans.balance}: {formatCurrency(customer.balance)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {customerTrans.balance}: {formatCurrency(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {customerTrans.purchases}: {customer.sales_count}
                        </div>
                        <div className="text-gray-500">
                          {customerTrans.onAmount}: {formatCurrency(customer.total_purchases)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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
        )}
      </div>

        {/* Модальное окно */}
        <CustomerModal
          key={editingCustomer?.id || 'new'}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          customer={editingCustomer}
        />
      </div>
    </div>
  );
}