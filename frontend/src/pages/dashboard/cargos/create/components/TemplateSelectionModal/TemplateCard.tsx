import React from "react";
import { FaCheck, FaWeight, FaDollarSign, FaClock } from "react-icons/fa";
import type { CargoFormSchemaType } from "@/pages/dashboard/cargos/create/components/form/cargoFormSchema";
import { cn } from "@/utils/cn";

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
        return "text-red-700 bg-red-50 border-red-100";
      case "HIGH":
        return "text-orange-700 bg-orange-50 border-orange-100";
      case "NORMAL":
        return "text-[#345E85] bg-blue-50 border-blue-100";
      case "LOW":
        return "text-emerald-700 bg-emerald-50 border-emerald-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
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
        "group relative bg-white border border-slate-100 rounded-[2rem] p-5 hover:border-[#345E85]/20 hover:shadow-xl",
        "transition-all duration-300 cursor-pointer transform hover:-translate-y-1",
        "flex flex-col"
      )}
    >
      <div className="flex flex-1 items-start mb-6">
        <div className="bg-blue-50 rounded-2xl p-3 mr-4 group-hover:bg-[#345E85] transition-all duration-300">
          <Icon className="text-[#345E85] group-hover:text-white w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-[#0f172a] tracking-tight mb-1 group-hover:text-[#345E85] transition-colors">
            {template.title}
          </h3>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider leading-relaxed">
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
      <button
        className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 transition-all group-hover:bg-[#345E85] group-hover:text-white group-hover:border-[#345E85] group-hover:shadow-lg group-hover:shadow-blue-900/20"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(template);
        }}
      >
        <FaCheck className="w-3.5 h-3.5" />
        USE TEMPLATE
      </button>
      {/* <button className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 group-hover:shadow-md transform group-hover:scale-105 text-sm"></button> */}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-teal-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default TemplateCard;
