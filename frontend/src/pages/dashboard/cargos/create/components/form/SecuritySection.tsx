import { type CargoFormSchemaType } from "./cargoFormSchema";
import {
  FaShieldAlt,
  FaDollarSign,
  FaSatellite,
  FaThermometerFull,
  FaPhone,
} from "react-icons/fa";
import { Input, Label, Textarea } from "@/components/ui";

interface SecuritySectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function SecuritySection({
  formData,
  handleFieldChange,
}: SecuritySectionProps) {
  const monitoringOptions = [
    {
      key: "requiresGpsMonitoring",
      label: "GPS Tracking Required",
      description: "Real-time location monitoring throughout transport",
      icon: FaSatellite,
    },
    {
      key: "requiresTemperatureMonitoring",
      label: "Temperature Monitoring",
      description: "Continuous temperature logging during transit",
      icon: FaThermometerFull,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 dark:bg-slate-800 transition-colors duration-300">
          <FaShieldAlt className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors duration-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 transition-colors duration-300">
            Security & Insurance Requirements
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 transition-colors duration-300">
            Configure insurance coverage and monitoring requirements
          </p>
        </div>
      </div>

      {/* Insurance Value Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-green-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaDollarSign className="w-4 h-4 text-green-600 dark:text-green-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Insurance Coverage</h4>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insuranceValue" className="font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300">
            Insurance Value ($)
          </Label>
          <Input
            type="number"
            id="insuranceValue"
            name="insuranceValue"
            value={formData.insuranceValue || ""}
            onChange={(e) =>
              handleFieldChange("insuranceValue", e.target.value)
            }
            min="0"
            step="0.01"
            placeholder="100,000.00"
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-green-500/20 duration-300"
          />
          <p className="text-sm text-gray-500 dark:text-slate-400 transition-colors duration-300">
            Specify the total insurance value required for this cargo
          </p>
        </div>
      </div>

      {/* Monitoring Requirements Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaSatellite className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Monitoring Requirements</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {monitoringOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.key}
                className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-300"
              >
                <input
                  type="checkbox"
                  id={option.key}
                  name={option.key}
                  checked={
                    (formData[
                      option.key as keyof CargoFormSchemaType
                    ] as boolean) || false
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      option.key as keyof CargoFormSchemaType,
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-blue-300 dark:border-blue-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 transition-colors duration-300">
                    <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                  </div>
                  <label htmlFor={option.key} className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-slate-400 transition-colors duration-300">
                      {option.description}
                    </div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-slate-800 p-6 shadow-none transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <FaPhone className="w-4 h-4 text-orange-600 dark:text-orange-400 transition-colors duration-300" />
          <h4 className="font-medium text-gray-900 dark:text-slate-100 transition-colors duration-300">Emergency Contact</h4>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="emergencyContactInfo"
            className="font-medium text-gray-700 dark:text-slate-300 transition-colors duration-300"
          >
            Emergency Contact Information
          </Label>
          <Textarea
            id="emergencyContactInfo"
            name="emergencyContactInfo"
            value={formData.emergencyContactInfo || ""}
            onChange={(e) =>
              handleFieldChange("emergencyContactInfo", e.target.value)
            }
            rows={3}
            placeholder="Contact Name: John Smith&#10;Phone: +1-555-0123&#10;Email: emergency@company.com&#10;Available 24/7 for cargo-related emergencies"
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all focus:ring-2 focus:ring-orange-500/20 resize-none duration-300"
          />
          <p className="text-sm text-gray-500 dark:text-slate-400 transition-colors duration-300">
            Provide 24/7 emergency contact details for urgent cargo issues
          </p>
        </div>
      </div>
    </div>
  );
}
