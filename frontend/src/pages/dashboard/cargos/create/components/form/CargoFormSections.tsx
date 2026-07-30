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

/** Combined wizard steps map to one or more legacy section ids */
const SECTION_GROUPS: Record<string, string[]> = {
  cargo: ["dimensions"],
  schedule: ["route", "urgency"],
  handling: ["environmental", "loading", "security"],
  documents: ["quality"],
  // Legacy / direct ids (create flows that still use old step names)
  dimensions: ["dimensions"],
  environmental: ["environmental"],
  loading: ["loading"],
  security: ["security"],
  route: ["route"],
  urgency: ["urgency"],
  quality: ["quality"],
};

const CargoFormSections: React.FC<CargoFormSectionsProps> = ({
  formData,
  handleChange,
  handleNumberChange,
  activeSection,
}) => {
  const sectionsToShow = SECTION_GROUPS[activeSection] || [];

  if (sectionsToShow.length === 0) return null;

  return (
    <div className="space-y-8">
      {sectionsToShow.includes("dimensions") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaRulerCombined className="w-4 h-4 mr-2" />
            Dimensions & Packaging
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="length" className="text-xs">Length (m)</Label>
              <Input
                type="number"
                id="length"
                name="length"
                value={formData.length || ""}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                placeholder="Enter length"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="width" className="text-xs">Width (m)</Label>
              <Input
                type="number"
                id="width"
                name="width"
                value={formData.width || ""}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                placeholder="Enter width"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="height" className="text-xs">Height (m)</Label>
              <Input
                type="number"
                id="height"
                name="height"
                value={formData.height || ""}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                placeholder="Enter height"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="stackableHeight" className="text-xs">Stackable Height (m)</Label>
              <Input
                type="number"
                id="stackableHeight"
                name="stackableHeight"
                value={formData.stackableHeight || ""}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                placeholder="Enter stackable height"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="packagingType" className="text-xs">Packaging Type</Label>
              <Select
                name="packagingType"
                value={formData.packagingType || ""}
                onValueChange={(value) => {
                  handleChange({ target: { name: "packagingType", value } } as any);
                }}
              >
                <SelectTrigger className="text-sm w-full">
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

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="numberOfPieces" className="text-xs">Number of Pieces</Label>
              <Input
                type="number"
                id="numberOfPieces"
                name="numberOfPieces"
                value={formData.numberOfPieces || ""}
                onChange={handleNumberChange}
                min="0"
                placeholder="Enter number of pieces"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="numberOfPallets" className="text-xs">Number of Pallets</Label>
              <Input
                type="number"
                id="numberOfPallets"
                name="numberOfPallets"
                value={formData.numberOfPallets || ""}
                onChange={handleNumberChange}
                min="0"
                placeholder="Enter number of pallets"
                className="text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isStackable"
              checked={formData.isStackable}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
            />
            <span className="text-xs text-gray-700 dark:text-slate-300">Cargo can be stacked</span>
          </div>
        </div>
      )}

      {sectionsToShow.includes("environmental") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaThermometerHalf className="w-4 h-4 mr-2" />
            Environmental Requirements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="temperatureMin" className="text-xs">Minimum Temperature (°C)</Label>
              <Input
                type="number"
                id="temperatureMin"
                name="temperatureMin"
                value={formData.temperatureMin || ""}
                onChange={handleNumberChange}
                step="0.1"
                placeholder="Enter minimum temperature"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="temperatureMax" className="text-xs">Maximum Temperature (°C)</Label>
              <Input
                type="number"
                id="temperatureMax"
                name="temperatureMax"
                value={formData.temperatureMax || ""}
                onChange={handleNumberChange}
                step="0.1"
                placeholder="Enter maximum temperature"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="hazmatClass" className="text-xs">Hazmat Class</Label>
              <Input
                type="text"
                id="hazmatClass"
                name="hazmatClass"
                value={formData.hazmatClass || ""}
                onChange={handleChange}
                placeholder="Enter UN hazmat class"
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="hazmatNumber" className="text-xs">Hazmat Number</Label>
              <Input
                type="text"
                id="hazmatNumber"
                name="hazmatNumber"
                value={formData.hazmatNumber || ""}
                onChange={handleChange}
                placeholder="Enter UN hazmat number"
                className="text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresHumidityControl"
              checked={formData.requiresHumidityControl}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
            />
            <span className="text-xs text-gray-700 dark:text-slate-300">
              Requires humidity control
            </span>
          </div>
        </div>
      )}

      {sectionsToShow.includes("loading") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaTruck className="w-4 h-4 mr-2" />
            Loading & Unloading Requirements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="loadingTimeEstimate" className="text-xs">
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
                className="text-sm w-full"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="unloadingTimeEstimate" className="text-xs">
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
                className="text-sm w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresForklift"
                checked={formData.requiresForklift}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires forklift for loading/unloading
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresCrane"
                checked={formData.requiresCrane}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires crane for loading/unloading
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresLoadingDock"
                checked={formData.requiresLoadingDock}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">Requires loading dock</span>
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="loadingInstructions" className="text-xs">Loading Instructions</Label>
            <Textarea
              id="loadingInstructions"
              name="loadingInstructions"
              value={formData.loadingInstructions || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Enter specific loading instructions"
              className="text-sm w-full min-w-0"
            />
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="unloadingInstructions" className="text-xs">Unloading Instructions</Label>
            <Textarea
              id="unloadingInstructions"
              name="unloadingInstructions"
              value={formData.unloadingInstructions || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Enter specific unloading instructions"
              className="text-sm w-full min-w-0"
            />
          </div>
        </div>
      )}

      {sectionsToShow.includes("security") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaShieldAlt className="w-4 h-4 mr-2" />
            Security & Insurance Requirements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="insuranceValue" className="text-xs">Insurance Value ($)</Label>
              <Input
                type="number"
                id="insuranceValue"
                name="insuranceValue"
                value={formData.insuranceValue || ""}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                placeholder="Enter insurance value"
                className="text-sm w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresGpsMonitoring"
                checked={formData.requiresGpsMonitoring}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires GPS monitoring during transit
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresTemperatureMonitoring"
                checked={formData.requiresTemperatureMonitoring}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires temperature monitoring during transit
              </span>
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="emergencyContactInfo" className="text-xs">
              Emergency Contact Information
            </Label>
            <Textarea
              id="emergencyContactInfo"
              name="emergencyContactInfo"
              value={formData.emergencyContactInfo || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Enter emergency contact information"
              className="text-sm w-full min-w-0"
            />
          </div>
        </div>
      )}

      {sectionsToShow.includes("route") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaMapMarkedAlt className="w-4 h-4 mr-2" />
            Route & Access Requirements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="maxClearanceHeight" className="text-xs">
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
                className="text-sm w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresLowClearanceRoute"
                checked={formData.requiresLowClearanceRoute}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires low clearance route planning
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresEscortVehicle"
                checked={formData.requiresEscortVehicle}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires escort vehicle
              </span>
            </div>
          </div>
        </div>
      )}

      {sectionsToShow.includes("urgency") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaClock className="w-4 h-4 mr-2" />
            Urgency & Timing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="urgencyLevel" className="text-xs">Urgency Level</Label>
              <Select
                name="urgencyLevel"
                value={formData.urgencyLevel || "NORMAL"}
                onValueChange={(value) => {
                  handleChange({ target: { name: "urgencyLevel", value } } as any);
                }}
              >
                <SelectTrigger className="text-sm w-full">
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

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="maxTransitTime" className="text-xs">Maximum Transit Time (hours)</Label>
              <Input
                type="number"
                id="maxTransitTime"
                name="maxTransitTime"
                value={formData.maxTransitTime || ""}
                onChange={handleNumberChange}
                min="0"
                step="0.5"
                placeholder="Enter maximum transit time"
                className="text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isTimeCritical"
              checked={formData.isTimeCritical}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
            />
            <span className="text-xs text-gray-700 dark:text-slate-300">Time critical cargo</span>
          </div>
        </div>
      )}

      {sectionsToShow.includes("quality") && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
            <FaCameraRetro className="w-4 h-4 mr-2" />
            Quality & Inspection Requirements
          </h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresPreShipmentInspection"
                checked={formData.requiresPreShipmentInspection}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires pre-shipment inspection
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresDeliveryInspection"
                checked={formData.requiresDeliveryInspection}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires delivery inspection
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresPhotographicDocumentation"
                checked={formData.requiresPhotographicDocumentation}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
              />
              <span className="text-xs text-gray-700 dark:text-slate-300">
                Requires photographic documentation
              </span>
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="specialHandlingInstructions" className="text-xs">
              Special Handling Instructions
            </Label>
            <Textarea
              id="specialHandlingInstructions"
              name="specialHandlingInstructions"
              value={formData.specialHandlingInstructions || ""}
              onChange={handleChange}
              rows={3}
              placeholder="Enter special handling instructions"
              className="text-sm w-full min-w-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoFormSections;
