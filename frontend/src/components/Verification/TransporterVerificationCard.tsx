import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Eye, Calendar, FileText, TrendingUp, Award } from 'lucide-react';
import { VerificationBadge, VerificationStatus, OverallVerificationStatus } from './VerificationBadge';

export interface VerificationData {
  transporterId: string;
  transporterName: string;
  verifiedAt?: string;
  insurance: {
    status: VerificationStatus;
    provider?: string;
    policyNumber?: string;
    coverage?: number;
    expiryDate?: string;
    verifiedDate?: string;
  };
  license: {
    status: VerificationStatus;
    licenseNumber?: string;
    type?: string;
    expiryDate?: string;
    verifiedDate?: string;
  };
  compliance: {
    status: VerificationStatus;
    dotNumber?: string;
    mcNumber?: string;
    safetyRating?: 'SATISFACTORY' | 'CONDITIONAL' | 'UNSATISFACTORY';
    lastInspection?: string;
    violations?: number;
  };
  credit?: {
    status: VerificationStatus;
    score?: string; // A+, A, B+, etc.
    paymentHistory?: number; // percentage
    outstandingDebts?: number;
  };
  performance?: {
    onTimeRate?: number;
    completionRate?: number;
    damageRate?: number;
    rating?: number;
  };
}

interface TransporterVerificationCardProps {
  verification: VerificationData;
  onViewDetails?: () => void;
  compact?: boolean;
}

export const TransporterVerificationCard: React.FC<TransporterVerificationCardProps> = ({
  verification,
  onViewDetails,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate overall trust score
  const getTrustScore = (): number => {
    let score = 0;
    let factors = 0;

    if (verification.insurance.status === 'VERIFIED') { score += 30; factors++; }
    if (verification.license.status === 'VERIFIED') { score += 25; factors++; }
    if (verification.compliance.status === 'VERIFIED') { score += 25; factors++; }
    if (verification.credit?.status === 'VERIFIED') { score += 20; factors++; }

    return factors > 0 ? Math.round(score) : 0;
  };

  const trustScore = getTrustScore();

  const getTrustScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getTrustScoreBg = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-teal-600';
    if (score >= 70) return 'from-blue-500 to-indigo-600';
    if (score >= 50) return 'from-amber-500 to-orange-600';
    return 'from-rose-500 to-pink-600';
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-violet-300 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`bg-gradient-to-r ${getTrustScoreBg(trustScore)} rounded-lg p-2`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Verification Status</p>
              <p className={`text-xs ${getTrustScoreColor(trustScore)} font-bold`}>
                Trust Score: {trustScore}/100
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            {showDetails ? 'Hide' : 'View'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            {verification.insurance.status === 'VERIFIED' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="text-xs text-gray-600">Insurance</span>
          </div>
          <div className="flex items-center gap-2">
            {verification.license.status === 'VERIFIED' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="text-xs text-gray-600">License</span>
          </div>
          <div className="flex items-center gap-2">
            {verification.compliance.status === 'VERIFIED' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="text-xs text-gray-600">Compliance</span>
          </div>
          {verification.credit && (
            <div className="flex items-center gap-2">
              {verification.credit.status === 'VERIFIED' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="text-xs text-gray-600">Credit</span>
            </div>
          )}
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {/* Insurance Details */}
            {verification.insurance.provider && (
              <div className="text-xs">
                <p className="font-medium text-gray-700 mb-1">Insurance Provider</p>
                <p className="text-gray-600">{verification.insurance.provider}</p>
                {verification.insurance.expiryDate && (
                  <p className="text-gray-500 mt-1">
                    Expires: {new Date(verification.insurance.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Compliance Details */}
            {verification.compliance.dotNumber && (
              <div className="text-xs">
                <p className="font-medium text-gray-700 mb-1">DOT/MC Numbers</p>
                <p className="text-gray-600">
                  DOT: {verification.compliance.dotNumber}
                  {verification.compliance.mcNumber && ` | MC: ${verification.compliance.mcNumber}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full detailed view
  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTrustScoreBg(trustScore)} p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Verification Report</h3>
              <p className="text-white/80">{verification.transporterName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80 mb-1">Trust Score</p>
            <p className="text-5xl font-bold">{trustScore}</p>
            <p className="text-sm text-white/80">out of 100</p>
          </div>
        </div>

        {/* Overall Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <OverallVerificationStatus
            insuranceStatus={verification.insurance.status}
            licenseStatus={verification.license.status}
            complianceStatus={verification.compliance.status}
            creditStatus={verification.credit?.status}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Insurance Section */}
        <div className="border-l-4 border-emerald-500 pl-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Insurance Coverage
            </h4>
            <VerificationBadge
              status={verification.insurance.status}
              type="insurance"
              expiryDate={verification.insurance.expiryDate}
              showLabel={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {verification.insurance.provider && (
              <div>
                <p className="text-gray-500">Provider</p>
                <p className="font-medium text-gray-900">{verification.insurance.provider}</p>
              </div>
            )}
            {verification.insurance.policyNumber && (
              <div>
                <p className="text-gray-500">Policy Number</p>
                <p className="font-medium text-gray-900">{verification.insurance.policyNumber}</p>
              </div>
            )}
            {verification.insurance.coverage && (
              <div>
                <p className="text-gray-500">Coverage Amount</p>
                <p className="font-medium text-gray-900">${verification.insurance.coverage.toLocaleString()}</p>
              </div>
            )}
            {verification.insurance.expiryDate && (
              <div>
                <p className="text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expiry Date
                </p>
                <p className="font-medium text-gray-900">
                  {new Date(verification.insurance.expiryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* License Section */}
        <div className="border-l-4 border-blue-500 pl-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              License Information
            </h4>
            <VerificationBadge
              status={verification.license.status}
              type="license"
              expiryDate={verification.license.expiryDate}
              showLabel={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {verification.license.licenseNumber && (
              <div>
                <p className="text-gray-500">License Number</p>
                <p className="font-medium text-gray-900">{verification.license.licenseNumber}</p>
              </div>
            )}
            {verification.license.type && (
              <div>
                <p className="text-gray-500">License Type</p>
                <p className="font-medium text-gray-900">{verification.license.type}</p>
              </div>
            )}
            {verification.license.expiryDate && (
              <div>
                <p className="text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Expiry Date
                </p>
                <p className="font-medium text-gray-900">
                  {new Date(verification.license.expiryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Compliance Section */}
        <div className="border-l-4 border-violet-500 pl-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-600" />
              Compliance Status
            </h4>
            <VerificationBadge
              status={verification.compliance.status}
              type="compliance"
              showLabel={false}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {verification.compliance.dotNumber && (
              <div>
                <p className="text-gray-500">DOT Number</p>
                <p className="font-medium text-gray-900">{verification.compliance.dotNumber}</p>
              </div>
            )}
            {verification.compliance.mcNumber && (
              <div>
                <p className="text-gray-500">MC Number</p>
                <p className="font-medium text-gray-900">{verification.compliance.mcNumber}</p>
              </div>
            )}
            {verification.compliance.safetyRating && (
              <div>
                <p className="text-gray-500">Safety Rating</p>
                <p className={`font-medium ${
                  verification.compliance.safetyRating === 'SATISFACTORY' 
                    ? 'text-emerald-600'
                    : verification.compliance.safetyRating === 'CONDITIONAL'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}>
                  {verification.compliance.safetyRating}
                </p>
              </div>
            )}
            {verification.compliance.violations !== undefined && (
              <div>
                <p className="text-gray-500">Violations (Last Year)</p>
                <p className="font-medium text-gray-900">{verification.compliance.violations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Section (if available) */}
        {verification.credit && (
          <div className="border-l-4 border-amber-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Credit Assessment
              </h4>
              <VerificationBadge
                status={verification.credit.status}
                type="credit"
                showLabel={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {verification.credit.score && (
                <div>
                  <p className="text-gray-500">Credit Score</p>
                  <p className="font-medium text-gray-900 text-xl">{verification.credit.score}</p>
                </div>
              )}
              {verification.credit.paymentHistory !== undefined && (
                <div>
                  <p className="text-gray-500">Payment History</p>
                  <p className="font-medium text-gray-900">{verification.credit.paymentHistory}% On-Time</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics (if available) */}
        {verification.performance && (
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {verification.performance.onTimeRate !== undefined && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-violet-600">{verification.performance.onTimeRate}%</p>
                  <p className="text-xs text-gray-600 mt-1">On-Time Delivery</p>
                </div>
              )}
              {verification.performance.completionRate !== undefined && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{verification.performance.completionRate}%</p>
                  <p className="text-xs text-gray-600 mt-1">Completion Rate</p>
                </div>
              )}
              {verification.performance.damageRate !== undefined && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">{verification.performance.damageRate}%</p>
                  <p className="text-xs text-gray-600 mt-1">Damage Rate</p>
                </div>
              )}
              {verification.performance.rating !== undefined && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{verification.performance.rating}/5</p>
                  <p className="text-xs text-gray-600 mt-1">Customer Rating</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {onViewDetails && (
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onViewDetails}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              View Full Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransporterVerificationCard;

