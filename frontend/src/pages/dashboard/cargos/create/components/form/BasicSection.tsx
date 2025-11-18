import { CARGO_TYPES } from "@/constants/cargo";
import { type CargoFormSchemaType } from "./cargoFormSchema";
import {
  FaBox,
  FaWeight,
  FaDollarSign,
  FaExclamationTriangle,
  FaFile,
} from "react-icons/fa";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

interface BasicSectionProps {
  formData: CargoFormSchemaType;
  register: UseFormRegister<CargoFormSchemaType>;
  setValue: UseFormSetValue<CargoFormSchemaType>;
  errors: FieldErrors<CargoFormSchemaType>;
}

export default function BasicSection({
  formData,
  register,
  setValue,
  errors,
}: BasicSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <FaBox className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h3>
          <p className="text-sm text-gray-600">
            Enter essential cargo details and specifications
          </p>
        </div>
      </div>

      {/* Cargo Identity Card */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaFile className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-gray-900">Cargo Identity</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-medium text-gray-700">
              Cargo Title *
            </Label>
            <Input
              id="title"
              type="text"
              {...register("title")}
              placeholder="Enter cargo title"
              className="transition-all focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargoType" className="font-medium text-gray-700">
              Cargo Type *
            </Label>
            <Select
              value={formData.cargoType}
              onValueChange={(value) => setValue("cargoType", value)}
            >
              <SelectTrigger className="transition-all focus:ring-2 focus:ring-blue-500/20">
                <SelectValue placeholder="Select cargo type" />
              </SelectTrigger>
              <SelectContent>
                {CARGO_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cargoType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.cargoType.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="description" className="font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={3}
            placeholder="Provide detailed cargo description"
            className="transition-all focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Physical Properties Card */}
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaWeight className="w-4 h-4 text-slate-600" />
          <h4 className="font-medium text-gray-900">Physical Properties</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="weight" className="font-medium text-gray-700">
              Weight (kg) *
            </Label>
            <Input
              id="weight"
              type="number"
              {...register("weight", { valueAsNumber: true })}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-slate-500/20"
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">
                {errors.weight.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume" className="font-medium text-gray-700">
              Volume (m³)
            </Label>
            <Input
              id="volume"
              type="number"
              {...register("volume", { valueAsNumber: true })}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-slate-500/20"
            />
            {errors.volume && (
              <p className="text-red-500 text-sm mt-1">
                {errors.volume.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Financial Information Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaDollarSign className="w-4 h-4 text-emerald-600" />
          <h4 className="font-medium text-gray-900">Financial Information</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="loadValue" className="font-medium text-gray-700">
              Load Value ($) *
            </Label>
            <Input
              id="loadValue"
              type="number"
              {...register("loadValue", { valueAsNumber: true })}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-emerald-500/20"
            />
            {errors.loadValue && (
              <p className="text-red-500 text-sm mt-1">
                {errors.loadValue.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="offeredPrice" className="font-medium text-gray-700">
              Offered Price ($)
            </Label>
            <Input
              id="offeredPrice"
              type="number"
              {...register("offeredPrice", { valueAsNumber: true })}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="transition-all focus:ring-2 focus:ring-emerald-500/20"
            />
            {errors.offeredPrice && (
              <p className="text-red-500 text-sm mt-1">
                {errors.offeredPrice.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Special Requirements Card */}
      <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <FaExclamationTriangle className="w-4 h-4 text-amber-600" />
          <h4 className="font-medium text-gray-900">Special Requirements</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-amber-100 hover:bg-amber-50/50 transition-colors">
            <input
              type="checkbox"
              id="isFragile"
              {...register("isFragile")}
              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
            />
            <label htmlFor="isFragile" className="flex-1 cursor-pointer">
              <div className="font-medium text-gray-900">Fragile</div>
              <div className="text-xs text-gray-600">Handle with care</div>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-red-100 hover:bg-red-50/50 transition-colors">
            <input
              type="checkbox"
              id="isHazardous"
              {...register("isHazardous")}
              className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500 focus:ring-offset-0"
            />
            <label htmlFor="isHazardous" className="flex-1 cursor-pointer">
              <div className="font-medium text-gray-900">Hazardous</div>
              <div className="text-xs text-gray-600">
                Special permits required
              </div>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-blue-100 hover:bg-blue-50/50 transition-colors">
            <input
              type="checkbox"
              id="requiresRefrigeration"
              {...register("requiresRefrigeration")}
              className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label
              htmlFor="requiresRefrigeration"
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-gray-900">Refrigerated</div>
              <div className="text-xs text-gray-600">
                Temperature controlled
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
