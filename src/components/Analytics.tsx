'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Package,
  History
} from 'lucide-react';
import { useAnalyticsTranslations } from '@/hooks/useTranslations';
import Dashboard from './Dashboard';
import SalesHistory from './SalesHistory';
import ProductStats from './ProductStats';
import CustomerStats from './CustomerStats';

type AnalyticsTab = 'overview' | 'sales-history' | 'product-stats' | 'customer-stats';

interface AnalyticsProps {
  onNavigate?: (tab: 'sales' | 'paints' | 'customers' | 'debts') => void;
}

export default function Analytics({ onNavigate }: AnalyticsProps = {}) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const t = useAnalyticsTranslations();

  const tabs = [
    {
      id: 'overview' as AnalyticsTab,
      name: t.overview,
      icon: BarChart3,
      description: t.subtitle
    },
    {
      id: 'sales-history' as AnalyticsTab,
      name: t.salesHistory,
      icon: History,
      description: 'Детальная история всех продаж'
    },
    {
      id: 'product-stats' as AnalyticsTab,
      name: t.productStats,
      icon: Package,
      description: 'Анализ продаж по товарам'
    },
    {
      id: 'customer-stats' as AnalyticsTab,
      name: t.customerStats,
      icon: Users,
      description: 'Анализ лояльности клиентов'
    }
  ];

  const renderTabContent = () => {
    // Функция-адаптер для Dashboard
    const handleDashboardNavigate = (tab: 'customers' | 'debts') => {
      if (onNavigate) {
        onNavigate(tab);
      }
    };

    switch (activeTab) {
      case 'overview':
        return <Dashboard onNavigate={handleDashboardNavigate} />;
      case 'sales-history':
        return <SalesHistory />;
      case 'product-stats':
        return <ProductStats />;
      case 'customer-stats':
        return <CustomerStats />;
      default:
        return <Dashboard onNavigate={handleDashboardNavigate} />;
    }
  };

  return (
    <div className="w-full px-6 py-6 overflow-visible">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t.title}
        </h1>
        <p className="text-gray-600">
          {t.subtitle}
        </p>
      </div>

        {/* Навигационные вкладки */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-visible">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Описание активной вкладки */}
          <div className="p-6 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Содержимое вкладки */}
        <div className="space-y-6 overflow-visible">
          {renderTabContent()}
        </div>
    </div>
  );
}