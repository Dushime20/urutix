import { type CargoFormSchemaType } from "./cargoFormSchema";
import { FaTruck, FaClock, FaTools, FaClipboardList } from "react-icons/fa";
import { Input, Label, Textarea } from "@/components/ui";

interface LoadingSectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function LoadingSection({
  formData,
  handleFieldChange,
}: LoadingSectionProps) {
  const equipmentRequirements = [
    {
      key: "requiresForklift",
      label: "Forklift Required",
      description: "Needs forklift for loading/unloading operations",
    },
    {
      key: "requiresCrane",
      label: "Crane Required",
      description: "Heavy lifting equipment needed for handling",
    },
    {
      key: "requiresLoadingDock",
      label: "Loading Dock Required",
      description: "Must be loaded/unloaded at a proper dock facility",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
          <FaTruck className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Loading & Unloading Requirements
          </h3>
          <p className="text-sm text-gray-600">
            Specify equipment needs and time estimates for cargo handling
          </p>
        </div>
      </div>

      {/* Time Estimates Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaClock className="w-4 h-4 text-indigo-600" />
          <h4 className="font-medium text-gray-900">Time Estimates</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="loadingTimeEstimate"
              className="font-medium text-gray-700"
            >
              Loading Time (hours)
            </Label>
            <Input
              type="number"
              id="loadingTimeEstimate"
              name="loadingTimeEstimate"
              value={formData.loadingTimeEstimate || ""}
              onChange={(e) =>
                handleFieldChange("loadingTimeEstimate", e.target.value)
              }
              min="0"
              step="0.5"
              placeholder="2.0"
              className="transition-all focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="unloadingTimeEstimate"
              className="font-medium text-gray-700"
            >
              Unloading Time (hours)
            </Label>
            <Input
              type="number"
              id="unloadingTimeEstimate"
              name="unloadingTimeEstimate"
              value={formData.unloadingTimeEstimate || ""}
              onChange={(e) =>
                handleFieldChange("unloadingTimeEstimate", e.target.value)
              }
              min="0"
              step="0.5"
              placeholder="1.5"
              className="transition-all focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Equipment Requirements Card */}
      <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaTools className="w-4 h-4 text-purple-600" />
          <h4 className="font-medium text-gray-900">Equipment Requirements</h4>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {equipmentRequirements.map((requirement) => (
            <div
              key={requirement.key}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-purple-100 hover:bg-purple-50/50 transition-colors"
            >
              <input
                type="checkbox"
                id={requirement.key}
                name={requirement.key}
                checked={
                  (formData[
                    requirement.key as keyof CargoFormSchemaType
                  ] as boolean) || false
                }
                onChange={(e) =>
                  handleFieldChange(
                    requirement.key as keyof CargoFormSchemaType,
                    e.target.checked
                  )
                }
                className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
              />
              <label
                htmlFor={requirement.key}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium text-gray-900">
                  {requirement.label}
                </div>
                <div className="text-sm text-gray-600">
                  {requirement.description}
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaClipboardList className="w-4 h-4 text-teal-600" />
          <h4 className="font-medium text-gray-900">Handling Instructions</h4>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="loadingInstructions"
              className="font-medium text-gray-700"
            >
              Loading Instructions
            </Label>
            <Textarea
              id="loadingInstructions"
              name="loadingInstructions"
              value={formData.loadingInstructions || ""}
              onChange={(e) =>
                handleFieldChange("loadingInstructions", e.target.value)
              }
              rows={3}
              placeholder="Specify any special loading procedures, equipment positioning, or safety requirements..."
              className="transition-all focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="unloadingInstructions"
              className="font-medium text-gray-700"
            >
              Unloading Instructions
            </Label>
            <Textarea
              id="unloadingInstructions"
              name="unloadingInstructions"
              value={formData.unloadingInstructions || ""}
              onChange={(e) =>
                handleFieldChange("unloadingInstructions", e.target.value)
              }
              rows={3}
              placeholder="Specify any special unloading procedures, delivery requirements, or handling precautions..."
              className="transition-all focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
