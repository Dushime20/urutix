import React, { useState, useEffect } from 'react';
import { 
  FaDollarSign, FaFileInvoiceDollar, FaChartLine, FaChartBar, 
  FaChartPie, FaChartArea, FaCalculator, FaReceipt, FaCreditCard,
  FaTruck, FaUser, FaCalendarAlt, FaClock, FaCheckCircle, 
  FaExclamationTriangle, FaTimes, FaPlus, FaEdit, FaDownload,
  FaEye, FaTrash, FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown,
  FaArrowUp, FaArrowDown, FaMinus, FaPercent, FaShieldAlt,
  FaRoute, FaGasPump, FaTools, FaFileAlt, FaBell, FaCog
} from 'react-icons/fa';
import type { 
  Invoice, Expense, Payment, FinancialReport, Budget, TaxRecord,
  CustomerAnalytics, DriverAnalytics, PerformanceMetric, PredictiveAnalytics
} from '../../types/fleet';

interface FinancialManagementProps {
  fleetId?: string;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({ fleetId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Mock data for demonstration
  const mockFinancialData = {
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-001',
        customerId: 'cust-001',
        customerName: 'ABC Logistics',
        tripId: 'trip-001',
        truckId: 'truck-001',
        driverId: 'drv-001',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'paid',
        subtotal: 2500,
        taxAmount: 250,
        totalAmount: 2750,
        currency: 'USD',
        items: [
          {
            id: 'item-1',
            description: 'Freight charges - Miami to Atlanta',
            quantity: 1,
            unitPrice: 2000,
            totalPrice: 2000,
            type: 'freight',
            tripId: 'trip-001'
          },
          {
            id: 'item-2',
            description: 'Fuel surcharge',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500,
            type: 'fuel_surcharge',
            tripId: 'trip-001'
          }
        ],
        notes: 'On-time delivery',
        paymentTerms: 'Net 30',
        paymentMethod: 'ach',
        paidDate: new Date('2024-01-20')
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-2024-002',
        customerId: 'cust-002',
        customerName: 'XYZ Transport',
        tripId: 'trip-002',
        truckId: 'truck-002',
        driverId: 'drv-002',
        issueDate: new Date('2024-01-20'),
        dueDate: new Date('2024-02-20'),
        status: 'sent',
        subtotal: 3200,
        taxAmount: 320,
        totalAmount: 3520,
        currency: 'USD',
        items: [
          {
            id: 'item-3',
            description: 'Freight charges - Chicago to Dallas',
            quantity: 1,
            unitPrice: 2800,
            totalPrice: 2800,
            type: 'freight',
            tripId: 'trip-002'
          },
          {
            id: 'item-4',
            description: 'Detention charges',
            quantity: 2,
            unitPrice: 200,
            totalPrice: 400,
            type: 'detention',
            tripId: 'trip-002'
          }
        ],
        notes: 'Delayed pickup',
        paymentTerms: 'Net 30'
      }
    ],
    expenses: [
      {
        id: 'exp-1',
        type: 'fuel',
        category: 'Fuel',
        amount: 450,
        date: new Date('2024-01-25'),
        description: 'Diesel fuel purchase',
        truckId: 'truck-001',
        driverId: 'drv-001',
        tripId: 'trip-001',
        status: 'approved',
        approvedBy: 'Manager',
        approvedDate: new Date('2024-01-26'),
        taxDeductible: true,
        allocation: {
          tripId: 'trip-001',
          percentage: 100
        }
      },
      {
        id: 'exp-2',
        type: 'maintenance',
        category: 'Maintenance',
        amount: 800,
        date: new Date('2024-01-28'),
        description: 'Tire replacement',
        truckId: 'truck-002',
        status: 'approved',
        approvedBy: 'Manager',
        approvedDate: new Date('2024-01-29'),
        taxDeductible: true,
        allocation: {
          percentage: 100
        }
      }
    ],
    payments: [
      {
        id: 'pay-1',
        invoiceId: 'inv-1',
        invoiceNumber: 'INV-2024-001',
        customerId: 'cust-001',
        customerName: 'ABC Logistics',
        amount: 2750,
        paymentDate: new Date('2024-01-20'),
        paymentMethod: 'ach',
        referenceNumber: 'ACH-2024-001',
        status: 'completed',
        processingFee: 25
      }
    ],
    performanceMetrics: [
      {
        id: 'metric-1',
        name: 'Monthly Revenue',
        value: 125000,
        target: 120000,
        unit: 'USD',
        trend: 'up',
        change: 5000,
        changePercentage: 4.2,
        period: 'monthly',
        date: new Date('2024-01-31')
      },
      {
        id: 'metric-2',
        name: 'Profit Margin',
        value: 18.5,
        target: 20,
        unit: '%',
        trend: 'down',
        change: -1.5,
        changePercentage: -7.5,
        period: 'monthly',
        date: new Date('2024-01-31')
      },
      {
        id: 'metric-3',
        name: 'Days to Payment',
        value: 28,
        target: 30,
        unit: 'days',
        trend: 'up',
        change: -2,
        changePercentage: -6.7,
        period: 'monthly',
        date: new Date('2024-01-31')
      },
      {
        id: 'metric-4',
        name: 'Fuel Efficiency',
        value: 6.8,
        target: 7.0,
        unit: 'mpg',
        trend: 'down',
        change: -0.2,
        changePercentage: -2.9,
        period: 'monthly',
        date: new Date('2024-01-31')
      }
    ],
    customerAnalytics: [
      {
        customerId: 'cust-001',
        customerName: 'ABC Logistics',
        totalRevenue: 45000,
        totalTrips: 18,
        averageRate: 2500,
        profitMargin: 22.5,
        paymentHistory: {
          onTime: 15,
          late: 3,
          averageDaysToPay: 25
        },
        satisfaction: 4.8,
        churnRisk: 'low',
        lastActivity: new Date('2024-01-30')
      },
      {
        customerId: 'cust-002',
        customerName: 'XYZ Transport',
        totalRevenue: 32000,
        totalTrips: 12,
        averageRate: 2667,
        profitMargin: 19.2,
        paymentHistory: {
          onTime: 8,
          late: 4,
          averageDaysToPay: 35
        },
        satisfaction: 4.2,
        churnRisk: 'medium',
        lastActivity: new Date('2024-01-28')
      }
    ],
    driverAnalytics: [
      {
        driverId: 'drv-001',
        driverName: 'John Smith',
        totalTrips: 25,
        totalMiles: 15000,
        revenue: 62500,
        expenses: 8500,
        profit: 54000,
        efficiency: 92.5,
        safetyScore: 88,
        retentionScore: 95,
        lastActivity: new Date('2024-01-30')
      },
      {
        driverId: 'drv-002',
        driverName: 'Mike Johnson',
        totalTrips: 20,
        totalMiles: 12000,
        revenue: 52000,
        expenses: 7200,
        profit: 44800,
        efficiency: 89.2,
        safetyScore: 92,
        retentionScore: 88,
        lastActivity: new Date('2024-01-29')
      }
    ],
    predictiveAnalytics: {
      demandForecast: {
        period: 'Q2 2024',
        predictedVolume: 180,
        confidence: 85,
        factors: ['Seasonal demand increase', 'New customer contracts', 'Market expansion']
      },
      priceOptimization: {
        recommendedRate: 2850,
        marketRate: 2700,
        competitiveAdvantage: 5.6,
        factors: ['Fuel price increase', 'Capacity constraints', 'Customer demand']
      },
      maintenancePrediction: {
        truckId: 'truck-001',
        nextMaintenanceDate: new Date('2024-03-15'),
        confidence: 92,
        recommendedActions: ['Oil change', 'Tire rotation', 'Brake inspection']
      },
      fuelOptimization: {
        recommendedRoutes: ['Route A-1', 'Route B-2', 'Route C-3'],
        expectedSavings: 1200,
        efficiencyImprovement: 8.5
      },
      riskAssessment: {
        riskLevel: 'low',
        riskFactors: ['Driver shortage', 'Fuel price volatility'],
        mitigationStrategies: ['Driver retention program', 'Fuel hedging strategy']
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'sent':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <FaArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <FaArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <FaMinus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600">Comprehensive financial oversight and analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
              <FaPlus className="w-4 h-4" />
              Create Invoice
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <FaDownload className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaDollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(125000)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaChartLine className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">18.5%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaClock className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Days to Payment</p>
              <p className="text-2xl font-bold text-gray-900">28</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaGasPump className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Fuel Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">6.8 mpg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartBar },
            { id: 'invoicing', label: 'Invoicing', icon: FaFileInvoiceDollar },
            { id: 'expenses', label: 'Expenses', icon: FaReceipt },
            { id: 'payments', label: 'Payments', icon: FaCreditCard },
            { id: 'analytics', label: 'Analytics', icon: FaChartLine },
            { id: 'predictive', label: 'Predictive', icon: FaCog }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Overview</h2>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Performance Indicators</h3>
                <div className="space-y-3">
                  {mockFinancialData.performanceMetrics.map(metric => (
                    <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{metric.name}</p>
                        <p className="text-sm text-gray-500">{metric.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{metric.value}</span>
                        {getTrendIcon(metric.trend)}
                        <span className={`text-xs px-2 py-1 rounded ${
                          metric.trend === 'up' ? 'bg-green-100 text-green-800' :
                          metric.trend === 'down' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-900">Payment Received</p>
                        <p className="text-sm text-green-700">ABC Logistics - {formatCurrency(2750)}</p>
                      </div>
                      <span className="text-xs text-green-600">2 days ago</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">Invoice Sent</p>
                        <p className="text-sm text-blue-700">XYZ Transport - {formatCurrency(3520)}</p>
                      </div>
                      <span className="text-xs text-blue-600">1 day ago</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-orange-900">Expense Approved</p>
                        <p className="text-sm text-orange-700">Tire replacement - {formatCurrency(800)}</p>
                      </div>
                      <span className="text-xs text-orange-600">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoicing' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Invoicing</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Create Invoice
              </button>
            </div>
            <div className="space-y-4">
              {mockFinancialData.invoices.map(invoice => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaFileInvoiceDollar className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{invoice.invoiceNumber}</h3>
                        <p className="text-sm text-gray-500">{invoice.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Issue Date:</span>
                      <span className="ml-2">{invoice.issueDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <span className="ml-2">{invoice.dueDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Items:</span>
                      <span className="ml-2">{invoice.items.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Terms:</span>
                      <span className="ml-2">{invoice.paymentTerms}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                      <FaEye className="w-3 h-3 inline mr-1" />
                      View
                    </button>
                    <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                      <FaEdit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                      <FaDownload className="w-3 h-3 inline mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Expense Management</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Add Expense
              </button>
            </div>
            <div className="space-y-4">
              {mockFinancialData.expenses.map(expense => (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaReceipt className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{expense.description}</h3>
                        <p className="text-sm text-gray-500">{expense.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{expense.date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2">{expense.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tax Deductible:</span>
                      <span className="ml-2">{expense.taxDeductible ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Allocation:</span>
                      <span className="ml-2">{expense.allocation.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Payment Processing</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Record Payment
              </button>
            </div>
            <div className="space-y-4">
              {mockFinancialData.payments.map(payment => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaCreditCard className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{payment.invoiceNumber}</h3>
                        <p className="text-sm text-gray-500">{payment.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Payment Date:</span>
                      <span className="ml-2">{payment.paymentDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Method:</span>
                      <span className="ml-2">{payment.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reference:</span>
                      <span className="ml-2">{payment.referenceNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Processing Fee:</span>
                      <span className="ml-2">{formatCurrency(payment.processingFee || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Analytics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Analytics</h3>
                <div className="space-y-3">
                  {mockFinancialData.customerAnalytics.map(customer => (
                    <div key={customer.customerId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{customer.customerName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.churnRisk === 'low' ? 'bg-green-100 text-green-800' :
                          customer.churnRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {customer.churnRisk} risk
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <span className="ml-2">{formatCurrency(customer.totalRevenue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Margin:</span>
                          <span className="ml-2">{customer.profitMargin}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Trips:</span>
                          <span className="ml-2">{customer.totalTrips}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Satisfaction:</span>
                          <span className="ml-2">{customer.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Analytics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Driver Analytics</h3>
                <div className="space-y-3">
                  {mockFinancialData.driverAnalytics.map(driver => (
                    <div key={driver.driverId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{driver.driverName}</h4>
                        <span className="text-sm text-gray-500">{driver.efficiency}% efficiency</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <span className="ml-2">{formatCurrency(driver.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Profit:</span>
                          <span className="ml-2">{formatCurrency(driver.profit)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Trips:</span>
                          <span className="ml-2">{driver.totalTrips}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Safety:</span>
                          <span className="ml-2">{driver.safetyScore}/100</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictive' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Predictive Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demand Forecast */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FaChartLine className="w-5 h-5 text-blue-600" />
                  Demand Forecast
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.demandForecast.period}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Predicted Volume:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.demandForecast.predictedVolume} trips</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.demandForecast.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Price Optimization */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FaCalculator className="w-5 h-5 text-green-600" />
                  Price Optimization
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Recommended Rate:</span>
                    <span className="font-medium">{formatCurrency(mockFinancialData.predictiveAnalytics.priceOptimization.recommendedRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Market Rate:</span>
                    <span className="font-medium">{formatCurrency(mockFinancialData.predictiveAnalytics.priceOptimization.marketRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Advantage:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.priceOptimization.competitiveAdvantage}%</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Prediction */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FaTools className="w-5 h-5 text-orange-600" />
                  Maintenance Prediction
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Next Maintenance:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.maintenancePrediction.nextMaintenanceDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.maintenancePrediction.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Fuel Optimization */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FaGasPump className="w-5 h-5 text-purple-600" />
                  Fuel Optimization
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Expected Savings:</span>
                    <span className="font-medium">{formatCurrency(mockFinancialData.predictiveAnalytics.fuelOptimization.expectedSavings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Efficiency Improvement:</span>
                    <span className="font-medium">{mockFinancialData.predictiveAnalytics.fuelOptimization.efficiencyImprovement}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 