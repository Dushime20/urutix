import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FaSync, FaExclamationTriangle, FaTruck, FaUser, FaRoute, FaDollarSign, FaChartBar } from 'react-icons/fa';
import { FiGrid, FiList } from 'react-icons/fi';
import { CheckCircle, Activity, Settings, AlertCircle, ArrowUpRight } from 'lucide-react';
import { FleetFilters } from './FleetFilters';
import { FleetModal } from './FleetModal';
import { FleetSkeleton } from './FleetSkeleton';
import { FleetTable } from './FleetTable';
import { ErrorBoundary } from '../ErrorBoundary';
import FleetFormStepper from './FleetFormStepper';
import { SafetyManagement } from './SafetyManagement';
import { FinancialManagement } from './FinancialManagement';
import { RouteAssignmentManager } from './RouteAssignmentManager';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from '../Layout/DashboardHeader';
import DashboardFooter from '../Layout/DashboardFooter';
import 'leaflet/dist/leaflet.css';
import { fleetApi } from '../../services/fleetApi';
import type { FleetItem as ServiceTruck, Driver as ServiceDriver } from '../../services/fleetApi';
import { authAPI } from '../../services/api';
import type { FleetItem as LocalFleetItem, FleetFilters as FleetFiltersType } from '../../types/fleet';
import { FleetStatus } from '../../types/fleet';
import { useLocation, useNavigate } from 'react-router-dom';
import { TruckAnalytics } from './TruckAnalytics';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { TranslatedText } from '../translated-text';
import { useCargoOwnerLayout } from '../../contexts/CargoOwnerLayoutContext';
import TruckBidsPage from '../../pages/TruckBidsPage';

// Fix default marker icon for Leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const fleetIcon = new Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const FleetDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, accessToken } = useAuth();
  const layoutContext = useCargoOwnerLayout();
  const { setHideHeader } = layoutContext || {};
  const { confirm, DialogComponent } = useConfirmDialog();
  const [fleetItems, setFleetItems] = useState<LocalFleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFleetItem, setSelectedFleetItem] = useState<LocalFleetItem | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState<FleetFiltersType>({ status: FleetStatus.IN_TRANSIT });
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const isTrucksRoute = location.pathname.includes('/trucks');
  const isDriversRoute = location.pathname.includes('/drivers');
  const isAnalyticsRoute = location.pathname.includes('/analytics');
  const isSafetyRoute = location.pathname.includes('/safety');
  const isFinancialRoute = location.pathname.includes('/financial');
  const isRoutesRoute = location.pathname.includes('/routes');

  const [activeTab, setActiveTab] = useState<'overview' | 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes'>('overview');
  
  const observer = useRef<IntersectionObserver | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFleetItem, setEditingFleetItem] = useState<LocalFleetItem | null>(null);

  useEffect(() => {
    if (setHideHeader) {
      setHideHeader(true);
      return () => setHideHeader(false);
    }
  }, [setHideHeader]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!authLoading && user && accessToken) {
      authAPI.testAuth()
        .then(() => loadFleetItems(true))
        .catch(() => navigate('/auth'));
    }
  }, [authLoading, user, accessToken, navigate]);

  useEffect(() => {
    if (location.pathname === '/dashboard/fleet/trucks/create') {
      setActiveTab('trucks');
      setShowForm(true);
      setFormMode('create');
      setEditingFleetItem(null);
    } else if (location.pathname === '/dashboard/fleet/drivers/create') {
      setActiveTab('drivers');
      setShowForm(true);
      setFormMode('create');
      setEditingFleetItem(null);
    }
  }, [location.pathname]);

  const normalizeTruck = (t: ServiceTruck): LocalFleetItem => {
    const name = [t.make, t.model].filter(Boolean).join(' ').trim() || t.plateNumber || t.id;
    const status = (t.status as unknown as FleetStatus) || FleetStatus.AVAILABLE;
    return {
      id: t.id,
      type: 'truck',
      name,
      status,
      currentLocation: t.currentLocation ? { coordinates: { coordinates: [] }, address: t.currentLocation } : undefined,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      licensePlate: t.plateNumber,
      plateNumber: t.plateNumber,
      make: t.make,
      model: t.model,
      year: t.year,
      capacityWeight: t.capacityWeight,
      capacityVolume: t.capacityVolume,
      mileage: t.mileage,
    } as LocalFleetItem;
  };

  const normalizeDriver = (d: ServiceDriver): LocalFleetItem => {
    const name = `${d.firstName} ${d.lastName}`.trim() || d.id;
    const status: FleetStatus = FleetStatus.AVAILABLE;
    return {
      id: d.id,
      type: 'driver',
      name,
      status,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
      licenseNumber: d.licenseNumber,
      experience: d.experience,
      contactInfo: { phone: d.phone, email: d.email },
    } as LocalFleetItem;
  };

  const loadFleetItems = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const truckData = await fleetApi.getTrucks({});
      const driverData = await fleetApi.getDrivers({});
      const allData = [...truckData.map(normalizeTruck), ...driverData.map(normalizeDriver)];
      setFleetItems(allData);
    } catch (e) {
      setError('Failed to load fleet items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleetItems(true);
  }, []);

  const lastFleetItemRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadFleetItems();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadFleetItems]);

  const handleExport = () => {
    const exportFilters: any = {};
    if (search) exportFilters.search = search;
    if (filters.status) exportFilters.status = filters.status;
    fleetApi.exportFleetData('csv', exportFilters)
      .then((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fleet-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => console.error('Export failed:', err));
  };

  const handleBulkAction = (action: 'delete' | 'export' | 'update', selectedIds: string[]) => {
    if (action === 'export') handleExport();
  };

  const handleCreateFleetItem = useCallback(async (fleetData: any) => {
    try {
      let newFleetItem: LocalFleetItem;
      if (activeTab === 'trucks') {
        const created = await fleetApi.createTruck(fleetData as Partial<ServiceTruck>);
        newFleetItem = normalizeTruck(created);
      } else if (activeTab === 'drivers') {
        const created = await fleetApi.createDriver(fleetData);
        newFleetItem = normalizeDriver(created);
      } else {
        throw new Error('Unsupported fleet type');
      }
      
      setFleetItems(prev => [newFleetItem, ...prev]);
      setShowForm(false);
      if (location.pathname.includes('/create')) {
        navigate('/dashboard/fleet');
      }
    } catch (error: any) {
      console.error('Error creating fleet item:', error);
      throw error;
    }
  }, [activeTab, location.pathname, navigate]);

  const handleUpdateFleetItem = useCallback(async (fleetData: any) => {
    if (!editingFleetItem) return;
    
    try {
      let updatedFleetItem: LocalFleetItem;
      if (activeTab === 'trucks') {
        const updated = await fleetApi.updateTruck(editingFleetItem.id, fleetData as Partial<ServiceTruck>);
        updatedFleetItem = normalizeTruck(updated);
      } else if (activeTab === 'drivers') {
        const updated = await fleetApi.updateDriver(editingFleetItem.id, fleetData);
        updatedFleetItem = normalizeDriver(updated);
      } else {
        throw new Error('Unsupported fleet type');
      }
      
      setFleetItems(prev => prev.map(item => 
        item.id === editingFleetItem.id ? updatedFleetItem : item
      ));
      setShowForm(false);
      setEditingFleetItem(null);
    } catch (error: any) {
      console.error('Error updating fleet item:', error);
      throw error;
    }
  }, [editingFleetItem, activeTab]);

  const handleDeleteFleetItem = useCallback(async (fleetItemId: string) => {
    const confirmed = await confirm({
      title: 'Delete Fleet Item',
      message: 'Are you sure you want to delete this fleet item? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    
    try {
      const item = fleetItems.find(i => i.id === fleetItemId);
      if (item?.type === 'truck') {
        await fleetApi.deleteTruck(fleetItemId);
      } else if (item?.type === 'driver') {
        await fleetApi.deleteDriver(fleetItemId);
      }
      
      setFleetItems(prev => prev.filter(item => item.id !== fleetItemId));
    } catch (error: any) {
      console.error('Error deleting fleet item:', error);
      setError('Failed to delete fleet item');
    }
  }, [fleetItems]);

  const handleEditFleetItem = useCallback((fleetItem: LocalFleetItem) => {
    setEditingFleetItem(fleetItem);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingFleetItem(null);
    setFormMode('create');
    setShowForm(true);
  }, []);

  const handleCreateTruck = useCallback(() => {
    setActiveTab('trucks');
    setEditingFleetItem(null);
    setFormMode('create');
    setShowForm(true);
  }, []);

  const handleCreateDriver = useCallback(() => {
    setActiveTab('drivers');
    setEditingFleetItem(null);
    setFormMode('create');
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingFleetItem(null);
    if (location.pathname.includes('/create')) {
      navigate('/dashboard/fleet');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (selectedFleetItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedFleetItem]);

  const trucks = fleetItems.filter(item => item.type === 'truck');
  const drivers = fleetItems.filter(item => item.type === 'driver');
  const availableTrucks = trucks.filter(item => item.status === 'AVAILABLE').length;
  const availableDrivers = drivers.filter(item => item.status === 'AVAILABLE').length;
  const inTransit = fleetItems.filter(item => item.status === 'IN_TRANSIT').length;
  const utilization = trucks.length > 0 ? Math.round((inTransit / trucks.length) * 100) : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                    return `${greeting}, ${user?.firstName || 'User'}`;
                  })()}
                </h1>
                <p className="mt-1 text-gray-600">
                  {trucks.length} trucks • {drivers.length} drivers
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateTruck}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                >
                  <FaTruck className="w-4 h-4" />
                  Add New Truck
                </button>
                <button
                  onClick={handleCreateDriver}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                >
                  <FaUser className="w-4 h-4" />
                  Add New Driver
                </button>
                <button
                  onClick={() => setActiveTab('routes')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <FaRoute className="w-4 h-4" />
                  Manage Routes
                </button>
              </div>
            </div>

            <div className="mt-8 flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaChartBar className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Overview" /></span>
              </button>
              <button
                onClick={() => setActiveTab('trucks')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'trucks'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaTruck className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Trucks" /></span>
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'drivers'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaUser className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Drivers" /></span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaChartBar className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Analytics" /></span>
              </button>
              <button
                onClick={() => setActiveTab('safety')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'safety'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-sm"><TranslatedText text="Safety" /></span>
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'financial'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaDollarSign className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Financial" /></span>
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'routes'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FaRoute className="w-4 h-4" />
                <span className="text-sm"><TranslatedText text="Routes" /></span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' ? (
            <div className="space-y-8">
              {/* Fleet Statistics - Larger cards with more detail */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Fleet Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <button
                    onClick={() => setActiveTab('trucks')}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-primary-50 rounded-xl">
                        <FaTruck className="w-8 h-8 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Total Trucks</p>
                      <h3 className="text-4xl font-bold text-gray-900 mb-3">{trucks.length}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-600 font-semibold">{availableTrucks} available</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{trucks.length - availableTrucks} in use</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('drivers')}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <FaUser className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Total Drivers</p>
                      <h3 className="text-4xl font-bold text-gray-900 mb-3">{drivers.length}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-emerald-600 font-semibold">{availableDrivers} available</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{drivers.length - availableDrivers} assigned</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('routes')}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-violet-50 rounded-xl">
                        <FaRoute className="w-8 h-8 text-violet-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Active Routes</p>
                      <h3 className="text-4xl font-bold text-gray-900 mb-3">{inTransit}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-emerald-600 font-semibold">Live tracking</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/dashboard/fleet/analytics')}
                    className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-amber-50 rounded-xl">
                        <FaDollarSign className="w-8 h-8 text-amber-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Fleet Utilization</p>
                      <h3 className="text-4xl font-bold text-gray-900 mb-3">{utilization}%</h3>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${utilization}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                </div>
              </section>

              {/* Fleet Status Breakdown */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Fleet Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Available</p>
                        <p className="text-2xl font-bold text-gray-900">{fleetItems.filter(item => item.status === 'AVAILABLE').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">In Transit</p>
                        <p className="text-2xl font-bold text-gray-900">{inTransit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <Settings className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Maintenance</p>
                        <p className="text-2xl font-bold text-gray-900">{fleetItems.filter(item => item.status === 'MAINTENANCE').length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Inactive</p>
                        <p className="text-2xl font-bold text-gray-900">{fleetItems.filter(item => item.status === 'INACTIVE').length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    {fleetItems.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                          <FaTruck className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-2">No fleet activity yet</p>
                        <p className="text-sm text-gray-400">Start by adding trucks and drivers to your fleet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fleetItems.slice(0, 5).map((item, index) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`p-3 rounded-lg ${
                              item.type === 'truck' ? 'bg-primary-50' : 'bg-blue-50'
                            }`}>
                              {item.type === 'truck' ? (
                                <FaTruck className={`w-5 h-5 ${
                                  item.type === 'truck' ? 'text-primary-600' : 'text-blue-600'
                                }`} />
                              ) : (
                                <FaUser className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">
                                {item.type === 'truck' ? `Plate: ${item.plateNumber || 'N/A'}` : `License: ${item.licenseNumber || 'N/A'}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                item.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                                item.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700' :
                                item.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <>
              <FleetFilters filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} activeTab={activeTab} />

              {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded flex items-center gap-2 mb-4" role="alert">
                  <FaExclamationTriangle /> {error}
                </div>
              )}

              {activeTab === 'analytics' ? (
                <TruckAnalytics trucks={trucks} />
              ) : activeTab === 'safety' ? (
                <SafetyManagement />
              ) : activeTab === 'financial' ? (
                <FinancialManagement />
              ) : activeTab === 'routes' ? (
                <RouteAssignmentManager />
              ) : loading && fleetItems.length === 0 ? (
                <FleetSkeleton />
              ) : (
                <FleetTable
                  fleetItems={fleetItems.filter(item => activeTab === 'trucks' ? item.type === 'truck' : item.type === 'driver')}
                  lastFleetItemRef={lastFleetItemRef}
                  view={view}
                  activeTab={activeTab}
                  onRowClick={setSelectedFleetItem}
                  onBulkAction={handleBulkAction}
                  onEditFleetItem={handleEditFleetItem}
                  onDeleteFleetItem={handleDeleteFleetItem}
                />
              )}
            </>
          )}

          <FleetModal fleetItem={selectedFleetItem} onClose={()=>setSelectedFleetItem(null)} activeTab={activeTab} />

          <FleetFormStepper
            isOpen={showForm}
            onClose={handleCloseForm}
            onSubmit={formMode === 'create' ? handleCreateFleetItem : handleUpdateFleetItem}
            initialData={editingFleetItem}
            mode={formMode}
            activeTab={activeTab === 'drivers' ? 'drivers' : 'trucks'}
          />
        </div>

        <DashboardFooter />
      </div>
      {DialogComponent}
    </ErrorBoundary>
  );
}; 
