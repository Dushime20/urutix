import { type CargoFormSchemaType } from "./cargoFormSchema";
import { FaCogs, FaTruck, FaDollarSign, FaStar } from "react-icons/fa";
import { Textarea } from "@/components/ui";

interface MatchingSectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function MatchingSection({
  formData,
  handleFieldChange,
}: MatchingSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 dark:bg-slate-800 transition-colors duration-300">
          <FaCogs className="w-5 h-5 text-teal-600 dark:text-teal-400 transition-colors duration-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 transition-colors duration-300">
            Matching Criteria
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors duration-300">
            Configure automatic matching preferences
          </p>
        </div>
      </div>

      {/* Auto Matching Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-teal-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaCogs className="w-4 h-4 text-teal-600 dark:text-teal-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Auto-Matching</h4>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-teal-100 dark:border-teal-900/30 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors duration-300">
          <input
            type="checkbox"
            id="autoMatchEnabled"
            name="autoMatchEnabled"
            checked={formData.autoMatchEnabled || false}
            onChange={(e) =>
              handleFieldChange("autoMatchEnabled", e.target.checked)
            }
            className="h-4 w-4 rounded border-teal-300 dark:border-teal-700 text-teal-600 focus:ring-teal-500 focus:ring-offset-0"
          />
          <label htmlFor="autoMatchEnabled" className="flex-1 cursor-pointer">
            <div className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">
              Enable Auto-Matching
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400 transition-colors duration-300">
              Automatically match with suitable carriers based on your criteria
            </div>
          </label>
        </div>
      </div>

      {/* Truck Requirements Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaTruck className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Truck Preferences</h4>
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300">
            Special Truck Requirements
          </label>
          <Textarea
            id="truckRequirements"
            name="truckRequirements"
            value={
              typeof formData.truckRequirements === "string"
                ? formData.truckRequirements
                : JSON.stringify(formData.truckRequirements || {}, null, 2)
            }
            onChange={(e) =>
              handleFieldChange("truckRequirements", e.target.value)
            }
            rows={3}
            placeholder="Specify any special truck requirements (e.g., refrigeration, crane, flatbed)"
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-blue-500/20 duration-300"
          />
        </div>
      </div>

      {/* Carrier Preferences Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-violet-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaStar className="w-4 h-4 text-violet-600 dark:text-violet-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Carrier Preferences</h4>
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300">
            Preferred Carrier Criteria
          </label>
          <Textarea
            id="carrierPreferences"
            name="carrierPreferences"
            value={
              typeof formData.carrierPreferences === "string"
                ? formData.carrierPreferences
                : JSON.stringify(formData.carrierPreferences || {}, null, 2)
            }
            onChange={(e) =>
              handleFieldChange("carrierPreferences", e.target.value)
            }
            rows={3}
            placeholder="Specify carrier preferences (e.g., minimum rating, certifications, experience)"
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-violet-500/20 duration-300"
          />
        </div>
      </div>

      {/* Cost Preferences Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Cost Optimization</h4>
        </div>

        <div className="space-y-2">
          <label className="block font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300">
            Cost Preferences & Constraints
          </label>
          <Textarea
            id="costPreferences"
            name="costPreferences"
            value={
              typeof formData.costPreferences === "string"
                ? formData.costPreferences
                : JSON.stringify(formData.costPreferences || {}, null, 2)
            }
            onChange={(e) =>
              handleFieldChange("costPreferences", e.target.value)
            }
            rows={3}
            placeholder="Specify cost preferences (e.g., budget constraints, priority between cost and speed)"
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-emerald-500/20 duration-300"
          />
        </div>
      </div>
    </div>
  );
}
