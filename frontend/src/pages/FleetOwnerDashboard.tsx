import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FaBolt
} from 'react-icons/fa';
import { Clock, Zap, AlertTriangle, Bell, Search, X, Settings, LogOut, Fuel, Droplets, CheckCircle, Plus } from 'lucide-react';
import { fleetApi, type FleetItem, type Driver } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FleetFormEnhanced as FleetForm } from '../components/FleetDashboard/FleetFormEnhanced';

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
  const [drivers, setDrivers] = useState<Driver[]>([]);

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

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const trucksData = await fleetApi.getTrucks();
      setTrucks(Array.isArray(trucksData) ? trucksData : []);

      const driversData = await fleetApi.getDrivers();
      setDrivers(driversData);

      let tripsData: any[] = [];
      try {
        const tripsResponse = await tripsAPI.getAll({});
        tripsData = tripsResponse.data?.data || tripsResponse.data?.trips || [];
      } catch (e) {
        console.warn('Failed to load trips:', e);
      }

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
        activeDrivers: driversData.filter(d => d.status === 'ACTIVE').length,
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.3,
        pendingPayments: trucksInTransit * 5000,
        activeTrips: tripsData.length,
        completedTrips: 0,
        utilizationRate: Math.round(utilizationRate),
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
      await fleetApi.createTruck(data);
      toast.success('Truck added successfully!');
      setShowTruckForm(false);
      setEditingTruck(null);
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error creating truck:', error);
      toast.error('Failed to add truck. Please try again.');
      throw error;
    }
  }, [loadDashboardData]);

  const handleCloseTruckForm = useCallback(() => {
    setShowTruckForm(false);
    setEditingTruck(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // --- UI COMPONENTS ---

  const Header = () => (
    <>
      {/* Marquee Alert Bar */}
      <div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5">
        <div className="flex items-center animate-marquee whitespace-nowrap">
          <div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
            <span className="flex items-center gap-2 text-amber-400">
              <AlertTriangle size={14} /> Maintenance Alert: TRK-004 brake service required
            </span>
            <span className="flex items-center gap-2">
              <Droplets size={14} className="text-blue-400" /> Heavy Rain Alert: Nairobi-Mombasa Route
            </span>
            <span className="flex items-center gap-2 text-green-400">
              <CheckCircle size={14} /> All border crossings operating normally
            </span>
            <span className="flex items-center gap-2 text-amber-400">
              <Fuel size={14} /> Fuel Surcharge Update: +2% effective Jan 15th
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
              <div className="size-10 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center rounded-xl shadow-lg shadow-blue-500/20">
                <FaTruck className="size-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-white">UrutiX<span className="text-blue-400">.</span></h2>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-10">
              <a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/dashboard/fleet">Dashboard</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/trucks">Fleet</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/drivers">Drivers</a>
              <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/maintenance">Maintenance</a>
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
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Fleet Commander</span>
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
                      Manage Fleet
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
              <a href="/dashboard/fleet/drivers" className="hover:text-white px-3 py-2">Drivers</a>
              <a href="/dashboard/fleet/maintenance" className="hover:text-white px-3 py-2">Maintenance</a>
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
              UrutiX Fleet Command is Africa's premier fleet management and logistics platform, empowering fleet owners to optimize operations and maximize profitability.
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
              <li><a className="text-slate-400 text-sm hover:text-blue-400 transition-colors" href="/dashboard/fleet/trucks">Manage Fleet</a></li>
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
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center md:text-left">
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Dark Header */}
      <Header />

      {/* Dark Welcome Section */}
      <section className="bg-slate-900 text-white px-4 md:px-8 lg:px-12 xl:px-20 py-6">
        <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back, Fleet Manager</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">System operational: <strong className="text-white">{stats.activeTrips} Active Dispatches</strong> | {stats.trucksAvailable} Awaiting Loading</span>
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
              onClick={() => navigate('/dashboard/fleet/status')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold text-white transition-all flex items-center gap-2"
            >
              <FaChartLine className="text-slate-400" /> Fleet Status
            </button>
            <button
              onClick={() => navigate('/dashboard/fleet/dispatch')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> DISPATCH
            </button>
          </div>
        </div>
      </section>

      {/* Light Main Content */}
      <main className="flex-1 px-4 md:px-8 lg:px-12 xl:px-20 py-8 md:py-12 space-y-8 max-w-[1536px] mx-auto w-full">

        {/* Metric Cards - Light Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Live Status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FaTruck className="w-16 h-16 text-blue-500" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fleet Live Status</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-gray-900">{stats.totalTrucks}</span>
              <span className="text-sm font-medium text-emerald-600 mb-1.5 flex items-center gap-1"><FaCheckCircle /> All Systems</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
              <div style={{ width: `${stats.utilizationRate}%` }} className="bg-blue-500 h-full"></div>
              <div style={{ width: `${100 - stats.utilizationRate}%` }} className="bg-emerald-500 h-full"></div>
            </div>
            <div className="flex justify-between text-[10px] mt-2 font-medium text-gray-500">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> In Transit ({stats.trucksInTransit})</span>
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Available ({stats.trucksAvailable})</span>
            </div>
          </div>

          {/* Reputation */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden group hover:border-yellow-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-yellow-500"><FaStar className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fleet Reputation</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-gray-900">4.82<span className="text-lg text-gray-400">/5</span></span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-200">
              <FaChartLine /> <strong>+0.2</strong> avg driver rating
            </div>
          </div>

          {/* Utilization */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-emerald-500"><FaUser className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Driver Utilization</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-gray-900">{stats.utilizationRate}%</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-200">
              <FaBolt /> <strong>+2%</strong> efficiency
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-300 hover:shadow-lg transition-all shadow-sm">
            <div className="absolute top-4 right-4 text-amber-500"><FaDollarSign className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Revenue (MTD)</p>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-black text-gray-900">KES 2.4M</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded border border-emerald-200">
              <FaChartLine /> <strong>+12%</strong> monthly growth
            </div>
          </div>
        </div>

        {/* Main Content: Map & Drivers - Light Theme */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Interactive Map */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-1 overflow-hidden flex flex-col h-[500px] shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><FaRoute /></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Interactive Dispatch Map</h3>
                  <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded ml-2">3 PENDING REQUESTS</span>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-all hover:bg-blue-100">
                <FaBolt /> Quick Assign Nearest
              </button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden relative border border-gray-200 mx-4 mb-4">
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
                          <div className="text-slate-900">
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
                <button className="w-8 h-8 bg-white border border-gray-300 text-gray-700 rounded flex items-center justify-center hover:bg-gray-50 font-bold text-lg shadow-sm">+</button>
                <button className="w-8 h-8 bg-white border border-gray-300 text-gray-700 rounded flex items-center justify-center hover:bg-gray-50 font-bold text-lg shadow-sm">-</button>
              </div>
            </div>
          </div>

          {/* Top Driver & Perf Panel - Light Theme */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            {/* Featured Driver */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="text-yellow-500" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Top Rated Driver</span>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-yellow-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <FaUser className="text-2xl text-gray-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Samuel Karanja</h3>
                  <span className="text-[10px] font-bold bg-yellow-500 text-black px-1.5 py-0.5 rounded">GOLD STAR</span>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><FaStar className="text-yellow-500 w-3 h-3" /> 4.96/5.0</span>
                    <span className="text-gray-400">(242 Trips)</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm text-blue-600 font-medium transition-all shadow-sm">
                View Performance Profile
              </button>
            </div>

            {/* Driver List */}
            <div className="p-4 flex-1 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900">Driver Performance</h4>
                <button className="text-xs text-blue-600 hover:text-blue-700">View All</button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Musa Jibril', rating: 4.7, status: 'On Time', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                  { name: 'Alice W.', rating: 4.8, status: 'Fuel Efficient', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
                  { name: 'David K.', rating: 4.5, status: 'Resting', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' }
                ].map((driver, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white hover:bg-blue-50 rounded-xl transition-colors cursor-pointer group border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 group-hover:border-blue-300">
                        <span className="font-bold text-xs text-gray-500">{driver.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{driver.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><FaStar className="text-yellow-500 w-3 h-3" /> {driver.rating}/5</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${driver.bg} ${driver.color}`}>
                      {driver.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: History & Maintenance - Already Light Theme */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Trip History */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">Recent Trip History</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Dispatch ID</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Truck & Driver</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Destination</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[1, 2].map((_, i) => (
                    <tr key={i} className="group hover:bg-gray-50/50">
                      <td className="py-4">
                        <span className="text-sm font-bold text-blue-600">DISP-442{i + 1}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-400"><FaTruck /></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">TRK-109</p>
                            <p className="text-xs text-gray-500">Musa Jibril</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">Naivasha ICD</td>
                      <td className="py-4">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200">COMPLETED</span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-sm font-medium text-gray-900">
                          <FaStar className="text-yellow-400" /> 5.0
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Alerts */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900">Maintenance Alerts</h3>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 mb-4">
              <div className="p-2 bg-white rounded-full text-red-500 shadow-sm"><AlertTriangle className="w-5 h-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-red-700">TRK-004: Critical Coverage</h4>
                <p className="text-xs text-red-600 mt-1">Brake wear limit exceeded on rear axle. Immediate service required.</p>
                <button className="mt-3 text-xs font-bold text-red-700 underline decoration-red-300 hover:decoration-red-700">BOOK SERVICE</button>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-4">
              <div className="p-2 bg-white rounded-full text-orange-500 shadow-sm"><Clock className="w-5 h-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-orange-700">TRK-102: Scheduled Service</h4>
                <p className="text-xs text-orange-600 mt-1">Due for routine oil change in 400km.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Dark Footer */}
      <Footer />

      {/* Truck Creation Form Modal */}
      <FleetForm
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
