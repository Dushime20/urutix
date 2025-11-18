import { PACKAGING_TYPES } from "@/constants/cargo";
import { type CargoFormSchemaType } from "./cargoFormSchema";
import { FaRulerCombined, FaBoxes, FaCube } from "react-icons/fa";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

interface DimensionsSectionProps {
  formData: CargoFormSchemaType;
  handleFieldChange: (
    field: keyof CargoFormSchemaType,
    value: string | number | boolean
  ) => void;
}

export default function DimensionsSection({
  formData,
  handleFieldChange,
}: DimensionsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <FaRulerCombined className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Dimensions & Packaging
          </h3>
          <p className="text-sm text-gray-600">
            Specify cargo dimensions and packaging requirements
          </p>
        </div>
      </div>

      {/* Physical Dimensions Card */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaCube className="w-4 h-4 text-slate-600" />
          <h4 className="font-medium text-gray-900">Physical Dimensions</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="length" className="font-medium text-gray-700">
              Length (m)
            </Label>
            <Input
              type="number"
              id="length"
              name="length"
              value={formData.length || ""}
              onChange={(e) => handleFieldChange("length", e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width" className="font-medium text-gray-700">
              Width (m)
            </Label>
            <Input
              type="number"
              id="width"
              name="width"
              value={formData.width || ""}
              onChange={(e) => handleFieldChange("width", e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="font-medium text-gray-700">
              Height (m)
            </Label>
            <Input
              type="number"
              id="height"
              name="height"
              value={formData.height || ""}
              onChange={(e) => handleFieldChange("height", e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Packaging Information Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaBoxes className="w-4 h-4 text-emerald-600" />
          <h4 className="font-medium text-gray-900">Packaging Information</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="packagingType"
              className="font-medium text-gray-700"
            >
              Packaging Type
            </Label>
            <Select
              name="packagingType"
              value={formData.packagingType || ""}
              onValueChange={(value) =>
                handleFieldChange("packagingType", value)
              }
            >
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-emerald-500/20">
                <SelectValue placeholder="Select packaging type" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="stackableHeight"
              className="font-medium text-gray-700"
            >
              Stackable Height (m)
            </Label>
            <Input
              type="number"
              id="stackableHeight"
              name="stackableHeight"
              value={formData.stackableHeight || ""}
              onChange={(e) =>
                handleFieldChange("stackableHeight", e.target.value)
              }
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="numberOfPieces"
              className="font-medium text-gray-700"
            >
              Number of Pieces
            </Label>
            <Input
              type="number"
              id="numberOfPieces"
              name="numberOfPieces"
              value={formData.numberOfPieces || ""}
              onChange={(e) =>
                handleFieldChange("numberOfPieces", e.target.value)
              }
              min="0"
              placeholder="0"
              className="transition-all focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="numberOfPallets"
              className="font-medium text-gray-700"
            >
              Number of Pallets
            </Label>
            <Input
              type="number"
              id="numberOfPallets"
              name="numberOfPallets"
              value={formData.numberOfPallets || ""}
              onChange={(e) =>
                handleFieldChange("numberOfPallets", e.target.value)
              }
              min="0"
              placeholder="0"
              className="transition-all focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Stacking Options */}
      <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200 p-6 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-4">Handling Options</h4>

        <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-amber-100 hover:bg-amber-50/50 transition-colors">
          <input
            type="checkbox"
            id="isStackable"
            name="isStackable"
            checked={formData.isStackable || false}
            onChange={(e) => handleFieldChange("isStackable", e.target.checked)}
            className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
          />
          <label htmlFor="isStackable" className="flex-1 cursor-pointer">
            <div className="font-medium text-gray-900">Stackable Cargo</div>
            <div className="text-sm text-gray-600">
              This cargo can be safely stacked with other items
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
