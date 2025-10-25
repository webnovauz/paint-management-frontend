'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/Toast';
import Dashboard from '@/components/Dashboard';
import SalesInterface from '@/components/SalesInterface';
import PaintManagement from '@/components/PaintManagement';
import Analytics from '@/components/Analytics';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import I18nProvider from '@/components/I18nProvider';
import { useNavTranslations } from '@/hooks/useTranslations';
import { Home, ShoppingCart, Package, BarChart3, Archive, Users, CreditCard } from 'lucide-react';
import Image from 'next/image';

// Lazy import для компонентов
import dynamic from 'next/dynamic';
const StockManagement = dynamic(() => import('@/components/StockManagement.simple'), {
  loading: () => <div className="flex items-center justify-center h-64">Loading...</div>
});
const CustomerManagement = dynamic(() => import('@/components/CustomerManagement'), {
  loading: () => <div className="flex items-center justify-center h-64">Loading customer management...</div>
});
const DebtManagement = dynamic(() => import('@/components/DebtManagement'), {
  loading: () => <div className="flex items-center justify-center h-64">Loading debt management...</div>
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Данные считаются устаревшими сразу
      gcTime: 0, // Удаляем из кэша сразу
      refetchOnWindowFocus: true, // Обновляем при фокусе окна
      refetchOnMount: true, // Обновляем при монтировании
    },
  },
});

type TabType = 'dashboard' | 'sales' | 'paints' | 'stock' | 'analytics' | 'customers' | 'debts';

function MainApp() {
  const navT = useNavTranslations();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    { id: 'dashboard' as TabType, label: navT.dashboard, icon: Home },
    { id: 'sales' as TabType, label: navT.sales, icon: ShoppingCart },
    { id: 'paints' as TabType, label: navT.products, icon: Package },
    { id: 'stock' as TabType, label: navT.inventory, icon: Archive },
    { id: 'customers' as TabType, label: navT.customers, icon: Users },
    { id: 'debts' as TabType, label: navT.debts, icon: CreditCard },
    { id: 'analytics' as TabType, label: navT.analytics, icon: BarChart3 },
  ];

  const handleNavigate = (tab: 'sales' | 'paints' | 'customers' | 'debts') => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'sales':
        return <SalesInterface />;
      case 'paints':
        return <PaintManagement />;
      case 'stock':
        return <StockManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'debts':
        return <DebtManagement />;
      case 'analytics':
        return <Analytics onNavigate={handleNavigate} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Навигация */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Image 
                  src="/refix.png" 
                  alt="Inventory Management Logo" 
                  width={150} 
                  height={32}
                  className="rounded-lg"
                />
              </div>
              
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Переключатель языка */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="flex-1 w-full">
        {renderContent()}
      </main>

      {/* Футер */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="w-full px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              © 2025 Inventory Management System - Система управления товарами
            </div>
            <div className="flex space-x-4">
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <I18nProvider>
          <MainApp />
        </I18nProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
