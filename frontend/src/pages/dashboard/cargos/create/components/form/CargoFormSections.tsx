import { PACKAGING_TYPES, URGENCY_LEVELS } from "@/constants/cargo";
import { type CargoFormData } from "@/types/cargo";
import React from "react";
import {
  FaRulerCombined,
  FaThermometerHalf,
  FaTruck,
  FaShieldAlt,
  FaMapMarkedAlt,
  FaClock,
  FaCameraRetro,
} from "react-icons/fa";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";

interface CargoFormSectionsProps {
  formData: CargoFormData;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeSection: string;
}

const CargoFormSections: React.FC<CargoFormSectionsProps> = ({
  formData,
  handleChange,
  handleNumberChange,
  activeSection,
}) => {
  // Dimensions & Packaging Section
  if (activeSection === "dimensions") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaRulerCombined className="w-5 h-5 mr-2" />
          Dimensions & Packaging
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="length">Length (m)</Label>
            <Input
              type="number"
              id="length"
              name="length"
              value={formData.length || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              placeholder="Enter length"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Width (m)</Label>
            <Input
              type="number"
              id="width"
              name="width"
              value={formData.width || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              placeholder="Enter width"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height (m)</Label>
            <Input
              type="number"
              id="height"
              name="height"
              value={formData.height || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              placeholder="Enter height"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stackableHeight">Stackable Height (m)</Label>
            <Input
              type="number"
              id="stackableHeight"
              name="stackableHeight"
              value={formData.stackableHeight || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              placeholder="Enter stackable height"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packagingType">Packaging Type</Label>
            <Select
              name="packagingType"
              value={formData.packagingType || ""}
              onValueChange={(value) => {
                const event = {
                  target: { name: "packagingType", value },
                } as any;
                handleChange(event);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select packaging type" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfPieces">Number of Pieces</Label>
            <Input
              type="number"
              id="numberOfPieces"
              name="numberOfPieces"
              value={formData.numberOfPieces || ""}
              onChange={handleNumberChange}
              min="0"
              placeholder="Enter number of pieces"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfPallets">Number of Pallets</Label>
            <Input
              type="number"
              id="numberOfPallets"
              name="numberOfPallets"
              value={formData.numberOfPallets || ""}
              onChange={handleNumberChange}
              min="0"
              placeholder="Enter number of pallets"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isStackable"
            checked={formData.isStackable}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Cargo can be stacked</span>
        </div>
      </div>
    );
  }

  // Environmental Requirements Section
  if (activeSection === "environmental") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaThermometerHalf className="w-5 h-5 mr-2" />
          Environmental Requirements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="temperatureMin">Minimum Temperature (°C)</Label>
            <Input
              type="number"
              id="temperatureMin"
              name="temperatureMin"
              value={formData.temperatureMin || ""}
              onChange={handleNumberChange}
              step="0.1"
              placeholder="Enter minimum temperature"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperatureMax">Maximum Temperature (°C)</Label>
            <Input
              type="number"
              id="temperatureMax"
              name="temperatureMax"
              value={formData.temperatureMax || ""}
              onChange={handleNumberChange}
              step="0.1"
              placeholder="Enter maximum temperature"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hazmatClass">Hazmat Class</Label>
            <Input
              type="text"
              id="hazmatClass"
              name="hazmatClass"
              value={formData.hazmatClass || ""}
              onChange={handleChange}
              placeholder="Enter UN hazmat class"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hazmatNumber">Hazmat Number</Label>
            <Input
              type="text"
              id="hazmatNumber"
              name="hazmatNumber"
              value={formData.hazmatNumber || ""}
              onChange={handleChange}
              placeholder="Enter UN hazmat number"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="requiresHumidityControl"
            checked={formData.requiresHumidityControl}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">
            Requires humidity control
          </span>
        </div>
      </div>
    );
  }

  // Loading & Unloading Section
  if (activeSection === "loading") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaTruck className="w-5 h-5 mr-2" />
          Loading & Unloading Requirements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="loadingTimeEstimate">
              Loading Time Estimate (hours)
            </Label>
            <Input
              type="number"
              id="loadingTimeEstimate"
              name="loadingTimeEstimate"
              value={formData.loadingTimeEstimate || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.5"
              placeholder="Enter loading time estimate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unloadingTimeEstimate">
              Unloading Time Estimate (hours)
            </Label>
            <Input
              type="number"
              id="unloadingTimeEstimate"
              name="unloadingTimeEstimate"
              value={formData.unloadingTimeEstimate || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.5"
              placeholder="Enter unloading time estimate"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresForklift"
              checked={formData.requiresForklift}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires forklift for loading/unloading
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresCrane"
              checked={formData.requiresCrane}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires crane for loading/unloading
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresLoadingDock"
              checked={formData.requiresLoadingDock}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Requires loading dock</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loadingInstructions">Loading Instructions</Label>
          <Textarea
            id="loadingInstructions"
            name="loadingInstructions"
            value={formData.loadingInstructions || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Enter specific loading instructions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unloadingInstructions">Unloading Instructions</Label>
          <Textarea
            id="unloadingInstructions"
            name="unloadingInstructions"
            value={formData.unloadingInstructions || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Enter specific unloading instructions"
          />
        </div>
      </div>
    );
  }

  // Security & Insurance Section
  if (activeSection === "security") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaShieldAlt className="w-5 h-5 mr-2" />
          Security & Insurance Requirements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="insuranceValue">Insurance Value ($)</Label>
            <Input
              type="number"
              id="insuranceValue"
              name="insuranceValue"
              value={formData.insuranceValue || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              placeholder="Enter insurance value"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresGpsMonitoring"
              checked={formData.requiresGpsMonitoring}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires GPS monitoring during transit
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresTemperatureMonitoring"
              checked={formData.requiresTemperatureMonitoring}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires temperature monitoring during transit
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContactInfo">
            Emergency Contact Information
          </Label>
          <Textarea
            id="emergencyContactInfo"
            name="emergencyContactInfo"
            value={formData.emergencyContactInfo || ""}
            onChange={handleChange}
            rows={3}
            placeholder="Enter emergency contact information"
          />
        </div>
      </div>
    );
  }

  // Route & Access Section
  if (activeSection === "route") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaMapMarkedAlt className="w-5 h-5 mr-2" />
          Route & Access Requirements
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maxClearanceHeight">
              Maximum Clearance Height (m)
            </Label>
            <Input
              type="number"
              id="maxClearanceHeight"
              name="maxClearanceHeight"
              value={formData.maxClearanceHeight || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              placeholder="Enter maximum clearance height"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresLowClearanceRoute"
              checked={formData.requiresLowClearanceRoute}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires low clearance route planning
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresEscortVehicle"
              checked={formData.requiresEscortVehicle}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires escort vehicle
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Urgency & Timing Section
  if (activeSection === "urgency") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaClock className="w-5 h-5 mr-2" />
          Urgency & Timing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="urgencyLevel">Urgency Level</Label>
            <Select
              name="urgencyLevel"
              value={formData.urgencyLevel || "NORMAL"}
              onValueChange={(value) => {
                const event = {
                  target: { name: "urgencyLevel", value },
                } as any;
                handleChange(event);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTransitTime">Maximum Transit Time (hours)</Label>
            <Input
              type="number"
              id="maxTransitTime"
              name="maxTransitTime"
              value={formData.maxTransitTime || ""}
              onChange={handleNumberChange}
              min="0"
              step="0.5"
              placeholder="Enter maximum transit time"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isTimeCritical"
            checked={formData.isTimeCritical}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Time critical cargo</span>
        </div>
      </div>
    );
  }

  // Quality & Inspection Section
  if (activeSection === "quality") {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaCameraRetro className="w-5 h-5 mr-2" />
          Quality & Inspection Requirements
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresPreShipmentInspection"
              checked={formData.requiresPreShipmentInspection}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires pre-shipment inspection
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresDeliveryInspection"
              checked={formData.requiresDeliveryInspection}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires delivery inspection
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresPhotographicDocumentation"
              checked={formData.requiresPhotographicDocumentation}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Requires photographic documentation
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialHandlingInstructions">
            Special Handling Instructions
          </Label>
          <Textarea
            id="specialHandlingInstructions"
            name="specialHandlingInstructions"
            value={formData.specialHandlingInstructions || ""}
            onChange={handleChange}
            rows={4}
            placeholder="Enter special handling instructions"
          />
        </div>
      </div>
    );
  }

  // Default case - show basic section
  return null;
};

export default CargoFormSections;
