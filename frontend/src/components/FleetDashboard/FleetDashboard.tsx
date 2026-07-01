import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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
  Calculator,
  Activity,
  Shield,
  CreditCard,
  Search,
  Star,
  AlertTriangle,
  Fuel,
  MessageSquare,
  Link,
  DollarSign,
  ShoppingCart,
  ClipboardList
} from 'lucide-react';
import { DetailedErrorBoundary } from '../DetailedErrorBoundary';
import { FleetSkeleton } from './FleetSkeleton';
import BiddingDashboard from '../Bidding/BiddingDashboard';
import { FleetModal } from './FleetModal';
import { DriversList } from './DriversList';
import StatCard from '../EnliteUI/Cards/StatCard';
import FleetFormStepper from './FleetFormStepper';
import { SafetyManagement } from './SafetyManagement';
import FleetAssignmentManager from './FleetAssignmentManager';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/Layout/DashboardHeader';
import DashboardFooter from '@/components/Layout/DashboardFooter';
import 'leaflet/dist/leaflet.css';
import { fleetApi } from '@/services/fleetApi';
import { fuelApi } from '@/services/fuelApi';
import type { Truck as ServiceTruck, Driver as ServiceDriver, TCOAnalysis } from '@/services/fleetApi';
import { authAPI } from '@/services/api';
import type { FleetItem as LocalFleetItem } from '@/types/fleet';
import { FleetStatus } from '@/types/fleet';
import { useLocation, useNavigate } from 'react-router-dom';
import { TruckAnalytics } from './TruckAnalytics';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { TrucksList } from './TrucksList';
import { TruckMatches } from './TruckMatches';
import { TruckOwnerRecentActivities } from './TruckOwnerRecentActivities';
import { FleetOverview } from './FleetOverview';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

import { useCargoOwnerLayout } from '@/contexts/CargoOwnerLayoutContext';

// Lazy load Credits component
const TruckOwnerCredits = lazy(() => import('@/pages/truck-owner/TruckOwnerCredits'));
const TruckOwnerPartnerPlans = lazy(() => import('@/pages/truck-owner/PartnerPlans'));
const FuelManagement = lazy(() => import('@/pages/FuelPage'));
const RoutesPage = lazy(() => import('@/pages/Routes'));

// Lazy load the full financial hub
const UnifiedFinancialManagement = lazy(() => import('@/pages/dashboard/financial/UnifiedFinancialManagement'));

// Import TenantCommunication for Truck Owners
import TenantCommunication from '@/pages/tenant/TenantCommunication';

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
  const { compact: formatCurrency } = useCurrencyFormat();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, accessToken } = useAuth();
  const { tSync } = useTranslation();
  const layoutContext = useCargoOwnerLayout();
  const { setHideHeader } = layoutContext || {};
  const { DialogComponent } = useConfirmDialog();
  const [fleetItems, setFleetItems] = useState<LocalFleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFleetItem, setSelectedFleetItem] = useState<LocalFleetItem | null>(null);

  const [search, setSearch] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'expenses' | 'routes' | 'assignments' | 'matches' | 'fuel' | 'credits' | 'communicate' | 'loans' | 'buy-credits' | 'partner-plans' | 'bids'>('overview');


  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'trucks' | 'drivers'>('trucks');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFleetItem, setEditingFleetItem] = useState<LocalFleetItem | null>(null);
  const [userProfileName, setUserProfileName] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [fuelStats, setFuelStats] = useState<any>(null);
  const [tcoData, setTcoData] = useState<TCOAnalysis | null>(null);
  const [rawTrucks, setRawTrucks] = useState<any[]>([]);
  const [rawDrivers, setRawDrivers] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── Role Based Access Control ──────────────────────────────────────────────
  const rolePermissions: Record<string, string[]> = {
    'SUPER_ADMIN': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans', 'bids'],
    'ADMIN': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans', 'bids'],
    'TENANT_ADMIN': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans', 'bids'],
    'TRUCK_OWNER': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans', 'bids'],
    'FLEET_MANAGER': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans', 'bids'],
    'FLEET_DISPATCHER': ['overview', 'trucks', 'drivers', 'routes', 'assignments', 'matches', 'analytics', 'communicate'],
    'FLEET_ACCOUNTANT': ['overview', 'financial', 'expenses', 'credits', 'fuel', 'analytics'],
    'FLEET_SAFETY_OFFICER': ['overview', 'trucks', 'drivers', 'safety', 'analytics'],
  };

  const allowedTabs = rolePermissions[user?.role || ''] || ['overview', 'trucks', 'drivers'];
  // ───────────────────────────────────────────────────────────────────────────

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
    else if (path.includes('/fleet/bids') || path.includes('/fleet/my-bids')) setActiveTab('bids');
    else if (path.includes('/fleet/loan-requests')) setActiveTab('loans');
    else if (path.includes('/fleet/financial')) setActiveTab('financial');
    else if (path.includes('/fleet/financial-info')) setActiveTab('financial');
    else if (path.includes('/fleet/cost-analysis')) setActiveTab('financial');
    else if (path.includes('/fleet/expenses')) setActiveTab('expenses');
    else if (path.includes('/fleet/routes')) setActiveTab('routes');
    else if (path.includes('/fleet/assignments')) setActiveTab('assignments');
    else if (path.includes('/fleet/fuel')) setActiveTab('fuel');
    else if (path.includes('/fleet/buy-credits')) setActiveTab('credits');
    else if (path.includes('/fleet/partner-plans')) setActiveTab('partner-plans');
    else if (path.includes('/fleet/communicate') || path.includes('/fleet/communication')) setActiveTab('communicate');
    else if (path.includes('/dashboard/fleet/overview')) setActiveTab('financial');
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
      setFormType('trucks');
      setShowForm(true);
      setFormMode('create');
      setEditingFleetItem(null);
    } else if (location.pathname === '/dashboard/fleet/drivers/create') {
      setActiveTab('drivers');
      setFormType('drivers');
      setShowForm(true);
      setFormMode('create');
      setEditingFleetItem(null);
    }
  }, [location.pathname]);

  const normalizeTruck = (t: ServiceTruck): LocalFleetItem => {
    if (!t) return {} as LocalFleetItem;
    const name = [t.make, t.model].filter(Boolean).join(' ').trim() || t.plateNumber || t.id || 'Unknown Truck';
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
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
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
    if (!d) return {} as LocalFleetItem;
    const name = [d.firstName, d.lastName].filter(Boolean).join(' ').trim() || d.id || 'Unknown Driver';
    const status: FleetStatus = FleetStatus.AVAILABLE;
    return {
      id: d.id,
      type: 'driver',
      name,
      status,
      createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
      licenseNumber: d.licenseNumber,
      experience: d.experience,
      contactInfo: { phone: d.phone, email: d.email },
    } as LocalFleetItem;
  };

  const loadFleetItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [truckData, driverData, analyticsData, fuelStatsData, tcoAnalyticsData] = await Promise.all([
        fleetApi.getTrucks({ limit: 100 }).catch(err => {
          console.warn('Failed to load trucks matrix:', err);
          return [];
        }),
        fleetApi.getDrivers({ limit: 100 }).catch(err => {
          console.warn('Failed to load drivers matrix:', err);
          return [];
        }),
        fleetApi.fetchAnalytics().catch(err => {
          console.warn('Failed to load fleet analytics:', err);
          return null;
        }),
        fuelApi.getFuelStatistics().catch(err => {
          console.warn('Failed to load fuel statistics:', err);
          return null;
        }),
        fleetApi.getTCOAnalysis().catch(err => {
          console.warn('Failed to load TCO analysis:', err);
          return null;
        })
      ]);

      const validTrucks = Array.isArray(truckData) ? truckData : [];
      const validDrivers = Array.isArray(driverData) ? driverData : [];

      setRawTrucks(validTrucks);
      setRawDrivers(validDrivers);

      const allData = [
        ...validTrucks.filter(Boolean).map(normalizeTruck),
        ...validDrivers.filter(Boolean).map(normalizeDriver)
      ];
      
      setFleetItems(allData);
      setAnalytics(analyticsData);
      setFuelStats(fuelStatsData);
      setTcoData(tcoAnalyticsData);
    } catch (e) {
      console.error('Critical failure in core fleet data pipeline:', e);
      setError('Core data systems encountered an unexpected interruption. Partial data degraded.');
    } finally {
      setLoading(false);
    }
  }, []);

  // formatCurrency provided by useCurrencyFormat hook




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
      if (formType === 'trucks') {
        const created = await fleetApi.createTruck(fleetData as any);
        console.log('✅ Truck created successfully:', created);
        newFleetItem = normalizeTruck(created);
      } else if (formType === 'drivers') {
        // Documents are sent together with driver data in one multipart request
        const created = await fleetApi.createDriver(fleetData);
        console.log('✅ Driver created successfully:', created);
        newFleetItem = normalizeDriver(created);
      } else {
        throw new Error('Unsupported fleet type');
      }

      setFleetItems(prev => [newFleetItem, ...prev]);
      setShowForm(false);
      if (location.pathname.includes('/create')) {
        navigate('/dashboard/fleet');
      }
      
      // Trigger refresh to ensure data is up to date
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error creating fleet item:', error);
      throw error;
    }
  }, [formType, location.pathname, navigate]);

  const handleUpdateFleetItem = useCallback(async (fleetData: any) => {
    if (!editingFleetItem) return;

    try {
      let updatedFleetItem: LocalFleetItem;
      if (formType === 'trucks') {
        const updated = await fleetApi.updateTruck(editingFleetItem.id, fleetData as any);
        updatedFleetItem = normalizeTruck(updated);
        toast.success('Truck updated successfully');
      } else if (formType === 'drivers') {
        const updated = await fleetApi.updateDriver(editingFleetItem.id, fleetData);
        updatedFleetItem = normalizeDriver(updated);
        toast.success('Driver updated successfully');
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
  }, [editingFleetItem, formType]);




  const handleCreateTruck = useCallback(() => {
    setActiveTab('trucks');
    setFormType('trucks');
    setEditingFleetItem(null);
    setFormMode('create');
    setShowForm(true);
  }, []);

  const handleCreateDriver = useCallback(() => {
    setActiveTab('drivers');
    setFormType('drivers');
    setEditingFleetItem(null);
    setFormMode('create');
    setShowForm(true);
  }, []);

  const handleEditDriver = useCallback((driver: ServiceDriver) => {
    console.log('🔧 Editing driver:', driver);
    console.log('📋 Driver fields available:', Object.keys(driver));
    
    // Helper function to format dates for HTML date inputs (YYYY-MM-DD)
    const formatDateForInput = (dateValue: any): string => {
      if (!dateValue) return '';
      
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        
        // Format as YYYY-MM-DD for HTML date input
        const formatted = date.toISOString().split('T')[0];
        console.log(`📅 Formatted date ${dateValue} -> ${formatted}`);
        return formatted;
      } catch (error) {
        console.warn('Error formatting date:', dateValue, error);
        return '';
      }
    };

    setActiveTab('drivers');
    setFormType('drivers');
    
    // Pass the complete driver data with all fields needed for form prefilling
    const editData = {
      id: driver.id,
      type: 'driver' as const,
      name: `${driver.firstName} ${driver.lastName}`.trim(),
      status: driver.status || 'ACTIVE' as FleetStatus,
      createdAt: new Date(driver.createdAt),
      updatedAt: new Date(driver.updatedAt),
      
      // Personal Information
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      email: driver.email || '',
      phone: driver.phone || '',
      dateOfBirth: formatDateForInput(driver.dateOfBirth),
      address: driver.address || '',
      
      // License Information
      licenseNumber: driver.licenseNumber || '',
      licenseType: driver.licenseClasses?.[0] || 'CDL_A', // Use first class or default
      licenseClasses: driver.licenseClasses || [],
      licenseIssueDate: formatDateForInput(driver.licenseIssueDate),
      licenseExpiry: formatDateForInput(driver.licenseExpiry),
      licenseState: driver.licenseState || '',
      licenseCountry: driver.licenseCountry || '',
      
      // Employment Information
      employmentType: driver.employmentType || 'FULL_TIME',
      hireDate: formatDateForInput(driver.hireDate),
      terminationDate: formatDateForInput(driver.terminationDate),
      availabilityStatus: driver.availabilityStatus || 'AVAILABLE',
      
      // Experience and Performance
      experience: driver.experience || 0,
      
      // Rates and Compensation
      hourlyRate: driver.hourlyRate ? Number(driver.hourlyRate) : undefined,
      mileageRate: driver.mileageRate ? Number(driver.mileageRate) : undefined,
      
      // Compliance and Certifications
      medicalCertExpiry: formatDateForInput(driver.medicalCertExpiry),
      drugTestDate: formatDateForInput(driver.drugTestDate),
      backgroundCheckDate: formatDateForInput(driver.backgroundCheckDate),
      trainingCompletionDate: formatDateForInput(driver.trainingCompletionDate),
      
      // Notes and Additional Info
      driverNotes: driver.driverNotes || '',
      emergencyContact: driver.emergencyContact || {},
      
      // Contact Information (for form compatibility)
      contactInfo: { 
        phone: driver.phone || '', 
        email: driver.email || '' 
      }
    } as LocalFleetItem;
    
    console.log('📝 Edit data prepared:', editData);
    console.log('🎯 Key form fields:', {
      firstName: editData.firstName,
      lastName: editData.lastName,
      email: editData.contactInfo?.email,
      phone: editData.contactInfo?.phone,
      licenseNumber: editData.licenseNumber,
      dateOfBirth: editData.dateOfBirth,
      hireDate: editData.hireDate
    });
    
    setEditingFleetItem(editData);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingFleetItem(null);
    // Trigger refresh when closing form (especially after edit)
    if (formMode === 'edit') {
      setRefreshTrigger(prev => prev + 1);
    }
    if (location.pathname.includes('/create')) {
      navigate('/dashboard/fleet');
    }
  }, [location.pathname, navigate, formMode]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <DashboardHeader />

        {/* Intelligence Header Context */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 relative overflow-hidden transition-colors duration-200">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] dark:opacity-[0.03] scale-[1.5] pointer-events-none rotate-12">
            <Layers size={100} className="text-[#2c5173] dark:text-[#2c5173]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-[#2c5173]/10 dark:bg-[#2c5173]/20 rounded-lg flex items-center justify-center text-[#2c5173] dark:text-[#2c5173]">
                    <Truck size={16} />
                  </div>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2c5173] dark:text-[#2c5173]">
                    <TranslatedText text="Fleet Dashboard" />
                  </h2>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? tSync('Good morning') : hour < 18 ? tSync('Good afternoon') : tSync('Good evening');
                    const displayName = userProfileName || (user?.firstName
                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                      : (user as any)?.profile?.firstName
                        ? `${(user as any).profile.firstName} ${(user as any).profile.lastName || ''}`.trim()
                        : user?.email?.split('@')[0] || 'Fleet Manager');

                    return <>{greeting}, <span className="text-[#2c5173] dark:text-[#2c5173]">{displayName}</span></>;
                  })()}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium max-w-xl">
                  <TranslatedText text="Manage your trucks, drivers and fleet performance." />
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateTruck}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#2c5173] text-white rounded-lg font-semibold text-sm hover:bg-[#1e3850] active:scale-95 transition-all group"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  <TranslatedText text="Add New Truck" />
                </button>
                <button
                  onClick={handleCreateDriver}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-sm hover:border-[#2c5173] hover:text-[#2c5173] dark:hover:text-[#2c5173] active:scale-95 transition-all shadow-sm"
                >
                  <User size={16} />
                  <TranslatedText text="Add New Driver" />
                </button>
                <button
                  onClick={() => navigate('/dashboard/fleet/fuel')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg font-semibold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  <Fuel size={16} />
                  <TranslatedText text="Log Fuel" />
                </button>
              </div>
            </div>


          </div>
        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {activeTab === 'overview' ? (
            <FleetOverview
              trucks={rawTrucks}
              drivers={rawDrivers}
              analytics={analytics}
              loading={loading}
              onRefresh={loadFleetItems}
              onAddTruck={handleCreateTruck}
              onAddDriver={handleCreateDriver}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Specialized View Header (Hidden for tabs that implement their own complete control surfaces) */}
              {!['trucks', 'drivers', 'assignments', 'bids'].includes(activeTab) && (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400">
                      {activeTab === 'trucks' ? <Truck size={28} /> :
                        activeTab === 'analytics' ? <Activity size={28} /> :
                          activeTab === 'safety' ? <Shield size={28} /> :
                            activeTab === 'financial' ? <CreditCard size={28} /> :
                              activeTab === 'routes' ? <Navigation size={28} /> :
                                activeTab === 'assignments' ? <Link size={28} /> :
                                  activeTab === 'matches' ? <Zap size={28} /> :
                                    activeTab === 'fuel' ? <Fuel size={28} /> :
                                      activeTab === 'credits' ? <CreditCard size={28} /> :
                                        activeTab === 'loans' ? <DollarSign size={28} /> :
                                          activeTab === 'partner-plans' ? <Star size={28} /> :
                                            activeTab === 'communicate' ? <MessageSquare size={28} /> : <User size={28} />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        {activeTab === 'trucks' ? <TranslatedText text="Trucks" /> :
                          activeTab === 'analytics' ? <TranslatedText text="Analytics" /> :
                            activeTab === 'safety' ? <TranslatedText text="Safety" /> :
                              activeTab === 'financial' ? <TranslatedText text="Financials" /> :
                                activeTab === 'loans' ? <TranslatedText text="Loan Requests" /> :
                                 activeTab === 'routes' ? <TranslatedText text="Route Management" /> : 
                                  activeTab === 'assignments' ? <TranslatedText text="Assignments" /> :
                                    activeTab === 'matches' ? <TranslatedText text="Matches" /> :
                                      activeTab === 'credits' ? <TranslatedText text="Credits" /> :
                                        activeTab === 'partner-plans' ? <TranslatedText text="Partner Plans" /> :
                                          activeTab === 'communicate' ? <TranslatedText text="Communication" /> : 
                                            activeTab === 'fuel' ? <TranslatedText text="Fuel Management" /> : 
                                              <TranslatedText text="Drivers" />}
                      </h2>
                      {activeTab !== 'fuel' && activeTab !== 'routes' && (
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          <TranslatedText text="Status" />: <span className="text-green-500 dark:text-green-400 font-black"><TranslatedText text="Active" /></span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative group hidden sm:block">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder="Search fleet entities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-12 pr-6 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[11px] font-bold text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-700 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all w-64"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-900 p-2 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-6 rounded-lg flex items-center gap-3 m-4" role="alert">
                    <AlertTriangle size={20} />
                    <span className="text-sm font-semibold">{error}</span>
                  </div>
                )}
                {activeTab === 'bids' ? (
                  <BiddingDashboard userRole={user?.role === 'TRUCK_OWNER' ? 'TRUCK_OWNER' : 'CARGO_OWNER'} />
                ) : activeTab === 'analytics' ? (
                  <TruckAnalytics 
                    trucks={trucks} 
                    analytics={analytics} 
                    fuelStats={fuelStats}
                    tcoData={tcoData}
                  />
                ) : activeTab === 'safety' ? (
                  <SafetyManagement />
                ) : (activeTab === 'financial' || activeTab === 'expenses' || activeTab === 'loans') ? (
                  <Suspense fallback={<div className="p-20 text-center animate-pulse"><p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Synchronizing Financial Hub...</p></div>}>
                    <UnifiedFinancialManagement />
                  </Suspense>
                ) : activeTab === 'routes' ? (
                  <Suspense fallback={<FleetSkeleton />}>
                    <RoutesPage isEmbedded={true} />
                  </Suspense>
                ) : activeTab === 'assignments' ? (
                  <FleetAssignmentManager />
                ) : activeTab === 'drivers' ? (
                  <DriversList 
                    onAddDriver={handleCreateDriver} 
                    onEditDriver={handleEditDriver} 
                    refreshTrigger={refreshTrigger}
                  />
                ) : activeTab === 'trucks' ? (
                  <TrucksList onAddTruck={handleCreateTruck} />
                ) : activeTab === 'matches' ? (
                  <TruckMatches />
                ) : activeTab === 'credits' ? (
                  <Suspense fallback={<FleetSkeleton />}>
                    <TruckOwnerCredits />
                  </Suspense>
                ) : activeTab === 'partner-plans' ? (
                  <Suspense fallback={<FleetSkeleton />}>
                    <TruckOwnerPartnerPlans />
                  </Suspense>
                ) : activeTab === 'fuel' ? (
                  <Suspense fallback={<FleetSkeleton />}>
                    <FuelManagement isEmbedded={true} />
                  </Suspense>
                ) : activeTab === 'communicate' ? (
                  <TenantCommunication />
                ) : loading && fleetItems.length === 0 ? (
                  <FleetSkeleton />
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coming Soon</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Sticky Right-Side Quick Actions */}
          <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[90]">
            {[
              { id: 'financial', icon: CreditCard, label: 'Finance', path: '/dashboard/fleet/financial' },
              { id: 'matches', icon: Zap, label: 'Matches', path: '/dashboard/fleet?tab=matches' },
              { id: 'bids', icon: ClipboardList, label: 'Bidding', path: '/dashboard/fleet/bids' },
            ].map((action) => {
              const isActive = (action.id === 'bids' && location.pathname.includes('/fleet/bids')) ||
                               (activeTab === action.id);
              return (
                <div key={action.id} className="relative group flex items-center">
                  <button
                    onClick={() => {
                       if (action.id === 'bids' || action.id === 'financial') {
                         navigate(action.path);
                       } else {
                         setActiveTab(action.id as any);
                       }
                    }}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#2c5173]/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
                      isActive ? 'bg-[#1f3a53] ring-4 ring-[#2c5173]/30' : 'bg-[#2c5173] hover:bg-[#1f3a53]'
                    }`}
                  >
                    <action.icon size={22} />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute right-full mr-4 px-3 py-2 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-xl">
                    <TranslatedText text={action.label} />
                    {/* Arrow */}
                    <div className="absolute top-1/2 right-[-5px] -translate-y-1/2 border-[5px] border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              );
            })}
          </div>

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
            activeTab={formType}
          />
        </div>

        <DashboardFooter />
      </div>
      {DialogComponent}
    </DetailedErrorBoundary>
  );
}; 
