import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaBox, FaShieldAlt, FaTools, FaFileAlt, FaDownload, FaExternalLinkAlt } from 'react-icons/fa';
import type { FleetItem } from '../../types/fleet';
import { documentApi, type Document } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui';

interface FleetModalProps {
  fleetItem: FleetItem | null;
  onClose: () => void;
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes';
}

const FleetModalComp: React.FC<FleetModalProps> = ({
  fleetItem,
  onClose,
  activeTab,
}) => {
  const [driverDocuments, setDriverDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Fetch documents when viewing a driver
  useEffect(() => {
    if (!fleetItem || activeTab !== 'drivers') {
      setDriverDocuments([]);
      return;
    }

    let cancelled = false;
    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const docs = await documentApi.getDocumentsByEntity('DRIVER', fleetItem.id);
        if (!cancelled) {
          setDriverDocuments(docs);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Error fetching driver documents:', error);
          setDriverDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingDocs(false);
        }
      }
    };

    fetchDocuments();
    return () => {
      cancelled = true;
    };
  }, [fleetItem, activeTab]);

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const blob = await documentApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  if (!fleetItem) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_SERVICE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCargoCapabilities = () => {
    if (!fleetItem.cargoCapabilities) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaBox className="w-5 h-5 text-primary-600" />
          Cargo Capabilities
        </h3>

        {/* Supported Cargo Types */}
        {fleetItem.cargoCapabilities.supportedCargoTypes && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Cargo Types</h4>
            <div className="flex flex-wrap gap-2">
              {fleetItem.cargoCapabilities.supportedCargoTypes.map((type, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Temperature Range */}
        {fleetItem.cargoCapabilities.temperatureRange && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Temperature Range</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {fleetItem.cargoCapabilities.temperatureRange.min}°C - {fleetItem.cargoCapabilities.temperatureRange.max}°C
              </span>
            </div>
          </div>
        )}

        {/* Special Handling Capabilities */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Special Handling</h4>
          <div className="flex flex-wrap gap-2">
            {fleetItem.cargoCapabilities.maxFragileHandling && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Fragile</span>
            )}
            {fleetItem.cargoCapabilities.maxHazardousHandling && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">Hazmat</span>
            )}
            {fleetItem.cargoCapabilities.maxRefrigeratedHandling && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Refrigerated</span>
            )}
            {fleetItem.cargoCapabilities.maxLiquidHandling && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Liquid</span>
            )}
            {fleetItem.cargoCapabilities.maxOversizedHandling && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Oversized</span>
            )}
            {fleetItem.cargoCapabilities.maxValuableHandling && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">Valuable</span>
            )}
          </div>
        </div>

        {/* Dimensional Capacities */}
        {/* Dimensional Capacities */}
        {(fleetItem.cargoCapabilities.maxDimensions?.length || fleetItem.cargoCapabilities.maxDimensions?.width ||
          fleetItem.cargoCapabilities.maxDimensions?.height || fleetItem.cargoCapabilities.maxVolume) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dimensional Capacities</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {fleetItem.cargoCapabilities.maxDimensions?.length && (
                  <div>
                    <span className="text-gray-600">Max Length:</span>
                    <span className="ml-2 font-medium">{fleetItem.cargoCapabilities.maxDimensions.length}m</span>
                  </div>
                )}
                {fleetItem.cargoCapabilities.maxDimensions?.width && (
                  <div>
                    <span className="text-gray-600">Max Width:</span>
                    <span className="ml-2 font-medium">{fleetItem.cargoCapabilities.maxDimensions.width}m</span>
                  </div>
                )}
                {fleetItem.cargoCapabilities.maxDimensions?.height && (
                  <div>
                    <span className="text-gray-600">Max Height:</span>
                    <span className="ml-2 font-medium">{fleetItem.cargoCapabilities.maxDimensions.height}m</span>
                  </div>
                )}
                {fleetItem.cargoCapabilities.maxVolume && (
                  <div>
                    <span className="text-gray-600">Max Volume:</span>
                    <span className="ml-2 font-medium">{fleetItem.cargoCapabilities.maxVolume}m³</span>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  const renderLoadingCapabilities = () => {
    if (!fleetItem.loadingCapabilities) return null;

    const equipment = Object.entries(fleetItem.loadingCapabilities)
      .filter(([key, value]) => key !== 'maxLoadingTime' && key !== 'maxUnloadingTime' && value)
      .map(([key]) => key.replace('has', '').replace(/([A-Z])/g, ' $1').trim());

    if (equipment.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaTools className="w-5 h-5 text-primary-600" />
          Loading Equipment
        </h3>
        <div className="flex flex-wrap gap-2">
          {equipment.map((item, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
              {item}
            </span>
          ))}
        </div>
        {(fleetItem.loadingCapabilities.maxLoadingTime || fleetItem.loadingCapabilities.maxUnloadingTime) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {fleetItem.loadingCapabilities.maxLoadingTime && (
              <div>
                <span className="text-gray-600">Max Loading Time:</span>
                <span className="ml-2 font-medium">{fleetItem.loadingCapabilities.maxLoadingTime} min</span>
              </div>
            )}
            {fleetItem.loadingCapabilities.maxUnloadingTime && (
              <div>
                <span className="text-gray-600">Max Unloading Time:</span>
                <span className="ml-2 font-medium">{fleetItem.loadingCapabilities.maxUnloadingTime} min</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSecurityFeatures = () => {
    if (!fleetItem.securityFeatures) return null;

    const features = Object.entries(fleetItem.securityFeatures)
      .filter(([, value]) => value)
      .map(([key]) => key.replace('has', '').replace(/([A-Z])/g, ' $1').trim());

    if (features.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaShieldAlt className="w-5 h-5 text-primary-600" />
          Security & Monitoring
        </h3>
        <div className="flex flex-wrap gap-2">
          {features.slice(0, 8).map((feature, idx) => (
            <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {feature}
            </span>
          ))}
          {features.length > 8 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
              +{features.length - 8} more
            </span>
          )}
        </div>
      </div>
    );
  };

  const isOpen = !!fleetItem;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="hidden">
          <DialogTitle>{fleetItem.name}</DialogTitle>
          <DialogDescription>Fleet Item Details</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {activeTab === 'trucks' ? (
              <FaTruck className="w-6 h-6 text-primary-600" />
            ) : (
              <FaUser className="w-6 h-6 text-primary-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{fleetItem.name}</h2>
              <p className="text-sm text-gray-600">ID: {fleetItem.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fleetItem.status)}`}>
              {fleetItem.status}
            </span>
            <div className="text-sm text-gray-600">
              Updated: {new Date(fleetItem.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              {activeTab === 'trucks' ? (
                <>
                  {fleetItem.plateNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Plate Number:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.plateNumber}</span>
                    </div>
                  )}
                  {fleetItem.vin && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">VIN Number:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.vin}</span>
                    </div>
                  )}
                  {fleetItem.make && fleetItem.model && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vehicle:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.make} {fleetItem.model}</span>
                    </div>
                  )}
                  {fleetItem.year && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Year:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.year}</span>
                    </div>
                  )}
                  {fleetItem.color && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Color:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.color}</span>
                    </div>
                  )}
                  {fleetItem.capacityWeight && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Weight Capacity:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.capacityWeight.toLocaleString()} kg</span>
                    </div>
                  )}
                  {fleetItem.capacityVolume && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Volume Capacity:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.capacityVolume} m³</span>
                    </div>
                  )}
                  {fleetItem.fuelType && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fuel Type:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.fuelType}</span>
                    </div>
                  )}
                  {fleetItem.mileage && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Mileage:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.mileage.toLocaleString()} km</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {fleetItem.licenseNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">License Number:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.licenseNumber}</span>
                    </div>
                  )}
                  {fleetItem.experience && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Experience:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.experience} years</span>
                    </div>
                  )}
                </>
              )}

              {/* Registration & Insurance Information */}
              {activeTab === 'trucks' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Registration & Insurance</h3>

                  {fleetItem.registrationNumber && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Registration Number:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.registrationNumber}</span>
                    </div>
                  )}
                  {fleetItem.registrationExpiry && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Registration Expiry:</span>
                      <span className="ml-2 text-sm text-gray-900">{new Date(fleetItem.registrationExpiry).toLocaleDateString()}</span>
                    </div>
                  )}
                  {fleetItem.insurancePolicy && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Insurance Policy:</span>
                      <span className="ml-2 text-sm text-gray-900">{fleetItem.insurancePolicy}</span>
                    </div>
                  )}
                  {fleetItem.insuranceExpiry && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Insurance Expiry:</span>
                      <span className="ml-2 text-sm text-gray-900">{new Date(fleetItem.insuranceExpiry).toLocaleDateString()}</span>
                    </div>
                  )}
                  {fleetItem.roadworthyCertExpiry && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Roadworthy Certificate Expiry:</span>
                      <span className="ml-2 text-sm text-gray-900">{new Date(fleetItem.roadworthyCertExpiry).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {fleetItem.currentLocation?.address && (
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Current Location:</span>
                    <p className="text-sm text-gray-900">{fleetItem.currentLocation.address}</p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {fleetItem.contactInfo && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Contact Information:</span>
                  {fleetItem.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{fleetItem.contactInfo.phone}</span>
                    </div>
                  )}
                  {fleetItem.contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{fleetItem.contactInfo.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cargo Alignment Information */}
            {activeTab === 'trucks' && (
              <div className="space-y-6">
                {renderCargoCapabilities()}
                {renderLoadingCapabilities()}
                {renderSecurityFeatures()}
              </div>
            )}

            {/* Driver Documents */}
            {activeTab === 'drivers' && (
              <div className="space-y-4 mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaFileAlt className="w-5 h-5 text-primary-600" />
                  Documents
                </h3>
                {loadingDocs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading documents...</p>
                  </div>
                ) : driverDocuments.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <FaFileAlt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No documents uploaded for this driver</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {driverDocuments.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FaFileAlt className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">{doc.title}</h4>
                              {doc.description && (
                                <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span>{doc.originalFileName}</span>
                                <span>•</span>
                                <span>{documentApi.formatFileSize(doc.fileSize)}</span>
                                <span>•</span>
                                <span className="capitalize">{doc.documentType.replace(/_/g, ' ').toLowerCase()}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                  doc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                      doc.status === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                  }`}>
                                  {doc.status}
                                </span>
                                {doc.expiryDate && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${documentApi.isDocumentExpiringSoon(doc, 30)
                                    ? 'bg-orange-100 text-orange-700'
                                    : doc.isExpired
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {doc.isExpired
                                      ? 'Expired'
                                      : documentApi.isDocumentExpiringSoon(doc, 30)
                                        ? 'Expiring Soon'
                                        : `Expires ${new Date(doc.expiryDate).toLocaleDateString()}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={() => window.open(documentApi.getDocumentViewUrl(doc.id), '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View document"
                            >
                              <FaExternalLinkAlt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <FaDownload className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const FleetModal = React.memo(FleetModalComp);