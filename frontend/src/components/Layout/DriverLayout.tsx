import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { TacticalAiAssistant } from '../DriverDashboard/TacticalAiAssistant';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';

const DriverLayout: React.FC = () => {
  const { user } = useAuth();
  const [driverId, setDriverId] = useState<string>('');

  // Fetch driverId based on encrypted session email/userId
  const { data: driverByUserId } = useQuery({
    queryKey: ['driver-by-user-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const drivers = await driverApi.getDrivers({ search: user.email || '' });
        const driver = drivers.find((d: any) => d.userId === user.id || d.email === user.email);
        return driver || null;
      } catch (error) {
        console.error('Error finding driver in layout:', error);
        return null;
      }
    },
    enabled: !!user?.id && !driverId,
  });

  useEffect(() => {
    if (driverByUserId?.id) {
      setDriverId(driverByUserId.id);
    }
  }, [driverByUserId]);

  // Persistent current trip fetch for AI context
  const { data: currentTrip } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
    refetchInterval: 60000, // Background refresh every 1min
  });

  // Fetch driver profile for name
  const { data: driver } = useQuery({
    queryKey: ['driver-profile', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <main className="flex-1 pb-20 lg:pb-0 relative">
        <Outlet />
      </main>
      
      {/* Global AI Tactical Assistant - Persistent across all driver pages */}
      <TacticalAiAssistant 
        currentTrip={currentTrip} 
        driverName={driver?.firstName || user?.firstName} 
      />

      <MobileBottomNav />
      <DashboardFooter />
    </div>
  );
};

export default DriverLayout;