import { useState, useEffect } from 'react';
import { X, Package, MapPin, Calendar, DollarSign, Zap, Copy, Map } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadsAPI } from '@/services/load';
import toast from 'react-hot-toast';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cargoId?: string) => void;
}

interface LocationCoords {
  lat: number;
  lng: number;
  name: string;
}

const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [recentCargos, setRecentCargos] = useState<any[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'pickup' | 'delivery' | null>(null);
  const [pickupCoords, setPickupCoords] = useState<LocationCoords | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<LocationCoords | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    cargoType: 'GENERAL',
    weight: '',
    pickupLocation: '',
    deliveryLocation: '',
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    loadValue: '',
    offeredPrice: '',
  });

  // Fetch recent cargos for duplication
  useEffect(() => {
    if (isOpen) {
      const fetchRecent = async () => {
        try {
          const response = await loadsAPI.getAll({ limit: 5 });
          const cargos = Array.isArray(response.data) ? response.data : (response.data?.cargos || []);
          if (Array.isArray(cargos)) {
            // Sort by created date desc if possible, or assume API returns latest
            setRecentCargos(cargos.slice(0, 5));
          }
        } catch (error) {
          console.error('Failed to fetch recent cargos', error);
        }
      };
      fetchRecent();
    }
  }, [isOpen]);

  // Extract unique locations from recent cargos
  const recentLocations = Array.from(new Set(
    recentCargos.flatMap(c => [
      c.pickupLocation?.address || c.pickupLocation?.name,
      c.deliveryLocation?.address || c.deliveryLocation?.name
    ]).filter(Boolean)
  ));

  const handleDuplicate = (cargoId: string) => {
    const cargo = recentCargos.find(c => c.id === cargoId);
    if (cargo) {
      setFormData({
        title: `${cargo.title} (Copy)`,
        cargoType: cargo.cargoType || 'GENERAL',
        weight: cargo.weight?.toString() || '',
        pickupLocation: cargo.pickupLocation?.address || cargo.pickupLocation?.name || '',
        deliveryLocation: cargo.deliveryLocation?.address || cargo.deliveryLocation?.name || '',
        pickupDate: new Date().toISOString().split('T')[0], // Reset dates to today/tomorrow
        deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        loadValue: cargo.loadValue?.toString() || '',
        offeredPrice: cargo.offeredPrice?.toString() || '',
      });
      toast.success('Details copied from recent shipment');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openMapPicker = (type: 'pickup' | 'delivery') => {
    setSelectingFor(type);
    setShowMapPicker(true);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!selectingFor) return;

    // Reverse geocode to get address (using Nominatim API)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const locationName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const coords: LocationCoords = { lat, lng, name: locationName };

      if (selectingFor === 'pickup') {
        setPickupCoords(coords);
        setFormData(prev => ({ ...prev, pickupLocation: locationName }));
        toast.success('Pickup location set!');
      } else {
        setDeliveryCoords(coords);
        setFormData(prev => ({ ...prev, deliveryLocation: locationName }));
        toast.success('Delivery location set!');
      }

      setShowMapPicker(false);
      setSelectingFor(null);
    } catch (error) {
      console.error('Geocoding error:', error);
      const locationName = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      const coords: LocationCoords = { lat, lng, name: locationName };

      if (selectingFor === 'pickup') {
        setPickupCoords(coords);
        setFormData(prev => ({ ...prev, pickupLocation: locationName }));
      } else {
        setDeliveryCoords(coords);
        setFormData(prev => ({ ...prev, deliveryLocation: locationName }));
      }

      setShowMapPicker(false);
      setSelectingFor(null);
      toast.success('Location set!');
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const createMarkerIcon = (color: string) =>
    new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
        </svg>
      `)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.pickupLocation || !formData.deliveryLocation || 
          !formData.pickupDate || !formData.deliveryDate || !formData.weight || !formData.loadValue) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create cargo with minimal data
      const cargoData = {
        title: formData.title,
        description: `Quick create: ${formData.title}`,
        cargoType: formData.cargoType,
        weight: parseFloat(formData.weight),
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        visibility: 'PUBLIC',
        unitsRequired: 1,
        locations: [
          {
            type: 'PICKUP',
            sequence: 0,
            locationData: {
              name: formData.pickupLocation,
              address: formData.pickupLocation,
              coordinates: {
                latitude: pickupCoords?.lat || 0,
                longitude: pickupCoords?.lng || 0,
              },
            },
          },
          {
            type: 'DELIVERY',
            sequence: 1,
            locationData: {
              name: formData.deliveryLocation,
              address: formData.deliveryLocation,
              coordinates: {
                latitude: deliveryCoords?.lat || 0,
                longitude: deliveryCoords?.lng || 0,
              },
            },
          },
        ],
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        loadValue: parseFloat(formData.loadValue),
        offeredPrice: formData.offeredPrice ? parseFloat(formData.offeredPrice) : 0,
        currencyCode: 'USD',
        paymentTerms: 'Net30',
        autoMatchEnabled: true,
      };

      // Create cargo and get the ID from response
      const response = await loadsAPI.create(cargoData);
      const cargoId = response.data?.id || response.data?.cargo?.id;
      
      toast.success('Cargo created successfully!');
      
      onClose();
      // Reset form
      setFormData({
        title: '',
        cargoType: 'GENERAL',
        weight: '',
        pickupLocation: '',
        deliveryLocation: '',
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        loadValue: '',
        offeredPrice: '',
      });
      setPickupCoords(null);
      setDeliveryCoords(null);
      if (onSuccess) onSuccess(cargoId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create cargo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Map Picker Modal
  if (showMapPicker) {
    return (
      <Dialog open={showMapPicker} onOpenChange={() => {
        setShowMapPicker(false);
        setSelectingFor(null);
      }}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Map className="w-5 h-5" style={{ color: '#345E85' }} />
              Select {selectingFor === 'pickup' ? 'Pickup' : 'Delivery'} Location
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-3">
              Click anywhere on the map to select the {selectingFor} location
            </p>
            <div className="h-[500px] rounded-lg overflow-hidden border border-gray-300">
              <MapContainer
                center={[0, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler />
                {pickupCoords && selectingFor === 'pickup' && (
                  <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={createMarkerIcon('#3B82F6')} />
                )}
                {deliveryCoords && selectingFor === 'delivery' && (
                  <Marker position={[deliveryCoords.lat, deliveryCoords.lng]} icon={createMarkerIcon('#10B981')} />
                )}
              </MapContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8EDF3' }}>
              <Zap className="w-4 h-4" style={{ color: '#345E85' }} />
            </div>
            Quick Create Cargo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {recentCargos.length > 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: '#E8EDF3', borderColor: '#C5D3E0', borderWidth: '1px' }}>
              <div className="flex items-center gap-2 mb-2">
                <Copy className="w-4 h-4" style={{ color: '#345E85' }} />
                <span className="text-sm font-medium" style={{ color: '#1E3A52' }}>Copy from recent</span>
              </div>
              <Select onValueChange={handleDuplicate}>
                <SelectTrigger className="w-full h-9 bg-white text-xs" style={{ borderColor: '#C5D3E0' }}>
                  <SelectValue placeholder="Select a shipment to duplicate..." />
                </SelectTrigger>
                <SelectContent>
                  {recentCargos.map(cargo => (
                    <SelectItem key={cargo.id} value={cargo.id} className="text-xs">
                      {cargo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-gray-500" />
              Cargo Title *
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Electronics shipment to New York"
              className="w-full min-h-[44px]"
            />
          </div>

          {/* Cargo Type & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cargoType" className="text-sm font-medium text-gray-700 mb-1.5">
                Cargo Type *
              </Label>
              <Select
                name="cargoType"
                value={formData.cargoType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cargoType: value }))}
              >
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="FRAGILE">Fragile</SelectItem>
                  <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                  <SelectItem value="REFRIGERATED">Refrigerated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight" className="text-sm font-medium text-gray-700 mb-1.5">
                Weight (kg) *
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="1000"
                className="w-full min-h-[44px]"
              />
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupLocation" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" style={{ color: '#345E85' }} />
                Pickup Location *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="pickupLocation"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  required
                  placeholder="City, State"
                  className="flex-1 min-h-[44px]"
                  list="recent-locations"
                />
                <button
                  type="button"
                  onClick={() => openMapPicker('pickup')}
                  className="px-3 min-h-[44px] rounded-lg transition-colors flex items-center gap-1"
                  style={{ backgroundColor: '#E8EDF3', color: '#345E85' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C5D3E0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E8EDF3'}
                  title="Select on map"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
              {pickupCoords && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Coordinates: {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="deliveryLocation" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-green-500" />
                Delivery Location *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="deliveryLocation"
                  name="deliveryLocation"
                  value={formData.deliveryLocation}
                  onChange={handleChange}
                  required
                  placeholder="City, State"
                  className="flex-1 min-h-[44px]"
                  list="recent-locations"
                />
                <button
                  type="button"
                  onClick={() => openMapPicker('delivery')}
                  className="px-3 min-h-[44px] bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors flex items-center gap-1"
                  title="Select on map"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
              {deliveryCoords && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Coordinates: {deliveryCoords.lat.toFixed(4)}, {deliveryCoords.lng.toFixed(4)}
                </p>
              )}
            </div>
            <datalist id="recent-locations">
              {recentLocations.map((loc, i) => (
                <option key={i} value={loc as string} />
              ))}
            </datalist>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupDate" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                Pickup Date *
              </Label>
              <Input
                id="pickupDate"
                name="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <Label htmlFor="deliveryDate" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                Delivery Date *
              </Label>
              <Input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={handleChange}
                required
                min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                className="w-full min-h-[44px]"
              />
            </div>
          </div>

          {/* Value & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loadValue" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-gray-500" />
                Load Value ($) *
              </Label>
              <Input
                id="loadValue"
                name="loadValue"
                type="number"
                value={formData.loadValue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="5000"
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <Label htmlFor="offeredPrice" className="text-sm font-medium text-gray-700 mb-1.5">
                Offered Price ($)
              </Label>
              <Input
                id="offeredPrice"
                name="offeredPrice"
                type="number"
                value={formData.offeredPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Optional"
                className="w-full min-h-[44px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
              style={{ backgroundColor: loading ? '#345E85' : '#345E85' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2A4D6E')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#345E85')}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Create Cargo</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can add more details later in the full cargo form
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCreateModal;

