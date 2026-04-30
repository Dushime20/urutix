import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { TacticalAiAssistant } from '../DriverDashboard/TacticalAiAssistant';
import { TacticalMissionOverlay } from '../DriverDashboard/TacticalMissionOverlay';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import { useNavigate } from 'react-router-dom';
import { PostTripChecklistModal } from '../DriverDashboard/PostTripChecklistModal';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { IncidentReportModal } from '../DriverDashboard/IncidentReportModal';

const DriverLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState<string>('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Tactical Mission Overlay - Sticky Top Bar */}
      <TacticalMissionOverlay 
        currentTrip={currentTrip} 
        onFocusMission={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onQuickAction={(action) => {
          if (action === 'refuel') navigate('/dashboard/driver/fuel');
          else if (action === 'complete') setShowCompleteModal(true);
          else if (action === 'report') setShowIncidentModal(true);
        }}
      />

      <main className={cn("flex-1 pb-20 lg:pb-0 relative transition-all duration-500", currentTrip ? "pt-24 lg:pt-28" : "")}>
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

      <PostTripChecklistModal 
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onComplete={async (data) => {
          if (!currentTrip) return;
          try {
            console.log('Completing trip with data:', data);
            await driverApi.completeTrip(currentTrip.id);
            toast.success('Mission finalized successfully!');
            setShowCompleteModal(false);
          } catch (error) {
            toast.error('Failed to finalize mission');
          }
        }}
        tripId={currentTrip?.id}
        tripNumber={currentTrip?.tripNumber}
        cargoTitle={currentTrip?.load?.title || currentTrip?.load?.cargoType}
        truckId={currentTrip?.truck?.id}
        truckPlate={currentTrip?.truck?.plateNumber}
        driverId={driverId}
        driverName={currentDriverProfile ? `${currentDriverProfile.firstName} ${currentDriverProfile.lastName}` : undefined}
        showEpod={true}
      />

      <MobileBottomNav />
      <DashboardFooter />
    </div>
  );
};

export default DriverLayout;