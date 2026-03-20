import React from 'react';
import { TranslatedText } from '../translated-text';
import {
  X,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Truck,
  FileText,
  User,
  Phone,
  Mail,
  Clock,
  Thermometer,
  Box,
  Ruler,
  Weight,
  Navigation,
  Info
} from 'lucide-react';

interface CargoModalProps {
  cargo: any;
  onClose: () => void;
}

export const CargoModal: React.FC<CargoModalProps> = ({ cargo, onClose }) => {
  if (!cargo) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'PUBLISHED': 'bg-green-100 text-green-800',
      'CREATED': 'bg-blue-100 text-blue-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'IN_TRANSIT': 'bg-yellow-100 text-yellow-800',
      'ASSIGNED': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-emerald-100 text-emerald-800',
      'COMPLETED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-orange-100 text-orange-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const InfoSection = ({ icon: Icon, title, children }: { icon: any; title: string | React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon }: { label: string | React.ReactNode; value: any; icon?: any }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex items-start gap-3 py-2 border-b border-gray-200 last:border-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <dt className="text-sm font-medium text-gray-600">{label}</dt>
          <dd className="text-sm text-gray-900 mt-0.5 break-words">{String(value)}</dd>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{cargo.title || <TranslatedText text="Cargo Details" />}</h2>
              <p className="text-sm text-primary-100"><TranslatedText text="ID" />: {cargo.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cargo.status)}`}>
                <TranslatedText text={cargo.status || 'N/A'} />
              </span>
              {cargo.autoMatchEnabled && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  <TranslatedText text="Auto-Match Enabled" />
                </span>
              )}
            </div>

            {/* Basic Information */}
            <InfoSection icon={Package} title={<TranslatedText text="Basic Information" />}>
              <dl className="space-y-0">
                <InfoRow label={<TranslatedText text="Cargo Type" />} value={cargo.cargoType} icon={Box} />
                <InfoRow label={<TranslatedText text="Description" />} value={cargo.description} icon={FileText} />
                <InfoRow label={<TranslatedText text="Weight" />} value={cargo.weight ? `${cargo.weight} kg` : null} icon={Weight} />
                {cargo.volume && <InfoRow label={<TranslatedText text="Volume" />} value={`${cargo.volume} m³`} icon={Box} />}
                {cargo.length && cargo.width && cargo.height && (
                  <InfoRow
                    label={<TranslatedText text="Dimensions" />}
                    value={`${cargo.length} × ${cargo.width} × ${cargo.height} cm`}
                    icon={Ruler}
                  />
                )}
                {cargo.numberOfPieces && <InfoRow label={<TranslatedText text="Number of Pieces" />} value={cargo.numberOfPieces} />}
                {cargo.numberOfPallets && <InfoRow label={<TranslatedText text="Number of Pallets" />} value={cargo.numberOfPallets} />}
                {cargo.packagingType && <InfoRow label={<TranslatedText text="Packaging Type" />} value={cargo.packagingType} />}
              </dl>
            </InfoSection>

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoSection icon={MapPin} title={<TranslatedText text="Pickup Location" />}>
                <dl className="space-y-0">
                  <InfoRow label={<TranslatedText text="Name" />} value={cargo.pickupLocation?.name} />
                  <InfoRow label={<TranslatedText text="Address" />} value={cargo.pickupLocation?.address} />
                  {cargo.pickupLocation?.coordinates && (
                    <InfoRow
                      label={<TranslatedText text="Coordinates" />}
                      value={`${cargo.pickupLocation.coordinates.latitude}, ${cargo.pickupLocation.coordinates.longitude}`}
                      icon={Navigation}
                    />
                  )}
                  <InfoRow label={<TranslatedText text="Pickup Date" />} value={formatDate(cargo.pickupDate)} icon={Calendar} />
                  {cargo.loadingInstructions && (
                    <InfoRow label={<TranslatedText text="Loading Instructions" />} value={cargo.loadingInstructions} icon={Info} />
                  )}
                </dl>
              </InfoSection>

              <InfoSection icon={MapPin} title={<TranslatedText text="Delivery Location" />}>
                <dl className="space-y-0">
                  <InfoRow label={<TranslatedText text="Name" />} value={cargo.deliveryLocation?.name} />
                  <InfoRow label={<TranslatedText text="Address" />} value={cargo.deliveryLocation?.address} />
                  {cargo.deliveryLocation?.coordinates && (
                    <InfoRow
                      label="Coordinates"
                      value={`${cargo.deliveryLocation.coordinates.latitude}, ${cargo.deliveryLocation.coordinates.longitude}`}
                      icon={Navigation}
                    />
                  )}
                  <InfoRow label={<TranslatedText text="Delivery Date" />} value={formatDate(cargo.deliveryDate)} icon={Calendar} />
                  {cargo.unloadingInstructions && (
                    <InfoRow label={<TranslatedText text="Unloading Instructions" />} value={cargo.unloadingInstructions} icon={Info} />
                  )}
                </dl>
              </InfoSection>
            </div>

            {/* Financial Information */}
            <InfoSection icon={DollarSign} title={<TranslatedText text="Financial Information" />}>
              <dl className="space-y-0">
                <InfoRow label={<TranslatedText text="Load Value" />} value={formatCurrency(cargo.loadValue, cargo.currencyCode)} />
                {cargo.offeredPrice && (
                  <InfoRow label={<TranslatedText text="Offered Price" />} value={formatCurrency(cargo.offeredPrice, cargo.currencyCode)} />
                )}
                <InfoRow label={<TranslatedText text="Currency" />} value={cargo.currencyCode} />
                {cargo.insuranceValue && (
                  <InfoRow label={<TranslatedText text="Insurance Value" />} value={formatCurrency(cargo.insuranceValue, cargo.currencyCode)} />
                )}
              </dl>
            </InfoSection>

            {/* Special Requirements */}
            {(cargo.isFragile || cargo.isHazardous || cargo.requiresRefrigeration ||
              cargo.requiresForklift || cargo.requiresCrane || cargo.requiresLoadingDock ||
              cargo.requiresHumidityControl || cargo.requiresGpsMonitoring ||
              cargo.requiresTemperatureMonitoring) && (
                <InfoSection icon={AlertCircle} title={<TranslatedText text="Special Requirements" />}>
                  <div className="flex flex-wrap gap-2">
                    {cargo.isFragile && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Fragile" />
                      </span>
                    )}
                    {cargo.isHazardous && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Hazardous" />
                      </span>
                    )}
                    {cargo.requiresRefrigeration && (
                      <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium flex items-center gap-1 border border-primary-100">
                        <Thermometer className="w-3 h-3" />
                        <TranslatedText text="Refrigeration Required" />
                      </span>
                    )}
                    {cargo.requiresForklift && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Forklift Required" />
                      </span>
                    )}
                    {cargo.requiresCrane && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Crane Required" />
                      </span>
                    )}
                    {cargo.requiresLoadingDock && (
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Loading Dock Required" />
                      </span>
                    )}
                    {cargo.requiresHumidityControl && (
                      <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Humidity Control" />
                      </span>
                    )}
                    {cargo.requiresGpsMonitoring && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <TranslatedText text="GPS Monitoring" />
                      </span>
                    )}
                    {cargo.requiresTemperatureMonitoring && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        <TranslatedText text="Temperature Monitoring" />
                      </span>
                    )}
                  </div>
                  {cargo.temperatureMin && cargo.temperatureMax && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <InfoRow
                        label={<TranslatedText text="Temperature Range" />}
                        value={`${cargo.temperatureMin}°C to ${cargo.temperatureMax}°C`}
                        icon={Thermometer}
                      />
                    </div>
                  )}
                  {cargo.hazmatClass && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <InfoRow label="Hazmat Class" value={cargo.hazmatClass} />
                      {cargo.hazmatNumber && <InfoRow label="Hazmat Number" value={cargo.hazmatNumber} />}
                    </div>
                  )}
                  {cargo.specialRequirements && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <InfoRow label="Special Requirements" value={cargo.specialRequirements} icon={Info} />
                    </div>
                  )}
                  {cargo.specialHandlingInstructions && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <InfoRow label="Special Handling Instructions" value={cargo.specialHandlingInstructions} icon={Info} />
                    </div>
                  )}
                </InfoSection>
              )}

            {/* Contact Information */}
            {cargo.contactInfo && (
              <InfoSection icon={User} title={<TranslatedText text="Contact Information" />}>
                <dl className="space-y-0">
                  {cargo.contactInfo?.contactPerson && (
                    <InfoRow label={<TranslatedText text="Contact Person" />} value={cargo.contactInfo?.contactPerson} icon={User} />
                  )}
                  {cargo.contactInfo?.contactPhone && (
                    <InfoRow label={<TranslatedText text="Phone" />} value={cargo.contactInfo?.contactPhone} icon={Phone} />
                  )}
                  {cargo.contactInfo?.contactEmail && (
                    <InfoRow label={<TranslatedText text="Email" />} value={cargo.contactInfo?.contactEmail} icon={Mail} />
                  )}
                </dl>
              </InfoSection>
            )}

            {/* Operator Information (Transporter / Truck / Broker) */}
            {(cargo.transporter || cargo.truckOwner || cargo.assignedTruck || cargo.broker || cargo.brokerId) && (
              <InfoSection icon={Truck} title={<TranslatedText text="Operator Information" />}>
                <dl className="space-y-0">
                  {/* Transporter Details */}
                  {cargo.transporter && (
                    <>
                      <InfoRow label={<TranslatedText text="Transporter" />} value={cargo.transporter.name} icon={User} />
                      {cargo.transporter.email && <InfoRow label={<TranslatedText text="Email" />} value={cargo.transporter.email} icon={Mail} />}
                      {cargo.transporter.phone && <InfoRow label={<TranslatedText text="Phone" />} value={cargo.transporter.phone} icon={Phone} />}
                    </>
                  )}

                  {/* Truck Owner (if different/specific) */}
                  {!cargo.transporter && cargo.truckOwner && (
                    <InfoRow label="Truck Owner" value={cargo.truckOwner.name} icon={User} />
                  )}

                  {/* Assigned Truck */}
                  {cargo.assignedTruck && (
                    <>
                      <InfoRow label="Truck Plate" value={cargo.assignedTruck.plateNumber} icon={Truck} />
                      {cargo.assignedTruck.driverName && <InfoRow label="Driver" value={cargo.assignedTruck.driverName} icon={User} />}
                    </>
                  )}

                  {/* Broker Details (Fallback or Additional) */}
                  {cargo.broker && (
                    <>
                      <div className="pt-2 mt-2 border-t border-gray-100 first:border-0 first:pt-0 first:mt-0">
                        <InfoRow
                          label="Broker"
                          value={cargo.broker.profile?.firstName ? `${cargo.broker.profile.firstName} ${cargo.broker.profile.lastName || ''}` : (cargo.broker.profile?.companyName || cargo.broker.email)}
                          icon={User}
                        />
                        {cargo.broker.email && <InfoRow label="Broker Email" value={cargo.broker.email} icon={Mail} />}
                      </div>
                    </>
                  )}
                  {!cargo.broker && cargo.brokerId && (
                    <InfoRow label="Broker" value="Broker Assigned (Details restricted)" icon={User} />
                  )}
                </dl>
              </InfoSection>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(cargo.loadingTimeEstimate || cargo.unloadingTimeEstimate || cargo.maxTransitTime) && (
                <InfoSection icon={Clock} title="Time Estimates">
                  <dl className="space-y-0">
                    {cargo.loadingTimeEstimate && (
                      <InfoRow label="Loading Time" value={`${cargo.loadingTimeEstimate} minutes`} />
                    )}
                    {cargo.unloadingTimeEstimate && (
                      <InfoRow label="Unloading Time" value={`${cargo.unloadingTimeEstimate} minutes`} />
                    )}
                    {cargo.maxTransitTime && (
                      <InfoRow label="Max Transit Time" value={`${cargo.maxTransitTime} hours`} />
                    )}
                  </dl>
                </InfoSection>
              )}

              {(cargo.createdAt || cargo.updatedAt) && (
                <InfoSection icon={FileText} title={<TranslatedText text="Timestamps" />}>
                  <dl className="space-y-0">
                    {cargo.createdAt && (
                      <InfoRow label={<TranslatedText text="Created At" />} value={formatDate(cargo.createdAt)} icon={Calendar} />
                    )}
                    {cargo.updatedAt && (
                      <InfoRow label={<TranslatedText text="Updated At" />} value={formatDate(cargo.updatedAt)} icon={Clock} />
                    )}
                  </dl>
                </InfoSection>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <TranslatedText text="Close" />
          </button>
        </div>
      </div>
    </div>
  );
};
