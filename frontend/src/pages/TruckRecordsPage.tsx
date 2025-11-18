import React from 'react';
import { useParams } from 'react-router-dom';
import { TruckRecords } from '../components/FleetDashboard/TruckRecords';

const TruckRecordsPage: React.FC = () => {
  const { truckId } = useParams<{ truckId: string }>();

  if (!truckId) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Truck ID Required</h3>
        <p className="text-gray-500">Please provide a valid truck ID to view records.</p>
      </div>
    );
  }

  return <TruckRecords truckId={truckId} />;
};

export default TruckRecordsPage; 