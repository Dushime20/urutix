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
  ShoppingCart
} from 'lucide-react';
import { DetailedErrorBoundary } from '../DetailedErrorBoundary';
import { FleetSkeleton } from './FleetSkeleton';
import { FleetModal } from './FleetModal';
import { DriversList } from './DriversList';
import StatCard from '../EnliteUI/Cards/StatCard';
import FleetFormStepper from './FleetFormStepper';
import { SafetyManagement } from './SafetyManagement';
import FleetAssignmentManager from './FleetAssignmentManager';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from '../Layout/DashboardHeader';
import DashboardFooter from '../Layout/DashboardFooter';
import 'leaflet/dist/leaflet.css';
import { fleetApi } from '../../services/fleetApi';
import type { Truck as ServiceTruck, Driver as ServiceDriver } from '../../services/fleetApi';
import { authAPI } from '../../services/api';
import type { FleetItem as LocalFleetItem } from '../../types/fleet';
import { FleetStatus } from '../../types/fleet';
import { useLocation, useNavigate } from 'react-router-dom';
import { TruckAnalytics } from './TruckAnalytics';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { TrucksList } from './TrucksList';
import { TruckMatches } from './TruckMatches';
import { TruckOwnerRecentActivities } from './TruckOwnerRecentActivities';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

import { useCargoOwnerLayout } from '../../contexts/CargoOwnerLayoutContext';

// Lazy load Credits component
const TruckOwnerCredits = lazy(() => import('../../pages/truck-owner/TruckOwnerCredits'));
const TruckOwnerPartnerPlans = lazy(() => import('../../pages/truck-owner/PartnerPlans'));
const FuelManagement = lazy(() => import('../../pages/FuelPage'));
const RoutesPage = lazy(() => import('../../pages/Routes'));

// Lazy load the full financial hub
const UnifiedFinancialManagement = lazy(() => import('../../pages/dashboard/financial/UnifiedFinancialManagement'));

// Import TenantCommunication for Truck Owners
import TenantCommunication from '../../pages/tenant/TenantCommunication';

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
  const { tSync } = useTranslation();
  const layoutContext = useCargoOwnerLayout();
  const { setHideHeader } = layoutContext || {};
  const { DialogComponent } = useConfirmDialog();
  const [fleetItems, setFleetItems] = useState<LocalFleetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFleetItem, setSelectedFleetItem] = useState<LocalFleetItem | null>(null);

  const [search, setSearch] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'expenses' | 'routes' | 'assignments' | 'matches' | 'fuel' | 'credits' | 'communicate' | 'loans' | 'buy-credits' | 'partner-plans'>('overview');


  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'trucks' | 'drivers'>('trucks');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingFleetItem, setEditingFleetItem] = useState<LocalFleetItem | null>(null);
  const [userProfileName, setUserProfileName] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ── Role Based Access Control ──────────────────────────────────────────────
  const rolePermissions: Record<string, string[]> = {
    'SUPER_ADMIN': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans'],
    'ADMIN': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans'],
    'TENANT_ADMIN': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans'],
    'TRUCK_OWNER': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans'],
    'FLEET_MANAGER': ['overview', 'trucks', 'drivers', 'fuel', 'routes', 'assignments', 'safety', 'matches', 'financial', 'expenses', 'credits', 'analytics', 'communicate', 'buy-credits', 'partner-plans', 'loans'],
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
      const [truckData, driverData, analyticsData] = await Promise.all([
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
        })
      ]);

      const validTrucks = Array.isArray(truckData) ? truckData : [];
      const validDrivers = Array.isArray(driverData) ? driverData : [];

      const allData = [
        ...validTrucks.filter(Boolean).map(normalizeTruck),
        ...validDrivers.filter(Boolean).map(normalizeDriver)
      ];
      
      setFleetItems(allData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error('Critical failure in core fleet data pipeline:', e);
      setError('Core data systems encountered an unexpected interruption. Partial data degraded.');
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
      if (formType === 'trucks') {
        const created = await fleetApi.createTruck(fleetData as any);
        newFleetItem = normalizeTruck(created);
      } else if (formType === 'drivers') {
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
          <div className="absolute top-0 right-0 p-20 opacity-[0.02] dark:opacity-[0.03] scale-[2.5] pointer-events-none rotate-12">
            <Layers size={140} className="text-blue-500 dark:text-blue-400" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Truck size={20} />
                  </div>
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                    <TranslatedText text="Fleet Dashboard" />
                  </h2>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">
                  {(() => {
                    const hour = new Date().getHours();
                    const greeting = hour < 12 ? tSync('Good morning') : hour < 18 ? tSync('Good afternoon') : tSync('Good evening');
                    const displayName = userProfileName || (user?.firstName
                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                      : (user as any)?.profile?.firstName
                        ? `${(user as any).profile.firstName} ${(user as any).profile.lastName || ''}`.trim()
                        : user?.email?.split('@')[0] || 'Fleet Manager');

                    return <>{greeting}, <span className="text-blue-600 dark:text-blue-400">{displayName}</span></>;
                  })()}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium max-w-xl">
                  <TranslatedText text="Manage your trucks, drivers and fleet performance." />
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreateTruck}
                  className="flex items-center gap-2.5 px-6 py-4 bg-blue-600 dark:bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-700 active:scale-95 transition-all group"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                  <TranslatedText text="Add New Truck" />
                </button>
                <button
                  onClick={handleCreateDriver}
                  className="flex items-center gap-2.5 px-6 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg font-semibold text-sm hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all shadow-sm"
                >
                  <User size={18} />
                  <TranslatedText text="Add New Driver" />
                </button>
                <button
                  onClick={() => navigate('/dashboard/fleet/fuel')}
                  className="flex items-center gap-2.5 px-6 py-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-lg font-semibold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  <Fuel size={18} />
                  <TranslatedText text="Log Fuel" />
                </button>
              </div>
            </div>

            {/* Sub-Navigation / Quick Vectors */}
            <div className="flex flex-wrap items-center gap-4 mt-12 pb-2">
              {[
                 { id: 'overview', icon: Layout, label: 'Overview' },
                 { id: 'trucks', icon: Truck, label: 'Trucks' },
                 { id: 'drivers', icon: User, label: 'Drivers' },
                 { id: 'fuel', icon: Fuel, label: 'Fuel' },
                 { id: 'routes', icon: Navigation, label: 'Routes' },
                 { id: 'safety', icon: Shield, label: 'Safety' },
                 { id: 'matches', icon: Zap, label: 'Matches' },
                 { id: 'financial', icon: CreditCard, label: 'Financials' },
                 { id: 'loans', icon: DollarSign, label: 'Loans' },
                 { id: 'expenses', icon: Calculator, label: 'Expenses' },
                 { id: 'credits', icon: CreditCard, label: 'Credits' },
                 { id: 'buy-credits', icon: ShoppingCart, label: 'Marketplace' },
                 { id: 'analytics', icon: Activity, label: 'Analytics' },
                 { id: 'communicate', icon: MessageSquare, label: 'Comms' }
               ].filter(t => allowedTabs.includes(t.id)).map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => {
                     if (tab.id === 'overview') {
                       navigate('/dashboard/fleet');
                     } else if (tab.id === 'fuel') {
                       navigate('/dashboard/fleet/fuel');
                     } else if (tab.id === 'credits') {
                       navigate('/dashboard/fleet/credits');
                     } else if (tab.id === 'buy-credits' || tab.id === 'partner-plans') {
                       navigate('/dashboard/fleet/buy-credits');
                     } else if (tab.id === 'financial') {
                       navigate('/dashboard/fleet/overview');
                     } else if (tab.id === 'loans') {
                       navigate('/dashboard/fleet/loan-requests');
                     } else if (tab.id === 'expenses') {
                       navigate('/dashboard/fleet/expenses');
                     } else if (tab.id === 'trucks') {
                       navigate('/dashboard/fleet/trucks');
                     } else if (tab.id === 'drivers') {
                       navigate('/dashboard/fleet/drivers');
                     } else if (tab.id === 'assignments') {
                       navigate('/dashboard/fleet/assignments');
                     } else {
                       setActiveTab(tab.id as any);
                     }
                   }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                    }`}
                >
                  <tab.icon size={16} />
                  <TranslatedText text={tab.label} />
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
                  title={<TranslatedText text="Total Trucks" />}
                  value={trucks.length}
                  icon={<Truck />}
                  subtitle={`${inTransit} ${tSync('In Transit')} • ${availableTrucks} ${tSync('Available')}`}
                  color="primary"
                  loading={loading}
                />

                <StatCard
                  title={<TranslatedText text="Utilization" />}
                  value={`${analytics?.utilizationRate !== undefined ? Math.round(analytics.utilizationRate) : utilization}%`}
                  icon={<Zap />}
                  trend={tSync("Good")}
                  trendDirection="up"
                  color="info"
                  subtitle={<TranslatedText text="Fleet usage" />}
                  loading={loading}
                />

                <StatCard
                  title={<TranslatedText text="Average Rating" />}
                  value={analytics?.averageRating?.toFixed(1) || '0.0'}
                  icon={<Star />}
                  subtitle={<TranslatedText text="Driver Rating" />}
                  color="warning"
                  loading={loading}
                />

                <StatCard
                  title={<TranslatedText text="Total Revenue" />}
                  value={analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : 'KES 0'}
                  icon={<CreditCard />}
                  trend="+12.4%"
                  trendDirection="up"
                  color="success"
                  loading={loading}
                />

                <StatCard
                  title={<TranslatedText text="Safety Alerts" />}
                  value="0"
                  icon={<AlertTriangle />}
                  subtitle={<TranslatedText text="All Good" />}
                  color="accent"
                  loading={loading}
                />
              </div>

              {/* Operations Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deployment Visualization */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col h-[560px] transition-colors duration-300 shadow-sm">
                  <div className="px-8 py-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapIcon size={16} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                          <TranslatedText text="Live Tracking" />
                        </h3>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                        <TranslatedText text="Fleet Map" />
                      </h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                            TR
                          </div>
                        ))}
                      </div>
                      <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-500 dark:text-primary-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all">
                        <Zap size={14} /> <TranslatedText text="Refresh Map" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 z-0">
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
                                <p className="font-black text-primary-500 uppercase text-[10px] mb-1">Truck ID: {item.plateNumber}</p>
                                <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
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
                      <div className="bg-white dark:bg-gray-800 backdrop-blur-md p-2 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 dark:text-gray-300">Live Updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Hub */}
                <div className="flex flex-col gap-8">
                  {/* Elite Personnel Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-8 flex flex-col relative overflow-hidden h-[300px] transition-colors duration-300 shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-[1.5] pointer-events-none rotate-12">
                      <Shield size={100} className="text-amber-400" />
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-8 w-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-500 dark:text-amber-400">
                        <Star size={16} fill="currentColor" />
                      </div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">
                        <TranslatedText text="Top Driver" />
                      </h3>
                    </div>

                    <div className="flex items-center gap-6 mb-8">
                      <div className="h-24 w-24 rounded-lg bg-gray-50 dark:bg-gray-800 border-4 border-white dark:border-gray-700 overflow-hidden flex items-center justify-center">
                        <User size={40} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>

                        <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Samuel Karanja</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span className="text-lg font-black text-gray-900 dark:text-white">4.96</span>
                          <span className="text-sm font-bold text-gray-400 dark:text-gray-500">Rating</span>
                        </div>
                      </div>
                    </div>

                    <button className="mt-auto w-full py-4 bg-gray-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      View Driver Profile
                    </button>
                  </div>

                  {/* Operational Metrics Sub-Matrix */}
                  <div className="bg-blue-500 dark:bg-blue-600 rounded-lg p-8 text-white relative overflow-hidden flex-1">
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
                    <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400">
                      <Clock size={16} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">Recent Activities</h3>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 hover:underline decoration-2 underline-offset-4">
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
              {/* Specialized View Header (Hidden for tabs that implement their own complete control surfaces) */}
              {!['trucks', 'drivers', 'assignments'].includes(activeTab) && (
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
                                        activeTab === 'partner-plans' ? <Star size={28} /> :
                                          activeTab === 'communicate' ? <MessageSquare size={28} /> : <User size={28} />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        {activeTab === 'trucks' ? <TranslatedText text="Trucks" /> :
                          activeTab === 'analytics' ? <TranslatedText text="Analytics" /> :
                            activeTab === 'safety' ? <TranslatedText text="Safety" /> :
                              activeTab === 'financial' ? <TranslatedText text="Financials" /> :
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
                {activeTab === 'analytics' ? (
                  <TruckAnalytics trucks={trucks} />
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
