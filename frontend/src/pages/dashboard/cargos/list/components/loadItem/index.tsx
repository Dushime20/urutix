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
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CargoFormSchemaType } from "../../../create/components/form/cargoFormSchema";
import { encodeUrl } from "@/utils/url";

export default function LoadItem({
  load,
  handleViewClick,
  handleConfirmLoading,
  handleDeleteCargo,
}: {
  load: Cargo;
  handleViewClick: (load: Cargo) => void;
  handleConfirmLoading: (load: Cargo) => void;
  handleDeleteCargo: (load: Cargo) => void;
}) {
  const navigate = useNavigate();

  const requirements = useMemo(() => {
    return getSpecialRequirements(load);
  }, [load]);

  const handleEditCargo = useCallback(
    (load: Cargo) => {
      // Transform the load data to match the CargoFormSchemaType
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
        // Transform carrierPreferences to match the expected schema
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
    },
    [navigate]
  );

  return (
    <div className="group p-8 transition-all duration-300 border-l-4 border-l-teal-500 shadow hover:shadow-md hover:-translate-y-1 rounded-lg bg-gray-100 hover:bg-white">
      <div className="flex max-lg:items-end justify-between max-lg:flex-col">
        <div className="flex-1 max-lg:w-full">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* <div className=""> */}
              {getCargoTypeIcon(load.cargoType)}
              {/* </div> */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {load.title ||
                    `${getCargoTypeDisplayName(load.cargoType)} Shipment`}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {load.description || "Cargo shipment details"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={cn(
                  `px-4 py-2 rounded-full text-xs font-medium shadow-sm group-hover:shadow`,
                  getStatusColor(load.status)
                )}
              >
                {getStatusDisplayName(load.status)}
              </span>
              {load.urgencyLevel && (
                <span
                  className={cn(
                    `px-4 py-2 rounded-full text-xs font-medium shadow-sm group-hover:shadow`,
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
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 shadow-sm">
                      <Globe className="w-3 h-3 inline mr-1" />
                      OSM Data
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Cargo Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
          </div>

          {/* Enhanced Location Information from OSM */}
          {(() => {
            const detailedLocationInfo = getDetailedLocationInfo(load);

            if (detailedLocationInfo.hasEnrichedData) {
              return (
                <div className="mb-6 p-6 bg-gradient-to-r from-teal-50 to-white rounded-xl border border-teal-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Globe className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-teal-800">
                      Enhanced Location Intelligence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pickup Location Enhanced */}
                    <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Pickup Location
                        </span>
                        <div className="p-1 bg-gray-100 rounded">
                          {getLocationTypeIcon(
                            detailedLocationInfo.pickup.type
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-gray-900">
                          {detailedLocationInfo.pickup.name}
                        </div>
                        <div className="text-gray-600">
                          {detailedLocationInfo.pickup.address}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getAccessTypeColor(
                              detailedLocationInfo.pickup.access
                            )} bg-opacity-20 border`}
                          >
                            {detailedLocationInfo.pickup.access} Access
                          </span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getSecurityLevelColor(
                              detailedLocationInfo.pickup.security
                            )} bg-opacity-20 border`}
                          >
                            {detailedLocationInfo.pickup.security} Security
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Location Enhanced */}
                    <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Delivery Location
                        </span>
                        <div className="p-1 bg-gray-100 rounded">
                          {getLocationTypeIcon(
                            detailedLocationInfo.delivery.type
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-gray-900">
                          {detailedLocationInfo.delivery.name}
                        </div>
                        <div className="text-gray-600">
                          {detailedLocationInfo.delivery.address}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getAccessTypeColor(
                              detailedLocationInfo.delivery.access
                            )} bg-opacity-20 border`}
                          >
                            {detailedLocationInfo.delivery.access} Access
                          </span>
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${getSecurityLevelColor(
                              detailedLocationInfo.delivery.security
                            )} bg-opacity-20 border`}
                          >
                            {detailedLocationInfo.delivery.security} Security
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Intelligence Summary */}
                  <div className="mt-4 pt-4 border-t border-teal-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-teal-800">
                        Route Intelligence:
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1"></div>
                          Real-time data
                        </span>
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1"></div>
                          Access analysis
                        </span>
                        <span className="text-teal-600 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-1"></div>
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

          {/* Special Requirements */}
          {requirements?.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm group-hover:shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Special Requirements
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {requirements?.map((req, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white text-orange-700 text-xs rounded-full border border-orange-200 shadow-sm"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                Created: {moment(load.createdAt).format("llll")}
              </span>
              {load.viewCount > 0 && (
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  Views: {load.viewCount}
                </span>
              )}
              {load.rating > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>{load.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-6 relative flex items-center lg:items-center lg:justify-center">
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
              onClick={() => handleEditCargo(load)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
