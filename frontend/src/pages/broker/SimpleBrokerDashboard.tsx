import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from '../../components/Layout/DashboardHeader';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Target,
  Sparkles,
  Shield,
  FileText,
  BarChart3,
  MapPin,
  Truck,
  Search,
  Gavel,
  Wallet
} from 'lucide-react';

const SimpleBrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <DashboardHeader />
      
      {/* Welcome Section - Same as Cargo Owner */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                  return `${greeting}, ${user?.firstName || 'Broker'}`;
                })()}
              </h1>
              <p className="mt-1 text-gray-600">
                Professional logistics facilitation at your fingertips
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/dashboard/broker/loads')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
              >
                <Package className="w-5 h-5" />
                My Loads
              </button>
              <button
                onClick={() => navigate('/dashboard/broker/bidding')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
              >
                <Gavel className="w-5 h-5" />
                Bidding
              </button>
              <button
                onClick={() => navigate('/dashboard/broker/tracking')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <MapPin className="w-5 h-5" />
                Tracking
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'Overview', label: 'Overview', icon: BarChart3 },
              { id: 'Loads', label: 'My Loads', icon: Package },
              { id: 'Bidding', label: 'Bidding', icon: Gavel },
              { id: 'Tracking', label: 'Tracking', icon: MapPin },
              { id: 'Contracts', label: 'Contracts', icon: FileText },
              { id: 'Insurance', label: 'Insurance', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/dashboard/broker/${tab.id.toLowerCase()}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">$12,450</p>
              <p className="text-xs text-gray-600 font-medium mt-1">↗ +15% this month</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <DollarSign className="w-7 h-7 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Loads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
              <p className="text-xs text-gray-500 mt-1">Currently managing</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <Package className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">$3,200</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">94%</p>
              <p className="text-xs text-gray-500 mt-1">Deal completion</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <TrendingUp className="w-7 h-7 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
            onClick={() => navigate('/dashboard/broker/loads')}
          >
            <div className="bg-gray-100 rounded-lg p-3 w-fit mb-3">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">My Loads</h3>
            <p className="text-sm text-gray-600 mb-3">
              Manage assigned loads & tracking
            </p>
            <div className="flex items-center text-sm font-semibold text-gray-700">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>

          <div 
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
            onClick={() => navigate('/dashboard/broker/bidding')}
          >
            <div className="bg-gray-100 rounded-lg p-3 w-fit mb-3">
              <Gavel className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Bidding</h3>
            <p className="text-sm text-gray-600 mb-3">
              Manage bids and proposals
            </p>
            <div className="flex items-center text-sm font-semibold text-gray-700">
              View Bids <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>

          <div 
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
            onClick={() => navigate('/dashboard/broker/tracking')}
          >
            <div className="bg-gray-100 rounded-lg p-3 w-fit mb-3">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Tracking</h3>
            <p className="text-sm text-gray-600 mb-3">
              Track shipments and deliveries
            </p>
            <div className="flex items-center text-sm font-semibold text-gray-700">
              Track Now <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>

          <div 
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
            onClick={() => navigate('/dashboard/broker/commissions')}
          >
            <div className="bg-gray-100 rounded-lg p-3 w-fit mb-3">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Commissions</h3>
            <p className="text-sm text-gray-600 mb-3">
              Track earnings & manage payouts
            </p>
            <div className="flex items-center text-sm font-semibold text-gray-700">
              View Earnings <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Services */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/dashboard/broker/contracts')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Contracts</h3>
                <p className="text-xs text-gray-500">Manage load agreements</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/dashboard/broker/insurance')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Insurance</h3>
                <p className="text-xs text-gray-500">Verify compliance</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/dashboard/broker/market-intelligence')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Market Intel</h3>
                <p className="text-xs text-gray-500">Real-time insights</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/dashboard/broker/analytics')}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-2">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Analytics</h3>
                <p className="text-xs text-gray-500">Performance data</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBrokerDashboard;