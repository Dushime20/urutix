import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerStatistics } from '../../services/brokerApi';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';

const BrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<BrokerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'BROKER') {
      navigate('/auth');
      return;
    }

    loadStatistics();
  }, [user, navigate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await brokerAPI.getBrokerStatistics(user!.id);
      setStatistics(response.data);
    } catch (err: any) {
      console.error('Failed to load broker statistics:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'Broker'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your loads, track commissions, and facilitate deals
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Default Commission Rate</p>
            <p className="text-2xl font-bold text-primary-600">
              {(user as any)?.defaultCommissionRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Commissions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-primary-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${statistics?.totalCommissions.toLocaleString() || '0.00'}
              </p>
            </div>
            <div className="bg-primary-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${statistics?.totalEarned.toLocaleString() || '0.00'}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Commissions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${statistics?.totalPending.toLocaleString() || '0.00'}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Total Loads */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Loads</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {statistics?.totalLoads || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stage 2: Cargo Discovery */}
        <div 
          className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-200"
          onClick={() => navigate('/dashboard/broker/discovery')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cargo Discovery</h3>
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Browse available cargo postings and find matching opportunities
          </p>
          <div className="flex items-center text-primary-600 text-sm font-medium">
            Explore Cargo <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        {/* Stage 3: Deal Facilitation */}
        <div 
          className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-200"
          onClick={() => navigate('/dashboard/broker/deals')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Deal Facilitation</h3>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manage match proposals and facilitate deals between parties
          </p>
          <div className="flex items-center text-primary-600 text-sm font-medium">
            Manage Deals <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        {/* Stage 4: Commissions */}
        <div 
          className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary-200"
          onClick={() => navigate('/dashboard/broker/commissions')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commissions</h3>
            <DollarSign className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Track commissions, view payment status, and manage payouts
          </p>
          <div className="flex items-center text-primary-600 text-sm font-medium">
            View Commissions <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Load Assigned</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Commission Paid</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              $500.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;

