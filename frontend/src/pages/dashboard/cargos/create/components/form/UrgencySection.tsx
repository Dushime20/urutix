import { URGENCY_LEVELS } from "@/constants/cargo";
import { type CargoFormSchemaType } from "./cargoFormSchema";
import { FaClock, FaTachometerAlt, FaExclamation } from "react-icons/fa";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

interface UrgencySectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function UrgencySection({
  formData,
  handleFieldChange,
}: UrgencySectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100">
          <FaClock className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Urgency & Timing
          </h3>
          <p className="text-sm text-gray-600">
            Set delivery priorities and time constraints
          </p>
        </div>
      </div>

      {/* Priority Settings Card */}
      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaTachometerAlt className="w-4 h-4 text-red-600" />
          <h4 className="font-medium text-gray-900">Priority Settings</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="urgencyLevel" className="font-medium text-gray-700">
              Urgency Level
            </Label>
            <Select
              name="urgencyLevel"
              value={formData.urgencyLevel || "NORMAL"}
              onValueChange={(value) =>
                handleFieldChange("urgencyLevel", value)
              }
            >
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-red-500/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          level === "CRITICAL"
                            ? "bg-red-500"
                            : level === "HIGH"
                            ? "bg-orange-500"
                            : level === "NORMAL"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <span>{level}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="maxTransitTime"
              className="font-medium text-gray-700"
            >
              Maximum Transit Time (hours)
            </Label>
            <Input
              type="number"
              id="maxTransitTime"
              name="maxTransitTime"
              value={formData.maxTransitTime || ""}
              onChange={(e) =>
                handleFieldChange("maxTransitTime", e.target.value)
              }
              min="0"
              step="0.5"
              placeholder="0"
              className="transition-all focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        </div>
      </div>

      {/* Time Critical Options */}
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaExclamation className="w-4 h-4 text-orange-600" />
          <h4 className="font-medium text-gray-900">Critical Timing</h4>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-orange-100 hover:bg-orange-50/50 transition-colors">
          <input
            type="checkbox"
            id="isTimeCritical"
            name="isTimeCritical"
            checked={formData.isTimeCritical || false}
            onChange={(e) =>
              handleFieldChange("isTimeCritical", e.target.checked)
            }
            className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-0"
          />
          <label htmlFor="isTimeCritical" className="flex-1 cursor-pointer">
            <div className="font-medium text-gray-900">Time Critical Cargo</div>
            <div className="text-sm text-gray-600">
              This cargo has strict delivery deadlines that cannot be missed
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
