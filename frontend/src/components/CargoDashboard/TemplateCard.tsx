import React from 'react';
import { FaTruck, FaWeight, FaTrash, FaClock } from 'react-icons/fa';
import { MapPin } from 'lucide-react';
import type { CargoTemplate } from '@/services/cargoTemplateService';

interface TemplateCardProps {
    template: CargoTemplate;
    onUse: (template: CargoTemplate) => void;
    onDelete: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse, onDelete }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getCargoTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            GENERAL: 'bg-blue-100 text-blue-800',
            PERISHABLE: 'bg-green-100 text-green-800',
            HAZARDOUS: 'bg-red-100 text-red-800',
            FRAGILE: 'bg-yellow-100 text-yellow-800',
            REFRIGERATED: 'bg-cyan-100 text-cyan-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {template.name}
                    </h4>
                    <div className="flex items-center text-xs text-gray-500">
                        <FaClock className="w-3 h-3 mr-1" />
                        <span>{formatDate(template.createdAt)}</span>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(template.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete template"
                >
                    <FaTrash className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Route */}
            <div className="mb-3 space-y-1.5">
                <div className="flex items-start text-xs">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 line-clamp-1">
                        {template.data.pickupLocation?.name || template.data.pickupLocation?.address || 'Pickup location'}
                    </span>
                </div>
                <div className="flex items-center ml-5">
                    <div className="w-px h-3 bg-gray-300"></div>
                </div>
                <div className="flex items-start text-xs">
                    <MapPin className="w-3.5 h-3.5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 line-clamp-1">
                        {template.data.deliveryLocation?.name || template.data.deliveryLocation?.address || 'Delivery location'}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCargoTypeColor(template.data.cargoType)}`}>
                    {template.data.cargoType}
                </span>
                <div className="flex items-center text-xs text-gray-600">
                    <FaWeight className="w-3 h-3 mr-1" />
                    <span>{template.data.weight} kg</span>
                </div>
                {template.data.volume && (
                    <div className="flex items-center text-xs text-gray-600">
                        <FaTruck className="w-3 h-3 mr-1" />
                        <span>{template.data.volume} m³</span>
                    </div>
                )}
            </div>

            {/* Special Requirements Badges */}
            {(template.data.isFragile || template.data.isHazardous || template.data.requiresRefrigeration) && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {template.data.isFragile && (
                        <span className="px-2 py-0.5 text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
                            Fragile
                        </span>
                    )}
                    {template.data.isHazardous && (
                        <span className="px-2 py-0.5 text-[10px] bg-red-50 text-red-700 border border-red-200 rounded-full">
                            Hazardous
                        </span>
                    )}
                    {template.data.requiresRefrigeration && (
                        <span className="px-2 py-0.5 text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full">
                            Refrigerated
                        </span>
                    )}
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={() => onUse(template)}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            >
                <FaTruck className="w-4 h-4" />
                Use Template
            </button>
        </div>
    );
};

export default TemplateCard;
