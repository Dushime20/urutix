import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FaExclamationTriangle, FaTruck, FaUser, FaDollarSign, FaGasPump, FaBolt, FaMapMarkedAlt, FaStar } from 'react-icons/fa';
import { FiLayers, FiZap, FiNavigation, FiTrendingUp } from 'react-icons/fi';
import { CheckCircle } from 'lucide-react';
import { FleetFilters } from './FleetFilters';
import { FleetModal } from './FleetModal';
import { FleetSkeleton } from './FleetSkeleton';
import { FleetTable } from './FleetTable';
import { TruckMatches } from './TruckMatches';
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

import { useCargoOwnerLayout } from '../../contexts/CargoOwnerLayoutContext';

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
  const [filters, setFilters] = useState<FleetFiltersType>({ status: FleetStatus.IN_TRANSIT });
  const [search, setSearch] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes' | 'matches'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const observer = useRef<IntersectionObserver | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFleetItem, setEditingFleetItem] = useState<LocalFleetItem | null>(null);

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/fleet/trucks')) setActiveTab('trucks');
    else if (path.includes('/fleet/drivers')) setActiveTab('drivers');
    else if (path.includes('/fleet/analytics')) setActiveTab('analytics');
    else if (path.includes('/fleet/safety')) setActiveTab('safety');
    else if (path.includes('/fleet/financial')) setActiveTab('financial');
    else if (path.includes('/fleet/routes')) setActiveTab('routes');
    else if (path.includes('/dashboard/fleet')) setActiveTab('overview');
  }, [location.pathname]);

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
        .then(() => loadFleetItems())
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
    } else if (location.pathname.includes('/matches')) {
      setActiveTab('matches');
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
      currentLocation: t.currentLocation ? { 
        coordinates: { coordinates: [] }, 
        address: typeof t.currentLocation === 'string' 
          ? t.currentLocation 
          : (t.currentLocation as any)?.address || 'Unknown'
      } : undefined,
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

  const loadFleetItems = useCallback(async () => {
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
    loadFleetItems();
  }, []);

  const lastFleetItemRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(_entries => {
      // Logic for infinite scroll can be re-enabled here if needed
    });
    if (node) observer.current.observe(node);
  }, [loading]);

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



  const handleCreateTruck = useCallback(() => {
    setActiveTab('trucks');
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


  const availableTrucks = trucks.filter(item => item.status === 'AVAILABLE').length;
  const inTransit = fleetItems.filter(item => item.status === 'IN_TRANSIT').length;
  const utilization = trucks.length > 0 ? Math.round((inTransit / trucks.length) * 100) : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">


        <DashboardHeader />


        <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50/30 shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col gap-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Welcome back, Fleet Manager
                  </h1>
                  <p className="text-sm text-gray-600">Manage your fleet operations efficiently</p>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCreateTruck}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#345e85] hover:bg-[#2a4d6d] text-white rounded-xl transition-all font-semibold shadow-lg shadow-[#345e85]/30 hover:shadow-xl hover:shadow-[#345e85]/40 active:transform active:scale-95"
                  >
                    <FaTruck className="w-4 h-4" />
                    <span>Add Truck</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('drivers')}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#345e85] hover:bg-[#2a4d6d] text-white rounded-xl transition-all font-semibold shadow-lg shadow-[#345e85]/30 hover:shadow-xl hover:shadow-[#345e85]/40 active:transform active:scale-95"
                  >
                    <FaUser className="w-4 h-4" />
                    <span>Add Driver</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Quick Actions:</span>

                <button
                  onClick={() => setActiveTab('trucks')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg transition-all font-medium shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow"
                >
                  <FiLayers className="w-4 h-4" />
                  <span>Fleet Assets</span>
                </button>

                <button
                  onClick={() => {/* Implement Smart Matches */ }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg transition-all font-medium shadow-sm border border-indigo-200 hover:border-indigo-300 hover:shadow"
                >
                  <FiZap className="w-4 h-4" />
                  <span>Smart Matches</span>
                </button>

                <button
                  onClick={() => {/* Implement Log Fuel */ }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 rounded-lg transition-all font-medium shadow-sm border border-orange-200 hover:border-orange-300 hover:shadow"
                >
                  <FaGasPump className="w-4 h-4" />
                  <span>Log Fuel</span>
                </button>

                <button
                  onClick={() => setActiveTab('routes')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-all font-medium shadow-sm border border-blue-200 hover:border-blue-300 hover:shadow"
                >
                  <FiNavigation className="w-4 h-4" />
                  <span>Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' ? (
            <div className="space-y-8">
              {/* Fleet Statistics - Larger cards with more detail */}
              {/* Fleet Statistics Row - New Design */}
              <section className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* Card 1: Fleet Live Status */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <FaTruck className="w-16 h-16 text-primary-600 transform -rotate-12" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">FLEET LIVE STATUS</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">{trucks.length}</span>
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>All Systems</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">In Transit ({inTransit})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-600">Available ({availableTrucks})</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Fuel Costs (Mock Data) */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-4 right-4 text-orange-500 bg-orange-50 p-2 rounded-lg">
                      <FaGasPump className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">FUEL COSTS (MTD)</h3>
                      <span className="text-3xl font-bold text-gray-900">$12.4k</span>
                    </div>
                    <div className="mt-auto">
                      <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                        <FiZap className="w-3 h-3" />
                        <span>6.2 MPG Avg</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Fleet Reputation (Mock Data to match image) */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-4 right-4 text-amber-500">
                      <FaStar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">FLEET REPUTATION</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">4.82</span>
                        <span className="text-sm text-gray-400 font-medium">/5</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                        <FiTrendingUp className="w-3 h-3" />
                        <span>+0.2 avg driver rating</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Driver Utilization */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-4 right-4 text-emerald-500">
                      <FaUser className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">DRIVER UTILIZATION</h3>
                      <span className="text-3xl font-bold text-gray-900">{utilization}%</span>
                    </div>
                    <div className="mt-auto">
                      <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                        <FiTrendingUp className="w-3 h-3" />
                        <span>+2% efficiency</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Revenue (Mock Data) */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-4 right-4 text-amber-500">
                      <FaDollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">REVENUE (MTD)</h3>
                      <span className="text-3xl font-bold text-gray-900">KES 2.4M</span>
                    </div>
                    <div className="mt-auto">
                      <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                        <FiTrendingUp className="w-3 h-3" />
                        <span>+12% monthly growth</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Fleet Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Left Column: Interactive Dispatch Map */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                          <FaMapMarkedAlt className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-900">Interactive Dispatch Map</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">
                        3 Pending Requests
                      </span>
                      <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                        <FaBolt className="w-3.5 h-3.5" />
                        Quick Assign Nearest
                      </button>
                    </div>
                  </div>
                  <div className="h-[400px] relative">
                    <MapContainer
                      center={[-1.2921, 36.8219]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {fleetItems
                        .filter(i => {
                          const coords = i.currentLocation?.coordinates?.coordinates;
                          return coords && coords.length >= 2 && 
                            typeof coords[0] === 'number' && 
                            typeof coords[1] === 'number';
                        })
                        .map(item => (
                        <Marker
                          key={item.id}
                          position={[
                            item.currentLocation!.coordinates.coordinates[1],
                            item.currentLocation!.coordinates.coordinates[0]
                          ]}
                          icon={fleetIcon}
                        >
                          <Popup>
                            <div className="p-2">
                              <p className="font-bold">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.status}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                    {/* Floating Controls Placeholder */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-[400]">
                      <div className="bg-white p-1 rounded shadow-md border border-gray-200">
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700">+</button>
                        <div className="h-px bg-gray-200"></div>
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-bold text-gray-700">-</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Top Rated Driver */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <FaStar className="text-amber-400 w-5 h-5" />
                    <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">TOP RATED DRIVER</h3>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm">
                      <FaUser className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Samuel Karanja</h4>
                      <div className="inline-block bg-amber-400 text-black text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                        GOLD STAR
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <FaStar className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-gray-900">4.96</span>
                        <span className="text-gray-400">/5.0</span>
                        <span className="text-gray-400 text-xs ml-1">(242 Trips)</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2.5 border border-gray-200 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors mb-6 text-sm">
                    View Performance Profile
                  </button>

                  <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">DRIVER PERFORMANCE</span>
                      <button className="text-xs text-blue-600 hover:underline">View All</button>
                    </div>
                    {/* Placeholder for small stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">On-Time Delivery</span>
                        <span className="font-medium text-emerald-600">98%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Safety Score</span>
                        <span className="font-medium text-emerald-600">99/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'matches' ? (
             <TruckMatches />
          ) : (
            <>
              <FleetFilters filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} activeTab={activeTab} viewMode={viewMode} setViewMode={setViewMode} />

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
                  view={viewMode}
                  activeTab={activeTab as 'trucks' | 'drivers'}
                  onRowClick={setSelectedFleetItem}
                  onEditFleetItem={handleEditFleetItem}
                  onDeleteFleetItem={handleDeleteFleetItem}
                  onRefresh={() => loadFleetItems()}
                />
              )}
            </>
          )}

          <FleetModal fleetItem={selectedFleetItem} onClose={() => setSelectedFleetItem(null)} activeTab={activeTab === 'overview' ? 'trucks' : activeTab as any} />

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
      </div >
      {DialogComponent}
    </ErrorBoundary >
  );
}; 
