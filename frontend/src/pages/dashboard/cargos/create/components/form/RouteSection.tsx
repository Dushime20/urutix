import { type CargoFormSchemaType } from "./cargoFormSchema";
import { FaMapMarkedAlt, FaRoute, FaCar } from "react-icons/fa";
import { Input, Label } from "@/components/ui";

interface RouteSectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function RouteSection({
  formData,
  handleFieldChange,
}: RouteSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30">
          <FaMapMarkedAlt className="w-4 h-4 text-[#345E85] dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#0f172a] dark:text-slate-100 tracking-tight uppercase">
            Route & Access Protocols
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Restrictions & Escort Settings
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <FaRoute className="w-3.5 h-3.5 text-[#345E85] dark:text-blue-400" />
          <h4 className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest">Clearance Requirements</h4>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="maxClearanceHeight"
            className="font-medium text-gray-700"
          >
            Maximum Clearance Height (m)
          </Label>
          <Input
            type="number"
            id="maxClearanceHeight"
            name="maxClearanceHeight"
            value={formData.maxClearanceHeight || ""}
            onChange={(e) =>
              handleFieldChange("maxClearanceHeight", e.target.value)
            }
            min="0"
            step="0.01"
            placeholder="0.00"
            className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-3">
          <FaCar className="w-3.5 h-3.5 text-[#345E85] dark:text-blue-400" />
          <h4 className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest">Escort & Restrictions</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
            <input
              type="checkbox"
              id="requiresLowClearanceRoute"
              name="requiresLowClearanceRoute"
              checked={formData.requiresLowClearanceRoute || false}
              onChange={(e) =>
                handleFieldChange("requiresLowClearanceRoute", e.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 text-[#345E85] focus:ring-[#345E85] focus:ring-offset-0"
            />
            <label
              htmlFor="requiresLowClearanceRoute"
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900 dark:text-slate-100">
                Low Clearance Route
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Requires specialized route planning for low clearances
              </div>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-300">
            <input
              type="checkbox"
              id="requiresEscortVehicle"
              name="requiresEscortVehicle"
              checked={formData.requiresEscortVehicle || false}
              onChange={(e) =>
                handleFieldChange("requiresEscortVehicle", e.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 text-[#345E85] focus:ring-[#345E85] focus:ring-offset-0"
            />
            <label
              htmlFor="requiresEscortVehicle"
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900 dark:text-slate-100">
                Escort Vehicle Required
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-400">
                Transportation requires escort vehicle accompaniment
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
