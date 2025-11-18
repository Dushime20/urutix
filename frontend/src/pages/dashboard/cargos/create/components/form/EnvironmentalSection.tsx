import { type CargoFormSchemaType } from "./cargoFormSchema";
import {
  FaThermometerHalf,
  FaExclamationTriangle,
  FaTint,
} from "react-icons/fa";
import { Input, Label } from "@/components/ui";

interface EnvironmentalSectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function EnvironmentalSection({
  formData,
  handleFieldChange,
}: EnvironmentalSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100">
          <FaThermometerHalf className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Environmental Requirements
          </h3>
          <p className="text-sm text-gray-600">
            Configure temperature, humidity, and hazmat specifications
          </p>
        </div>
      </div>

      {/* Temperature Control Card */}
      <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaThermometerHalf className="w-4 h-4 text-cyan-600" />
          <h4 className="font-medium text-gray-900">Temperature Control</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="temperatureMin"
              className="font-medium text-gray-700"
            >
              Minimum Temperature (°C)
            </Label>
            <Input
              type="number"
              id="temperatureMin"
              name="temperatureMin"
              value={formData.temperatureMin || ""}
              onChange={(e) =>
                handleFieldChange("temperatureMin", e.target.value)
              }
              step="0.1"
              placeholder="Enter min temp"
              className="transition-all focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="temperatureMax"
              className="font-medium text-gray-700"
            >
              Maximum Temperature (°C)
            </Label>
            <Input
              type="number"
              id="temperatureMax"
              name="temperatureMax"
              value={formData.temperatureMax || ""}
              onChange={(e) =>
                handleFieldChange("temperatureMax", e.target.value)
              }
              step="0.1"
              placeholder="Enter max temp"
              className="transition-all focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>
      </div>

      {/* Hazmat Information Card */}
      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaExclamationTriangle className="w-4 h-4 text-red-600" />
          <h4 className="font-medium text-gray-900">Hazardous Materials</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="hazmatClass" className="font-medium text-gray-700">
              Hazmat Class
            </Label>
            <Input
              type="text"
              id="hazmatClass"
              name="hazmatClass"
              value={formData.hazmatClass || ""}
              onChange={(e) => handleFieldChange("hazmatClass", e.target.value)}
              placeholder="e.g., UN 1.1"
              className="transition-all focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hazmatNumber" className="font-medium text-gray-700">
              Hazmat Number
            </Label>
            <Input
              type="text"
              id="hazmatNumber"
              name="hazmatNumber"
              value={formData.hazmatNumber || ""}
              onChange={(e) =>
                handleFieldChange("hazmatNumber", e.target.value)
              }
              placeholder="e.g., UN1234"
              className="transition-all focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </div>

      {/* Humidity Control */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaTint className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-900">Humidity Control</h4>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
          <input
            type="checkbox"
            id="requiresHumidityControl"
            name="requiresHumidityControl"
            checked={formData.requiresHumidityControl || false}
            onChange={(e) =>
              handleFieldChange("requiresHumidityControl", e.target.checked)
            }
            className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
          />
          <label
            htmlFor="requiresHumidityControl"
            className="flex-1 cursor-pointer"
          >
            <div className="font-medium text-gray-900">
              Humidity Control Required
            </div>
            <div className="text-sm text-gray-600">
              Cargo requires specific humidity levels during transport
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
