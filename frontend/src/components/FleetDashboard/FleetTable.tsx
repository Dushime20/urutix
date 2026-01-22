import React, { useState, useEffect } from 'react';
import { FaTruck, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaEdit, FaTrash, FaTimes, FaFileAlt, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';
import type { FleetItem } from '../../types/fleet';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { documentApi, type Document } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';


interface FleetTableProps {
  fleetItems: FleetItem[];
  lastFleetItemRef: (node: HTMLElement | null) => void;
  view: 'grid' | 'list';
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes';
  onRowClick: (item: FleetItem) => void;
  onEditFleetItem: (item: FleetItem) => void;
  onDeleteFleetItem: (itemId: string) => void;
}

const FleetTableComp: React.FC<FleetTableProps> = ({
  fleetItems,
  lastFleetItemRef,
  view,
  activeTab,
  onRowClick,
  onEditFleetItem,
  onDeleteFleetItem
}) => {
  const [viewingDriver, setViewingDriver] = useState<FleetItem | null>(null);
  const [driverDocuments, setDriverDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Fetch documents when viewing a driver
  useEffect(() => {
    if (!viewingDriver || activeTab !== 'drivers') {
      setDriverDocuments([]);
      return;
    }

    console.log('Fetching documents for driver:', {
      driverId: viewingDriver.id,
      driverName: viewingDriver.name,
    });

    let cancelled = false;
    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const docs = await documentApi.getDocumentsByEntity('DRIVER', viewingDriver.id);
        console.log('Documents fetched:', docs);
        if (!cancelled) {
          setDriverDocuments(docs);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Error fetching driver documents:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          toast.error('Failed to load documents');
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
  }, [viewingDriver, activeTab]);




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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-success-100 text-success-800';
      case 'IN_TRANSIT':
        return 'bg-primary-100 text-primary-800';
      case 'MAINTENANCE':
        return 'bg-warning-100 text-warning-800';
      case 'OUT_OF_SERVICE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const { tSync } = useTranslation();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return tSync('Available');
      case 'IN_TRANSIT':
        return tSync('In Transit');
      case 'MAINTENANCE':
        return tSync('Maintenance');
      case 'OUT_OF_SERVICE':
        return tSync('Out of Service');
      default:
        return tSync(status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
  };

  if (view === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fleetItems.map((item, index) => (
            <div
              key={item.id}
              ref={index === fleetItems.length - 1 ? lastFleetItemRef : null}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onRowClick(item)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {activeTab === 'trucks' ? (
                    <FaTruck className="w-5 h-5 text-primary-600" />
                  ) : (
                    <FaUser className="w-5 h-5 text-primary-600" />
                  )}
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>

              <div className="space-y-3">
                {activeTab === 'trucks' ? (
                  <>
                    {item.plateNumber && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Plate:</span> {item.plateNumber}
                      </div>
                    )}
                    {item.vin && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">VIN:</span> {item.vin}
                      </div>
                    )}
                    {item.make && item.model && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Vehicle:</span> {item.make} {item.model}
                      </div>
                    )}
                    {item.year && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Year:</span> {item.year}
                      </div>
                    )}
                    {item.capacityWeight && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Weight:</span> {item.capacityWeight.toLocaleString()} kg
                      </div>
                    )}
                    {item.capacityVolume && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Volume:</span> {item.capacityVolume} m³
                      </div>
                    )}
                    {item.fuelType && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Fuel:</span> {item.fuelType}
                      </div>
                    )}
                    {/* Cargo Capabilities Display */}
                    {item.cargoCapabilities && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Cargo Types:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.cargoCapabilities.supportedCargoTypes?.map((type, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Temperature Range Display */}
                    {item.cargoCapabilities?.temperatureRange && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Temp Range:</span> {item.cargoCapabilities.temperatureRange.min}°C - {item.cargoCapabilities.temperatureRange.max}°C
                      </div>
                    )}
                    {/* Special Capabilities */}
                    {item.cargoCapabilities && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Special:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.cargoCapabilities.maxFragileHandling && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Fragile</span>
                          )}
                          {item.cargoCapabilities.maxHazardousHandling && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Hazmat</span>
                          )}
                          {item.cargoCapabilities.maxRefrigeratedHandling && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Refrigerated</span>
                          )}
                          {item.cargoCapabilities.maxLiquidHandling && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Liquid</span>
                          )}
                          {item.cargoCapabilities.maxOversizedHandling && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Oversized</span>
                          )}
                          {item.cargoCapabilities.maxValuableHandling && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Valuable</span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Loading Capabilities */}
                    {item.loadingCapabilities && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Loading:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.loadingCapabilities.hasForklift && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Forklift</span>
                          )}
                          {item.loadingCapabilities.hasCrane && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Crane</span>
                          )}
                          {item.loadingCapabilities.hasTailLift && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Tail Lift</span>
                          )}
                          {item.loadingCapabilities.hasSideLift && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Side Lift</span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Security Features */}
                    {item.securityFeatures && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Security:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.securityFeatures.hasGps && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">GPS</span>
                          )}
                          {item.securityFeatures.hasTracking && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Tracking</span>
                          )}
                          {item.securityFeatures.hasTemperatureAlerts && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Temp Monitor</span>
                          )}
                          {item.securityFeatures.hasCargoMonitoring && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Cargo Monitor</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.licenseNumber && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">License:</span> {item.licenseNumber}
                      </div>
                    )}
                    {item.experience && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Experience:</span> {item.experience} years
                      </div>
                    )}
                    {item.currentTruck && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Assigned Truck:</span> {item.currentTruck.licensePlate}
                      </div>
                    )}
                  </>
                )}

                {item.currentLocation?.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{item.currentLocation.address}</span>
                  </div>
                )}

                {item.contactInfo && (
                  <div className="space-y-1">
                    {item.contactInfo.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaPhone className="w-3 h-3" />
                        <span>{item.contactInfo.phone}</span>
                      </div>
                    )}
                    {item.contactInfo.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaEnvelope className="w-3 h-3" />
                        <span>{item.contactInfo.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFleetItem(item);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFleetItem(item.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Driver Details Modal */}
        {viewingDriver && activeTab === 'drivers' && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" onClick={() => setViewingDriver(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Driver Details</h2>
                  <p className="text-sm text-gray-600 mt-1">{viewingDriver.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewingDriver(null)} className="text-gray-400 hover:text-gray-600">
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-base text-gray-900 mt-1">{viewingDriver.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">License Number</label>
                      <p className="text-base text-gray-900 mt-1">{viewingDriver.licenseNumber || '-'}</p>
                    </div>
                    {viewingDriver.contactInfo?.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                          <FaPhone className="text-gray-400" />
                          {viewingDriver.contactInfo.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingDriver.status)}`}>
                          {getStatusText(viewingDriver.status)}
                        </span>
                      </div>
                    </div>
                    {viewingDriver.currentTruck && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned Truck</label>
                        <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                          <FaTruck className="text-gray-400" />
                          {viewingDriver.currentTruck.licensePlate || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Documents */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
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
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                    doc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    doc.status === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {doc.status}
                                  </span>
                                  {doc.expiryDate && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      documentApi.isDocumentExpiringSoon(doc, 30)
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
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <button 
                  onClick={() => setViewingDriver(null)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Table view - responsive: hidden on mobile, shown on desktop
  return (
    <>
      {/* Mobile Card View - Always show on mobile regardless of view preference */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-4">
          {fleetItems.map((item, index) => (
            <div
              key={item.id}
              ref={index === fleetItems.length - 1 ? lastFleetItemRef : null}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onRowClick(item)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {activeTab === 'trucks' ? (
                    <FaTruck className="w-4 h-4 text-primary-600" />
                  ) : (
                    <FaUser className="w-4 h-4 text-primary-600" />
                  )}
                  <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {activeTab === 'trucks' ? (
                  <>
                    {item.plateNumber && (
                      <div className="text-gray-600">
                        <span className="font-medium">Plate:</span> {item.plateNumber}
                      </div>
                    )}
                    {item.make && item.model && (
                      <div className="text-gray-600">
                        <span className="font-medium">Vehicle:</span> {item.make} {item.model}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.licenseNumber && (
                      <div className="text-gray-600">
                        <span className="font-medium">License:</span> {item.licenseNumber}
                      </div>
                    )}
                    {item.experience && (
                      <div className="text-gray-600">
                        <span className="font-medium">Experience:</span> {item.experience} years
                      </div>
                    )}
                  </>
                )}

                {item.currentLocation?.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaMapMarkerAlt className="w-3 h-3" />
                    <span className="text-xs">{item.currentLocation.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFleetItem(item);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFleetItem(item.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View - Only show on desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'trucks' ? <TranslatedText text="Truck" /> : <TranslatedText text="Driver" />}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Status" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Location" />
                </th>
                {activeTab === 'trucks' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TranslatedText text="License Plate" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TranslatedText text="Vehicle" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TranslatedText text="Driver" />
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TranslatedText text="License Number" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TranslatedText text="Experience" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TranslatedText text="Assigned Truck" />
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Contact" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Actions" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fleetItems.map((item, index) => (
                <tr
                  key={item.id}
                  ref={index === fleetItems.length - 1 ? lastFleetItemRef : null}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {activeTab === 'trucks' ? (
                        <FaTruck className="w-5 h-5 text-primary-600 mr-3" />
                      ) : (
                        <FaUser className="w-5 h-5 text-primary-600 mr-3" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">ID: {item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2" />
                      {item.currentLocation?.address || 'Unknown location'}
                    </div>
                  </td>
                  {activeTab === 'trucks' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.licensePlate || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.make && item.model ? `${item.make} ${item.model}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.primaryDriver?.name || 'No driver assigned'}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.licenseNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.experience ? `${item.experience} years` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.currentTruck?.licensePlate || 'No truck assigned'}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.contactInfo ? (
                      <div className="space-y-1">
                        {item.contactInfo.phone && (
                          <div className="flex items-center gap-1">
                            <FaPhone className="w-3 h-3 text-gray-400" />
                            <span>{item.contactInfo.phone}</span>
                          </div>
                        )}
                        {item.contactInfo.email && (
                          <div className="flex items-center gap-1">
                            <FaEnvelope className="w-3 h-3 text-gray-400" />
                            <span>{item.contactInfo.email}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditFleetItem(item);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFleetItem(item.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export const FleetTable = React.memo(FleetTableComp);