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
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
          <FaMapMarkedAlt className="w-4 h-4 text-[#345E85]" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#0f172a] tracking-tight uppercase">
            Route & Access Protocols
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Restrictions & Escort Settings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3">
          <FaRoute className="w-3.5 h-3.5 text-[#345E85]" />
          <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest">Clearance Requirements</h4>
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

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3">
          <FaCar className="w-3.5 h-3.5 text-[#345E85]" />
          <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest">Escort & Restrictions</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
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
              <div className="font-medium text-gray-900">
                Low Clearance Route
              </div>
              <div className="text-sm text-gray-600">
                Requires specialized route planning for low clearances
              </div>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
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
              <div className="font-medium text-gray-900">
                Escort Vehicle Required
              </div>
              <div className="text-sm text-gray-600">
                Transportation requires escort vehicle accompaniment
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
