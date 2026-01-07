import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FaSync, FaExclamationTriangle, FaTruck, FaUser, FaRoute, FaDollarSign, FaChartBar } from 'react-icons/fa';
import { FiGrid, FiList } from 'react-icons/fi';
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
  console.log('FleetDashboard component is rendering');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, accessToken } = useAuth();
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
  
  // Determine active tab based on current route
  const isTrucksRoute = location.pathname.includes('/trucks');
  const isDriversRoute = location.pathname.includes('/drivers');
  const isAnalyticsRoute = location.pathname.includes('/analytics');
  const isSafetyRoute = location.pathname.includes('/safety');
  const isFinancialRoute = location.pathname.includes('/financial');
  const isRoutesRoute = location.pathname.includes('/routes');

  const [activeTab, setActiveTab] = useState<'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes'>(
    isTrucksRoute ? 'trucks' : 
    isDriversRoute ? 'drivers' : 
    isAnalyticsRoute ? 'analytics' : 
    isSafetyRoute ? 'safety' : 
    isFinancialRoute ? 'financial' :
    isRoutesRoute ? 'routes' : 'trucks'
  );  const observer = useRef<IntersectionObserver | null>(null);
  
  // CRUD state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFleetItem, setEditingFleetItem] = useState<LocalFleetItem | null>(null);

  // Debug auth state
  useEffect(() => {
    console.log('FleetDashboard: Auth state changed -', {
      user: user ? `${user.firstName} ${user.lastName}` : 'null',
      authLoading,
      hasToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none'
    });
    
    // Debug authentication details
    if (user && accessToken) {
      console.log('🔍 Detailed auth debug:');
      console.log('User role:', user.role);
      console.log('User tenant:', user.tenantId);
      console.log('Token in localStorage:', !!localStorage.getItem('accessToken'));
      console.log('Token in state:', !!accessToken);
    }
  }, [user, authLoading, accessToken]);

  // Check authentication before loading fleet data
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/auth');
      return;
    }
    
    if (!authLoading && user && accessToken) {
      console.log('✅ User authenticated, testing token validity...');
      
      // Test token validity
      authAPI.testAuth()
        .then(() => {
          console.log('✅ Token is valid, loading fleet data');
          loadFleetItems(true);
        })
        .catch((error) => {
          console.error('❌ Token validation failed:', error);
          console.log('🔐 Redirecting to login due to invalid token');
          navigate('/auth');
        });
    }
  }, [authLoading, user, accessToken, navigate]);

  // Route-based form opening
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

  // Helpers to normalize API responses to local FleetItem shape
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

  // Fetch fleet items with filters, search, and pagination
  const loadFleetItems = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      let data: LocalFleetItem[] = [];
      
      if (activeTab === 'trucks') {
        // Use the new getTrucks method with filters
        const truckFilters: { search?: string; status?: string } = {};
        if (search) truckFilters.search = search;
        if (filters.status) truckFilters.status = filters.status;
        
        const raw = await fleetApi.getTrucks(truckFilters);
        data = raw.map(normalizeTruck);
      } else if (activeTab === 'drivers') {
        // Use the new getDrivers method with filters
        const driverFilters: { search?: string } = {};
        if (search) driverFilters.search = search;
        const rawDrivers = await fleetApi.getDrivers(driverFilters);
        data = rawDrivers.map(normalizeDriver);
      }
      
      setFleetItems(prev => {
        if (reset) {
          return data;
        } else {
          // Prevent duplicates by checking if item already exists
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = data.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        }
      });
      setHasMore(data.length > 0);
      setPage(prev => reset ? 2 : prev + 1);
    } catch (e) {
      setError('Failed to load fleet items.');
      console.error('Error loading fleet items:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, filters]);

  useEffect(() => {
    loadFleetItems(true);
    // eslint-disable-next-line
  }, [filters, search, activeTab]);

  // Real-time updates are not configured in this build

  // Infinite scroll
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

  // Export functionality
  const handleExport = () => {
    const exportFilters: any = {};
    if (search) exportFilters.search = search;
    if (filters.status) exportFilters.status = filters.status;
    fleetApi
      .exportFleetData('csv', exportFilters)
      .then((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fleet-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err: unknown) => {
        console.error('Export failed:', err);
      });
  };

  // Bulk actions (example: delete)
  const handleBulkAction = (action: 'delete' | 'export' | 'update', selectedIds: string[]) => {
    switch (action) {
      case 'delete':
        // Handle bulk delete
        break;
      case 'export':
        handleExport();
        break;
      case 'update':
        // Handle bulk update
        break;
    }
  };

  // CRUD Functions
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
      // Navigate back to main fleet dashboard if we're on a create route
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
      if (activeTab === 'trucks') {
        await fleetApi.deleteTruck(fleetItemId);
      } else if (activeTab === 'drivers') {
        await fleetApi.deleteDriver(fleetItemId);
      } else {
        throw new Error('Unsupported fleet type');
      }
      
      setFleetItems(prev => prev.filter(item => item.id !== fleetItemId));
    } catch (error: any) {
      console.error('Error deleting fleet item:', error);
      setError('Failed to delete fleet item');
    }
  }, [activeTab]);

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

  // Debug function to test authentication
  const debugAuthentication = useCallback(() => {
    console.log('🔍 Debug Authentication:');
    console.log('User:', user);
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Token in localStorage:', localStorage.getItem('accessToken') ? 'Present' : 'Missing');
    
    // Test API call
    if (accessToken) {
      console.log('🧪 Testing API call...');
      fleetApi.getTrucks()
        .then(trucks => {
          console.log('✅ API call successful, trucks:', trucks.length);
        })
        .catch(error => {
          console.error('❌ API call failed:', error);
        });
    }
  }, [user, accessToken]);

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
    // Navigate back to main fleet dashboard if we're on a create route
    if (location.pathname.includes('/create')) {
      navigate('/dashboard/fleet');
    }
  }, [location.pathname, navigate]);

  // Accessibility: focus management for modal
  useEffect(() => {
    if (selectedFleetItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedFleetItem]);

  return (
    <ErrorBoundary>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 mb-6">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search Bar */}
            <div className="flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search trucks, drivers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0) || 'F'}
                </div>
              </button>
            </div>
          </div>

          {/* Menu Tabs */}
          <div className="flex items-center gap-8 px-6">
            <button
              onClick={() => {
                setActiveTab('trucks');
                navigate('/dashboard/fleet/trucks');
              }}
              className={`pb-3 border-b-2 font-medium ${
                activeTab === 'trucks'
                  ? 'border-navy-600 text-navy-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TranslatedText text="Trucks" />
            </button>
            <button
              onClick={() => {
                setActiveTab('drivers');
                navigate('/dashboard/fleet/drivers');
              }}
              className={`pb-3 border-b-2 font-medium ${
                activeTab === 'drivers'
                  ? 'border-navy-600 text-navy-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TranslatedText text="Drivers" />
            </button>
            <button
              onClick={() => {
                setActiveTab('analytics');
                navigate('/dashboard/fleet/analytics');
              }}
              className={`pb-3 border-b-2 font-medium ${
                activeTab === 'analytics'
                  ? 'border-navy-600 text-navy-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TranslatedText text="Analytics" />
            </button>
            <button
              onClick={() => {
                setActiveTab('safety');
                navigate('/dashboard/fleet/safety');
              }}
              className={`pb-3 border-b-2 font-medium ${
                activeTab === 'safety'
                  ? 'border-navy-600 text-navy-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TranslatedText text="Safety" />
            </button>
            <button
              onClick={() => {
                setActiveTab('financial');
                navigate('/dashboard/fleet/financial');
              }}
              className={`pb-3 border-b-2 font-medium ${
                activeTab === 'financial'
                  ? 'border-navy-600 text-navy-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TranslatedText text="Financial" />
            </button>
            <button
              onClick={() => {
                setActiveTab('routes');
                navigate('/dashboard/fleet/routes');
              }}
              className={`pb-3 border-b-2 font-medium ${
                activeTab === 'routes'
                  ? 'border-navy-600 text-navy-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <TranslatedText text="Routes" />
            </button>
          </div>
        </div>

        <FleetFilters filters={filters} setFilters={setFilters} search={search} setSearch={setSearch} activeTab={activeTab} />
        
        {/* Fleet Map - Only show for trucks and drivers tabs where location is relevant */}
        {(activeTab === 'trucks' || activeTab === 'drivers') && (
          <div className="my-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  <TranslatedText text="Fleet Locations" />
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FaTruck className="w-3 h-3" />
                    <TranslatedText text="Trucks" />: {fleetItems.filter(item => item.type === 'truck').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaUser className="w-3 h-3" />
                    <TranslatedText text="Drivers" />: {fleetItems.filter(item => item.type === 'driver').length}
                  </span>
                </div>
              </div>
              <MapContainer
                center={[40.7128, -74.0060]} // New York coordinates as default
                zoom={10}
                style={{ width: '100%', height: 400 }}
                scrollWheelZoom={true}
                className="rounded-lg fleet-map-container"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {fleetItems.map((item) => {
                  const coords = item.currentLocation?.coordinates?.coordinates;
                  if (coords && coords.length >= 2) {
                    return (
                      <Marker 
                        key={item.id} 
                        position={[coords[1], coords[0]]} // [lat, lng] from [lng, lat]
                        icon={fleetIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p><strong>ID:</strong> {item.id}</p>
                            <p><strong>Type:</strong> {item.type}</p>
                            <p><strong>Name:</strong> {item.name}</p>
                            <p><strong>Status:</strong> {item.status}</p>
                            <p><strong>Location:</strong> {item.currentLocation?.address || 'N/A'}</p>
                            <p><strong>Updated:</strong> {new Date(item.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded flex items-center gap-2 mb-4" role="alert">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        
        {activeTab === 'analytics' ? (
          <TruckAnalytics trucks={fleetItems.filter(item => item.type === 'truck')} />
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
            fleetItems={fleetItems}
            lastFleetItemRef={lastFleetItemRef}
            view={view}
            activeTab={activeTab}
            onRowClick={setSelectedFleetItem}
            onBulkAction={handleBulkAction}
            onEditFleetItem={handleEditFleetItem}
            onDeleteFleetItem={handleDeleteFleetItem}
          />
        )}
        
        <FleetModal fleetItem={selectedFleetItem} onClose={()=>setSelectedFleetItem(null)} activeTab={activeTab} />
        
        {/* CRUD Form */}
        <FleetFormStepper
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={formMode === 'create' ? handleCreateFleetItem : handleUpdateFleetItem}
          initialData={editingFleetItem}
          mode={formMode}
          activeTab={activeTab === 'drivers' ? 'drivers' : 'trucks'}
        />
      </div>
      {DialogComponent}
    </ErrorBoundary>
  );
}; 