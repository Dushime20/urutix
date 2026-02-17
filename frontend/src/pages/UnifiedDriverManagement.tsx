import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Star,
  Award,
  Target,
  Plus,
  User,
  CheckCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fleetApi } from '../services/fleetApi';
import { documentApi } from '../services/documents/documentApi';
import FleetFormStepper from '../components/FleetDashboard/FleetFormStepper';
import { DriversList } from '../components/FleetDashboard/DriversList';
import { DriverAssignments } from '../components/FleetDashboard/DriverAssignments';
import UserRatings from './UserRatings';
import UserRewards from './UserRewards';
import UserScoring from './UserScoring';
import type { Driver } from '../services/fleetApi';
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
      loadDrivers();
    }
  };

  const handleDriverFormSubmit = async (data: any) => {
    try {
      let driverId: string;

      if (editingDriver) {
        await fleetApi.updateDriver(editingDriver.id, data);
        driverId = editingDriver.id;
        toast.success('Driver updated successfully!');
      } else {
        const createdDriver = await fleetApi.createDriver(data);
        driverId = createdDriver.id;
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

      handleDriverFormClose();
      setActiveTab('my-drivers');
      navigate('/dashboard/fleet/drivers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save driver');
      throw err;
    }
  };

  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    return <p className="text-center text-red-500 py-12">Authentication required.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Driver Management</h1>
            <p className="text-xs text-gray-600">Manage your drivers, add new drivers, and assign them to trucks</p>
          </div>
          <div className="flex items-center gap-2">

            <button
              onClick={handleCreateDriver}
              className="flex items-center gap-2.5 px-6 py-4 bg-[#345E85] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 hover:bg-[#2a4d6d] active:scale-95 transition-all group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              Add New Driver
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Drivers</p>
                <p className="text-xl font-bold text-gray-900">
                  {loadingDrivers ? '...' : drivers.length}
                </p>
              </div>
              <User className="w-6 h-6" style={{ color: '#345E85' }} />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Available</p>
                <p className="text-xl font-bold text-green-600">
                  {loadingDrivers ? '...' : drivers.filter(d => !d.currentTruckId).length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation / Quick Vectors */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {[
          { id: 'my-drivers', icon: Users, label: 'My Drivers' },
          { id: 'assignments', icon: UserCheck, label: 'Assignments' },
          { id: 'ratings', icon: Star, label: 'Ratings' },
          { id: 'rewards', icon: Award, label: 'Rewards' },
          { id: 'scoring', icon: Target, label: 'Scoring' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'my-drivers') navigate('/dashboard/fleet/drivers');
              else if (tab.id === 'assignments') navigate('/dashboard/fleet/assignments');
              // Add other routes if strictly needed, but typically setting activeTab is enough if we are in the same parent or managing via state in this file
            }}
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

      {/* Content Container */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'add-driver' && (
            <div>
              {!showDriverForm ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="mb-2">Add New Driver</h3>
                  <p className="text-gray-600 mb-6">Click the button below to start adding a new driver to your fleet</p>
                  <button
                    onClick={handleCreateDriver}
                    className="px-6 py-3 bg-[#345E85] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#2a4d6d] transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Driver
                  </button>
                </div>
              ) : null}
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
            <DriverAssignments />
          )}

          {activeTab === 'ratings' && (
            <UserRatings />
          )}

          {activeTab === 'rewards' && (
            <UserRewards />
          )}

          {activeTab === 'scoring' && (
            <UserScoring />
          )}
        </div>
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

