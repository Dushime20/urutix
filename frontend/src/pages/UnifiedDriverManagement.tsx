import React, { useState, useEffect, useCallback } from 'react';
import { FaUser, FaPlus, FaList, FaUserCheck, FaSpinner, FaThumbsUp, FaGift, FaChartLine } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fleetApi } from '../services/fleetApi';
import FleetFormStepper from '../components/FleetDashboard/FleetFormStepper';
import { DriversList } from '../components/FleetDashboard/DriversList';
import { DriverAssignments } from '../components/FleetDashboard/DriverAssignments';
import UserRatings from './UserRatings';
import UserRewards from './UserRewards';
import UserScoring from './UserScoring';
import type { Driver } from '../services/fleetApi';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

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

  const handleCreateDriver = () => {
    setEditingDriver(null);
    setShowDriverForm(true);
    setActiveTab('add-driver');
  };

  const handleEditDriver = useCallback((driver: Driver) => {
    setEditingDriver(driver);
    setShowDriverForm(true);
    setActiveTab('add-driver');
  }, []);

  const handleDriverFormClose = () => {
    setShowDriverForm(false);
    setEditingDriver(null);
    if (activeTab === 'my-drivers') {
      loadDrivers();
    }
  };

  const handleDriverFormSubmit = async (data: any) => {
    try {
      if (editingDriver) {
        await fleetApi.updateDriver(editingDriver.id, data);
        toast.success('Driver updated successfully!');
      } else {
        await fleetApi.createDriver(data);
        toast.success('Driver added successfully!');
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
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="mb-2">My Drivers</h1>
        <p className="text-sm text-gray-600">Manage your drivers, add new drivers, and assign them to trucks.</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => {
            setActiveTab('add-driver');
            navigate('/dashboard/fleet/drivers/create');
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'add-driver'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === 'add-driver'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaPlus className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'add-driver' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Add Driver
          </h3>
          {activeTab === 'add-driver' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('my-drivers');
            navigate('/dashboard/fleet/drivers');
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'my-drivers'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === 'my-drivers'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaList className="w-4 h-4" />
            </div>
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-full",
                activeTab === 'my-drivers'
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-700 group-hover:bg-primary-600 group-hover:text-white"
              )}
            >
              {drivers.length}
            </span>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'my-drivers' ? "text-primary-900" : "text-gray-900"
            )}
          >
            My Drivers
          </h3>
          {activeTab === 'my-drivers' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('assignments');
            navigate('/dashboard/fleet/assignments');
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'assignments'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === 'assignments'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaUserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'assignments' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Driver Assignments
          </h3>
          {activeTab === 'assignments' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('ratings');
            navigate('/dashboard/fleet/ratings');
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'ratings'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === 'ratings'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'ratings' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Driver Ratings
          </h3>
          {activeTab === 'ratings' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('rewards');
            navigate('/dashboard/fleet/rewards');
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'rewards'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === 'rewards'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaGift className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'rewards' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Rewards
          </h3>
          {activeTab === 'rewards' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('scoring');
            navigate('/dashboard/fleet/scoring');
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'scoring'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                activeTab === 'scoring'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaChartLine className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'scoring' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Credit Scoring
          </h3>
          {activeTab === 'scoring' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Content */}
        <div className="p-6">
        {activeTab === 'add-driver' && (
          <div>
            {!showDriverForm ? (
              <div className="text-center py-12">
                <FaUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="mb-2">Add New Driver</h3>
                <p className="text-gray-600 mb-6">Click the button below to start adding a new driver to your fleet</p>
                <button
                  onClick={handleCreateDriver}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Driver
                </button>
              </div>
            ) : null}
            <FleetFormStepper
              isOpen={showDriverForm}
              onClose={handleDriverFormClose}
              onSubmit={handleDriverFormSubmit}
              initialData={editingDriver}
              mode={editingDriver ? 'edit' : 'create'}
              activeTab="drivers"
            />
          </div>
        )}

        {activeTab === 'my-drivers' && (
          <DriversList onAddDriver={handleCreateDriver} />
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
          initialData={editingDriver}
          mode={editingDriver ? 'edit' : 'create'}
          activeTab="drivers"
        />
      )}
    </div>
  );
};

export default UnifiedDriverManagement;

