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
  UserX,
  UserCheck,
  Briefcase,
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
  formatCurrency,
  isLoadingConfirmable,
} from "../../utils";
import type { Cargo } from "@/types/cargo";
import SmCard from "./SmCard";
import moment from "moment";
import { cn } from "@/utils/cn";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CargoFormSchemaType } from "../../../create/components/form/cargoFormSchema";
import { encodeUrl } from "@/utils/url";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LoadItem({
  load,
  handleViewClick,
  handleConfirmLoading,
  handleDeleteCargo,
  handleEditCargo,
  handleAssignBroker,
  handleUnassignBroker,
}: {
  load: Cargo;
  handleViewClick: (load: Cargo) => void;
  handleConfirmLoading: (load: Cargo) => void;
  handleDeleteCargo: (load: Cargo) => void;
  handleEditCargo?: (load: Cargo) => void;
  handleAssignBroker?: (load: Cargo) => void;
  handleUnassignBroker?: (load: Cargo) => void;
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
    <div className="group p-4 sm:p-6 lg:p-8 transition-all duration-300 border-l-4 border-l-teal-500 shadow hover:shadow-md hover:-translate-y-1 rounded-lg bg-gray-100 hover:bg-white overflow-hidden w-full max-w-full">
      {/* Mobile Simplified View */}
      <div className="sm:hidden">
        {!showMobileDetails ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  {getCargoTypeIcon(load.cargoType)}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="text-base font-semibold text-gray-900 break-words overflow-wrap-anywhere">
                    {load.title ||
                      `${getCargoTypeDisplayName(load.cargoType)} Shipment`}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-end gap-2">
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
                <button
                  onClick={() => setShowMobileDetails(true)}
                  className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  title="View Details"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => setShowMobileDetails(false)}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
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
                    <span className="text-xs text-teal-600 flex items-center mt-1">
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
                      <MapPin className="w-3 h-3 mr-1" />
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
              content={formatCurrency(load.loadValue, load.currencyCode)}
            />

            {load.offeredPrice && (
              <SmCard
                Icon={TrendingUp}
                title="Offered"
                content={formatCurrency(load.offeredPrice, load.currencyCode)}
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
                    <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-white rounded-xl border border-teal-200 shadow-sm w-full overflow-hidden">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-teal-100 rounded-lg flex-shrink-0">
                          <Globe className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                        <span className="text-xs font-medium text-teal-800 break-words">
                          Enhanced Location Intelligence
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                    {/* Pickup Location Enhanced */}
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                        <div className="w-3 h-3 bg-teal-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Pickup Location
                        </span>
                        <div className="p-1 bg-gray-100 rounded flex-shrink-0">
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
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                        <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Delivery Location
                        </span>
                        <div className="p-1 bg-gray-100 rounded flex-shrink-0">
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
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-teal-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs">
                      <span className="font-medium text-teal-800">
                        Route Intelligence:
                      </span>
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1 flex-shrink-0"></div>
                          Real-time data
                        </span>
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1 flex-shrink-0"></div>
                          Access analysis
                        </span>
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1 flex-shrink-0"></div>
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
                <div className="mb-4 p-3 bg-gray-50 rounded-lg shadow-sm w-full overflow-hidden">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
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
              
              {/* Action Buttons - Mobile */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => handleEditClick()}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                {handleAssignBroker && !load.broker && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-white text-purple-600 border border-purple-300 rounded-lg font-medium text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleAssignBroker(load)}
                  >
                    <User className="w-4 h-4" />
                    Assign Broker
                  </button>
                )}
                {handleUnassignBroker && load.broker && (
                  <button
                    className="flex-1 px-4 py-2.5 bg-white text-orange-600 border border-orange-300 rounded-lg font-medium text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleUnassignBroker(load)}
                  >
                    <UserX className="w-4 h-4" />
                    Unassign Broker
                  </button>
                )}
                <button
                  className="flex-1 px-4 py-2.5 bg-white text-red-600 border border-red-300 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  onClick={() => handleDeleteCargo(load)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words overflow-wrap-anywhere">
                  {load.title ||
                    `${getCargoTypeDisplayName(load.cargoType)} Shipment`}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words overflow-wrap-anywhere line-clamp-3 sm:line-clamp-none">
                  {load.description || "Cargo shipment details"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 sm:flex-shrink-0 w-full sm:w-auto">
              <span
                className={cn(
                  `px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium shadow-sm group-hover:shadow whitespace-nowrap`,
                  getStatusColor(load.status)
                )}
              >
                {getStatusDisplayName(load.status)}
              </span>
              {load.urgencyLevel && (
                <span
                  className={cn(
                    `px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium shadow-sm group-hover:shadow whitespace-nowrap`,
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
                    <span className="px-2 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 shadow-sm whitespace-nowrap flex items-center">
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
                    <span className="text-xs text-teal-600 flex items-center mt-1">
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
                      <MapPin className="w-3 h-3 mr-1" />
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
              content={formatCurrency(load.loadValue, load.currencyCode)}
            />

            {load.offeredPrice && (
              <SmCard
                Icon={TrendingUp}
                title="Offered"
                content={formatCurrency(load.offeredPrice, load.currencyCode)}
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
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-teal-50 to-white rounded-xl border border-teal-200 shadow-sm w-full overflow-hidden">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 bg-teal-100 rounded-lg flex-shrink-0">
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-teal-800 break-words">
                      Enhanced Location Intelligence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Pickup Location Enhanced */}
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                        <div className="w-3 h-3 bg-teal-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Pickup Location
                        </span>
                        <div className="p-1 bg-gray-100 rounded flex-shrink-0">
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
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                        <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          Delivery Location
                        </span>
                        <div className="p-1 bg-gray-100 rounded flex-shrink-0">
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
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-teal-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs">
                      <span className="font-medium text-teal-800">
                        Route Intelligence:
                      </span>
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1 flex-shrink-0"></div>
                          Real-time data
                        </span>
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1 flex-shrink-0"></div>
                          Access analysis
                        </span>
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1 flex-shrink-0"></div>
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
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg shadow-sm group-hover:shadow w-full overflow-hidden">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
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
              className="p-3 bg-white text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              title="View Details"
              onClick={() => handleViewClick(load)}
            >
              <Eye className="w-4 h-4" />
            </button>
            {isLoadingConfirmable(load.status) && (
              <button
                className="p-3 bg-white text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                title="Confirm Cargo Loaded"
                onClick={() => handleConfirmLoading(load)}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            <button
              className="p-3 bg-white text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              title="Edit Cargo"
              onClick={handleEditClick}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              className="p-3 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              title="Delete Cargo"
              onClick={() => handleDeleteCargo(load)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {handleAssignBroker && !load.broker && (
              <button
                className="p-3 bg-white text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                title="Assign Broker"
                onClick={() => handleAssignBroker(load)}
              >
                <User className="w-4 h-4" />
              </button>
            )}
            {handleUnassignBroker && load.broker && (
              <button
                className="p-3 bg-white text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
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
