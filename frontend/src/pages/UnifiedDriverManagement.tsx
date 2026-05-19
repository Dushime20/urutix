import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Star,
  Award,
  Target,
  Plus,
  User,
  CheckCircle2,
  List,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Layout,
  UserPlus
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fleetApi } from '../services/fleetApi';
import { documentApi } from '../services/documents/documentApi';
import FleetFormStepper from '../components/FleetDashboard/FleetFormStepper';
import { DriversList } from '../components/FleetDashboard/DriversList';
import { DriverAssignments } from '../components/FleetDashboard/DriverAssignments';
import { cn } from '../utils/cn';
import { CircularStatCard } from '@/components/EnliteUI/Cards/StatCard';
import { motion, AnimatePresence } from 'framer-motion';
import UserRatings from './UserRatings';
import UserRewards from './UserRewards';
import UserScoring from './UserScoring';
import type { Driver } from '../services/fleetApi';
import ModernLoader from '../components/common/ModernLoader';
import toast from 'react-hot-toast';

const UnifiedDriverManagement: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'add-driver' | 'my-drivers' | 'assignments' | 'ratings' | 'rewards' | 'scoring'>(() => {
    if (location.pathname.includes('/drivers/create')) return 'add-driver';
    if (location.pathname.includes('/assignments')) return 'assignments';
    if (location.pathname.includes('/ratings')) return 'ratings';
    if (location.pathname.includes('/rewards')) return 'rewards';
    if (location.pathname.includes('/scoring')) return 'scoring';
    return 'my-drivers';
  });

  const [showDriverForm, setShowDriverForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversListRefreshKey, setDriversListRefreshKey] = useState(0);

  useEffect(() => {
    // Update tab based on URL changes
    if (location.pathname.includes('/drivers/create')) setActiveTab('add-driver');
    else if (location.pathname.includes('/assignments')) setActiveTab('assignments');
    else if (location.pathname.includes('/ratings')) setActiveTab('ratings');
    else if (location.pathname.includes('/rewards')) setActiveTab('rewards');
    else if (location.pathname.includes('/scoring')) setActiveTab('scoring');
    else if (location.pathname.includes('/drivers')) setActiveTab('my-drivers');
  }, [location.pathname]);

  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const driversData = await fleetApi.getDrivers({});
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (error: any) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'my-drivers' && user && !authLoading) {
      loadDrivers();
    }
  }, [activeTab, user, authLoading, loadDrivers]);

  // Load drivers on mount for statistics
  useEffect(() => {
    if (user && !authLoading) {
      loadDrivers();
    }
  }, [user, authLoading, loadDrivers]);

  const handleCreateDriver = () => {
    setEditingDriver(null);
    setShowDriverForm(true);
    setActiveTab('add-driver');
  };



  const handleDriverFormClose = () => {
    setShowDriverForm(false);
    setEditingDriver(null);
    if (activeTab === 'my-drivers') {
      // Trigger refresh when closing from my-drivers tab
      setDriversListRefreshKey(prev => prev + 1);
    }
  };

  const handleDriverFormSubmit = async (data: any) => {
    try {
      let driverId: string;

      if (editingDriver) {
        await fleetApi.updateDriver(editingDriver.id, data);
        driverId = editingDriver.id;
        console.log('✅ Driver updated successfully:', driverId);
        toast.success('Driver updated successfully!');
      } else {
        const createdDriver = await fleetApi.createDriver(data);
        driverId = createdDriver.id;
        console.log('✅ Driver created successfully:', createdDriver);
        toast.success('Driver added successfully!');
      }

      // Upload documents if any are provided
      if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
        toast.loading(`Uploading ${data.documents.length} document(s)...`);

        for (const doc of data.documents) {
          try {
            await documentApi.createDocument(
              {
                entityType: 'DRIVER',
                entityId: driverId,
                documentType: doc.documentType,
                category: 'LICENSE',
                title: doc.title,
                description: doc.description || '',
                expiryDate: doc.expiryDate || undefined,
                priority: 'NORMAL',
              },
              doc.file
            );
          } catch (docError: any) {
            console.error('Failed to upload document:', doc.title, docError);
            toast.error(`Failed to upload ${doc.title}`);
          }
        }

        toast.dismiss();
        toast.success('All documents uploaded successfully!');
      }

      // Wait for data refresh to complete
      await loadDrivers();
      
      // Trigger DriversList component refresh
      setDriversListRefreshKey(prev => prev + 1);
      
      handleDriverFormClose();
      setActiveTab('my-drivers');
      navigate('/dashboard/fleet/drivers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save driver');
      throw err;
    }
  };

  if (authLoading) {
    return <ModernLoader isLoading={true} type="page" showStats={true} />;
  }

  if (!user) {
    return <p className="text-center text-red-500 py-12">Authentication required.</p>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Driver Management</h1>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Layout size={12} className="text-primary-500" />
            <span>Overview</span>
            <ChevronRight size={10} />
            <span className="text-primary-500">Control Center</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateDriver}
            className="px-6 py-3 bg-primary-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            Add New Driver
          </button>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <CircularStatCard
          title="Total Drivers"
          value={loadingDrivers ? '...' : drivers.length}
          icon={Users}
          colorClass="bg-blue-50 text-blue-600"
          secondaryColor="text-blue-600"
        />
        <CircularStatCard
          title="Available"
          value={loadingDrivers ? '...' : drivers.filter(d => !d.currentTruckId).length}
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
        <CircularStatCard
          title="Average Rating"
          value="94.2%"
          icon={TrendingUp}
          colorClass="bg-primary-50 text-primary-500"
          secondaryColor="text-primary-500"
        />
        <CircularStatCard
          title="Documents"
          value="100%"
          icon={ShieldCheck}
          colorClass="bg-purple-50 text-purple-600"
          secondaryColor="text-purple-600"
        />
      </div>

      {/* Navigation Sub-Surface */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-2 flex flex-wrap items-center gap-1 shadow-sm">
        {[
          { id: 'my-drivers', icon: List, label: 'My Drivers' },
          { id: 'assignments', icon: UserCheck, label: 'Assignments' },
          { id: 'ratings', icon: Star, label: 'Ratings' },
          { id: 'rewards', icon: Award, label: 'Rewards' },
          { id: 'scoring', icon: Target, label: 'Performance' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'my-drivers') navigate('/dashboard/fleet/drivers');
              else if (tab.id === 'assignments') navigate('/dashboard/fleet/assignments');
            }}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20'
              : 'text-slate-400 hover:text-primary-500 hover:bg-white'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Canvas */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'add-driver' && (
              <div className="bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200 p-16 text-center flex flex-col items-center">
                <div className="size-24 bg-white rounded-[32px] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-sm">
                  <User size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Drivers Added Yet</h3>
                <p className="text-sm font-medium text-slate-400 mb-10 max-w-sm">Start by adding a new driver to your fleet to begin managing assignments and tracking performance.</p>
                <button
                  onClick={() => {
                    setEditingDriver(null);
                    setShowDriverForm(true);
                  }}
                  className="px-8 py-4 bg-primary-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-primary-600 transition-all shadow-2xl shadow-primary-500/20"
                >
                  <UserPlus size={18} /> Add New Driver
                </button>

                <FleetFormStepper
                  isOpen={showDriverForm}
                  onClose={handleDriverFormClose}
                  onSubmit={handleDriverFormSubmit}
                  initialData={editingDriver ? {
                    ...editingDriver,
                    type: 'driver',
                    name: `${editingDriver.firstName} ${editingDriver.lastName}`.trim() || 'Unknown Driver',
                    status: editingDriver.status || 'AVAILABLE',
                    createdAt: new Date(), // Fallback
                    updatedAt: new Date() // Fallback
                  } as any : undefined}
                  mode={editingDriver ? 'edit' : 'create'}
                  activeTab="drivers"
                />
              </div>
            )}

            {activeTab === 'my-drivers' && (
              <DriversList onAddDriver={handleCreateDriver} refreshTrigger={driversListRefreshKey} />
            )}

            {activeTab === 'assignments' && (
              <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                <DriverAssignments />
              </div>
            )}

            {activeTab === 'ratings' && (
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <UserRatings />
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <UserRewards />
              </div>
            )}

            {activeTab === 'scoring' && (
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                <UserScoring />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Driver Form Modal (when opened from My Drivers tab) */}
      {showDriverForm && activeTab === 'my-drivers' && (
        <FleetFormStepper
          isOpen={showDriverForm}
          onClose={handleDriverFormClose}
          onSubmit={handleDriverFormSubmit}
          initialData={editingDriver ? {
            ...editingDriver,
            type: 'driver',
            name: `${editingDriver.firstName} ${editingDriver.lastName}`.trim() || 'Unknown Driver',
            status: editingDriver.status || 'AVAILABLE',
            createdAt: new Date(), // Fallback
            updatedAt: new Date() // Fallback
          } as any : undefined}
          mode={editingDriver ? 'edit' : 'create'}
          activeTab="drivers"
        />
      )}
    </div>
  );
};

export default UnifiedDriverManagement;


