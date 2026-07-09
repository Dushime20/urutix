import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { TacticalAiAssistant } from '../DriverDashboard/TacticalAiAssistant';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import { useNavigate } from 'react-router-dom';
import ModernLoader from '../common/ModernLoader';
import { cn } from '../../utils/cn';
import { IncidentReportModal } from '../DriverDashboard/IncidentReportModal';

const DriverLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState<string>('');
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  // Fetch driverId based on encrypted session email/userId
  const { data: currentDriverProfile } = useQuery({
    queryKey: ['driver-me', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await driverApi.getCurrentDriver();
      } catch (error) {
        console.error('Error finding driver in layout:', error);
        return null;
      }
    },
    enabled: !!user?.id && !driverId,
  });

  useEffect(() => {
    if (currentDriverProfile?.id) {
      setDriverId(currentDriverProfile.id);
    }
  }, [currentDriverProfile]);

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

  if (isLoading || !user) {
    return <ModernLoader isLoading={true} text="Initializing_Mission" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <main className="flex-1 pb-20 lg:pb-0 relative transition-all duration-500">
        <Outlet />
      </main>
      
      {/* Global AI Tactical Assistant - Persistent across all driver pages */}
      <TacticalAiAssistant 
        currentTrip={currentTrip} 
        driverName={driver?.firstName || user?.firstName} 
      />

      <IncidentReportModal 
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        driverId={driverId}
      />

      <MobileBottomNav />
      <DashboardFooter />
    </div>
  );
};

export default DriverLayout;