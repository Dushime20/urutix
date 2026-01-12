import React, { useState, useEffect } from 'react';
import { FaTruck, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaEdit, FaTrash, FaCheckSquare, FaSquare, FaMinusSquare, FaCog, FaFileExport } from 'react-icons/fa';
import type { FleetItem } from '../../types/fleet';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface FleetTableProps {
  fleetItems: FleetItem[];
  lastFleetItemRef: (node: HTMLElement | null) => void;
  view: 'grid' | 'list';
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes';
  onRowClick: (item: FleetItem) => void;
  onBulkAction: (action: 'delete' | 'export' | 'update', selectedIds: string[]) => void;
  onEditFleetItem: (item: FleetItem) => void;
  onDeleteFleetItem: (itemId: string) => void;
}

const FleetTableComp: React.FC<FleetTableProps> = ({
  fleetItems,
  lastFleetItemRef,
  view,
  activeTab,
  onRowClick,
  onBulkAction,
  onEditFleetItem,
  onDeleteFleetItem
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { tSync } = useTranslation();

  // Reset selection when items or tab changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const handleSelectAll = () => {
    if (selectedIds.length === fleetItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(fleetItems.map(item => item.id));
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
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

  const BulkActionsToolbar = () => (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700">
      <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
        <span className="text-sm font-medium">Selected</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onBulkAction('update', selectedIds)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
        >
          <FaCog className="text-slate-400" /> Update Status
        </button>
        <button
          onClick={() => onBulkAction('export', selectedIds)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
        >
          <FaFileExport className="text-slate-400" /> Export
        </button>
        <div className="w-px h-4 bg-slate-700 mx-2"></div>
        <button
          onClick={() => onBulkAction('delete', selectedIds)}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
        >
          <FaTrash /> Delete
        </button>
      </div>
      <button
        onClick={() => setSelectedIds([])}
        className="ml-2 text-slate-500 hover:text-white transition-colors"
      >
        <FaCheckSquare />
      </button>
    </div>
  );

  if (view === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fleetItems.map((item, index) => (
            <div
              key={item.id}
              ref={index === fleetItems.length - 1 ? lastFleetItemRef : null}
              className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer relative group ${selectedIds.includes(item.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
              onClick={() => onRowClick(item)}
            >
              <div
                className="absolute top-4 right-4 z-10"
                onClick={(e) => handleSelectOne(item.id, e)}
              >
                {selectedIds.includes(item.id) ? (
                  <FaCheckSquare className="text-blue-600 w-5 h-5" />
                ) : (
                  <FaSquare className="text-gray-300 w-5 h-5 hover:text-blue-400 transition-colors" />
                )}
              </div>

              <div className="flex items-center justify-between mb-4 pr-8">
                <div className="flex items-center gap-2">
                  {activeTab === 'trucks' ? (
                    <FaTruck className="w-5 h-5 text-primary-600" />
                  ) : (
                    <FaUser className="w-5 h-5 text-primary-600" />
                  )}
                  <h3 className="font-semibold text-gray-900 truncate max-w-[120px]">{item.name}</h3>
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
        {selectedIds.length > 0 && <BulkActionsToolbar />}
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <div onClick={handleSelectAll} className="cursor-pointer">
                    {selectedIds.length === fleetItems.length && fleetItems.length > 0 ? (
                      <FaCheckSquare className="text-blue-600 w-4 h-4" />
                    ) : selectedIds.length > 0 ? (
                      <FaMinusSquare className="text-blue-600 w-4 h-4" />
                    ) : (
                      <FaSquare className="text-gray-300 w-4 h-4 hover:text-gray-400" />
                    )}
                  </div>
                </th>
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
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.includes(item.id) ? 'bg-blue-50/50' : ''}`}
                  onClick={() => onRowClick(item)}
                >
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => handleSelectOne(item.id, e)}>
                    {selectedIds.includes(item.id) ? (
                      <FaCheckSquare className="text-blue-600 w-4 h-4" />
                    ) : (
                      <FaSquare className="text-gray-300 w-4 h-4 hover:text-blue-400 group-hover:text-gray-400 transition-colors" />
                    )}
                  </td>
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
      {selectedIds.length > 0 && <BulkActionsToolbar />}
    </>
  );
};

export const FleetTable = React.memo(FleetTableComp);