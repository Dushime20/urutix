import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskScoreGaugeProps {
  score: number; // 0-10 scale
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  animated = true
}) => {
  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 3) return 'LOW';
    if (score <= 5) return 'MEDIUM';
    if (score <= 7) return 'HIGH';
    return 'CRITICAL';
  };

  const getRiskConfig = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return {
          color: 'text-emerald-600',
          bgGradient: 'from-emerald-500 to-teal-600',
          bgLight: 'bg-emerald-50',
          icon: CheckCircle,
          label: 'Low Risk',
          description: 'Excellent match with minimal risk factors'
        };
      case 'MEDIUM':
        return {
          color: 'text-amber-600',
          bgGradient: 'from-amber-500 to-orange-600',
          bgLight: 'bg-amber-50',
          icon: AlertCircle,
          label: 'Medium Risk',
          description: 'Acceptable risk with some caution advised'
        };
      case 'HIGH':
        return {
          color: 'text-orange-600',
          bgGradient: 'from-orange-500 to-rose-600',
          bgLight: 'bg-orange-50',
          icon: AlertTriangle,
          label: 'High Risk',
          description: 'Significant risk factors present'
        };
      case 'CRITICAL':
        return {
          color: 'text-rose-600',
          bgGradient: 'from-rose-500 to-pink-600',
          bgLight: 'bg-rose-50',
          icon: XCircle,
          label: 'Critical Risk',
          description: 'High risk - proceed with extreme caution'
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-24 h-24',
          strokeWidth: 6,
          fontSize: 'text-xl',
          labelSize: 'text-xs',
          iconSize: 'w-4 h-4'
        };
      case 'lg':
        return {
          container: 'w-48 h-48',
          strokeWidth: 12,
          fontSize: 'text-5xl',
          labelSize: 'text-base',
          iconSize: 'w-8 h-8'
        };
      case 'md':
      default:
        return {
          container: 'w-32 h-32',
          strokeWidth: 8,
          fontSize: 'text-3xl',
          labelSize: 'text-sm',
          iconSize: 'w-6 h-6'
        };
    }
  };

  const riskLevel = getRiskLevel(score);
  const config = getRiskConfig(riskLevel);
  const sizeConfig = getSizeConfig();
  const Icon = config.icon;

  // Calculate percentage for circular progress (0-10 scale to 0-100%)
  const percentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular Gauge */}
      <div className={`relative ${sizeConfig.container}`}>
        {/* Background Circle */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="currentColor"
            strokeWidth={sizeConfig.strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress Circle */}
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="currentColor"
            strokeWidth={sizeConfig.strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={config.color}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: animated ? strokeDashoffset : 0,
              transition: animated ? 'stroke-dashoffset 1s ease-in-out' : 'none'
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`font-bold ${config.color} ${sizeConfig.fontSize}`}>
            {score.toFixed(1)}
          </p>
          <p className={`${sizeConfig.labelSize} text-gray-500 font-medium`}>/ 10</p>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgLight}`}>
            <Icon className={`${sizeConfig.iconSize} ${config.color}`} />
            <span className={`font-bold ${config.color} ${sizeConfig.labelSize}`}>
              {config.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Horizontal bar version
export const RiskScoreBar: React.FC<{
  score: number;
  label?: string;
  showPercentage?: boolean;
}> = ({ score, label, showPercentage = true }) => {
  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 3) return 'LOW';
    if (score <= 5) return 'MEDIUM';
    if (score <= 7) return 'HIGH';
    return 'CRITICAL';
  };

  const riskLevel = getRiskLevel(score);
  const percentage = (score / 10) * 100;

  const getBarColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-amber-500 to-orange-600';
      case 'HIGH':
        return 'bg-gradient-to-r from-orange-500 to-rose-600';
      case 'CRITICAL':
        return 'bg-gradient-to-r from-rose-500 to-pink-600';
    }
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-bold text-gray-900">
              {score.toFixed(1)}/10
            </span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(riskLevel)} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Compact badge version
export const RiskScoreBadge: React.FC<{
  score: number;
  size?: 'sm' | 'md';
}> = ({ score, size = 'md' }) => {
  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 3) return 'LOW';
    if (score <= 5) return 'MEDIUM';
    if (score <= 7) return 'HIGH';
    return 'CRITICAL';
  };

  const getBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-700 border-rose-300';
    }
  };

  const riskLevel = getRiskLevel(score);
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 font-bold ${getBadgeColor(riskLevel)} ${sizeClasses}`}
    >
      <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      Risk: {score.toFixed(1)}
    </span>
  );
};

export default RiskScoreGauge;

