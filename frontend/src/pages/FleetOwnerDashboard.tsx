import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaTruck,
  FaDollarSign,
  FaRoute,
  FaChartLine,
  FaCheckCircle,
  FaUser,
  FaStar,
  FaBolt,
  FaClipboardCheck
} from 'react-icons/fa';
import { Clock, Zap, AlertTriangle, Bell, Search, X, Settings, LogOut, Fuel, Droplets, CheckCircle, Plus } from 'lucide-react';
import { fleetApi, type FleetItem } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoUrutiX from '../assets/urutiX Logistics Logo (1).svg';
import toast from 'react-hot-toast';
import FleetFormStepper from '../components/FleetDashboard/FleetFormStepper';
import ModernLoader from '../components/common/ModernLoader';
import { StandardDataTable, StatusBadge, type Column } from '../components/EnliteUI/Tables';

// Fix Leaflet icons
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

interface DashboardStats {
  totalTrucks: number;
  trucksInTransit: number;
  trucksAvailable: number;
  trucksInMaintenance: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  activeTrips: number;
  completedTrips: number;
  utilizationRate: number;
}

const FleetOwnerDashboard: React.FC = () => {
  const { compact: fmtMoney } = useCurrencyFormat();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrucks: 0, trucksInTransit: 0, trucksAvailable: 0, trucksInMaintenance: 0,
    totalDrivers: 0, activeDrivers: 0, totalRevenue: 0, monthlyRevenue: 0,
    pendingPayments: 0, activeTrips: 0, completedTrips: 0, utilizationRate: 0,
  });
  const [trucks, setTrucks] = useState<FleetItem[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  // Truck creation state (matching cargo creation pattern)
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTruck, setEditingTruck] = useState<FleetItem | null>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    setShowUserMenu(false);
    try {
      if (logout && typeof logout === 'function') {
        logout();
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/auth');
    }
  };

  const [fuelStats, setFuelStats] = useState<any>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const trucksData = await fleetApi.getTrucks();
      setTrucks(Array.isArray(trucksData) ? trucksData : []);

      const driversData = await fleetApi.getDrivers();
      // setDrivers(driversData);

      // Fetch Top Drivers & Alerts
      const topDriversData = await fleetApi.getTopDrivers(5);
      setTopDrivers(topDriversData);

      const alertsData = await fleetApi.getMaintenanceAlerts();
      setMaintenanceAlerts(alertsData);

      const inspectionsData = await fleetApi.getSafetyInspections();
      setRecentInspections(inspectionsData.slice(0, 5)); // Get recent 5

      // Fetch Fuel Stats
      try {
        const fuelData = await fleetApi.getFuelStats();
        setFuelStats(fuelData);
      } catch (e) {
        console.warn('Failed to load fuel stats:', e);
      }

      let tripsData: any[] = [];
      try {
        const tripsResponse = await tripsAPI.getAll({});
        tripsData = tripsResponse.data?.data || tripsResponse.data?.trips || [];
        setTrips(tripsData);
      } catch (e) {
        console.warn('Failed to load trips:', e);
      }

      const analyticsData = await fleetApi.fetchAnalytics();

      // Calculations
      const trucksInTransit = trucksData.filter(t => ['intransit', 'in_transit', 'in-transit'].includes(t.status?.toLowerCase())).length;
      const trucksAvailable = trucksData.filter(t => ['available', 'idle'].includes(t.status?.toLowerCase())).length;
      const trucksInMaintenance = trucksData.filter(t => ['maintenance', 'repair'].includes(t.status?.toLowerCase())).length;

      const totalRevenue = trucksData.reduce((sum, truck) => sum + (truck.totalRevenue || 0), 0);
      const utilizationRate = trucksData.length > 0 ? (trucksInTransit / trucksData.length) * 100 : 0;

      setStats({
        totalTrucks: trucksData.length,
        trucksInTransit,
        trucksAvailable,
        trucksInMaintenance,
        totalDrivers: driversData.length,
        activeDrivers: driversData.filter((d: any) => d.status === 'ACTIVE').length,
        totalRevenue: analyticsData.totalRevenue || totalRevenue,
        monthlyRevenue: (analyticsData.totalRevenue || totalRevenue) * 0.3,
        pendingPayments: trucksInTransit * 5000,
        activeTrips: tripsData.filter(t => ['active', 'in_progress', 'started'].includes(t.status?.toLowerCase())).length,
        completedTrips: tripsData.filter(t => ['completed', 'delivered'].includes(t.status?.toLowerCase())).length,
        utilizationRate: analyticsData.utilizationRate || Math.round(utilizationRate),
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Truck creation handlers (matching cargo creation pattern)
  const handleCreateTruck = useCallback(() => {
    setEditingTruck(null);
    setFormMode('create');
    setShowTruckForm(true);
  }, []);

  const handleSubmitTruck = useCallback(async (data: any) => {
    try {
      const createdTruck = await fleetApi.createTruck(data);
      console.log('✅ Truck created successfully:', createdTruck);
      toast.success('Truck added successfully!');
      return createdTruck;
    } catch (error) {
      console.error('Error creating truck:', error);
      toast.error('Failed to add truck. Please try again.');
      throw error;
    }
  }, []);

  const handleCloseTruckForm = useCallback(() => {
    setShowTruckForm(false);
    setEditingTruck(null);
    void loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return <ModernLoader isLoading={true} type="dashboard" showStats={true} />;
  }

  // --- UI COMPONENTS ---

  const Header = () => (
    <>
      {/* Marquee Alert Bar */}
      <div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5">
        <div className="flex items-center animate-marquee whitespace-nowrap">
          <div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
            {maintenanceAlerts.length > 0 ? (
              <span className="flex items-center gap-2 text-amber-400">
                <AlertTriangle size={14} /> Attention: {maintenanceAlerts.length} vehicles need service
              </span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-400">
                <CheckCircle size={14} /> Health: All vehicles running
              </span>
            )}

            <span className="flex items-center gap-2">
              <Droplets size={14} className="text-blue-400" /> Weather Update: Heavy Rain Expected (Nairobi-Mombasa)
            </span>
            <span className="flex items-center gap-2 text-green-400">
              <CheckCircle size={14} /> Border Status: Busia & Malaba operating normally
            </span>
            <span className="flex items-center gap-2 text-amber-400">
              <Fuel size={14} /> Fuel Price: Diesel KES 210.00 (+2% effective Jan 15th)
            </span>
          </div>
        </div>
      </div>

      {/* Header Section - Dark Theme (matches Cargo Owner) */}
      <div className="bg-[#0f172a] text-white">
        <header className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-5 border-b border-white/10">
          <div className="flex items-center gap-4 md:gap-10">
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard/fleet')}>
              <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-14 md:h-20 w-auto object-contain py-1" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              <a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/dashboard/fleet">Dashboard</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/trucks">Fleet</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/fleet-manager">Manage</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/drivers">Drivers</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/epod-reports">ePOD Reports</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/maintenance">Maintenance</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/fuel">Fuel</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/bids">Load Board</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/smart-bookings">Bookings</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/reports">Reports</a>
            </nav>

            {/* Search Bar */}
            <div className="hidden xl:flex items-center relative ml-8 group">
              <Search className="absolute left-3 text-white/40 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search trucks, drivers, IDs..."
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64 transition-all"
              />
              <span className="absolute right-3 text-[10px] font-bold text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Fleet Status Badge */}
            <div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <span className="text-blue-400">🚛</span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Active</span>
            </div>

            {/* Quick Actions Button */}
            <button
              onClick={() => navigate('/dashboard/fleet/dispatch')}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
            >
              <Zap size={16} /> Dispatch
            </button>

            {/* Notification Bell */}
            <button className="p-2 text-white/60 hover:text-white transition-all relative">
              <Bell size={24} />
              <span className="absolute top-2 right-2 size-2 bg-blue-500 rounded-full border-2 border-[#0f172a]"></span>
            </button>

            {/* User Profile with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Fleet Manager'}</p>
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Fleet Owner</p>
                </div>
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/20 shadow-inner overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Fleet'}`} alt="User" className="size-full" />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e293b] rounded-lg shadow-2xl border border-white/10 z-[9999] overflow-hidden">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-white/10">
                      <div className="text-sm font-semibold text-white">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.firstName || user?.email || 'User'
                        }
                      </div>
                      <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard/fleet/settings');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2 mt-1"
                    >
                      <Settings size={16} />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard/fleet/trucks');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                    >
                      <FaTruck size={16} />
                      Fleet
                    </button>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Nav Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-[120px] left-0 right-0 bg-[#0f172a] border-b border-white/10 p-4 z-50 shadow-xl">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-gray-400">
              <a href="/dashboard/fleet" className="text-white px-3 py-2 bg-white/5 rounded-lg">Dashboard</a>
              <a href="/dashboard/fleet/trucks" className="hover:text-white px-3 py-2">Fleet</a>
              <a href="/fleet-manager" className="hover:text-white px-3 py-2">Manage</a>
              <a href="/dashboard/fleet/drivers" className="hover:text-white px-3 py-2">Drivers</a>
              <a href="/dashboard/fleet/epod-reports" className="hover:text-white px-3 py-2">ePOD Reports</a>
              <a href="/dashboard/fleet/maintenance" className="hover:text-white px-3 py-2">Maintenance</a>
              <a href="/dashboard/fleet/fuel" className="hover:text-white px-3 py-2">Fuel</a>
              <a href="/dashboard/fleet/bids" className="hover:text-white px-3 py-2">Load Board</a>
              <a href="/dashboard/fleet/smart-bookings" className="hover:text-white px-3 py-2">Bookings</a>
              <a href="/dashboard/fleet/reports" className="hover:text-white px-3 py-2">Reports</a>
            </nav>
          </div>
        )}
      </div>
    </>
  );

  // Footer Component - Matching Cargo Owner Pattern
  const Footer = () => (
    <footer className="bg-[#0a101f] text-white pt-16 md:pt-20 pb-8 md:pb-10 border-t border-white/5">
      <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20">
                <FaTruck className="size-5 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-blue-400">.</span></h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              UrutiX Fleet is Africa's premier fleet management and logistics platform, empowering fleet owners to optimize operations and maximize profitability.
            </p>
            <div className="flex gap-4">
              <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 transition-all" href="#">𝕏</a>
              <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 transition-all" href="#">in</a>
              <a className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 transition-all" href="#">📸</a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Fleet</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/trucks">Fleet</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/drivers">Drivers</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/dispatch">Dispatch</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/maintenance">Maintenance</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Support</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Help Center</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors flex items-center gap-2" href="#">Live Chat <span className="size-1.5 bg-green-500 rounded-full"></span></a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Route Status</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">API Documentation</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4 md:mb-6">Legal</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Terms of Service</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Compliance</a></li>
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="#">Driver Safety Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 md:pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest text-center md:text-left">
              © 2026 UrutiX Technologies Inc. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-all">
                <span className="text-[10px] font-bold uppercase tracking-wider">English</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:border-blue-500 transition-all">
                <span className="text-[10px] font-bold uppercase tracking-wider">KES (Ksh)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* System Status Badge */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-white tracking-widest">Systems Online</p>
                <span className="text-xs font-semibold text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            {/* Dispatch Quick Action */}
            <button
              onClick={() => navigate('/dashboard/fleet/dispatch')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              <Zap size={16} /> Quick Dispatch
            </button>
          </div>
        </div>
      </div>
    </footer>
  );

  const recentTrips = useMemo(() => trips.slice(0, 5), [trips]);

  const tripColumns: Column<any>[] = useMemo(() => [
    {
      key: 'tripId',
      label: 'Dispatch ID',
      render: (_: unknown, trip: any, index?: number) => (
        <span className="text-sm font-bold text-blue-600">
          {trip.tripId || trip.id ? `#${(trip.tripId || trip.id).substring(0, 8)}` : `DISP-${4420 + (index ?? 0)}`}
        </span>
      ),
    },
    {
      key: 'truck',
      label: 'Truck & Driver',
      render: (_: unknown, trip: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-400"><FaTruck /></div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{trip.truck?.plateNumber || trip.truckId || 'Unassigned'}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{trip.driver?.name || trip.driverId || 'No Driver'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (_: unknown, trip: any) => (
        <span className="text-sm text-gray-600 dark:text-slate-300">{trip.route?.destination || trip.destination || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, trip: any) => (
        <StatusBadge status={trip.status || 'PENDING'} label={trip.status || 'PENDING'} />
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      align: 'right',
      render: (_: unknown, trip: any) => (
        <div className="flex items-center justify-end gap-1 text-sm font-medium text-gray-900 dark:text-white">
          {['completed', 'delivered'].includes(trip.status?.toLowerCase()) ? (
            <><FaStar className="text-yellow-400" /> 5.0</>
          ) : (
            <span className="text-gray-400 text-xs">In Progress</span>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Dark Header */}
      <Header />

      {/* Dark Welcome Section */}
      <section className="bg-slate-900 text-white px-4 md:px-8 lg:px-12 xl:px-20 py-6">
        <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">Operational: <strong className="text-white">{stats.activeTrips} Active</strong> | {stats.trucksAvailable} Available</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateTruck}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Truck
            </button>
            <button
              onClick={() => navigate('/dashboard/fleet/trucks')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2"
            >
              <FaChartLine className="text-slate-400" /> Vehicles
            </button>
            <button
              onClick={() => navigate('/dashboard/fleet/smart-bookings')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Bookings
            </button>
            <button
              onClick={() => navigate('/dashboard/fleet/fuel')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
            >
              <Fuel className="w-4 h-4" /> Fuel
            </button>
            <button
              onClick={() => navigate('/dashboard/fleet/dispatch')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Dispatch
            </button>
          </div>
        </div>
      </section>

      {/* Light Main Content */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 xl:px-20 py-8 md:py-12 space-y-8 max-w-[1536px] mx-auto w-full">

        {/* Metric Cards - Light Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Live Status */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FaTruck className="w-16 h-16 text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fleet Status</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalTrucks}</span>
              <span className="text-sm font-medium text-emerald-600 mb-1.5 flex items-center gap-1"><FaCheckCircle /> All Systems</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
              <div style={{ width: `${stats.utilizationRate}%` }} className="bg-blue-500 h-full"></div>
              <div style={{ width: `${100 - stats.utilizationRate}%` }} className="bg-emerald-500 h-full"></div>
            </div>
            <div className="flex justify-between text-[10px] mt-2 font-medium text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> In Transit ({stats.trucksInTransit})</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Available ({stats.trucksAvailable})</span>
            </div>
          </div>

          {/* Fuel Costs */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-orange-500"><Fuel className="w-6 h-6" /></div>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fuel Costs</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-black text-gray-900 dark:text-white">
                {fuelStats?.totalCost ? fmtMoney(fuelStats.totalCost) : '0'}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${fuelStats?.avgMpg > 6 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}>
              <Zap className="w-3 h-3" /> <strong>{fuelStats?.avgMpg || 0}</strong> MPG
            </div>
          </div>

          {/* Reputation */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 relative overflow-hidden group hover:border-yellow-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-yellow-500"><FaStar className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Reputation</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-gray-900 dark:text-white">4.82<span className="text-lg text-gray-400">/5</span></span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-200">
              <FaChartLine /> <strong>+0.2</strong> Rating
            </div>
          </div>

          {/* Utilization */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-emerald-500"><FaUser className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Driver Utilization</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.utilizationRate}%</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-200">
              <FaBolt /> <strong>+2%</strong> efficiency
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-amber-500"><FaDollarSign className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Revenue (MTD)</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-black text-gray-900 dark:text-white">{fmtMoney(2400000)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-200">
              <FaChartLine /> <strong>+12%</strong> monthly growth
            </div>
          </div>
        </div>

        {/* Main Content: Map & Drivers - Light Theme */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Interactive Map */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-1 overflow-hidden flex flex-col h-[500px] shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><FaRoute /></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Dispatch Map</h3>
                  <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded ml-2">3 PENDING REQUESTS</span>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-all hover:bg-blue-100">
                <FaBolt /> Quick Assign Nearest
              </button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden relative border border-gray-200 dark:border-slate-700 mx-4 mb-4">
              <MapContainer
                center={[0.0236, 37.9062]} // Kenya Center
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {trucks.map(truck => {
                  const coords = truck.currentLocation?.coordinates?.coordinates; // [lng, lat]
                  if (coords && coords.length === 2) {
                    return (
                      <Marker key={truck.id} position={[coords[1], coords[0]]} icon={fleetIcon}>
                        <Popup className="custom-popup">
                          <div className="text-slate-900 dark:text-white">
                            <strong>{truck.plateNumber}</strong><br />
                            {truck.status}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  }
                  return null;
                })}
              </MapContainer>

              {/* Map Controls Overlay (Visual Only) */}
              <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
                <button className="w-8 h-8 bg-white dark:bg-slate-900 border border-gray-300 text-gray-700 dark:text-slate-300 rounded flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-lg shadow-sm">+</button>
                <button className="w-8 h-8 bg-white dark:bg-slate-900 border border-gray-300 text-gray-700 dark:text-slate-300 rounded flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800 font-bold text-lg shadow-sm">-</button>
              </div>
            </div>
          </div>

          {/* Top Driver & Perf Panel - Light Theme */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            {/* Featured Driver */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="text-yellow-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Top Driver</span>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-yellow-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <FaUser className="text-2xl text-gray-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Samuel Karanja</h3>
                  <span className="text-[10px] font-bold bg-yellow-500 text-black px-1.5 py-0.5 rounded">GOLD STAR</span>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-slate-300">
                    <span className="flex items-center gap-1"><FaStar className="text-yellow-500 w-3 h-3" /> 4.96/5.0</span>
                    <span className="text-gray-400">(242 Trips)</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-300 rounded-lg text-sm text-blue-600 font-medium transition-all shadow-sm">
                View Performance Profile
              </button>
            </div>

            {/* Driver List */}
            <div className="p-4 flex-1 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Driver Performance</h4>
                <button className="text-xs text-blue-600 hover:text-blue-700">View All</button>
              </div>
              <div className="space-y-3">
                {topDrivers.length > 0 ? topDrivers.map((driver, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer group border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 dark:border-slate-700 group-hover:border-blue-300">
                        {/* Fallback avatar logic */}
                        <span className="font-bold text-xs text-gray-500 dark:text-slate-400">{(driver.name || driver.firstName || 'D').charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{driver.name || `${driver.firstName} ${driver.lastName}`}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><FaStar className="text-yellow-500 w-3 h-3" /> {driver.rating?.toFixed(1) || '4.5'}/5</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${driver.performanceStatus === 'On Time' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                      {driver.performanceStatus || 'Active'}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-500 dark:text-slate-400 text-sm">No driver data available</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: History & Maintenance - Already Light Theme */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Trip History */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Trips</h3>
            </div>

            <StandardDataTable
              embedded
              columns={tripColumns}
              data={recentTrips}
              getRowId={(row, index) => row.id ?? row.tripId ?? String(index)}
              searchable={false}
              pagination={false}
              columnVisibility={false}
              stickyHeader
              striped
              hoverable
              emptyMessage="No recent trips found."
              ariaLabel="Recent trips"
            />
          </div>

          {/* Maintenance Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Maintenance Alerts</h3>
            </div>

            {maintenanceAlerts.length > 0 ? maintenanceAlerts.map((alert, i) => (
              <div key={i} className={`rounded-xl p-4 flex items-start gap-4 mb-4 ${alert.type === 'Critical' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                <div className={`p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm ${alert.type === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>
                  {alert.type === 'Critical' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${alert.type === 'Critical' ? 'text-red-700' : 'text-orange-700'}`}>
                    {alert.plateNumber}: {alert.type}
                  </h4>
                  <p className={`text-xs mt-1 ${alert.type === 'Critical' ? 'text-red-600' : 'text-orange-600'}`}>{alert.message}</p>
                  {alert.type === 'Critical' && (
                    <button className="mt-3 text-xs font-bold text-red-700 underline decoration-red-300 hover:decoration-red-700">BOOK SERVICE</button>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                No maintenance alerts. Fleet is healthy!
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-slate-700 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <FaClipboardCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Inspections</h3>
            </div>

            {recentInspections.length > 0 ? (
              <div className="space-y-4">
                {recentInspections.map((inspection, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${inspection.status === 'PASSED' ? 'bg-emerald-500' :
                        inspection.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'
                        }`}></div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {inspection.truckPlate || inspection.truck?.plateNumber || inspection.truckId}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{inspection.inspector || inspection.inspectorName || 'Unknown Inspector'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${inspection.status === 'PASSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        inspection.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                        {inspection.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(inspection.inspectionDate || inspection.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm">
                <FaClipboardCheck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                No recent inspections found.
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Dark Footer */}
      <Footer />

      {/* Truck Creation Form Modal */}
      <FleetFormStepper
        isOpen={showTruckForm}
        onClose={handleCloseTruckForm}
        onSubmit={handleSubmitTruck}
        initialData={editingTruck as any}
        mode={formMode}
        activeTab="trucks"
      />
    </div>
  );
};

export default FleetOwnerDashboard;
