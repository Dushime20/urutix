import React from 'react';
import { Package, Search, Filter, MoreVertical, MapPin } from 'lucide-react';
import { Button } from '../../components/ui';
import { formatLocation } from '../../utils/formatLocation';

interface Cargo {
  id: string;
  title: string;
  status: string;
  origin: string | Record<string, unknown>;
  destination: string | Record<string, unknown>;
  date: string;
}

interface AssignedCargoManagementProps {
  cargos: Cargo[];
}

export const AssignedCargoManagement: React.FC<AssignedCargoManagementProps> = ({ cargos }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            Assigned Cargo
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage cargo assigned to you by owners</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search cargo..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            />
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Cargo ID / Title</th>
              <th className="px-6 py-4 font-medium">Route</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {cargos.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No assigned cargo found.
                </td>
              </tr>
            ) : (
              cargos.map((cargo) => (
                <tr key={cargo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{cargo.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cargo.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="w-2 h-2 rounded-full border-2 border-emerald-500"></div>
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-gray-900 dark:text-gray-300">{formatLocation(cargo.origin, '—')}</span>
                        <span className="text-gray-900 dark:text-gray-300">{formatLocation(cargo.destination, '—')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {cargo.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      {cargo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
