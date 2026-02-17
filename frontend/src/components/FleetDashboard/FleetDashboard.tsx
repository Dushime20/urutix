import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import {
  Truck,
  User,
  Zap,
  Map as MapIcon,
  Navigation,
  Clock,
  ShieldCheck,
  Layers,
  Plus,
  Layout,
  Activity,
  Shield,
  CreditCard,
  Search,
  Star,
  AlertTriangle
} from 'lucide-react';
import { DetailedErrorBoundary } from '../DetailedErrorBoundary';
import { FleetSkeleton } from './FleetSkeleton';
import { FleetModal } from './FleetModal';
import { DriversList } from './DriversList';
import StatCard from '../EnliteUI/Cards/StatCard';
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
import type { FleetItem as LocalFleetItem } from '../../types/fleet';
import { FleetStatus } from '../../types/fleet';
import { useLocation, useNavigate } from 'react-router-dom';
import { TruckAnalytics } from './TruckAnalytics';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { TrucksList } from './TrucksList';
import { TruckMatches } from './TruckMatches';
import { TruckOwnerRecentActivities } from './TruckOwnerRecentActivities';

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
  const { DialogComponent } = useConfirmDialog();
  const [fleetItems, setFleetItems] = useState<LocalFleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFleetItem, setSelectedFleetItem] = useState<LocalFleetItem | null>(null);

  const [search, setSearch] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes' | 'matches'>('overview');

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFleetItem, setEditingFleetItem] = useState<LocalFleetItem | null>(null);
  const [userProfileName, setUserProfileName] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);

  // Sync activeTab with URL
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');

    if (tabParam === 'matches') {
      setActiveTab('matches');
      return;
    }

    if (path.includes('/fleet/trucks')) setActiveTab('trucks');
    else if (path.includes('/fleet/drivers')) setActiveTab('drivers');
    else if (path.includes('/fleet/analytics')) setActiveTab('analytics');
    else if (path.includes('/fleet/safety')) setActiveTab('safety');
    else if (path.includes('/fleet/financial')) setActiveTab('financial');
    else if (path.includes('/fleet/routes')) setActiveTab('routes');
    else if (path.includes('/dashboard/fleet')) setActiveTab('overview');
  }, [location.pathname, location.search]);

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
      const [truckData, driverData, analyticsData] = await Promise.all([
        fleetApi.getTrucks({}),
        fleetApi.getDrivers({}),
        fleetApi.fetchAnalytics()
      ]);

      const allData = [...truckData.map(normalizeTruck), ...driverData.map(normalizeDriver)];
      setFleetItems(allData);
      setAnalytics(analyticsData);
    } catch (e) {
      setError('Failed to load fleet items.');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(amount);
  };




  useEffect(() => {
    loadFleetItems();
  }, []);

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user && !user.firstName && !userProfileName) {
        try {
          const res = await authAPI.getProfile();
          if (res.data?.success && res.data?.data?.user?.firstName) {
            const u = res.data.data.user;
            setUserProfileName(`${u.firstName} ${u.lastName || ''}`.trim());
          }
        } catch (err) {
          console.error("Failed to fetch fresh profile for name", err);
        }
      }
    };
    fetchProfileName();
  }, [user, userProfileName]);

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
    <DetailedErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC]">
        <DashboardHeader />

        {/* Intelligence Header Context */}
        <div className="bg-white border-b border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] scale-[2.5] pointer-events-none rotate-12">
            <Layers size={140} className="text-[#345E85]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85] shadow-inner">
                    <Truck size={20} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Fleet Dashboard</h2>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                    const displayName = userProfileName || (user?.firstName
                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                      : (user as any)?.profile?.firstName
                        ? `${(user as any).profile.firstName} ${(user as any).profile.lastName || ''}`.trim()
                        : user?.email?.split('@')[0] || 'Fleet Manager');

                    return <>{greeting}, <span className="text-[#345E85]">{displayName}</span></>;
                  })()}
                </h1>
                <p className="text-lg text-slate-500 font-medium max-w-xl">
                  Synchronizing asset logistics and operational intelligence across your global transportation network.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateTruck}
                  className="flex items-center gap-2.5 px-6 py-4 bg-[#345E85] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 hover:bg-[#2a4d6d] active:scale-95 transition-all group"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                  Add New Truck
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className="flex items-center gap-2.5 px-6 py-4 bg-white text-slate-700 border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:border-[#345E85] hover:text-[#345E85] active:scale-95 transition-all"
                >
                  <User size={18} />
                  Add New Driver
                </button>
              </div>
            </div>

            {/* Sub-Navigation / Quick Vectors */}
            <div className="flex flex-wrap items-center gap-4 mt-12 pb-2">
              {[
                { id: 'overview', icon: Layout, label: 'Overview' },
                { id: 'trucks', icon: Truck, label: 'Trucks' },
                { id: 'matches', icon: Zap, label: 'Matches' },
                { id: 'financial', icon: CreditCard, label: 'Financials' },
                { id: 'analytics', icon: Activity, label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? 'bg-blue-50 text-[#345E85] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {activeTab === 'overview' ? (
            <div className="space-y-10">
              {/* Metrics Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard
                  title="Total Trucks"
                  value={trucks.length}
                  icon={<Truck />}
                  subtitle={`${inTransit} In Transit • ${availableTrucks} Available`}
                  color="primary"
                  loading={loading}
                />

                <StatCard
                  title="Utilization"
                  value={`${analytics?.utilizationRate !== undefined ? Math.round(analytics.utilizationRate) : utilization}%`}
                  icon={<Zap />}
                  trend="Optimal"
                  trendDirection="up"
                  color="info"
                  subtitle="Network load factor"
                  loading={loading}
                />

                <StatCard
                  title="Average Rating"
                  value={analytics?.averageRating?.toFixed(1) || '0.0'}
                  icon={<Star />}
                  subtitle="Reputation Index"
                  color="warning"
                  loading={loading}
                />

                <StatCard
                  title="Total Revenue"
                  value={analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : 'KES 0'}
                  icon={<CreditCard />}
                  trend="+12.4%"
                  trendDirection="up"
                  color="success"
                  subtitle="Gross Yield (MTD)"
                  loading={loading}
                />

                <StatCard
                  title="Safety Alerts"
                  value="0"
                  icon={<AlertTriangle />}
                  subtitle="All Good"
                  color="accent"
                  loading={loading}
                />
              </div>

              {/* Operations Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deployment Visualization */}
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[560px]">
                  <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapIcon size={16} className="text-[#345E85]" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#345E85]">Live Tracking</h3>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">Fleet Map</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                            TR
                          </div>
                        ))}
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-[#345E85] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#345E85] hover:text-white transition-all">
                        <Zap size={14} /> Global Sync
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative bg-slate-50">
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
                              <div className="p-3">
                                <p className="font-black text-[#345E85] uppercase text-[10px] mb-1">Truck ID: {item.plateNumber}</p>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className={`h-1.5 w-1.5 rounded-full ${item.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                    </MapContainer>

                    {/* Layered Controls */}
                    <div className="absolute bottom-8 left-8 z-[400] flex flex-col gap-2">
                      <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/50 space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl shadow-inner border border-slate-100">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Live Updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Hub */}
                <div className="flex flex-col gap-8">
                  {/* Elite Personnel Card */}
                  <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 flex flex-col relative overflow-hidden h-[300px]">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[1.5] pointer-events-none rotate-12">
                      <Shield size={100} className="text-amber-400" />
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500">
                        <Star size={16} fill="currentColor" />
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85]">Top Driver</h3>
                    </div>

                    <div className="flex items-center gap-6 mb-8">
                      <div className="h-24 w-24 rounded-[32px] bg-slate-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        <User size={40} className="text-slate-300" />
                      </div>
                      <div>

                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">Samuel Karanja</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span className="text-lg font-black text-slate-900">4.96</span>
                          <span className="text-sm font-bold text-slate-400">Rating</span>
                        </div>
                      </div>
                    </div>

                    <button className="mt-auto w-full py-4 bg-slate-50 hover:bg-[#345E85] hover:text-white text-[#345E85] rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all">
                      View Driver Profile
                    </button>
                  </div>

                  {/* Operational Metrics Sub-Matrix */}
                  <div className="bg-[#345E85] rounded-[40px] p-8 text-white relative overflow-hidden flex-1 shadow-xl shadow-blue-100">
                    <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Activity size={180} />
                    </div>

                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-8">Performance Metrics</h3>

                    <div className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span>Dispatch Accuracy</span>
                          <span className="text-emerald-400">98.4%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '98.4%' }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span>Safety Compliance</span>
                          <span className="text-emerald-400">99.1%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '99.1%' }} />
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Verified</p>
                          <p className="text-xs font-black tracking-tight mt-1">Enlite V4.2</p>
                        </div>
                        <ShieldCheck size={24} className="opacity-40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Logs Section */}
              <div className="space-y-6 mt-12">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#345E85]">
                      <Clock size={16} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#345E85]">Recent Activities</h3>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-[#345E85] hover:underline decoration-2 underline-offset-4">
                    View All
                  </button>
                </div>
                <TruckOwnerRecentActivities />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Specialized View Header */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-[#345E85] shadow-inner">
                    {activeTab === 'trucks' ? <Truck size={28} /> :
                      activeTab === 'analytics' ? <Activity size={28} /> :
                        activeTab === 'safety' ? <Shield size={28} /> :
                          activeTab === 'financial' ? <CreditCard size={28} /> :
                            activeTab === 'routes' ? <Navigation size={28} /> :
                              activeTab === 'matches' ? <Zap size={28} /> : <User size={28} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                      {activeTab === 'trucks' ? 'Trucks' :
                        activeTab === 'analytics' ? 'Analytics' :
                          activeTab === 'safety' ? 'Safety' :
                            activeTab === 'financial' ? 'Financials' :
                              activeTab === 'routes' ? 'Routes' :
                                activeTab === 'matches' ? 'Matches' : 'Drivers'}
                    </h2>
                    <p className="text-sm font-medium text-slate-500">Status: <span className="text-emerald-500 font-black">Active</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size={16} text-slate-400 group-focus-within:text-[#345E85] transition-colors" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all w-64"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-[32px] flex items-center gap-3" role="alert">
                  <AlertTriangle size={20} />
                  <span className="text-sm font-black uppercase tracking-widest">{error}</span>
                </div>
              )}

              <div className="bg-white p-2 rounded-[40px] border border-slate-100 shadow-xl overflow-hidden min-h-[500px]">
                {activeTab === 'analytics' ? (
                  <TruckAnalytics trucks={trucks} />
                ) : activeTab === 'safety' ? (
                  <SafetyManagement />
                ) : activeTab === 'financial' ? (
                  <FinancialManagement />
                ) : activeTab === 'routes' ? (
                  <RouteAssignmentManager />
                ) : activeTab === 'drivers' ? (
                  <DriversList onAddDriver={() => { setFormMode('create'); setShowForm(true); }} />
                ) : activeTab === 'trucks' ? (
                  <TrucksList onAddTruck={handleCreateTruck} />
                ) : activeTab === 'matches' ? (
                  <TruckMatches />
                ) : loading && fleetItems.length === 0 ? (
                  <FleetSkeleton />
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Under Synchronization</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <FleetModal
            fleetItem={selectedFleetItem}
            onClose={() => setSelectedFleetItem(null)}
            activeTab={activeTab === 'overview' ? 'trucks' : activeTab as any}
          />

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
    </DetailedErrorBoundary>
  );
}; 
