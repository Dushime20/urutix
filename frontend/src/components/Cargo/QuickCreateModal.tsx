import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, DollarSign, Zap, Copy, Map, TrendingUp, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadsAPI } from '@/services/load';
import toast from 'react-hot-toast';
import EnliteInput from '../EnliteUI/Forms/Input';
import EnliteSelect from '../EnliteUI/Forms/Select';
import type { ICargoBody, ICargoResponse } from '@/pages/dashboard/cargos/create/types/cargo';

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

      // Create cargo with minimal data and defaults to satisfy ICargoBody
      const cargoData: ICargoBody = {
        title: formData.title,
        description: `Quick create: ${formData.title}`,
        cargoType: formData.cargoType,
        weight: parseFloat(formData.weight),
        volume: 0,
        loadType: 'FTL',
        equipmentType: 'DRY_VAN',
        visibility: 'PUBLIC',
        unitsRequired: 1,
        locations: [
          {
            id: '',
            type: 'PICKUP',
            sequence: 1,
            status: 'PENDING',
            scheduledDate: formData.pickupDate,
            estimatedTime: 60,
            locationData: {
              name: formData.pickupLocation,
              address: formData.pickupLocation,
              coordinates: {
                latitude: pickupCoords?.lat || 0,
                longitude: pickupCoords?.lng || 0,
              },
              contactInfo: {},
              operatingHours: {},
              accessInstructions: ''
            },
            requirements: {
              requiresForklift: false,
              requiresCrane: false,
              requiresLoadingDock: false,
              hazmatCertified: false,
              temperatureControlled: false,
              securityClearance: 'STANDARD'
            }
          },
          {
            id: '',
            type: 'DELIVERY',
            sequence: 2,
            status: 'PENDING',
            scheduledDate: formData.deliveryDate,
            estimatedTime: 60,
            locationData: {
              name: formData.deliveryLocation,
              address: formData.deliveryLocation,
              coordinates: {
                latitude: deliveryCoords?.lat || 0,
                longitude: deliveryCoords?.lng || 0,
              },
              contactInfo: {},
              operatingHours: {},
              accessInstructions: ''
            },
            requirements: {
              requiresForklift: false,
              requiresCrane: false,
              requiresLoadingDock: false,
              hazmatCertified: false,
              temperatureControlled: false,
              securityClearance: 'STANDARD'
            }
          },
        ],
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        loadValue: parseFloat(formData.loadValue),
        offeredPrice: formData.offeredPrice ? parseFloat(formData.offeredPrice) : 0,
        currencyCode: 'USD',
        paymentTerms: 'Net30',
        autoMatchEnabled: true,
        isFragile: formData.cargoType === 'FRAGILE',
        isHazardous: formData.cargoType === 'HAZARDOUS',
        requiresRefrigeration: formData.cargoType === 'REFRIGERATED',
        contactInfo: {},
        matchingCriteria: {},
        length: 0,
        width: 0,
        height: 0,
        stackableHeight: 0,
        isStackable: true,
        temperatureMin: 0,
        temperatureMax: 0,
        requiresHumidityControl: false,
        requiresForklift: false,
        requiresCrane: false,
        requiresLoadingDock: false,
        loadingTimeEstimate: 60,
        unloadingTimeEstimate: 60,
        hazmatClass: '',
        hazmatNumber: '',
        urgencyLevel: 'NORMAL',
        isTimeCritical: false,
        maxTransitTime: 0,
        packagingType: 'Palletized',
        numberOfPieces: 1,
        numberOfPallets: 1,
        requiresGpsMonitoring: true,
        requiresTemperatureMonitoring: false,
        insuranceValue: parseFloat(formData.loadValue),
        requiresLowClearanceRoute: false,
        maxClearanceHeight: 0,
        requiresEscortVehicle: false,
        specialHandlingInstructions: '',
        loadingInstructions: '',
        unloadingInstructions: '',
        emergencyContactInfo: '',
        requiresPreShipmentInspection: false,
        requiresDeliveryInspection: false,
        requiresPhotographicDocumentation: false
      };

      // Create cargo and get the ID from response
      const response: ICargoResponse = await loadsAPI.create(cargoData);
      const cargoId = response.id;

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
        <DialogContent className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 transition-colors duration-300">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 transition-colors duration-300">
              <Map className="w-5 h-5" style={{ color: '#345E85' }} />
              Select {selectingFor === 'pickup' ? 'Pickup' : 'Delivery'} Location
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3 transition-colors duration-300">
              Click anywhere on the map to select the {selectingFor} location
            </p>
            <div className="h-[500px] rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700 transition-colors duration-300">
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
      <DialogContent className="w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 transition-colors duration-300">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 transition-colors duration-300">
          <DialogTitle className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight flex items-center gap-3 transition-colors duration-300">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center transition-colors duration-300">
              <Zap className="w-5 h-5 text-[#345E85] dark:text-blue-400 transition-colors duration-300" />
            </div>
            Quick Create Cargo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {recentCargos.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-4 h-4 text-[#345E85] dark:text-blue-400 transition-colors duration-300" />
                <span className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-wider transition-colors duration-300">Templates</span>
              </div>
              <Select onValueChange={handleDuplicate}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl transition-colors duration-300">
                  <SelectValue placeholder="Copy details from recent shipment..." />
                </SelectTrigger>
                <SelectContent>
                  {recentCargos.map(cargo => (
                    <SelectItem key={cargo.id} value={cargo.id} className="text-sm">
                      {cargo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <EnliteInput
              id="title"
              name="title"
              label="Cargo Title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. 500kW Industrial Generator for Mining Site"
              icon={<Package className="w-5 h-5" />}
              className="mb-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EnliteSelect
              label="Cargo Type"
              name="cargoType"
              value={formData.cargoType}
              onChange={(e) => setFormData(prev => ({ ...prev, cargoType: e.target.value }))}
              required
              options={[
                { value: 'GENERAL', label: 'General' },
                { value: 'FRAGILE', label: 'Fragile' },
                { value: 'HAZARDOUS', label: 'Hazardous' },
                { value: 'REFRIGERATED', label: 'Refrigerated' },
              ]}
            />
            <EnliteInput
              id="weight"
              name="weight"
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="1000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="pickupLocation" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors duration-300">
                  Pickup
                </Label>
                <button
                  type="button"
                  onClick={() => openMapPicker('pickup')}
                  className="text-[10px] font-black text-[#345E85] dark:text-blue-400 flex items-center gap-1 hover:underline transition-colors duration-300"
                >
                  <Map className="w-3 h-3" />
                  MAP PICKER
                </button>
              </div>
              <EnliteInput
                id="pickupLocation"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                placeholder="City, State"
                icon={<MapPin className="w-4 h-4 text-[#345E85]" />}
                list="recent-locations"
              />
              {pickupCoords && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 uppercase tracking-tighter transition-colors duration-300">
                  ✓ Geocoded: {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
                </p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="deliveryLocation" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors duration-300">
                  Delivery
                </Label>
                <button
                  type="button"
                  onClick={() => openMapPicker('delivery')}
                  className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline transition-colors duration-300"
                >
                  <Map className="w-3 h-3" />
                  MAP PICKER
                </button>
              </div>
              <EnliteInput
                id="deliveryLocation"
                name="deliveryLocation"
                value={formData.deliveryLocation}
                onChange={handleChange}
                required
                placeholder="City, State"
                icon={<MapPin className="w-4 h-4 text-emerald-500" />}
                list="recent-locations"
              />
              {deliveryCoords && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 uppercase tracking-tighter transition-colors duration-300">
                  ✓ Geocoded: {deliveryCoords.lat.toFixed(4)}, {deliveryCoords.lng.toFixed(4)}
                </p>
              )}
            </div>
            <datalist id="recent-locations">
              {recentLocations.map((loc, i) => (
                <option key={i} value={loc as string} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EnliteInput
              id="pickupDate"
              name="pickupDate"
              label="Pickup Date"
              type="date"
              value={formData.pickupDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              icon={<Calendar className="w-4 h-4" />}
            />
            <EnliteInput
              id="deliveryDate"
              name="deliveryDate"
              label="Delivery Date"
              type="date"
              value={formData.deliveryDate}
              onChange={handleChange}
              required
              min={formData.pickupDate || new Date().toISOString().split('T')[0]}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EnliteInput
              id="loadValue"
              name="loadValue"
              label="Load Value ($)"
              type="number"
              value={formData.loadValue}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="5000"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <EnliteInput
              id="offeredPrice"
              name="offeredPrice"
              label="Offered Price ($)"
              type="number"
              value={formData.offeredPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Optional"
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-sm duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#345E85] dark:bg-blue-600 text-white rounded-2xl transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-slate-800 dark:hover:bg-blue-700 duration-300"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>CREATING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>CREATE CARGO</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 text-center transition-colors duration-300">
            You can add more details later in the full cargo form
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickCreateModal;

