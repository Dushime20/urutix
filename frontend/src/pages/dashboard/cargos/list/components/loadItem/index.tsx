"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  Globe,
  MapPin,
  Star,
  Trash2,
  TrendingUp,
  Weight,
  Box,
  User,
  Users,
  UserX,
  Briefcase,
  ChevronLeft,
} from "lucide-react";
import {
  getCargoTypeDisplayName,
  getCargoTypeIcon,
  getStatusColor,
  getStatusDisplayName,
  getUrgencyColor,
  getAccessTypeColor,
  getDetailedLocationInfo,
  getEnrichedLocationDetails,
  getLocationTypeIcon,
  getSecurityLevelColor,
  getSpecialRequirements,
  formatVolume,
  formatWeight,
  getLocationDisplay,
  isLoadingConfirmable,
} from "../../utils";
import { compactCurrency } from "@/utils/formatNumber";
import type { Cargo } from "@/types/cargo";
import SmCard from "./SmCard";
import moment from "moment";
import { cn } from "@/utils/cn";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CargoFormSchemaType } from "../../../create/components/form/cargoFormSchema";
import { encodeUrl } from "@/utils/url";

export default function LoadItem({
  load,
  handleViewClick,
  handleConfirmLoading,
  handleDeleteCargo,
  handleEditCargo,
  handleAssignBroker,
  handleUnassignBroker,
  handleAssignReceiver,
}: {
  load: Cargo;
  handleViewClick: (load: Cargo) => void;
  handleConfirmLoading: (load: Cargo) => void;
  handleDeleteCargo: (load: Cargo) => void;
  handleEditCargo?: (load: Cargo) => void;
  handleAssignBroker?: (load: Cargo) => void;
  handleUnassignBroker?: (load: Cargo) => void;
  handleAssignReceiver?: (load: Cargo) => void;
}) {
  const navigate = useNavigate();
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Debug: Log broker data for this load
  useEffect(() => {
    console.log(`[LoadItem] Load ${load.id} - Checking for broker:`, {
      brokerId: load.brokerId,
      hasBroker: !!load.broker,
      brokerEmail: load.broker?.email,
      hasProfile: !!load.broker?.profile,
      profileFirstName: load.broker?.profile?.firstName,
      profileLastName: load.broker?.profile?.lastName,
      profileCompanyName: load.broker?.profile?.companyName,
      commissionRate: load.brokerCommissionRate,
      commissionAmount: load.brokerCommissionAmount,
      willShowBrokerCard: !!(load.brokerId || load.broker),
    });
  }, [load]);

  const requirements = useMemo(() => {
    return getSpecialRequirements(load);
  }, [load]);

  const handleEditClick = useCallback(() => {
    if (handleEditCargo) {
      // Use the passed handler (opens modal)
      handleEditCargo(load);
    } else {
      // Fallback to old behavior if handler not provided (navigates to create page)
      const template: Partial<CargoFormSchemaType> = {
        id: load.id,
        title: load.title,
        description: load.description,
        weight: load.weight,
        volume: load.volume,
        cargoType: load.cargoType,
        pickupLocationId: load.pickupLocationId,
        deliveryLocationId: load.deliveryLocationId,
        pickupDate: load.pickupDate,
        deliveryDate: load.deliveryDate,
        loadValue: load.loadValue,
        offeredPrice: load.offeredPrice,
        currencyCode: load.currencyCode,
        isFragile: load.isFragile,
        isHazardous: load.isHazardous,
        requiresRefrigeration: load.requiresRefrigeration,
        specialRequirements: load.specialHandlingInstructions,
        autoMatchEnabled: load.autoMatchEnabled,
        loadingInstructions: load.loadingInstructions,
        unloadingInstructions: load.unloadingInstructions,
        contactPerson: load.contactInfo?.contactPerson,
        contactPhone: load.contactInfo?.contactPhone,
        contactEmail: load.contactInfo?.contactEmail,
        length: Number(load.length) || undefined,
        width: Number(load.width) || undefined,
        height: Number(load.height) || undefined,
        stackableHeight: Number(load.stackableHeight) || undefined,
        isStackable: load.isStackable,
        temperatureMin: Number(load.temperatureMin) || undefined,
        temperatureMax: Number(load.temperatureMax) || undefined,
        requiresHumidityControl: load.requiresHumidityControl,
        requiresForklift: load.requiresForklift,
        requiresCrane: load.requiresCrane,
        requiresLoadingDock: load.requiresLoadingDock,
        loadingTimeEstimate: Number(load.loadingTimeEstimate) || undefined,
        unloadingTimeEstimate: Number(load.unloadingTimeEstimate) || undefined,
        hazmatClass: load.hazmatClass,
        hazmatNumber: load.hazmatNumber,
        urgencyLevel: load.urgencyLevel,
        isTimeCritical: load.isTimeCritical,
        maxTransitTime: Number(load.maxTransitTime) || undefined,
        packagingType: load.packagingType,
        numberOfPieces: load.numberOfPieces,
        numberOfPallets: load.numberOfPallets,
        requiresGpsMonitoring: load.requiresGpsMonitoring,
        requiresTemperatureMonitoring: load.requiresTemperatureMonitoring,
        insuranceValue: load.insuranceValue,
        requiresLowClearanceRoute: load.requiresLowClearanceRoute,
        maxClearanceHeight: Number(load.maxClearanceHeight) || undefined,
        requiresEscortVehicle: load.requiresEscortVehicle,
        specialHandlingInstructions: load.specialHandlingInstructions,
        emergencyContactInfo: load.emergencyContactInfo,
        truckRequirements: load.truckRequirements,
        carrierPreferences: load.carrierPreferences
          ? {
            carrierName: load.carrierPreferences.preferredCarriers?.[0],
            carrierType: undefined,
          }
          : undefined,
        costPreferences: load.costPreferences ? {} : undefined,
        requiresPreShipmentInspection: load.requiresPreShipmentInspection,
        requiresDeliveryInspection: load.requiresDeliveryInspection,
        requiresPhotographicDocumentation:
          load.requiresPhotographicDocumentation,
      };

      navigate(
        `/dashboard/cargos/create?create=${encodeUrl({
          is_open: true,
          template,
        })}`
      );
    }
  }, [handleEditCargo, load, navigate]);

  return (
    <div className="group p-4 sm:p-6 transition-all duration-300 border border-slate-100 dark:border-slate-800 hover:border-[#345E85]/20 dark:hover:border-primary-700 shadow-sm hover:shadow-xl hover:-translate-y-1 rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden w-full">
      {/* Mobile Simplified View */}
      <div className="sm:hidden">
        {!showMobileDetails ? (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    {getCargoTypeIcon(load.cargoType)}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 break-words overflow-wrap-anywhere leading-tight">
                      {load.title ||
                        `${getCargoTypeDisplayName(load.cargoType)} Shipment`}
                    </h3>
                    <div className="mt-1 flex flex-col gap-0.5">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{getLocationDisplay(load)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                         <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3 flex-shrink-0" />
                            {formatWeight(load.weight)}
                         </span>
                         {load.offeredPrice && (
                           <span className="text-primary-600 font-black truncate" title={compactCurrency(load.offeredPrice, load.currencyCode)}>
                              {compactCurrency(load.offeredPrice, load.currencyCode)}
                           </span>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={cn(
                      `px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-all`,
                      getStatusColor(load.status)
                    )}
                  >
                    {getStatusDisplayName(load.status)}
                  </span>
                  {load.urgencyLevel && (
                    <span
                      className={cn(
                        `px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-all`,
                        getUrgencyColor(load.urgencyLevel)
                      )}
                    >
                      {load.urgencyLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Bar - Mobile Visible */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewClick(load)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#345E85] dark:hover:text-primary-400 rounded-xl transition-all duration-300 active:scale-95"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!load.broker && (
                    <button
                      onClick={handleEditClick}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary-600 rounded-xl transition-all duration-300 active:scale-95"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {handleAssignBroker && !load.broker && (
                    <button
                      onClick={() => handleAssignBroker(load)}
                      className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl transition-all duration-300 active:scale-95"
                      title="Assign Broker"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  )}
                  {handleAssignReceiver && (
                    <button
                      onClick={() => !load.receiverId && handleAssignReceiver(load)}
                      disabled={!!load.receiverId}
                      className={cn(
                        "p-2.5 rounded-xl transition-all duration-300 active:scale-95",
                        load.receiverId ? "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600" : "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                      )}
                      title="Assign Receiver"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {isLoadingConfirmable(load.status) && (
                    <button
                      onClick={() => handleConfirmLoading(load)}
                      className="p-2.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl transition-all duration-300 active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">CONFIRM</span>
                    </button>
                  )}
                  {!load.broker && (
                    <button
                      onClick={() => handleDeleteCargo(load)}
                      className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl transition-all duration-300 active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setShowMobileDetails(false)}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors touch-manipulation min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to List
            </button>

            {/* Mobile Detailed View */}
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  {getCargoTypeIcon(load.cargoType)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 break-words">
                    {load.title ||
                      `${getCargoTypeDisplayName(load.cargoType)} Shipment`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 break-words">
                    {load.description || "Cargo shipment details"}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    `px-3 py-1.5 rounded-full text-xs font-medium shadow-sm whitespace-nowrap`,
                    getStatusColor(load.status)
                  )}
                >
                  {getStatusDisplayName(load.status)}
                </span>
                {load.urgencyLevel && (
                  <span
                    className={cn(
                      `px-3 py-1.5 rounded-full text-xs font-medium shadow-sm whitespace-nowrap`,
                      getUrgencyColor(load.urgencyLevel)
                    )}
                  >
                    {load.urgencyLevel}
                  </span>
                )}
              </div>

              {/* Cargo Details - Mobile */}
              <div className="grid grid-cols-1 gap-4 mb-4 w-full">
                <SmCard
                  Icon={MapPin}
                  title={getLocationDisplay(load)}
                  content={(() => {
                    const enrichedDetails = getEnrichedLocationDetails(load);
                    if (enrichedDetails?.pickup || enrichedDetails?.delivery) {
                      return (
                        <span className="text-xs text-primary-600 flex items-center mt-1">
                          <Globe className="w-3 h-3 mr-1" />
                          Enhanced location data
                        </span>
                      );
                    } else if (
                      load.pickupLocation?.coordinates ||
                      load.deliveryLocation?.coordinates
                    ) {
                      return (
                        <span className="text-xs text-gray-500 flex items-center mt-1">
                          Location data available
                        </span>
                      );
                    }
                    return null;
                  })()}
                />

                <SmCard
                  Icon={Calendar}
                  title="Pickup Date"
                  content={moment(load.pickupDate).format("lll")}
                />

                <SmCard
                  Icon={Weight}
                  title="Weight"
                  content={formatWeight(load.weight)}
                />

                {load.volume && (
                  <SmCard
                    Icon={Box}
                    title="Volume"
                    content={formatVolume(load.volume)}
                  />
                )}

                <SmCard
                  Icon={DollarSign}
                  title="Value"
                  content={compactCurrency(load.loadValue, load.currencyCode)}
                />

                {load.offeredPrice && (
                  <SmCard
                    Icon={TrendingUp}
                    title="Offered"
                    content={compactCurrency(load.offeredPrice, load.currencyCode)}
                  />
                )}

                {load.brokerId && (
                  <SmCard
                    Icon={Briefcase}
                    title="Broker"
                    content={
                      load.broker?.profile?.companyName ||
                      (load.broker?.profile?.firstName && load.broker?.profile?.lastName
                        ? `${load.broker.profile.firstName} ${load.broker.profile.lastName}`
                        : load.broker?.email || 'Broker Assigned')
                    }
                  />
                )}
              </div>

              {/* Enhanced Location Information from OSM - Mobile */}
              {(() => {
                const detailedLocationInfo = getDetailedLocationInfo(load);

                if (detailedLocationInfo.hasEnrichedData) {
                  return (
                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm w-full overflow-hidden transition-colors duration-300">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                          <Globe className="w-3.5 h-3.5 text-gray-600 dark:text-slate-400" />
                        </div>
                        <span className="text-xs font-medium text-gray-800 break-words">
                          Enhanced Location Intelligence
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Pickup Location Enhanced */}
                        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm transition-colors duration-300">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                            <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              Pickup Location
                            </span>
                            <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded flex-shrink-0">
                              {getLocationTypeIcon(
                                detailedLocationInfo.pickup.type
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="font-medium text-gray-900 break-words">
                              {detailedLocationInfo.pickup.name}
                            </div>
                            <div className="text-gray-600 break-words">
                              {detailedLocationInfo.pickup.address}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getAccessTypeColor(
                                  detailedLocationInfo.pickup.access
                                )} bg-opacity-20 border whitespace-nowrap`}
                              >
                                {detailedLocationInfo.pickup.access} Access
                              </span>
                              <span
                                className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getSecurityLevelColor(
                                  detailedLocationInfo.pickup.security
                                )} bg-opacity-20 border whitespace-nowrap`}
                              >
                                {detailedLocationInfo.pickup.security} Security
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Location Enhanced */}
                        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm transition-colors duration-300">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                            <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              Delivery Location
                            </span>
                            <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded flex-shrink-0">
                              {getLocationTypeIcon(
                                detailedLocationInfo.delivery.type
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="font-medium text-gray-900 break-words">
                              {detailedLocationInfo.delivery.name}
                            </div>
                            <div className="text-gray-600 break-words">
                              {detailedLocationInfo.delivery.address}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getAccessTypeColor(
                                  detailedLocationInfo.delivery.access
                                )} bg-opacity-20 border whitespace-nowrap`}
                              >
                                {detailedLocationInfo.delivery.access} Access
                              </span>
                              <span
                                className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getSecurityLevelColor(
                                  detailedLocationInfo.delivery.security
                                )} bg-opacity-20 border whitespace-nowrap`}
                              >
                                {detailedLocationInfo.delivery.security} Security
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Route Intelligence Summary */}
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs">
                          <span className="font-medium text-gray-800">
                            Route Intelligence:
                          </span>
                          <div className="flex flex-wrap gap-2 sm:gap-4">
                            <span className="text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></div>
                              Real-time data
                            </span>
                            <span className="text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></div>
                              Access analysis
                            </span>
                            <span className="text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></div>
                              POI mapping
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Special Requirements - Mobile */}
              {requirements?.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg shadow-sm w-full overflow-hidden transition-colors duration-300">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-slate-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 break-words">
                      Special Requirements
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {requirements?.map((req, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-400 text-xs rounded-full border border-orange-200 dark:border-orange-800 shadow-sm whitespace-nowrap transition-colors duration-300"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info - Mobile */}
              <div className="flex flex-col text-xs text-gray-500 pt-3 border-t border-gray-200 gap-2">
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                    <span>Created: {moment(load.createdAt).format("llll")}</span>
                  </span>
                  {load.viewCount > 0 && (
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                      Views: {load.viewCount}
                    </span>
                  )}
                  {load.rating > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                      <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      <span>{load.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Broker Management Notice */}
              {load.broker && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-800">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm font-medium">Managed by Broker</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    This load is being managed by a broker. Contact your broker for changes.
                  </p>
                </div>
              )}

              {/* Action Buttons - Mobile */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                {!load.broker && (
                  <button
                    className="flex-1 min-w-[120px] px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-300 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    onClick={() => handleEditClick()}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {handleAssignBroker && !load.broker && (
                  <button
                    className="flex-1 min-w-[120px] px-4 py-2.5 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 rounded-lg font-medium text-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-300 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    onClick={() => handleAssignBroker(load)}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden xs:inline">Assign Broker</span>
                    <span className="xs:hidden">Assign</span>
                  </button>
                )}
                {handleAssignReceiver && (
                  <button
                    className={`flex-1 min-w-[120px] px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-lg font-medium text-sm flex items-center justify-center gap-2 touch-manipulation min-h-[44px] transition-colors duration-300 ${load.receiverId
                        ? 'text-gray-400 dark:text-slate-600 border-gray-200 dark:border-slate-700 cursor-not-allowed'
                        : 'text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors'
                      }`}
                    onClick={() => !load.receiverId && handleAssignReceiver(load)}
                    disabled={!!load.receiverId}
                    title={load.receiverId ? "Receiver already assigned" : "Assign Receiver"}
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden xs:inline">{load.receiverId ? "Receiver Assigned" : "Assign Receiver"}</span>
                    <span className="xs:hidden">{load.receiverId ? "Assigned" : "Recv"}</span>
                  </button>
                )}
                {handleUnassignBroker && load.broker && (
                  <button
                    className="flex-1 min-w-[120px] px-4 py-2.5 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700 rounded-lg font-medium text-sm hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-300 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    onClick={() => handleUnassignBroker(load)}
                  >
                    <UserX className="w-4 h-4" />
                    <span className="hidden xs:inline">Unassign Broker</span>
                    <span className="xs:hidden">Unassign</span>
                  </button>
                )}
                {!load.broker && (
                  <button
                    className="flex-1 min-w-[120px] px-4 py-2.5 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-300 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                    onClick={() => handleDeleteCargo(load)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex max-lg:items-start justify-between max-lg:flex-col gap-4 w-full">
        <div className="flex-1 max-lg:w-full min-w-0 max-w-full overflow-hidden">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1 max-w-full overflow-hidden">
              <div className="flex-shrink-0 mt-1 sm:mt-0">
                {getCargoTypeIcon(load.cargoType)}
              </div>
              <div className="min-w-0 flex-1 max-w-full overflow-hidden">
                <h3 className="text-lg font-black text-[#0f172a] dark:text-slate-100 tracking-tight group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">
                  {load.title ||
                    `${getCargoTypeDisplayName(load.cargoType)} Shipment`}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                  {load.description || "Cargo shipment details"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 sm:flex-shrink-0 w-full sm:w-auto">
              <span
                className={cn(
                  `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all`,
                  getStatusColor(load.status)
                )}
              >
                {getStatusDisplayName(load.status)}
              </span>
              {load.urgencyLevel && (
                <span
                  className={cn(
                    `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all`,
                    getUrgencyColor(load.urgencyLevel)
                  )}
                >
                  {load.urgencyLevel}
                </span>
              )}
              {(() => {
                const enrichedDetails = getEnrichedLocationDetails(load);
                if (enrichedDetails?.pickup || enrichedDetails?.delivery) {
                  return (
                    <span className="px-2 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 shadow-sm whitespace-nowrap flex items-center transition-colors duration-300">
                      <Globe className="w-3 h-3 inline mr-1 flex-shrink-0" />
                      <span className="hidden xs:inline">OSM Data</span>
                      <span className="xs:hidden">OSM</span>
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Cargo Details - Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6 w-full">
            <SmCard
              Icon={MapPin}
              title={getLocationDisplay(load)}
              content={(() => {
                const enrichedDetails = getEnrichedLocationDetails(load);
                if (enrichedDetails?.pickup || enrichedDetails?.delivery) {
                  return (
                    <span className="text-xs text-primary-600 flex items-center mt-1">
                      <Globe className="w-3 h-3 mr-1" />
                      Enhanced location data
                    </span>
                  );
                } else if (
                  load.pickupLocation?.coordinates ||
                  load.deliveryLocation?.coordinates
                ) {
                  return (
                    <span className="text-xs text-gray-500 flex items-center mt-1">
                      Location data available
                    </span>
                  );
                }
                return null;
              })()}
            />

            <SmCard
              Icon={Calendar}
              title="Pickup Date"
              content={moment(load.pickupDate).format("lll")}
            />

            <SmCard
              Icon={Weight}
              title="Weight"
              content={formatWeight(load.weight)}
            />

            {load.volume && (
              <SmCard
                Icon={Box}
                title="Volume"
                content={formatVolume(load.volume)}
              />
            )}

            <SmCard
              Icon={DollarSign}
              title="Value"
              content={compactCurrency(load.loadValue, load.currencyCode)}
            />

            {load.offeredPrice && (
              <SmCard
                Icon={TrendingUp}
                title="Offered"
                content={compactCurrency(load.offeredPrice, load.currencyCode)}
              />
            )}

            {(load.brokerId || load.broker) && (
              <SmCard
                Icon={Briefcase}
                title="Broker"
                content={
                  load.broker?.profile?.companyName ||
                  (load.broker?.profile?.firstName && load.broker?.profile?.lastName
                    ? `${load.broker.profile.firstName} ${load.broker.profile.lastName}`
                    : load.broker?.email || 'Broker Assigned')
                }
              />
            )}
          </div>

          {/* Enhanced Location Information from OSM - Desktop */}
          {(() => {
            const detailedLocationInfo = getDetailedLocationInfo(load);

            if (detailedLocationInfo.hasEnrichedData) {
              return (
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm w-full overflow-hidden transition-colors duration-300">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-slate-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-800 break-words">
                      Enhanced Location Intelligence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Pickup Location Enhanced */}
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm transition-colors duration-300">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                        <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">
                          Pickup Location
                        </span>
                        <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded flex-shrink-0">
                          {getLocationTypeIcon(
                            detailedLocationInfo.pickup.type
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="font-medium text-gray-900 break-words">
                          {detailedLocationInfo.pickup.name}
                        </div>
                        <div className="text-gray-600 break-words">
                          {detailedLocationInfo.pickup.address}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getAccessTypeColor(
                              detailedLocationInfo.pickup.access
                            )} bg-opacity-20 border whitespace-nowrap`}
                          >
                            {detailedLocationInfo.pickup.access} Access
                          </span>
                          <span
                            className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getSecurityLevelColor(
                              detailedLocationInfo.pickup.security
                            )} bg-opacity-20 border whitespace-nowrap`}
                          >
                            {detailedLocationInfo.pickup.security} Security
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Location Enhanced */}
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm transition-colors duration-300">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                        <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300">
                          Delivery Location
                        </span>
                        <div className="p-1 bg-gray-100 dark:bg-slate-700 rounded flex-shrink-0">
                          {getLocationTypeIcon(
                            detailedLocationInfo.delivery.type
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="font-medium text-gray-900 break-words">
                          {detailedLocationInfo.delivery.name}
                        </div>
                        <div className="text-gray-600 break-words">
                          {detailedLocationInfo.delivery.address}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getAccessTypeColor(
                              detailedLocationInfo.delivery.access
                            )} bg-opacity-20 border whitespace-nowrap`}
                          >
                            {detailedLocationInfo.delivery.access} Access
                          </span>
                          <span
                            className={`text-xs px-2 sm:px-3 py-1 rounded-full ${getSecurityLevelColor(
                              detailedLocationInfo.delivery.security
                            )} bg-opacity-20 border whitespace-nowrap`}
                          >
                            {detailedLocationInfo.delivery.security} Security
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Intelligence Summary */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs">
                      <span className="font-medium text-gray-800">
                        Route Intelligence:
                      </span>
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        <span className="text-gray-600 flex items-center">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></div>
                          Real-time data
                        </span>
                        <span className="text-gray-600 flex items-center">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></div>
                          Access analysis
                        </span>
                        <span className="text-gray-600 flex items-center">
                          <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 flex-shrink-0"></div>
                          POI mapping
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Special Requirements - Desktop */}
          {requirements?.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 rounded-lg shadow-sm group-hover:shadow w-full overflow-hidden transition-colors duration-300">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-gray-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-slate-400" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 break-words">
                  Special Requirements
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {requirements?.map((req, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 bg-white text-orange-700 text-xs rounded-full border border-orange-200 shadow-sm whitespace-nowrap"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Broker Management Notice - Desktop */}
          {load.broker && (
            <div className="mb-4 sm:mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-800 mb-2">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-semibold">Managed by Broker</span>
              </div>
              <p className="text-sm text-purple-700">
                This load is being managed by a broker. Editing and deletion are restricted. Contact your broker for any changes or unassign the broker to regain full control.
              </p>
            </div>
          )}

          {/* Additional Info - Desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 pt-3 sm:pt-4 border-t border-gray-200 gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                <span className="truncate">Created: {moment(load.createdAt).format("llll")}</span>
              </span>
              {load.viewCount > 0 && (
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  Views: {load.viewCount}
                </span>
              )}
              {load.rating > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                  <span>{load.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="sm:ml-6 relative flex items-center sm:items-center lg:items-center lg:justify-center max-lg:w-full max-lg:justify-end flex-shrink-0">
          <div className="flex items-center lg:flex-col gap-2 lg:sticky lg:top-32">
            <button
              className="p-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              title="View Details"
              onClick={() => handleViewClick(load)}
            >
              <Eye className="w-4 h-4" />
            </button>
            {isLoadingConfirmable(load.status) && (
              <button
                className="p-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                title="Confirm Cargo Loaded"
                onClick={() => handleConfirmLoading(load)}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            {!load.broker && (
              <button
                className="p-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                title="Edit Cargo"
                onClick={handleEditClick}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {!load.broker && (
              <button
                className="p-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                title="Delete Cargo"
                onClick={() => handleDeleteCargo(load)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {handleAssignBroker && !load.broker && (
              <button
                className="p-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                title="Assign Broker"
                onClick={() => handleAssignBroker(load)}
              >
                <User className="w-4 h-4" />
              </button>
            )}
            {handleAssignReceiver && (
              <button
                className={`p-3 bg-white dark:bg-slate-800 rounded-xl transition-all duration-300 shadow-sm ${load.receiverId
                    ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed hover:shadow-sm'
                    : 'text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:shadow-md'
                  }`}
                title={load.receiverId ? "Receiver already assigned" : "Assign Receiver"}
                onClick={() => !load.receiverId && handleAssignReceiver(load)}
                disabled={!!load.receiverId}
              >
                <Users className="w-4 h-4" />
              </button>
            )}
            {handleUnassignBroker && load.broker && (
              <button
                className="p-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                title="Unassign Broker"
                onClick={() => handleUnassignBroker(load)}
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
