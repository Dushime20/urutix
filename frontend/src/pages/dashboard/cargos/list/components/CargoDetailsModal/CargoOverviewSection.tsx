import {
  Package,
  Weight,
  Volume,
  DollarSign,
  TrendingUp,
  Zap,
  AlertTriangle,
  MapPin,
  Calendar,
  Globe,
  Users,
  Mail,
  Info,
  Star,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  formatCurrency,
  formatVolume,
  formatWeight,
  getCargoTypeDisplayName,
  getCargoTypeIcon,
  getEnrichedLocationDetails,
  getSpecialRequirements,
  getStatusColor,
  getStatusDisplayName,
  getUrgencyColor,
  hasValidAddress,
  getAddressDisplay,
} from "../../utils";
import type { Cargo } from "@/types/cargo";
import moment from "moment";

interface CargoOverviewSectionProps {
  cargo: Cargo;
}

const CargoOverviewSection = ({ cargo }: CargoOverviewSectionProps) => {
  const requirements = getSpecialRequirements?.(cargo);
  const enrichedDetails = getEnrichedLocationDetails(cargo);

  console.log(enrichedDetails);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Cargo Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Cargo Information
            </h3>
            {getCargoTypeIcon(cargo.cargoType)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                {cargo.title}
              </h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {cargo.description || "No description provided"}
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="text-sm text-gray-500">Type</span>
                    <p className="text-sm font-medium text-gray-900">
                      {getCargoTypeDisplayName(cargo.cargoType)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Weight className="w-5 h-5 text-green-500" />
                  <div>
                    <span className="text-sm text-gray-500">Weight</span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatWeight(cargo.weight)}
                    </p>
                  </div>
                </div>

                {cargo.volume && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Volume className="w-5 h-5 text-purple-500" />
                    <div>
                      <span className="text-sm text-gray-500">Volume</span>
                      <p className="text-sm font-medium text-gray-900">
                        {formatVolume(cargo.volume)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="text-sm text-gray-500">Value</span>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(cargo.loadValue, cargo.currencyCode)}
                    </p>
                  </div>
                </div>

                {cargo.offeredPrice && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <div>
                      <span className="text-sm text-gray-500">
                        Offered Price
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(cargo.offeredPrice, cargo.currencyCode)}
                      </p>
                    </div>
                  </div>
                )}

                {cargo.urgencyLevel && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <span className="text-sm text-gray-500">Urgency</span>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getUrgencyColor(cargo.urgencyLevel)
                        )}
                      >
                        {cargo.urgencyLevel}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Special Requirements
              </h4>
              <div className="space-y-3 mb-6">
                {requirements?.length > 0 ? (
                  requirements?.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <span className="text-sm text-amber-800">{req}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">
                      No special requirements
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Cargo Details */}
              {(cargo.length || cargo.width || cargo.height) && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Dimensions</h4>
                  <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {cargo.length && <div>Length: {cargo.length} cm</div>}
                    {cargo.width && <div>Width: {cargo.width} cm</div>}
                    {cargo.height && <div>Height: {cargo.height} cm</div>}
                    {cargo.isStackable && (
                      <div className="text-emerald-600 font-medium">
                        ✓ Stackable
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(cargo.temperatureMin || cargo.temperatureMax) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Temperature Range
                  </h4>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {cargo.temperatureMin}°C - {cargo.temperatureMax}°C
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
            Locations
          </h3>

          {enrichedDetails && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Real Location Data (OpenStreetMap)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Location Enhanced */}
                {enrichedDetails.pickup && hasValidAddress(cargo.pickupLocation) ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <h4 className="font-medium text-gray-900">
                        Pickup Location
                      </h4>
                    </div>

                    <div className="space-y-3 text-sm bg-white p-4 rounded-lg border border-gray-200">
                      <div>
                        <strong className="text-gray-700">Address:</strong>{" "}
                        <span className="text-gray-900">
                          {enrichedDetails.pickup.fullAddress ||
                            enrichedDetails.pickup.address}
                        </span>
                      </div>
                      {enrichedDetails.pickup.administrativeAreas && (
                        <>
                          <div>
                            <strong className="text-gray-700">District:</strong>{" "}
                            <span className="text-gray-900">
                              {
                                enrichedDetails.pickup.administrativeAreas
                                  .district
                              }
                            </span>
                          </div>
                          <div>
                            <strong className="text-gray-700">Province:</strong>{" "}
                            <span className="text-gray-900">
                              {
                                enrichedDetails.pickup.administrativeAreas
                                  .province
                              }
                            </span>
                          </div>
                          <div>
                            <strong className="text-gray-700">Country:</strong>{" "}
                            <span className="text-gray-900">
                              {enrichedDetails?.pickup?.country}
                            </span>
                          </div>
                        </>
                      )}
                      {enrichedDetails.pickup.locationCategory && (
                        <div>
                          <strong className="text-gray-700">Category:</strong>{" "}
                          <span className="text-gray-900">
                            {enrichedDetails.pickup.locationCategory}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Delivery Location Enhanced */}
                {enrichedDetails.delivery && hasValidAddress(cargo.deliveryLocation) ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <h4 className="font-medium text-gray-900">
                        Delivery Location
                      </h4>
                    </div>

                    <div className="space-y-3 text-sm bg-white p-4 rounded-lg border border-gray-200">
                      <div>
                        <strong className="text-gray-700">Address:</strong>{" "}
                        <span className="text-gray-900">
                          {enrichedDetails.delivery.fullAddress ||
                            enrichedDetails.delivery.address}
                        </span>
                      </div>
                      {enrichedDetails.delivery.administrativeAreas && (
                        <>
                          <div>
                            <strong className="text-gray-700">District:</strong>{" "}
                            <span className="text-gray-900">
                              {
                                enrichedDetails.delivery.administrativeAreas
                                  .district
                              }
                            </span>
                          </div>
                          <div>
                            <strong className="text-gray-700">Province:</strong>{" "}
                            <span className="text-gray-900">
                              {
                                enrichedDetails.delivery.administrativeAreas
                                  .province
                              }
                            </span>
                          </div>
                          <div>
                            <strong className="text-gray-700">Country:</strong>{" "}
                            <span className="text-gray-900">
                              {enrichedDetails?.delivery?.country}
                            </span>
                          </div>
                        </>
                      )}
                      {enrichedDetails.delivery.locationCategory && (
                        <div>
                          <strong className="text-gray-700">Category:</strong>{" "}
                          <span className="text-gray-900">
                            {enrichedDetails.delivery.locationCategory}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}

          {/* Original Location Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pickup Location */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <h4 className="font-medium text-gray-900">Pickup Location</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700">
                    {getAddressDisplay(cargo.pickupLocation)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700">
                    Date: {new Date(cargo.pickupDate).toLocaleDateString()}
                  </span>
                </div>

                {cargo.pickupLocation?.coordinates && hasValidAddress(cargo.pickupLocation) && (
                  <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                    Coordinates:{" "}
                    {cargo.pickupLocation.coordinates.latitude.toFixed(4)},{" "}
                    {cargo.pickupLocation.coordinates.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Location */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-red-50 to-pink-50">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h4 className="font-medium text-gray-900">Delivery Location</h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    {getAddressDisplay(cargo.deliveryLocation)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    Date: {new Date(cargo.deliveryDate).toLocaleDateString()}
                  </span>
                </div>

                {cargo.deliveryLocation?.coordinates && hasValidAddress(cargo.deliveryLocation) && (
                  <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                    Coordinates:{" "}
                    {cargo.deliveryLocation.coordinates.latitude.toFixed(4)},{" "}
                    {cargo.deliveryLocation.coordinates.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <Info className="w-4 h-4 mr-2 text-purple-600" />
            Status Information
          </h3>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                <span
                  className={cn(
                    `px-2 py-1 rounded-full text-xs font-medium`,
                    getStatusColor(cargo.status)
                  )}
                >
                  {getStatusDisplayName(cargo.status)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-600">Urgency Level</span>
              <p className="text-sm font-medium text-gray-900">
                {cargo.urgencyLevel || "Normal"}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <p className="text-sm font-medium text-gray-900">
                {moment(cargo.createdAt).format("lll")}
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <p className="text-sm font-medium text-gray-900">
                {moment(cargo.updatedAt).format("lll")}
              </p>
            </div>

            {cargo.viewCount > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">Views</span>
                <p className="text-sm font-medium text-gray-900">
                  {cargo.viewCount}
                </p>
              </div>
            )}

            {cargo.rating > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">Rating</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {cargo.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cargo Owner */}
        {cargo.cargoOwner && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Cargo Owner
            </h3>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">
                  {cargo.cargoOwner.email}
                </span>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">
                  {cargo.cargoOwner.email}
                </span>
              </div>

              {cargo.cargoOwner.profile && (
                <>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700">
                      {cargo.cargoOwner.profile.firstName}{" "}
                      {cargo.cargoOwner.profile.lastName}
                    </span>
                  </div>

                  {cargo.cargoOwner.profile.companyName && (
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-700">
                        {cargo.cargoOwner.profile.companyName}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoOverviewSection;
