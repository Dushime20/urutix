import React from "react";
import { type CargoFormSchemaType } from "./cargoFormSchema";
import {
  FaLocationArrow,
  FaMapMarkerAlt,
  FaCalendar,
  FaMapPin,
} from "react-icons/fa";
import { Input, Label } from "@/components/ui";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Icon } from "leaflet";
import LocationItem from "../LocationItem";
import "leaflet/dist/leaflet.css";
import {
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

interface Location {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface RouteInformationSectionProps {
  formData: CargoFormSchemaType;
  register: UseFormRegister<CargoFormSchemaType>;
  setValue: UseFormSetValue<CargoFormSchemaType>;
  errors: FieldErrors<CargoFormSchemaType>;
  pickupLocation: Location | null;
  deliveryLocation: Location | null;
  activeLocation: "pickup" | "delivery" | null;
  setActiveLocation: (location: "pickup" | "delivery" | null) => void;
  MapClickHandler: React.ComponentType<{
    onMapClick: (lat: number, lng: number) => void;
  }>;
  handleMapClick: (lat: number, lng: number) => void;
  createCustomIcon: (color: string) => Icon;
}

export default function RouteInformationSection({
  // formData,
  errors,
  register,
  pickupLocation,
  activeLocation,
  handleMapClick,
  MapClickHandler,
  deliveryLocation,
  createCustomIcon,
  setActiveLocation,
}: RouteInformationSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
          <FaLocationArrow className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Route Information
          </h3>
          <p className="text-sm text-gray-600">
            Set pickup and delivery locations with scheduling
          </p>
        </div>
      </div>

      {/* Location Selection Card */}
      <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaMapMarkerAlt className="w-4 h-4 text-green-600" />
          <h4 className="font-medium text-gray-900">Locations *</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <LocationItem
            type="pickup"
            location={pickupLocation}
            isActive={activeLocation === "pickup"}
            onSelect={() => setActiveLocation("pickup")}
          />
          <LocationItem
            type="delivery"
            location={deliveryLocation}
            isActive={activeLocation === "delivery"}
            onSelect={() => setActiveLocation("delivery")}
          />
        </div>

        {/* Map Container */}
        <div className="relative">
          <div className="h-64 rounded-lg overflow-hidden border border-green-200 shadow-inner">
            <MapContainer
              center={[0, 0]}
              zoom={2}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Pickup Marker */}
              {pickupLocation && (
                <Marker
                  position={[pickupLocation.latitude, pickupLocation.longitude]}
                  icon={createCustomIcon("#3B82F6")}
                />
              )}

              {/* Delivery Marker */}
              {deliveryLocation && (
                <Marker
                  position={[
                    deliveryLocation.latitude,
                    deliveryLocation.longitude,
                  ]}
                  icon={createCustomIcon("#10B981")}
                />
              )}
            </MapContainer>
          </div>

          {/* Active Location Helper */}
          {activeLocation && (
            <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-sm text-yellow-800">
                <FaMapPin className="w-4 h-4 mr-2 text-yellow-600" />
                <span className="font-medium">
                  Click on the map to set{" "}
                  {activeLocation === "pickup" ? "pickup" : "delivery"} location
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scheduling Card */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaCalendar className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-900">Schedule</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="pickupDate" className="font-medium text-gray-700">
              Pickup Date *
            </Label>
            <Input
              id="pickupDate"
              type="date"
              {...register("pickupDate")}
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.pickupDate && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.pickupDate.message || "")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryDate" className="font-medium text-gray-700">
              Delivery Date *
            </Label>
            <Input
              id="deliveryDate"
              type="date"
              {...register("deliveryDate")}
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.deliveryDate && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.deliveryDate.message || "")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
