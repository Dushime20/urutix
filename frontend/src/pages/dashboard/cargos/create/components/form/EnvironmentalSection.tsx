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
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 transition-colors duration-300">
          <FaThermometerHalf className="w-4 h-4 text-[#345E85] dark:text-blue-400 transition-colors duration-300" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#0f172a] dark:text-slate-100 tracking-tight uppercase transition-colors duration-300">
            Environmental Requirements
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider transition-colors duration-300">
            Temperature & Hazmat Configurations
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <FaThermometerHalf className="w-3.5 h-3.5 text-[#345E85] dark:text-blue-400 transition-colors duration-300" />
          <h4 className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest transition-colors duration-300">Temperature Regulation</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="temperatureMin"
              className="font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300"
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
              min="-999.99"
              max="999.99"
              step="0.1"
              placeholder="e.g. -18"
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10 duration-300"
            />
            <p className="text-xs text-slate-400">Range: -999.99°C to 999.99°C</p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="temperatureMax"
              className="font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300"
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
              min="-999.99"
              max="999.99"
              step="0.1"
              placeholder="e.g. 25"
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10 duration-300"
            />
            <p className="text-xs text-slate-400">Range: -999.99°C to 999.99°C</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <FaExclamationTriangle className="w-3.5 h-3.5 text-[#345E85] dark:text-blue-400 transition-colors duration-300" />
          <h4 className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest transition-colors duration-300">Hazmat Compliance</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="hazmatClass" className="font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300">
              Hazmat Class
            </Label>
            <Input
              type="text"
              id="hazmatClass"
              name="hazmatClass"
              value={formData.hazmatClass || ""}
              onChange={(e) => handleFieldChange("hazmatClass", e.target.value)}
              placeholder="e.g., UN 1.1"
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10 duration-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hazmatNumber" className="font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300">
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
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10 duration-300"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <FaTint className="w-3.5 h-3.5 text-[#345E85] dark:text-blue-400 transition-colors duration-300" />
          <h4 className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest transition-colors duration-300">Relative Humidity</h4>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
          <input
            type="checkbox"
            id="requiresHumidityControl"
            name="requiresHumidityControl"
            checked={formData.requiresHumidityControl || false}
            onChange={(e) =>
              handleFieldChange("requiresHumidityControl", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#345E85] focus:ring-[#345E85] focus:ring-offset-0"
          />
          <label
            htmlFor="requiresHumidityControl"
            className="flex-1 cursor-pointer"
          >
            <div className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">
              Humidity Control Required
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400 transition-colors duration-300">
              Cargo requires specific humidity levels during transport
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
