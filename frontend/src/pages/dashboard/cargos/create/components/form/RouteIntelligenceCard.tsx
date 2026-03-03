
import React from 'react';
import { FaRoad, FaClock, FaGasPump, FaShieldAlt, FaSnowflake, FaExclamationTriangle } from 'react-icons/fa';
import type { RouteInsight } from '@/services/routeIntelligence';

interface RouteIntelligenceCardProps {
    insight: RouteInsight | null;
    loading?: boolean;
}

const RouteIntelligenceCard: React.FC<RouteIntelligenceCardProps> = ({ insight, loading }) => {
    if (!insight && !loading) return null;

    if (loading) {
        return (
            <div className="mt-4 p-4 border border-indigo-100 rounded-xl bg-indigo-50/50 animate-pulse">
                <div className="h-4 bg-indigo-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="h-10 bg-indigo-100 rounded"></div>
                    <div className="h-10 bg-indigo-100 rounded"></div>
                    <div className="h-10 bg-indigo-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (!insight) return null;

    return (
        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 transition-all duration-500 animate-fadeIn">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center mb-3">
                <FaRoad className="mr-2 text-indigo-600" />
                Smart Route Intelligence
                <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    {insight.priority === 'high' ? 'High Traffic Route' : 'Standard Route'}
                </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-3">
                <div className="flex items-center p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <div className="p-1.5 bg-blue-100 rounded-full mr-2 text-blue-600">
                        <FaClock />
                    </div>
                    <div>
                        <div className="text-gray-500">Est. Time</div>
                        <div className="font-bold text-gray-800">{insight.estimatedTime} Hours</div>
                    </div>
                </div>

                <div className="flex items-center p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <div className="p-1.5 bg-green-100 rounded-full mr-2 text-green-600">
                        <FaGasPump />
                    </div>
                    <div>
                        <div className="text-gray-500">Distance</div>
                        <div className="font-bold text-gray-800">{insight.distance} km</div>
                    </div>
                </div>

                <div className="flex items-center p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <div className="p-1.5 bg-purple-100 rounded-full mr-2 text-purple-600">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <div className="text-gray-500">Road Condition</div>
                        <div className="font-bold text-gray-800 capitalize">{insight.routeType}</div>
                    </div>
                </div>
            </div>

            {(insight.weatherConditions || insight.trafficLevel === 'heavy') && (
                <div className="space-y-2">
                    {insight.weatherConditions && (
                        <div className="text-xs text-indigo-800 flex items-start bg-indigo-100/50 p-2 rounded-lg">
                            <FaSnowflake className="mr-2 mt-0.5 flex-shrink-0 text-indigo-500" />
                            <span><strong>Weather Alert:</strong> {insight.weatherConditions}</span>
                        </div>
                    )}
                    {insight.trafficLevel === 'heavy' && (
                        <div className="text-xs text-orange-800 flex items-start bg-orange-50 p-2 rounded-lg border border-orange-100">
                            <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0 text-orange-500" />
                            <span><strong>Traffic Warning:</strong> Heavy traffic reported on this route. Consider alternative departure times.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RouteIntelligenceCard;
