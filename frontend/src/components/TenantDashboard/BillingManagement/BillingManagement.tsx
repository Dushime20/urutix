import React, { useState } from 'react';
import { 
  FaDollarSign, FaFileInvoiceDollar, FaCreditCard, 
  FaChartPie, FaDownload, FaStore
} from 'react-icons/fa';
import SubscriptionTab from './SubscriptionTab';
import InvoicesTab from './InvoicesTab';
import PaymentsTab from './PaymentsTab';
import TaxReportsTab from './TaxReportsTab';
import TenantSubscriptionPlansTab from './TenantSubscriptionPlansTab';

interface BillingManagementProps {
  tenantId: string;
  className?: string;
}

type TabType = 'subscription' | 'tenant-plans' | 'invoices' | 'payments' | 'tax';

const BillingManagement: React.FC<BillingManagementProps> = ({ 
  tenantId, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('subscription');

  const tabs = [
    { id: 'subscription' as TabType, label: 'My Subscription', icon: FaDollarSign },
    { id: 'tenant-plans' as TabType, label: 'Subscription Plans', icon: FaStore },
    { id: 'invoices' as TabType, label: 'Invoices', icon: FaFileInvoiceDollar },
    { id: 'payments' as TabType, label: 'Payments', icon: FaCreditCard },
    { id: 'tax' as TabType, label: 'Tax Reports', icon: FaChartPie }
  ];

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaDollarSign className="mr-3 text-green-600" />
              Billing Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage subscriptions, invoices, payments, and tax reports
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center
                  ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'subscription' && <SubscriptionTab tenantId={tenantId} />}
        {activeTab === 'tenant-plans' && <TenantSubscriptionPlansTab tenantId={tenantId} />}
        {activeTab === 'invoices' && <InvoicesTab tenantId={tenantId} />}
        {activeTab === 'payments' && <PaymentsTab tenantId={tenantId} />}
        {activeTab === 'tax' && <TaxReportsTab tenantId={tenantId} />}
      </div>
    </div>
  );
};

export default BillingManagement;
