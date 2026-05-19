import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Truck, Wifi, AlertTriangle, Shield, Navigation, Activity, Target, TrendingUp, Loader2, CheckCircle, X, MessageCircle, MessageSquare, User } from 'lucide-react';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackingWebSocket } from '../services/websocket';
import type { ShipmentUpdate } from '../services/websocket';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import receiverService from '../services/receiverService';
import { brokerAPI } from '../services/brokerApi';
import { cn } from '@/utils/cn';
import { CircularStatCard } from '@/components/EnliteUI/Cards/StatCard';

interface Shipment {
  id: string;
  cargoId: string;
  cargoTitle: string;
  status: 'IN_TRANSIT' | 'PICKED_UP' | 'DELIVERED' | 'DELAYED';
  pickupLocation: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  driver: {
    name: string;
    phone: string;
    photo?: string;
  };
  vehicle: {
    plateNumber: string;
    type: string;
  };
  estimatedDelivery: string;
  actualPickup?: string;
  actualDelivery?: string;
  progress: number; // 0-100
  milestones?: {
    type: 'PICKUP' | 'IN_TRANSIT' | 'CHECKPOINT' | 'DELIVERY';
    location: string;
    timestamp?: string;
    status: 'COMPLETED' | 'CURRENT' | 'PENDING';
  }[];
  etaConfidence?: number; // 0-100
  delayReason?: string;
  distanceRemaining?: number;
}

const Tracking: React.FC = () => {
  const { tSync } = useTranslation();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [messages, setMessages] = useState<{ id: string, sender: 'me' | 'driver', text: string, timestamp: Date }[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  // Initialize WebSocket connection (only if enabled)
  useEffect(() => {
    // Check if WebSocket is enabled before attempting connection
    if (!trackingWebSocket.isEnabled()) {
      // WebSocket is disabled, skip connection
      setWsConnected(false);
      setWsError('Real-time updates disabled');
      return;
    }

    const initializeWebSocket = async () => {
      try {
        await trackingWebSocket.connect();
        setWsConnected(trackingWebSocket.getConnectionStatus());
        setWsError(null);
      } catch (error) {
        // Silently handle connection failures - don't log errors
        setWsError('Real-time updates unavailable');
        setWsConnected(false);
      }
    };

    initializeWebSocket();

    // Cleanup on unmount - safely disconnect
    return () => {
      trackingWebSocket.disconnect();
    };
  }, []);

  // Handle WebSocket updates
  const handleShipmentUpdate = useCallback((update: ShipmentUpdate) => {
    // Update last update timestamp
    // setLastUpdate(new Date()); // Unused at the moment, keeping commented if needed later

    // Show update notification
    setShowUpdateNotification(true);
    setTimeout(() => setShowUpdateNotification(false), 3000);

    setShipments((prevShipments: Shipment[]) => {
      return prevShipments.map((shipment: Shipment) => {
        if (shipment.id === update.shipmentId) {
          const updatedShipment = { ...shipment };

          switch (update.type) {
            case 'LOCATION_UPDATE':
              if (update.data.currentLocation) {
                updatedShipment.currentLocation = update.data.currentLocation;
              }
              break;
            case 'STATUS_UPDATE':
              if (update.data.status) {
                updatedShipment.status = update.data.status as any;
              }
              break;
            case 'PROGRESS_UPDATE':
              if (update.data.progress !== undefined) {
                updatedShipment.progress = update.data.progress;
              }
              break;
            case 'DELIVERY_UPDATE':
              if (update.data.actualDelivery) {
                updatedShipment.actualDelivery = update.data.actualDelivery;
              }
              if (update.data.actualPickup) {
                updatedShipment.actualPickup = update.data.actualPickup;
              }
              break;
          }

          return updatedShipment;
        }
        return shipment;
      });
    });
  }, []);

  // Subscribe to WebSocket updates for each shipment
  useEffect(() => {
    if (wsConnected && shipments.length > 0) {
      // Clean up previous subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current.clear();

      // Subscribe to updates for each shipment
      shipments.forEach(shipment => {
        const unsubscribe = trackingWebSocket.subscribe(shipment.id, handleShipmentUpdate);
        unsubscribeRefs.current.set(shipment.id, unsubscribe);
      });
    }

    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current.clear();
    };
  }, [wsConnected, shipments, handleShipmentUpdate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (user?.role === 'CARGO_RECEIVER') {
          const myCargos = await receiverService.getMyCargos();
          const activeCargos = myCargos.filter((c: any) => c.status === 'IN_TRANSIT' || c.status === 'ASSIGNED' || c.status === 'PICKED_UP');

          const mappedShipments: Shipment[] = activeCargos.map((c: any) => ({
            id: c.id,
            cargoId: c.id.substring(0, 8).toUpperCase(),
            cargoTitle: c.cargoType || 'My Shipment',
            status: (c.status === 'ASSIGNED' ? 'PICKED_UP' : c.status) as any,
            pickupLocation: {
              name: c.pickupLocation || 'Pickup Point',
              address: c.pickupLocation || '',
              latitude: -1.2921,
              longitude: 36.8219,
            },
            deliveryLocation: {
              name: c.deliveryLocation || 'Delivery Point',
              address: c.deliveryLocation || '',
              latitude: -4.0435,
              longitude: 39.6682,
            },
            currentLocation: {
              latitude: -2.5,
              longitude: 38.0,
              timestamp: new Date().toISOString(),
            },
            driver: {
              name: c.assignedTruck?.driverName || 'Assigned Driver',
              phone: c.assignedTruck?.driverPhone || '',
            },
            vehicle: {
              plateNumber: c.assignedTruck?.plateNumber || 'Truck',
              type: c.assignedTruck?.model || 'Truck',
            },
            estimatedDelivery: c.deliveryDate || new Date().toISOString(),
            progress: 50,
            etaConfidence: 85,
            distanceRemaining: 120
          }));

          setShipments(mappedShipments);
        } else if (user?.role === 'BROKER') {
          // Fetch real broker loads
          const brokerLoadsResponse = await brokerAPI.getBrokerLoads(user.id);
          const brokerLoads = brokerLoadsResponse.data || [];
          
          // Filter for active tracking (in transit, etc.)
          const activeLoads = brokerLoads.filter((l: any) => 
            l.status === 'IN_TRANSIT' || l.status === 'PICKED_UP' || l.status === 'ON_ROUTE'
          );

          const mappedShipments: Shipment[] = activeLoads.map((l: any) => ({
            id: l.id,
            cargoId: l.id.substring(0, 8).toUpperCase(),
            cargoTitle: l.title || 'Load',
            status: l.status as any,
            pickupLocation: {
              name: l.pickupLocation || 'Pickup',
              address: l.pickupLocation || '',
              latitude: -1.2921,
              longitude: 36.8219,
            },
            deliveryLocation: {
              name: l.deliveryLocation || 'Delivery',
              address: l.deliveryLocation || '',
              latitude: -4.0435,
              longitude: 39.6682,
            },
            currentLocation: {
              latitude: l.currentLocation?.latitude || -1.5,
              longitude: l.currentLocation?.longitude || 36.5,
              timestamp: new Date().toISOString(),
            },
            driver: {
              name: l.driverName || 'Truck Driver',
              phone: l.driverPhone || '',
            },
            vehicle: {
              plateNumber: l.plateNumber || 'T123',
              type: l.vehicleType || 'Truck',
            },
            estimatedDelivery: l.deliveryDate || new Date().toISOString(),
            progress: l.progress || 50,
            etaConfidence: 90,
            distanceRemaining: 150
          }));

          setShipments(mappedShipments);
        } else if (user?.role === 'CARGO_OWNER') {
          // Fetch real trips for cargo owner from /trips endpoint
          try {
            const { default: api } = await import('../services/api');
            const res = await api.get('/trips', { params: { limit: 50, page: 1 } });
            const body = res.data;
            const allTrips: any[] = Array.isArray(body?.data?.trips)
              ? body.data.trips
              : Array.isArray(body?.trips)
                ? body.trips
                : Array.isArray(body?.data)
                  ? body.data
                  : [];

            // Filter to active trips only
            const activeTrips = allTrips.filter((t: any) =>
              ['PLANNED', 'IN_PROGRESS', 'DELAYED'].includes(t.status)
            );

            const mapped: Shipment[] = activeTrips.map((trip: any) => {
              const load = trip.load || {};
              const truck = trip.truck || {};
              const driver = trip.driver || {};
              const pickup = load.origin || load.pickupLocation || {};
              const delivery = load.destination || load.deliveryLocation || {};

              // Calculate progress based on status
              const progress = trip.status === 'IN_PROGRESS' ? 50
                : trip.status === 'COMPLETED' ? 100
                : trip.status === 'PLANNED' ? 0 : 30;

              return {
                id: trip.id,
                cargoId: trip.tripNumber || trip.id.slice(0, 8).toUpperCase(),
                cargoTitle: load.title || `Trip ${trip.tripNumber || trip.id.slice(0, 8)}`,
                status: trip.status === 'IN_PROGRESS' ? 'IN_TRANSIT'
                  : trip.status === 'PLANNED' ? 'PICKED_UP'
                  : trip.status as any,
                pickupLocation: {
                  name: pickup.city || pickup.name || pickup.address || 'Pickup',
                  address: pickup.address || pickup.city || '',
                  latitude: pickup.lat || pickup.latitude || -1.2921,
                  longitude: pickup.lng || pickup.longitude || 36.8219,
                },
                deliveryLocation: {
                  name: delivery.city || delivery.name || delivery.address || 'Delivery',
                  address: delivery.address || delivery.city || '',
                  latitude: delivery.lat || delivery.latitude || -4.0435,
                  longitude: delivery.lng || delivery.longitude || 39.6682,
                },
                currentLocation: {
                  latitude: -2.5,
                  longitude: 38.0,
                  timestamp: trip.updatedAt || new Date().toISOString(),
                },
                driver: {
                  name: driver.firstName ? `${driver.firstName} ${driver.lastName || ''}`.trim() : 'Assigned Driver',
                  phone: driver.phone || driver.phoneNumber || '',
                },
                vehicle: {
                  plateNumber: truck.plateNumber || '—',
                  type: truck.truckType || truck.model || 'Truck',
                },
                estimatedDelivery: trip.plannedEndTime || trip.estimatedEndTime || new Date().toISOString(),
                actualPickup: trip.actualStartTime,
                progress,
                milestones: [
                  { type: 'PICKUP' as const, location: pickup.city || 'Pickup', timestamp: trip.actualStartTime, status: trip.actualStartTime ? 'COMPLETED' as const : 'PENDING' as const },
                  { type: 'IN_TRANSIT' as const, location: 'En Route', timestamp: undefined, status: trip.status === 'IN_PROGRESS' ? 'CURRENT' as const : trip.status === 'COMPLETED' ? 'COMPLETED' as const : 'PENDING' as const },
                  { type: 'DELIVERY' as const, location: delivery.city || 'Delivery', timestamp: trip.actualEndTime, status: trip.actualEndTime ? 'COMPLETED' as const : 'PENDING' as const },
                ],
                etaConfidence: 85,
                distanceRemaining: trip.distance ? Math.round(Number(trip.distance) * 0.4) : undefined,
              };
            });

            setShipments(mapped);
          } catch {
            setShipments([]);
          }
        } else {
          // Default dummy data for non-receivers
          setShipments([
            {
              id: '1',
              cargoId: 'CARGO-001',
              cargoTitle: 'Electronics Shipment',
              status: 'IN_TRANSIT',
              pickupLocation: {
                name: 'Nairobi Warehouse',
                address: '123 Industrial Area, Nairobi',
                latitude: -1.2921,
                longitude: 36.8219,
              },
              deliveryLocation: {
                name: 'Mombasa Port',
                address: '456 Port Road, Mombasa',
                latitude: -4.0435,
                longitude: 39.6682,
              },
              currentLocation: {
                latitude: -2.5,
                longitude: 38.0,
                timestamp: new Date().toISOString(),
              },
              driver: {
                name: 'John Kamau',
                phone: '+254700123456',
              },
              vehicle: {
                plateNumber: 'KCA 123A',
                type: 'Flatbed Truck',
              },
              estimatedDelivery: '2024-01-20T14:00:00Z',
              actualPickup: '2024-01-18T08:30:00Z',
              progress: 65,
              milestones: [
                { type: 'PICKUP', location: 'Nairobi Warehouse', timestamp: '2024-01-18T08:30:00Z', status: 'COMPLETED' },
                { type: 'CHECKPOINT', location: 'Machakos Junction', timestamp: '2024-01-18T11:00:00Z', status: 'COMPLETED' },
                { type: 'CHECKPOINT', location: 'Voi Checkpoint', timestamp: undefined, status: 'CURRENT' },
                { type: 'DELIVERY', location: 'Mombasa Port', timestamp: undefined, status: 'PENDING' },
              ],
              etaConfidence: 88,
              distanceRemaining: 180,
            },
            {
              id: '2',
              cargoId: 'CARGO-002',
              cargoTitle: 'Agricultural Products',
              status: 'PICKED_UP',
              pickupLocation: {
                name: 'Kisumu Farm',
                address: '789 Farm Road, Kisumu',
                latitude: -0.0917,
                longitude: 34.7680,
              },
              deliveryLocation: {
                name: 'Nairobi Market',
                address: '321 Market Street, Nairobi',
                latitude: -1.2921,
                longitude: 36.8219,
              },
              currentLocation: {
                latitude: -0.5,
                longitude: 36.0,
                timestamp: new Date().toISOString(),
              },
              driver: {
                name: 'Mary Wanjiku',
                phone: '+254700654321',
              },
              vehicle: {
                plateNumber: 'KCA 456B',
                type: 'Refrigerated Truck',
              },
              estimatedDelivery: '2024-01-19T16:00:00Z',
              actualPickup: '2024-01-18T10:15:00Z',
              progress: 35,
              milestones: [
                { type: 'PICKUP', location: 'Kisumu Farm', timestamp: '2024-01-18T10:15:00Z', status: 'COMPLETED' },
                { type: 'CHECKPOINT', location: 'Kericho Stop', timestamp: undefined, status: 'CURRENT' },
                { type: 'DELIVERY', location: 'Nairobi Market', timestamp: undefined, status: 'PENDING' },
              ],
              etaConfidence: 92,
              distanceRemaining: 245,
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading tracking data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // const getStatusColor = (status: string) => { // Removed as unused in new UI
  //   switch (status) {
  //     case 'IN_TRANSIT':
  //       return 'text-blue-600 bg-blue-100';
  //     case 'PICKED_UP':
  //       return 'text-yellow-600 bg-yellow-100';
  //     case 'DELIVERED':
  //       return 'text-green-600 bg-green-100';
  //     case 'DELAYED':
  //       return 'text-red-600 bg-red-100';
  //     default:
  //       return 'text-gray-600 bg-gray-100';
  //   }
  // };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return tSync('In Transit');
      case 'PICKED_UP':
        return tSync('Picked Up');
      case 'DELIVERED':
        return tSync('Delivered');
      case 'DELAYED':
        return tSync('Delayed');
      default:
        return tSync(status);
    }
  };

  const createCustomIcon = (color: string) => new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-[#345E85]" size={32} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Info...</p>
      </div>
    );
  }

  const activeCount = shipments.filter((s: Shipment) => s.status !== 'DELIVERED').length;
  const deliveryCount = shipments.filter((s: Shipment) => s.status === 'DELIVERED').length;
  const onTimeRate = shipments.length > 0 ? Math.round((shipments.filter((s: Shipment) => s.status !== 'DELAYED').length / shipments.length) * 100) : 100;

  return (
    <div className="space-y-12">
      {/* Search & Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 place-items-center bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
        <CircularStatCard
          title="Active Tracking"
          value={activeCount}
          icon={Activity}
          colorClass="bg-blue-50 text-[#345E85]"
          secondaryColor="text-[#345E85]"
        />
        <CircularStatCard
          title="Delivered"
          value={deliveryCount}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
        <CircularStatCard
          title="On-time Rate"
          value={`${onTimeRate}%`}
          icon={Shield}
          colorClass="bg-amber-50 text-amber-600"
          secondaryColor="text-amber-600"
        />
        <CircularStatCard
          title="Avg Speed"
          value="42 KM/H"
          icon={TrendingUp}
          colorClass="bg-purple-50 text-purple-600"
          secondaryColor="text-purple-600"
        />
      </div>

      {/* Header with WebSocket Status */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${wsConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            <Wifi size={20} className={wsConnected ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest">Live Updates</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {wsConnected ? 'Live tracking active' : 'Connecting...'}
            </p>
          </div>
        </div>

        {wsError && (
          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={async () => {
              try {
                setWsError(null);
                await trackingWebSocket.connect();
                setWsConnected(true);
              } catch (error) {
                setWsError('Reconnection failed');
              }
            }}>
            <AlertTriangle size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Try Reconnecting</span>
          </div>
        )}
      </div>

      {/* Real-time Update Notification */}
      {showUpdateNotification && wsConnected && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">
                Real-time updates received
              </p>
            </div>
            <button onClick={() => setShowUpdateNotification(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipment List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Shipments</h5>
            <div className="px-3 py-1 bg-slate-100 rounded-full">
              <span className="text-[10px] font-black text-slate-900">{shipments.length} UNITS</span>
            </div>
          </div>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {shipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="size-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                  <Truck className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">No active shipments</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Trips will appear here once started</p>
              </div>
            ) : shipments.map((shipment) => (
              <div
                key={shipment.id}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all cursor-pointer group",
                  selectedShipment?.id === shipment.id
                    ? "bg-[#345E85] border-[#345E85] text-white shadow-xl shadow-blue-900/20"
                    : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                )}
                onClick={() => setSelectedShipment(shipment)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className={cn("text-sm font-black truncate tracking-tight", selectedShipment?.id === shipment.id ? "text-white" : "text-[#0f172a]")}>
                      {shipment.cargoTitle}
                    </h3>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", selectedShipment?.id === shipment.id ? "text-blue-200" : "text-slate-400")}>
                      #{shipment.cargoId}
                    </p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                    selectedShipment?.id === shipment.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {getStatusText(shipment.status)}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", selectedShipment?.id === shipment.id ? "bg-white/10" : "bg-slate-50")}>
                      <Truck size={12} className={selectedShipment?.id === shipment.id ? "text-white" : "text-[#345E85]"} />
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-tight", selectedShipment?.id === shipment.id ? "text-blue-50" : "text-slate-600")}>
                      {shipment.vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", selectedShipment?.id === shipment.id ? "bg-white/10" : "bg-slate-50")}>
                      <User size={12} className={selectedShipment?.id === shipment.id ? "text-white" : "text-[#345E85]"} />
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-tight", selectedShipment?.id === shipment.id ? "text-blue-50" : "text-slate-600")}>
                      {shipment.driver.name}
                    </span>
                  </div>
                </div>

                {/* Simplified Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedShipment?.id === shipment.id ? "text-white" : "text-slate-400")}>Progress</span>
                    <span className={cn("text-xs font-black", selectedShipment?.id === shipment.id ? "text-white" : "text-[#0f172a]")}>{shipment.progress}%</span>
                  </div>
                  <div className={cn("w-full h-1.5 rounded-full overflow-hidden", selectedShipment?.id === shipment.id ? "bg-white/20" : "bg-slate-100")}>
                    <div
                      className={cn("h-full transition-all duration-700", selectedShipment?.id === shipment.id ? "bg-white" : "bg-[#345E85]")}
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Map */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 text-[#345E85] rounded-xl flex items-center justify-center border border-slate-100">
                  <Navigation size={18} />
                </div>
                <h2 className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em]">Tracking Map</h2>
              </div>
              {selectedShipment && (
                <div className="px-4 py-2 bg-blue-50 text-[#345E85] rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  Tracking ID: {selectedShipment.cargoId}
                </div>
              )}
            </div>

            <div className="h-[400px] rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner relative z-0">
              <MapContainer
                center={[-1.2921, 36.8219]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Pickup and Delivery Markers */}
                {selectedShipment && (
                  <>
                    <Marker
                      position={[selectedShipment.pickupLocation.latitude, selectedShipment.pickupLocation.longitude]}
                      icon={createCustomIcon('#10B981')}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Pickup Location</h3>
                          <p className="text-[10px] font-bold text-slate-600">{selectedShipment.pickupLocation.address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    <Marker
                      position={[selectedShipment.deliveryLocation.latitude, selectedShipment.deliveryLocation.longitude]}
                      icon={createCustomIcon('#EF4444')}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">Delivery Location</h3>
                          <p className="text-[10px] font-bold text-slate-600">{selectedShipment.deliveryLocation.address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    <Marker
                      position={[selectedShipment.currentLocation.latitude, selectedShipment.currentLocation.longitude]}
                      icon={createCustomIcon('#3B82F6')}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">Current Location</h3>
                          <p className="text-[10px] font-bold text-slate-600">Updated: {new Date(selectedShipment.currentLocation.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Shipment Details - Intelligence Report Style */}
          {selectedShipment && (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />

              <div className="relative">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 text-[#345E85] rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                      <Shield size={20} />
                    </div>
                    <h2 className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em]">Shipment Details</h2>
                  </div>
                  {wsConnected && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      Live Tracking
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">General Info</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shipment ID</span>
                        <span className="text-[10px] font-black text-[#0f172a]">{selectedShipment.cargoId}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</span>
                        <span className="text-[10px] font-black text-[#0f172a] truncate ml-4">{selectedShipment.cargoTitle}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ETA</span>
                        <span className="text-[10px] font-black text-[#0f172a]">{new Date(selectedShipment.estimatedDelivery).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-[#345E85]/5 rounded-[2rem] border border-[#345E85]/10">
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-[#345E85]" />
                          <span className="text-[9px] font-black text-[#345E85] uppercase tracking-widest">ETA Confidence</span>
                        </div>
                        <span className="text-sm font-black text-[#345E85]">{selectedShipment.etaConfidence || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tracking Events</h3>
                    <div className="relative pl-6 space-y-6">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                      {selectedShipment.milestones?.map((milestone, index) => (
                        <div key={index} className="relative flex items-center gap-4">
                          <div className={cn(
                            "absolute -left-[30px] w-4 h-4 rounded-full border-4 border-white z-10",
                            milestone.status === 'COMPLETED' ? "bg-emerald-500" :
                              milestone.status === 'CURRENT' ? "bg-blue-500 animate-pulse" : "bg-slate-200"
                          )} />
                          <div className="flex-1">
                            <p className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              milestone.status === 'PENDING' ? "text-slate-400" : "text-[#0f172a]"
                            )}>
                              {milestone.location}
                            </p>
                            {milestone.timestamp && (
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(milestone.timestamp).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tracking Action Hub */}
                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      <User size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">{selectedShipment.driver.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Driver</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMessaging(!showMessaging)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#345E85] transition-all shadow-lg flex items-center gap-2"
                  >
                    <Activity size={14} />
                    Message Driver
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMessaging && selectedShipment && (
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm mt-8 animate-in slide-in-from-bottom-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 text-[#345E85] rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                    <MessageCircle size={20} />
                  </div>
                  <h3 className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em]">Chat with: {selectedShipment.driver.name}</h3>
                </div>
                <button onClick={() => setShowMessaging(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="h-64 overflow-y-auto mb-6 space-y-4 bg-slate-50 rounded-[2rem] p-6 border border-slate-100 shadow-inner">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                    <MessageSquare size={24} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No messages yet...</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={cn(
                        "max-w-[70%] px-5 py-3 rounded-[1.5rem] shadow-sm",
                        msg.sender === 'me' ? "bg-slate-900 text-white rounded-br-none" : "bg-white border border-slate-100 text-[#0f172a] rounded-bl-none"
                      )}>
                        <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                        <p className={cn(
                          "text-[8px] font-black uppercase tracking-widest mt-2",
                          msg.sender === 'me' ? "text-slate-400" : "text-slate-400"
                        )}>
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && messageInput.trim()) {
                      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text: messageInput, timestamp: new Date() }]);
                      setMessageInput('');
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-[#345E85] transition-all"
                />
                <button
                  onClick={() => {
                    if (messageInput.trim()) {
                      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text: messageInput, timestamp: new Date() }]);
                      setMessageInput('');
                    }
                  }}
                  className="px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracking;