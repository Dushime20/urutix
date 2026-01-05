import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad } from '../../services/brokerApi';
import { 
  Package, 
  MapPin, 
  DollarSign, 
  Calendar,
  Eye,
  TrendingUp,
  Loader2,
  ArrowRight
} from 'lucide-react';

const BrokerLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<BrokerLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerLoads();
    }
  }, [user]);

  const loadBrokerLoads = async () => {
    try {
      setLoading(true);
      const response = await brokerAPI.getBrokerLoads(user!.id);
      setLoads(response.data || []);
    } catch (err: any) {
      console.error('Failed to load broker loads:', err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Loads</h1>
            <p className="text-gray-600 mt-1">
              View and manage loads assigned to you
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/broker/discovery')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Find More Loads</span>
          </button>
        </div>
      </div>

      {/* Loads Grid */}
      {loads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No loads assigned yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Discover available cargo and get assigned to start earning commissions
          </p>
          <button
            onClick={() => navigate('/dashboard/broker/discovery')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 mx-auto"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Discover Cargo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loads.map((load) => (
            <div
              key={load.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
              onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{load.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium text-gray-900">
                      {load.currencyCode} {load.loadValue.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  load.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800'
                    : load.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {load.status}
                </span>
              </div>

              {load.brokerCommissionRate && (
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Commission Rate</p>
                    <p className="text-sm font-semibold text-primary-700">
                      {load.brokerCommissionRate}%
                    </p>
                  </div>
                  {load.brokerCommissionAmount && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Potential Commission</p>
                      <p className="text-sm font-semibold text-primary-700">
                        ${load.brokerCommissionAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Created {new Date(load.createdAt).toLocaleDateString()}
                </span>
                <button className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerLoadsPage;

