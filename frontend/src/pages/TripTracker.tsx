import React from 'react';
import { useParams } from 'react-router-dom';
import { TripTracker } from '../components/TripTracker';

const TripTrackerPage: React.FC = () => {
  const { tripId } = useParams();
  if (!tripId) return <div className="p-4">Trip ID not specified.</div>;
  return <TripTracker tripId={tripId} />;
};

export default TripTrackerPage;
