'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paintAPI, Customer, Payment, CreatePaymentData } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useDebtTranslations } from '@/hooks/useTranslations';
import { 
  CreditCard, Plus, Calendar, DollarSign, TrendingUp,
  Receipt, AlertTriangle, CheckCircle, User
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

function PaymentModal({ isOpen, onClose, customer }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const debtTrans = useDebtTranslations();
  const [formData, setFormData] = useState({
    amount: '',
    payment_type: 'cash' as 'cash' | 'transfer' | 'card',
    notes: '',
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: CreatePaymentData) => paintAPI.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-statistics'] });
      onClose();
      setFormData({ amount: '', payment_type: 'cash', notes: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) return;

    const paymentData: CreatePaymentData = {
      customer: customer.id,
      amount: formData.amount,
      payment_type: formData.payment_type,
      notes: formData.notes,
      created_by: 'Admin' // В реальном приложении это будет из контекста пользователя
    };

    createPaymentMutation.mutate(paymentData);
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {debtTrans.addPayment}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Информация о клиенте */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <User className="w-4 h-4 text-gray-500 mr-2" />
            <span className="font-medium">{customer.name}</span>
          </div>
          {customer.has_debt && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {debtTrans.debt}: {formatCurrency(customer.debt_amount)}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {debtTrans.amount} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={debtTrans.enterAmount}
            />
            {customer.has_debt && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: customer.debt_amount })}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Погасить весь долг ({formatCurrency(customer.debt_amount)})
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {debtTrans.paymentType} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.payment_type}
              onChange={(e) => setFormData({ 
                ...formData, 
                payment_type: e.target.value as 'cash' | 'transfer' | 'card' 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cash">💵 {debtTrans.cash}</option>
              <option value="transfer">🏦 {debtTrans.transfer}</option>
              <option value="card">💳 {debtTrans.card}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {debtTrans.notes}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={debtTrans.optionalNotes}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {debtTrans.cancel}
            </button>
            <button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createPaymentMutation.isPending ? debtTrans.loading : debtTrans.recordPayment}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DebtManagement() {
  const debtTrans = useDebtTranslations();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  // Загрузка должников
  const { data: debtors = [], isLoading: debtorsLoading } = useQuery({
    queryKey: ['debtors'],
    queryFn: () => paintAPI.getDebtors().then(res => res.data),
  });

  // Загрузка последних платежей
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paintAPI.getPayments({ page_size: 10 }).then(res => res.data),
  });

  const recentPayments: Payment[] = paymentsResponse?.results || [];

  // Загрузка статистики платежей
  const { data: paymentStats } = useQuery({
    queryKey: ['payment-statistics'],
    queryFn: () => paintAPI.getPaymentStatistics().then(res => res.data),
  });

  const handleAddPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedCustomer(undefined);
  };

  // Общая сумма долгов
  const totalDebt = debtors.reduce((sum, debtor) => sum + parseFloat(debtor.debt_amount), 0);

  return (
    <div className="w-full px-6 py-6">
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-7 h-7" />
              {debtTrans.title}
            </h1>
          <p className="text-gray-600">
            {debtTrans.subtitle}
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{debtTrans.debtors}</p>
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
              <p className="text-sm font-medium text-gray-600">{debtTrans.totalDebt}</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalDebt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{debtTrans.paymentsToday}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {paymentStats?.today_payments_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{debtTrans.incomeToday}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(paymentStats?.today_payments_amount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Список должников */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {debtTrans.debtors}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {debtorsLoading ? (
              <div className="p-6 text-center text-gray-500">
                {debtTrans.loadingDebtors}
              </div>
            ) : debtors.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>{debtTrans.noDebtors}</p>
                <p className="text-sm">{debtTrans.allClientsSettled}</p>
              </div>
            ) : (
              debtors.map((debtor) => (
                <div key={debtor.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {debtor.name}
                        </div>
                        <div className="ml-2 text-xs text-gray-500">
                          {debtor.phone}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className="text-lg font-semibold text-red-600">
                          {formatCurrency(debtor.debt_amount)}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({debtor.sales_count} {debtTrans.purchases})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddPayment(debtor)}
                      className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {debtTrans.payment}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Последние платежи */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-500" />
              {debtTrans.recentPayments}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {paymentsLoading ? (
              <div className="p-6 text-center text-gray-500">
                {debtTrans.loadingPayments}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>{debtTrans.noPayments}</p>
                <p className="text-sm">{debtTrans.addPayment}</p>
              </div>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.customer_name}
                        </div>
                        <div className="ml-2 px-2 py-1 text-xs rounded-full">
                          {payment.payment_type === 'cash' ? '💵' :
                           payment.payment_type === 'transfer' ? '🏦' : '💳'}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-lg font-semibold text-green-600">
                          +{formatCurrency(payment.amount)}
                        </span>
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(payment.payment_date).toLocaleDateString('uz-UZ')}
                          </div>
                        </div>
                      </div>
                      {payment.notes && (
                        <div className="mt-1 text-xs text-gray-500">
                          {payment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Статистика по типам оплаты */}
      {paymentStats?.by_payment_type && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {debtTrans.paymentStats}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(paymentStats.by_payment_type).map(([type, stats]) => {
              const typedStats = stats as { display_name: string; count: number; amount: string };
              return (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-2xl">
                      {type === 'cash' ? '💵' : type === 'transfer' ? '🏦' : '💳'}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      {typedStats.display_name}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {typedStats.count} {debtTrans.payments}
                    </p>
                    <p className="text-sm text-gray-500">
                      {debtTrans.on} {formatCurrency(typedStats.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Модальное окно добавления платежа */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          customer={selectedCustomer}
        />
      </div>
    </div>
  );
}