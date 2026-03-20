import React from 'react';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';
import { TranslatedText } from '../components/translated-text';

const TestDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <TranslatedText text="Cargo Owner Dashboard" />
        </h1>
        <p className="text-gray-600">
          <TranslatedText text="Welcome to your cargo management dashboard" />
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Total Cargos" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Active Shipments" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Carriers" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                <TranslatedText text="Total Value" />
              </p>
              <p className="text-2xl font-semibold text-gray-900">$45,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <TranslatedText text="Recent Activity" />
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">
                <TranslatedText text="Electronics Shipment" />
              </p>
              <p className="text-sm text-gray-600">
                <TranslatedText text="From Kigali to Musanze" />
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              <TranslatedText text="In Transit" />
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">
                <TranslatedText text="Construction Materials" />
              </p>
              <p className="text-sm text-gray-600">
                <TranslatedText text="From Kigali to Huye" />
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              <TranslatedText text="Delivered" />
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">
                <TranslatedText text="Food Products" />
              </p>
              <p className="text-sm text-gray-600">
                <TranslatedText text="From Kigali to Rubavu" />
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
              <TranslatedText text="Pending" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          <TranslatedText text="Quick Actions" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              <TranslatedText text="Create New Cargo" />
            </p>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              <TranslatedText text="View Analytics" />
            </p>
          </button>
          
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              <TranslatedText text="Manage Carriers" />
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;