import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Clock, Shield } from 'lucide-react';

export type VerificationStatus = 'VERIFIED' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING' | 'NOT_VERIFIED';

interface VerificationBadgeProps {
  status: VerificationStatus;
  type: 'insurance' | 'license' | 'compliance' | 'credit' | 'overall';
  expiryDate?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  type,
  expiryDate,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          icon: CheckCircle,
          color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          iconColor: 'text-emerald-600',
          label: 'Verified',
          description: 'All checks passed'
        };
      case 'EXPIRING_SOON':
        return {
          icon: AlertCircle,
          color: 'bg-amber-100 text-amber-700 border-amber-300',
          iconColor: 'text-amber-600',
          label: 'Expiring Soon',
          description: expiryDate ? `Expires ${new Date(expiryDate).toLocaleDateString()}` : 'Expires soon'
        };
      case 'EXPIRED':
        return {
          icon: XCircle,
          color: 'bg-rose-100 text-rose-700 border-rose-300',
          iconColor: 'text-rose-600',
          label: 'Expired',
          description: 'Verification expired'
        };
      case 'PENDING':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          iconColor: 'text-blue-600',
          label: 'Pending',
          description: 'Verification in progress'
        };
      case 'NOT_VERIFIED':
      default:
        return {
          icon: XCircle,
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          iconColor: 'text-gray-600',
          label: 'Not Verified',
          description: 'Verification required'
        };
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'insurance':
        return 'Insurance';
      case 'license':
        return 'License';
      case 'compliance':
        return 'Compliance';
      case 'credit':
        return 'Credit';
      case 'overall':
        return 'Overall Status';
      default:
        return type;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1',
          icon: 'w-3 h-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'px-4 py-2',
          icon: 'w-6 h-6',
          text: 'text-base'
        };
      case 'md':
      default:
        return {
          container: 'px-3 py-1.5',
          icon: 'w-4 h-4',
          text: 'text-sm'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  if (!showLabel) {
    // Icon only version
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full ${config.color} ${sizeClasses.container} ${className}`}
        title={`${getTypeLabel()}: ${config.label} - ${config.description}`}
      >
        <Icon className={`${sizeClasses.icon} ${config.iconColor}`} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${config.color} ${sizeClasses.container} font-medium ${className}`}
      title={config.description}
    >
      <Icon className={`${sizeClasses.icon} ${config.iconColor}`} />
      <span className={sizeClasses.text}>
        {getTypeLabel()}: {config.label}
      </span>
    </div>
  );
};

// Compact version for lists
export const VerificationBadgeCompact: React.FC<{
  status: VerificationStatus;
  tooltip?: string;
}> = ({ status, tooltip }) => {
  const getIcon = () => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'EXPIRING_SOON':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div title={tooltip} className="inline-flex">
      {getIcon()}
    </div>
  );
};

// Badge group for showing multiple verifications
export const VerificationBadgeGroup: React.FC<{
  verifications: {
    type: 'insurance' | 'license' | 'compliance' | 'credit';
    status: VerificationStatus;
    expiryDate?: string;
  }[];
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}> = ({ verifications, layout = 'horizontal', size = 'sm' }) => {
  const containerClass = layout === 'horizontal' 
    ? 'flex flex-wrap gap-2'
    : 'flex flex-col gap-2';

  return (
    <div className={containerClass}>
      {verifications.map((verification, index) => (
        <VerificationBadge
          key={index}
          status={verification.status}
          type={verification.type}
          expiryDate={verification.expiryDate}
          size={size}
          showLabel={true}
        />
      ))}
    </div>
  );
};

// Overall verification status indicator
export const OverallVerificationStatus: React.FC<{
  insuranceStatus: VerificationStatus;
  licenseStatus: VerificationStatus;
  complianceStatus: VerificationStatus;
  creditStatus?: VerificationStatus;
}> = ({ insuranceStatus, licenseStatus, complianceStatus, creditStatus }) => {
  // Determine overall status (most critical status wins)
  const getOverallStatus = (): VerificationStatus => {
    const statuses = [insuranceStatus, licenseStatus, complianceStatus, creditStatus].filter(Boolean);
    
    if (statuses.includes('EXPIRED')) return 'EXPIRED';
    if (statuses.includes('NOT_VERIFIED')) return 'NOT_VERIFIED';
    if (statuses.includes('PENDING')) return 'PENDING';
    if (statuses.includes('EXPIRING_SOON')) return 'EXPIRING_SOON';
    if (statuses.every(s => s === 'VERIFIED')) return 'VERIFIED';
    
    return 'NOT_VERIFIED';
  };

  const overallStatus = getOverallStatus();
  
  return (
    <div className="space-y-3">
      <VerificationBadge
        status={overallStatus}
        type="overall"
        size="lg"
        showLabel={true}
      />
      
      <div className="grid grid-cols-2 gap-2">
        <VerificationBadge
          status={insuranceStatus}
          type="insurance"
          size="sm"
        />
        <VerificationBadge
          status={licenseStatus}
          type="license"
          size="sm"
        />
        <VerificationBadge
          status={complianceStatus}
          type="compliance"
          size="sm"
        />
        {creditStatus && (
          <VerificationBadge
            status={creditStatus}
            type="credit"
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default VerificationBadge;

