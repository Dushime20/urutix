import React from 'react';
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Clock,
  Truck,
  Package,
  MapPin,
  CloudRain,
  Zap
} from 'lucide-react';
import { RiskScoreGauge, RiskScoreBar, RiskScoreBadge } from './RiskScoreGauge';

export interface RiskFactor {
  category: string;
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'low' | 'medium' | 'high';
  score: number; // contribution to risk (0-10)
  description: string;
}

export interface MitigationAction {
  action: string;
  cost: number;
  riskReduction: number; // percentage
  priority: 'required' | 'recommended' | 'optional';
  description: string;
}

export interface RiskAssessmentData {
  loadId: string;
  transporterId?: string;
  overallRiskScore: number; // 0-10 scale
  calculatedAt: string;
  
  // Risk Categories
  transporterRisk: {
    score: number;
    factors: RiskFactor[];
  };
  
  loadRisk: {
    score: number;
    factors: RiskFactor[];
  };
  
  routeRisk: {
    score: number;
    factors: RiskFactor[];
  };
  
  timelineRisk: {
    score: number;
    factors: RiskFactor[];
  };
  
  // Mitigation
  mitigation: {
    actions: MitigationAction[];
    totalCost: number;
    totalRiskReduction: number;
    estimatedLoss: number; // potential loss without mitigation
    roi: number; // return on investment
  };
}

interface RiskAssessmentCardProps {
  assessment: RiskAssessmentData;
  onAcceptMitigation?: (actions: MitigationAction[]) => void;
  compact?: boolean;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  assessment,
  onAcceptMitigation,
  compact = false
}) => {
  const [selectedMitigations, setSelectedMitigations] = React.useState<MitigationAction[]>(
    assessment.mitigation.actions.filter(a => a.priority === 'required')
  );

  const getRiskLevelLabel = (score: number): string => {
    if (score <= 3) return 'Low Risk';
    if (score <= 5) return 'Medium Risk';
    if (score <= 7) return 'High Risk';
    return 'Critical Risk';
  };

  const getRiskLevelEmoji = (score: number): string => {
    if (score <= 3) return '🟢';
    if (score <= 5) return '🟡';
    if (score <= 7) return '🟠';
    return '🔴';
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-5 h-5";
    switch (category.toLowerCase()) {
      case 'transporter':
        return <Truck className={iconClass} />;
      case 'load':
        return <Package className={iconClass} />;
      case 'route':
        return <MapPin className={iconClass} />;
      case 'timeline':
        return <Clock className={iconClass} />;
      default:
        return <Shield className={iconClass} />;
    }
  };

  const toggleMitigation = (action: MitigationAction) => {
    if (action.priority === 'required') return; // Can't deselect required

    if (selectedMitigations.find(m => m.action === action.action)) {
      setSelectedMitigations(selectedMitigations.filter(m => m.action !== action.action));
    } else {
      setSelectedMitigations([...selectedMitigations, action]);
    }
  };

  const calculateSelectedCost = () => {
    return selectedMitigations.reduce((sum, m) => sum + m.cost, 0);
  };

  const calculateSelectedReduction = () => {
    return selectedMitigations.reduce((sum, m) => sum + m.riskReduction, 0);
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-violet-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <RiskScoreGauge score={assessment.overallRiskScore} size="sm" showLabel={false} />
            <div>
              <p className="font-bold text-gray-900">
                {getRiskLevelEmoji(assessment.overallRiskScore)} {getRiskLevelLabel(assessment.overallRiskScore)}
              </p>
              <p className="text-xs text-gray-500">
                Risk Score: {assessment.overallRiskScore.toFixed(1)}/10
              </p>
            </div>
          </div>
          <RiskScoreBadge score={assessment.overallRiskScore} size="sm" />
        </div>

        {/* Quick Risk Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Transporter</p>
            <p className="font-semibold text-gray-900">{assessment.transporterRisk.score.toFixed(1)}/10</p>
          </div>
          <div>
            <p className="text-gray-500">Load</p>
            <p className="font-semibold text-gray-900">{assessment.loadRisk.score.toFixed(1)}/10</p>
          </div>
          <div>
            <p className="text-gray-500">Route</p>
            <p className="font-semibold text-gray-900">{assessment.routeRisk.score.toFixed(1)}/10</p>
          </div>
          <div>
            <p className="text-gray-500">Timeline</p>
            <p className="font-semibold text-gray-900">{assessment.timelineRisk.score.toFixed(1)}/10</p>
          </div>
        </div>

        {/* Mitigation Summary */}
        {assessment.mitigation.actions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Recommended Mitigation:</p>
            <p className="text-sm font-semibold text-emerald-600">
              ${assessment.mitigation.totalCost.toLocaleString()} reduces risk by {assessment.mitigation.totalRiskReduction}%
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full detailed view
  return (
    <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Risk Assessment Report</h3>
              <p className="text-violet-100">
                {getRiskLevelEmoji(assessment.overallRiskScore)} {getRiskLevelLabel(assessment.overallRiskScore)}
              </p>
            </div>
          </div>
          <RiskScoreGauge 
            score={assessment.overallRiskScore} 
            size="lg" 
            showLabel={false}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Risk Breakdown by Category */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Risk Breakdown
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transporter Risk */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Transporter</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {assessment.transporterRisk.score.toFixed(1)}
                </span>
              </div>
              <RiskScoreBar score={assessment.transporterRisk.score} showPercentage={false} />
            </div>

            {/* Load Risk */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-violet-500 rounded-lg p-2">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Load</span>
                </div>
                <span className="text-2xl font-bold text-violet-600">
                  {assessment.loadRisk.score.toFixed(1)}
                </span>
              </div>
              <RiskScoreBar score={assessment.loadRisk.score} showPercentage={false} />
            </div>

            {/* Route Risk */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500 rounded-lg p-2">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Route</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {assessment.routeRisk.score.toFixed(1)}
                </span>
              </div>
              <RiskScoreBar score={assessment.routeRisk.score} showPercentage={false} />
            </div>

            {/* Timeline Risk */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-500 rounded-lg p-2">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Timeline</span>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                  {assessment.timelineRisk.score.toFixed(1)}
                </span>
              </div>
              <RiskScoreBar score={assessment.timelineRisk.score} showPercentage={false} />
            </div>
          </div>
        </div>

        {/* Risk Factors Detail */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Risk Factors Analysis
          </h4>

          <div className="space-y-3">
            {[
              ...assessment.transporterRisk.factors,
              ...assessment.loadRisk.factors,
              ...assessment.routeRisk.factors,
              ...assessment.timelineRisk.factors
            ].map((factor, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                  factor.impact === 'positive'
                    ? 'bg-emerald-50 border-emerald-200'
                    : factor.impact === 'negative'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {factor.impact === 'positive' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : factor.impact === 'negative' ? (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{factor.factor}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      factor.severity === 'high'
                        ? 'bg-rose-200 text-rose-800'
                        : factor.severity === 'medium'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-emerald-200 text-emerald-800'
                    }`}>
                      {factor.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mitigation Recommendations */}
        {assessment.mitigation.actions.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Risk Mitigation Actions
            </h4>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${calculateSelectedCost().toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Risk Reduction</p>
                  <p className="text-2xl font-bold text-violet-600">
                    {calculateSelectedReduction()}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Potential Loss</p>
                  <p className="text-2xl font-bold text-rose-600">
                    ${assessment.mitigation.estimatedLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">ROI</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {assessment.mitigation.roi}x
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {assessment.mitigation.actions.map((action, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMitigations.find(m => m.action === action.action)
                      ? 'bg-violet-50 border-violet-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${action.priority === 'required' ? 'opacity-100' : 'opacity-90'}`}
                  onClick={() => toggleMitigation(action)}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedMitigations.find(m => m.action === action.action)}
                    disabled={action.priority === 'required'}
                    className="mt-1"
                    readOnly
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{action.action}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          action.priority === 'required'
                            ? 'bg-rose-100 text-rose-700'
                            : action.priority === 'recommended'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {action.priority.toUpperCase()}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          ${action.cost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                    <p className="text-xs text-emerald-600 font-medium">
                      Reduces risk by {action.riskReduction}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {onAcceptMitigation && (
              <button
                onClick={() => onAcceptMitigation(selectedMitigations)}
                className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                Apply Selected Mitigations (${calculateSelectedCost().toLocaleString()})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAssessmentCard;

