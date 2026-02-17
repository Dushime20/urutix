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
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
          <FaRulerCombined className="w-4 h-4 text-[#345E85]" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#0f172a] tracking-tight uppercase">
            Dimensions & Packaging
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Sizing and handling specifications
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3">
          <FaCube className="w-3.5 h-3.5 text-[#345E85]" />
          <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest">Physical Dimensions</h4>
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
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
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
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
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
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <div className="flex items-center space-x-2 mb-3">
          <FaBoxes className="w-3.5 h-3.5 text-[#345E85]" />
          <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest">Packaging Intelligence</h4>
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
              <SelectTrigger className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10">
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
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
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
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
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
              className="bg-slate-50 border-slate-200 transition-all focus:ring-2 focus:ring-blue-500/20 text-sm h-10"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-none">
        <h4 className="text-xs font-black text-[#345E85] uppercase tracking-widest mb-3">Handling Protocols</h4>

        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            id="isStackable"
            name="isStackable"
            checked={formData.isStackable || false}
            onChange={(e) => handleFieldChange("isStackable", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#345E85] focus:ring-[#345E85] focus:ring-offset-0"
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
