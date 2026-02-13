import React, { useState, useEffect } from "react";
import {
  FaBox,
  FaTruck,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDollarSign,
  FaSearch,
  FaEye,
  FaLayerGroup,
  FaUsers,
  FaArrowLeft,
} from "react-icons/fa";
import FilterSelect from "@/components/common/FilterSelect";
import { cargoApi } from "@/services/cargoApi";
import type { CargoSummary, CargoOwner, Load } from "@/services/cargoApi";
import CargoOwnerDetailsDrawer from './CargoOwnerDetailsDrawer';
import LoadDetailsDrawer from './LoadDetailsDrawer';

interface CargoAnalyticsProps {
  tenantId?: string;
}

type ViewMode = 'cargo-owners' | 'all-loads';
type LoadTypeFilter = 'all' | 'own-cargo' | 'own-fleet';

const CargoAnalytics: React.FC<CargoAnalyticsProps> = ({ tenantId }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cargo-owners');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [loadTypeFilter, setLoadTypeFilter] = useState<LoadTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerDrawerOpen, setOwnerDrawerOpen] = useState(false);
  const [loadDrawerOpen, setLoadDrawerOpen] = useState(false);
  const [selectedOwnerForDrawer, setSelectedOwnerForDrawer] = useState<string | null>(null);
  const [selectedLoadForDrawer, setSelectedLoadForDrawer] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<CargoSummary | null>(null);
  const [cargoOwners, setCargoOwners] = useState<CargoOwner[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId, viewMode, selectedOwnerId, selectedFilter, searchTerm, loadTypeFilter]);

  const fetchData = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      // Fetch summary
      const summaryData = await cargoApi.getCargoSummary(tenantId);
      setSummary(summaryData);

      if (viewMode === 'cargo-owners') {
        // Fetch cargo owners
        const ownersData = await cargoApi.getCargoOwners(tenantId, {
          status: selectedFilter || undefined,
          search: searchTerm || undefined,
          limit: 100,
        });
        setCargoOwners(ownersData.cargoOwners);
      } else {
        // Fetch loads
        const loadsData = await cargoApi.getLoads(tenantId, {
          ownerId: selectedOwnerId || undefined,
          status: selectedFilter || undefined,
          search: searchTerm || undefined,
          loadType: loadTypeFilter,
          limit: 100,
        });
        setLoads(loadsData.loads);
      }
    } catch (error) {
      console.error('Error fetching cargo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerClick = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setViewMode('all-loads');
    setSelectedFilter('');
    setSearchTerm('');
  };

  const handleBackToOwners = () => {
    setSelectedOwnerId(null);
    setViewMode('cargo-owners');
    setSelectedFilter('');
    setLoadTypeFilter('all');
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'created': return 'text-blue-600 bg-blue-100';
      case 'published': return 'text-green-600 bg-green-100';
      case 'assigned': return 'text-purple-600 bg-purple-100';
      case 'in_transit': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <FaCheckCircle className="w-4 h-4" />;
      case 'in_transit': return <FaTruck className="w-4 h-4" />;
      case 'cancelled': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `RF ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `RF ${(amount / 1000).toFixed(1)}K`;
    } else {
      return `RF ${amount.toLocaleString()}`;
    }
  };

  const formatFullCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cargo data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Loads</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalLoads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaBox className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{summary.completedLoads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <FaDollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cargo Owners</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalCargoOwners}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <FaUsers className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle and Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedOwnerId && (
                <button
                  onClick={handleBackToOwners}
                  className="text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <FaArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cargo Owners
                </button>
              )}
              {!selectedOwnerId && (
                <>
                  <button
                    onClick={() => setViewMode('cargo-owners')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'cargo-owners'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaUsers className="inline w-4 h-4 mr-2" />
                    Cargo Owners
                  </button>
                  <button
                    onClick={() => setViewMode('all-loads')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'all-loads'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaBox className="inline w-4 h-4 mr-2" />
                    All Loads
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={viewMode === 'cargo-owners' ? "Search cargo owners..." : "Search loads..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <FilterSelect
              label="Status"
              value={selectedFilter}
              onChange={setSelectedFilter}
              placeholder="All Status"
              options={
                viewMode === 'cargo-owners'
                  ? [
                      { value: "ACTIVE", label: "Active" },
                      { value: "SUSPENDED", label: "Suspended" },
                      { value: "DEACTIVATED", label: "Deactivated" },
                    ]
                  : [
                      { value: "DRAFT", label: "Draft" },
                      { value: "PUBLISHED", label: "Published" },
                      { value: "ASSIGNED", label: "Assigned" },
                      { value: "IN_TRANSIT", label: "In Transit" },
                      { value: "DELIVERED", label: "Delivered" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]
              }
              icon={<FaLayerGroup className="text-purple-500" />}
              className="sm:min-w-[180px]"
            />
            {viewMode === 'all-loads' && !selectedOwnerId && (
              <FilterSelect
                label="Load Type"
                value={loadTypeFilter}
                onChange={(value) => setLoadTypeFilter(value as LoadTypeFilter)}
                placeholder="All Loads"
                options={[
                  { value: "all", label: "All Loads" },
                  { value: "own-cargo", label: "Our Cargo" },
                  { value: "own-fleet", label: "Our Fleet" },
                ]}
                icon={<FaTruck className="text-blue-500" />}
                className="sm:min-w-[180px]"
              />
            )}
          </div>
        </div>

        {/* Cargo Owners Table */}
        {viewMode === 'cargo-owners' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Loads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargoOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOwnerClick(owner.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.companyName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                        {owner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.totalLoads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.activeLoads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.completedLoads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(owner.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.averageRating > 0 ? owner.averageRating.toFixed(1) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOwnerForDrawer(owner.id);
                          setOwnerDrawerOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cargoOwners.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No cargo owners found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Loads Table */}
        {viewMode === 'all-loads' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck/Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {load.loadNumber}
                        <div className="flex gap-1">
                          {load.isOwnCargo && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Created by our cargo owner">
                              📦 Our Cargo
                            </span>
                          )}
                          {load.isOwnFleet && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" title="Assigned to our truck">
                              🚛 Our Fleet
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {load.cargoType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">{load.origin}</div>
                          <div className="text-sm text-gray-500">→ {load.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{load.owner.name}</div>
                        {load.owner.companyName && (
                          <div className="text-sm text-gray-500">{load.owner.companyName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(load.status)}`}>
                        {getStatusIcon(load.status)}
                        <span className="ml-1.5 capitalize">{load.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {load.weight > 0 ? `${load.weight} kg` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {load.revenue > 0 ? formatFullCurrency(load.revenue) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {load.assignedTruck?.plateNumber || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {load.assignedDriver?.name || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLoadForDrawer(load.id);
                          setLoadDrawerOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {loads.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No loads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawers */}
      {selectedOwnerForDrawer && (
        <CargoOwnerDetailsDrawer
          ownerId={selectedOwnerForDrawer}
          tenantId={tenantId || ''}
          isOpen={ownerDrawerOpen}
          onClose={() => {
            setOwnerDrawerOpen(false);
            setSelectedOwnerForDrawer(null);
          }}
          onViewLoad={(loadId) => {
            setOwnerDrawerOpen(false);
            setSelectedLoadForDrawer(loadId);
            setLoadDrawerOpen(true);
          }}
        />
      )}

      {selectedLoadForDrawer && (
        <LoadDetailsDrawer
          loadId={selectedLoadForDrawer}
          tenantId={tenantId || ''}
          isOpen={loadDrawerOpen}
          onClose={() => {
            setLoadDrawerOpen(false);
            setSelectedLoadForDrawer(null);
          }}
        />
      )}
    </div>
  );
};

export default CargoAnalytics;
