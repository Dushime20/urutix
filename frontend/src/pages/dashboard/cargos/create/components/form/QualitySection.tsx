import { type CargoFormSchemaType } from "./cargoFormSchema";
import {
  FaCameraRetro,
  FaCheckCircle,
  FaClipboardList,
  FaTools,
} from "react-icons/fa";
import { Label, Textarea } from "@/components/ui";

interface QualitySectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function QualitySection({
  formData,
  handleFieldChange,
}: QualitySectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100">
          <FaCameraRetro className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Quality & Inspection Requirements
          </h3>
          <p className="text-sm text-gray-600">
            Configure inspection and documentation requirements
          </p>
        </div>
      </div>

      {/* Inspection Requirements Card */}
      <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaCheckCircle className="w-4 h-4 text-pink-600" />
          <h4 className="font-medium text-gray-900">Inspection Requirements</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-pink-100 hover:bg-pink-50/50 transition-colors">
            <input
              type="checkbox"
              id="requiresPreShipmentInspection"
              name="requiresPreShipmentInspection"
              checked={formData.requiresPreShipmentInspection || false}
              onChange={(e) =>
                handleFieldChange(
                  "requiresPreShipmentInspection",
                  e.target.checked
                )
              }
              className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500 focus:ring-offset-0"
            />
            <label
              htmlFor="requiresPreShipmentInspection"
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900">
                Pre-Shipment Inspection
              </div>
              <div className="text-sm text-gray-600">
                Cargo must be inspected before loading and transport
              </div>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-pink-100 hover:bg-pink-50/50 transition-colors">
            <input
              type="checkbox"
              id="requiresDeliveryInspection"
              name="requiresDeliveryInspection"
              checked={formData.requiresDeliveryInspection || false}
              onChange={(e) =>
                handleFieldChange(
                  "requiresDeliveryInspection",
                  e.target.checked
                )
              }
              className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500 focus:ring-offset-0"
            />
            <label
              htmlFor="requiresDeliveryInspection"
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900">
                Delivery Inspection
              </div>
              <div className="text-sm text-gray-600">
                Cargo must be inspected upon delivery completion
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Documentation Requirements Card */}
      <div className="bg-gradient-to-br from-cyan-50 to-white rounded-xl border border-cyan-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaClipboardList className="w-4 h-4 text-cyan-600" />
          <h4 className="font-medium text-gray-900">
            Documentation Requirements
          </h4>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-cyan-100 hover:bg-cyan-50/50 transition-colors">
          <input
            type="checkbox"
            id="requiresPhotographicDocumentation"
            name="requiresPhotographicDocumentation"
            checked={formData.requiresPhotographicDocumentation || false}
            onChange={(e) =>
              handleFieldChange(
                "requiresPhotographicDocumentation",
                e.target.checked
              )
            }
            className="h-4 w-4 rounded border-cyan-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <label
            htmlFor="requiresPhotographicDocumentation"
            className="flex-1 cursor-pointer"
          >
            <div className="font-medium text-gray-900">
              Photographic Documentation
            </div>
            <div className="text-sm text-gray-600">
              Photo evidence required at key stages of transportation
            </div>
          </label>
        </div>
      </div>

      {/* Special Handling Instructions Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaTools className="w-4 h-4 text-yellow-600" />
          <h4 className="font-medium text-gray-900">Special Handling</h4>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="specialHandlingInstructions"
            className="font-medium text-gray-700"
          >
            Special Handling Instructions
          </Label>
          <Textarea
            id="specialHandlingInstructions"
            name="specialHandlingInstructions"
            value={formData.specialHandlingInstructions || ""}
            onChange={(e) =>
              handleFieldChange("specialHandlingInstructions", e.target.value)
            }
            rows={4}
            placeholder="Provide detailed instructions for special handling requirements, quality standards, or care instructions..."
            className="transition-all focus:ring-2 focus:ring-yellow-500/20"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include any specific handling procedures, orientation requirements,
            or quality standards
          </p>
        </div>
      </div>
    </div>
  );
}
