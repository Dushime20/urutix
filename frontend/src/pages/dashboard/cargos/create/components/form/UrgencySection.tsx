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
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
          <FaClock className="w-4 h-4 text-[#345E85]" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#0f172a] tracking-tight uppercase">
            Urgency & Timing
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Priorities & Deadlines
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3">
          <FaTachometerAlt className="w-3.5 h-3.5 text-[#345E85]" />
          <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest">Priority Settings</h4>
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
              <SelectTrigger className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${level === "CRITICAL"
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
              max="999.99"
              step="0.5"
              placeholder="e.g. 48"
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
            />
            <p className="text-xs text-slate-400">Max: 999.99 hrs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3">
          <FaExclamation className="w-3.5 h-3.5 text-[#345E85]" />
          <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest">Critical Timing</h4>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            id="isTimeCritical"
            name="isTimeCritical"
            checked={formData.isTimeCritical || false}
            onChange={(e) =>
              handleFieldChange("isTimeCritical", e.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 text-[#345E85] focus:ring-[#345E85] focus:ring-offset-0"
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
