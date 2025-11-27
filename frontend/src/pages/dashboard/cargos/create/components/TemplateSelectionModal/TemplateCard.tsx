import React from "react";
import { FaCheck, FaWeight, FaDollarSign, FaClock } from "react-icons/fa";
import type { CargoFormSchemaType } from "@/pages/dashboard/cargos/create/components/form/cargoFormSchema";
import { cn } from "@/utils/cn";
import SmartButton from "@/components/shared/button";

type CargoTemplate = Partial<CargoFormSchemaType> & {
  id: string;
  category: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

interface TemplateCardProps {
  template: CargoTemplate;
  onSelect: (template: Partial<CargoFormSchemaType>) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const Icon = template.icon;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "text-red-600 bg-red-50 border-red-200";
      case "HIGH":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "NORMAL":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "🔥";
      case "HIGH":
        return "⚡";
      case "NORMAL":
        return "📦";
      case "LOW":
        return "🐌";
      default:
        return "📋";
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white border border-gray-200 rounded-xl p-3.5 hover:border-teal-400 hover:shadow-lg",
        "transition-all duration-300 cursor-pointer transform hover:-translate-y-1",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex flex-1 items-start mb-4">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-2.5 mr-2.5 group-hover:from-teal-500 group-hover:to-teal-600 transition-all duration-300">
          <Icon className="text-gray-600 group-hover:text-white w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
            {template.title}
          </h3>
          <p className="text-gray-500 text-xs leading-relaxed">
            {template.description}
          </p>
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center p-2 bg-gray-50 rounded-lg">
            <FaWeight className="text-gray-500 w-3 h-3 mr-1.5" />
            <div>
              <p className="text-xs text-gray-500">Weight</p>
              <p className="font-medium text-gray-900 text-xs">
                {template.weight} kg
              </p>
            </div>
          </div>
          <div className="flex items-center p-2 bg-gray-50 rounded-lg">
            <FaDollarSign className="text-gray-500 w-3 h-3 mr-1.5" />
            <div>
              <p className="text-xs text-gray-500">Value</p>
              <p className="font-medium text-gray-900 text-xs">
                ${template?.loadValue?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Urgency Level */}
        <div className="flex items-center p-2 bg-gray-50 rounded-lg">
          <FaClock className="text-gray-500 w-3 h-3 mr-1.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Urgency</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {getUrgencyIcon(template.urgencyLevel || "")}
              </span>
              <span
                className={`font-medium px-1.5 py-0.5 rounded-full text-xs border ${getUrgencyColor(
                  template.urgencyLevel || ""
                )}`}
              >
                {template.urgencyLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {template.isFragile && (
          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
            🚨 Fragile
          </span>
        )}
        {template.isHazardous && (
          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200">
            ⚠️ Hazardous
          </span>
        )}
        {template.requiresRefrigeration && (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200">
            ❄️ Refrigerated
          </span>
        )}
        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border border-gray-200">
          📦 {template.cargoType}
        </span>
      </div>

      {/* Action Button */}
      <SmartButton
        className="flex gap-1.5 text-xs py-1.5 group-hover:from-teal-600 group-hover:to-teal-700 hover:!from-teal-700 hover:!to-teal-800"
        onClick={() => onSelect(template)}
      >
        <FaCheck className="w-3.5 h-3.5" />
        Use This Template
      </SmartButton>
      {/* <button className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 group-hover:shadow-md transform group-hover:scale-105 text-sm"></button> */}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-teal-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default TemplateCard;
