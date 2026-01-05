import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FaTruck, FaMapMarkedAlt, FaClock, FaBox, FaUser, FaPhone, FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import { trackingWebSocket } from '../services/websocket';
import type { ShipmentUpdate } from '../services/websocket';
import { TranslatedText } from '../components/translated-text';
import { useTranslation } from '../hooks/useTranslation';

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
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
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
    setLastUpdate(new Date());

    // Show update notification
    setShowUpdateNotification(true);
    setTimeout(() => setShowUpdateNotification(false), 3000);

    setShipments(prevShipments => {
      return prevShipments.map(shipment => {
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
    // Simulate loading shipments
    setTimeout(() => {
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
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return 'text-blue-600 bg-blue-100';
      case 'PICKED_UP':
        return 'text-yellow-600 bg-yellow-100';
      case 'DELIVERED':
        return 'text-green-600 bg-green-100';
      case 'DELAYED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with WebSocket Status */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-1.5">
                <FaMapMarkedAlt className="text-white" size={16} />
              </div>
              <TranslatedText text="Live Tracking" />
            </h1>
            <p className="text-xs text-gray-600">
              <TranslatedText text="Track your shipments in real-time" />
            </p>
          </div>

          {/* WebSocket Connection Status */}
          <div className="flex items-center space-x-2">
            {wsError && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg border border-red-200">
                <FaExclamationTriangle className="w-3.5 h-3.5" />
                <span className="text-xs">{wsError}</span>
                <button
                  onClick={async () => {
                    try {
                      setWsError(null);
                      await trackingWebSocket.connect();
                      setWsConnected(true);
                    } catch (error) {
                      setWsError('Reconnection failed');
                    }
                  }}
                  className="ml-1.5 px-2 py-0.5 bg-red-200 hover:bg-red-300 rounded text-xs font-medium"
                >
                  <TranslatedText text="Retry" />
                </button>
              </div>
            )}

            <div className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${wsConnected
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
              }`}>
              <FaWifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-green-600' : 'text-yellow-600'}`} />
              <span>
                {wsConnected ? <TranslatedText text="Live Updates" /> : <TranslatedText text="Connecting..." />}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Update Notification */}
      {showUpdateNotification && wsConnected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-800">
                <TranslatedText text="Real-time update received" />
              </p>
              <p className="text-xs text-blue-600">
                <TranslatedText text="Last updated" />: {lastUpdate?.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => setShowUpdateNotification(false)}
              className="text-blue-400 hover:text-blue-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipment List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                <TranslatedText text="Active Shipments" />
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {shipments.length} <TranslatedText text="shipments in transit" />
              </p>
            </div>
            <div className="p-3 space-y-3">
              {shipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedShipment?.id === shipment.id
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => setSelectedShipment(shipment)}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{shipment.cargoTitle}</h3>
                        <p className="text-xs text-gray-600">#{shipment.cargoId}</p>
                      </div>
                      {/* Real-time update indicator */}
                      {wsConnected && (
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">
                            <TranslatedText text="LIVE" />
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(shipment.status)}`}>
                      {getStatusText(shipment.status)}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-2.5">
                    <div className="flex items-center text-xs text-gray-600">
                      <FaTruck className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{shipment.vehicle.plateNumber}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <FaUser className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{shipment.driver.name}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <FaClock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span className="truncate">
                        <TranslatedText text="ETA" />: {new Date(shipment.estimatedDelivery).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span><TranslatedText text="Progress" /></span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium">{shipment.progress}%</span>
                        {wsConnected && (
                          <div className="flex items-center space-x-1">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 text-xs">
                              <TranslatedText text="Live" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${shipment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map and Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              <TranslatedText text="Live Map" />
            </h2>
            <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
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
                        <div>
                          <h3 className="font-medium">
                            <TranslatedText text="Pickup Location" />
                          </h3>
                          <p className="text-sm">{selectedShipment.pickupLocation.name}</p>
                          <p className="text-xs text-gray-600">{selectedShipment.pickupLocation.address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    <Marker
                      position={[selectedShipment.deliveryLocation.latitude, selectedShipment.deliveryLocation.longitude]}
                      icon={createCustomIcon('#EF4444')}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-medium">
                            <TranslatedText text="Delivery Location" />
                          </h3>
                          <p className="text-sm">{selectedShipment.deliveryLocation.name}</p>
                          <p className="text-xs text-gray-600">{selectedShipment.deliveryLocation.address}</p>
                        </div>
                      </Popup>
                    </Marker>

                    <Marker
                      position={[selectedShipment.currentLocation.latitude, selectedShipment.currentLocation.longitude]}
                      icon={createCustomIcon('#3B82F6')}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-medium">
                            <TranslatedText text="Current Location" />
                          </h3>
                          <p className="text-sm">
                            <TranslatedText text="Driver" />: {selectedShipment.driver.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            <TranslatedText text="Updated" />: {new Date(selectedShipment.currentLocation.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
              </MapContainer>
            </div>
          </div>

          {/* Shipment Details */}
          {selectedShipment && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  <TranslatedText text="Shipment Details" />
                </h2>
                {wsConnected && (
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">
                      <TranslatedText text="Live Tracking" />
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">
                    <TranslatedText text="Cargo Information" />
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        <TranslatedText text="Cargo ID" />:
                      </span>
                      <span className="text-xs font-medium">{selectedShipment.cargoId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        <TranslatedText text="Title" />:
                      </span>
                      <span className="text-xs font-medium truncate ml-2">{selectedShipment.cargoTitle}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        <TranslatedText text="Status" />:
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(selectedShipment.status)}`}>
                        {getStatusText(selectedShipment.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        <TranslatedText text="Progress" />:
                      </span>
                      <span className="text-xs font-medium">{selectedShipment.progress}%</span>
                    </div>
                    {selectedShipment.etaConfidence && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          <TranslatedText text="ETA Confidence" />:
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedShipment.etaConfidence >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {selectedShipment.etaConfidence}%
                        </span>
                      </div>
                    )}
                    {selectedShipment.distanceRemaining && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          <TranslatedText text="Distance Remaining" />:
                        </span>
                        <span className="text-xs font-medium">{selectedShipment.distanceRemaining} km</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">
                    <TranslatedText text="Milestones" />
                  </h3>
                  <div className="space-y-2">
                    {selectedShipment.milestones?.map((milestone, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${milestone.status === 'COMPLETED' ? 'bg-green-500' :
                            milestone.status === 'CURRENT' ? 'bg-blue-500' :
                              'bg-gray-300'
                          }`}>
                          {milestone.status === 'COMPLETED' ? (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : milestone.status === 'CURRENT' ? (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${milestone.status === 'PENDING' ? 'text-gray-500' : 'text-gray-900'}`}>
                            {milestone.location}
                          </p>
                          {milestone.timestamp && (
                            <p className="text-[10px] text-gray-500">{new Date(milestone.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messaging Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowMessaging(!showMessaging)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  Message Driver
                </button>
              </div>
            </div>
          )}

          {/* Messaging Panel */}
          {showMessaging && selectedShipment && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Chat with {selectedShipment.driver.name}</h3>
                <button onClick={() => setShowMessaging(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="h-64 overflow-y-auto mb-3 space-y-2 bg-gray-50 rounded-lg p-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">No messages yet. Say hello!</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${msg.sender === 'me' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'
                        }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    if (messageInput.trim()) {
                      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'me', text: messageInput, timestamp: new Date() }]);
                      setMessageInput('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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