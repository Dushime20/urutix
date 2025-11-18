import axios from 'axios';


export const getTripData = async (tripId: string) => {
  const res = await axios.get(`/api/trips/${tripId}`);
  // Backend returns { success, message, data, statusCode, timestamp }
  // TripTracker expects trip, route, driverLocation, eta, etc. in data
  const trip = res.data?.data;
  // If backend does not provide route, driverLocation, eta, set as null
  return {
    trip,
    route: trip?.route || null,
    driverLocation: trip?.driverLocation || null,
    eta: trip?.eta || null,
  };
};

export const subscribeTripUpdates = (tripId: string, onUpdate: (update: any) => void) => {
  // Example using WebSocket for real-time updates
  const ws = new WebSocket(`ws://localhost:4000/trip-updates/${tripId}`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onUpdate(data);
  };
  return () => ws.close();
};
