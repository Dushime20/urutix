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
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
          <FaMapMarkedAlt className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Route & Access Requirements
          </h3>
          <p className="text-sm text-gray-600">
            Specify route restrictions and clearance requirements
          </p>
        </div>
      </div>

      {/* Clearance Requirements Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaRoute className="w-4 h-4 text-indigo-600" />
          <h4 className="font-medium text-gray-900">Clearance Requirements</h4>
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
            className="transition-all focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Route Restrictions Card */}
      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaCar className="w-4 h-4 text-purple-600" />
          <h4 className="font-medium text-gray-900">Route Restrictions</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-purple-100 hover:bg-purple-50/50 transition-colors">
            <input
              type="checkbox"
              id="requiresLowClearanceRoute"
              name="requiresLowClearanceRoute"
              checked={formData.requiresLowClearanceRoute || false}
              onChange={(e) =>
                handleFieldChange("requiresLowClearanceRoute", e.target.checked)
              }
              className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
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

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-purple-100 hover:bg-purple-50/50 transition-colors">
            <input
              type="checkbox"
              id="requiresEscortVehicle"
              name="requiresEscortVehicle"
              checked={formData.requiresEscortVehicle || false}
              onChange={(e) =>
                handleFieldChange("requiresEscortVehicle", e.target.checked)
              }
              className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
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
