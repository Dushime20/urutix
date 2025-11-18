import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Award,
  Eye,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';

interface SafetyMetricsProps {
  driverId: string;
}

interface SafetyData {
  overallScore: number;
  drivingScore: number;
  complianceScore: number;
  vehicleScore: number;
  lastUpdated: string;
  trends: {
    period: string;
    score: number;
    change: number;
  }[];
  violations: {
    id: string;
    type: string;
    description: string;
    date: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'PENDING' | 'RESOLVED' | 'APPEALED';
    points: number;
  }[];
  certifications: {
    id: string;
    name: string;
    issueDate: string;
    expiryDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
  }[];
  inspections: {
    id: string;
    type: string;
    date: string;
    result: 'PASS' | 'FAIL' | 'CONDITIONAL';
    notes?: string;
  }[];
}

export const SafetyMetrics: React.FC<SafetyMetricsProps> = ({ driverId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showViolations, setShowViolations] = useState(false);
  const [showCertifications, setShowCertifications] = useState(false);

  const { data: safetyData, isLoading } = useQuery({
    queryKey: ['driver-safety', driverId, selectedPeriod],
    queryFn: () => driverApi.getSafetyMetrics(driverId, selectedPeriod),
    enabled: !!driverId,
  });

  // Mock data for demonstration
  const mockSafetyData: SafetyData = {
    overallScore: 87,
    drivingScore: 92,
    complianceScore: 85,
    vehicleScore: 88,
    lastUpdated: new Date().toISOString(),
    trends: [
      { period: 'Week 1', score: 82, change: 0 },
      { period: 'Week 2', score: 85, change: 3 },
      { period: 'Week 3', score: 87, change: 2 },
      { period: 'Week 4', score: 87, change: 0 }
    ],
    violations: [
      {
        id: '1',
        type: 'Speeding',
        description: 'Exceeded speed limit by 10 mph',
        date: '2024-01-15',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        points: 3
      },
      {
        id: '2',
        type: 'Harsh Braking',
        description: 'Sudden brake application detected',
        date: '2024-01-20',
        severity: 'LOW',
        status: 'PENDING',
        points: 1
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'Commercial Driver License',
        issueDate: '2020-03-15',
        expiryDate: '2025-03-15',
        status: 'ACTIVE'
      },
      {
        id: '2',
        name: 'Hazmat Endorsement',
        issueDate: '2021-06-20',
        expiryDate: '2024-06-20',
        status: 'EXPIRING_SOON'
      },
      {
        id: '3',
        name: 'Medical Certificate',
        issueDate: '2023-09-10',
        expiryDate: '2024-09-10',
        status: 'EXPIRING_SOON'
      }
    ],
    inspections: [
      {
        id: '1',
        type: 'Pre-Trip Inspection',
        date: '2024-01-25',
        result: 'PASS',
        notes: 'All systems operational'
      },
      {
        id: '2',
        type: 'Post-Trip Inspection',
        date: '2024-01-24',
        result: 'PASS',
        notes: 'Minor wear on brake pads'
      }
    ]
  };

  const data = safetyData || mockSafetyData;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-yellow-100';
    if (score >= 70) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRING_SOON': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCertificationStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'EXPIRING_SOON': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'EXPIRED': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Safety & Compliance</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Safety Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${getScoreBgColor(data.overallScore)}`}>
              <Shield className="w-6 h-6 text-gray-600" />
            </div>
            <span className={`text-sm font-medium ${getScoreColor(data.overallScore)}`}>
              {data.overallScore >= 90 ? 'Excellent' : data.overallScore >= 80 ? 'Good' : data.overallScore >= 70 ? 'Fair' : 'Poor'}
            </span>
          </div>
          <div className="mb-2">
            <p className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>{data.overallScore}</p>
            <p className="text-sm font-medium text-gray-600">Overall Safety Score</p>
          </div>
          <p className="text-xs text-gray-500">Last updated: {formatDate(data.lastUpdated)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="mb-2">
            <p className={`text-3xl font-bold ${getScoreColor(data.drivingScore)}`}>{data.drivingScore}</p>
            <p className="text-sm font-medium text-gray-600">Driving Score</p>
          </div>
          <p className="text-xs text-gray-500">Based on driving behavior</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="mb-2">
            <p className={`text-3xl font-bold ${getScoreColor(data.complianceScore)}`}>{data.complianceScore}</p>
            <p className="text-sm font-medium text-gray-600">Compliance Score</p>
          </div>
          <p className="text-xs text-gray-500">Regulatory compliance</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="mb-2">
            <p className={`text-3xl font-bold ${getScoreColor(data.vehicleScore)}`}>{data.vehicleScore}</p>
            <p className="text-sm font-medium text-gray-600">Vehicle Score</p>
          </div>
          <p className="text-xs text-gray-500">Vehicle maintenance</p>
        </div>
      </div>

      {/* Safety Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Score Trends</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.trends.map((trend, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(trend.score)}`}>{trend.score}</div>
              <div className="text-sm text-gray-600">{trend.period}</div>
              <div className={`text-xs ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.change >= 0 ? '+' : ''}{trend.change} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations and Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Violations</h3>
            <button
              onClick={() => setShowViolations(!showViolations)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showViolations ? 'Hide' : 'Show'} All
            </button>
          </div>
          
          <div className="space-y-3">
            {data.violations.slice(0, showViolations ? undefined : 2).map((violation) => (
              <div key={violation.id} className="border-l-4 border-red-400 pl-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{violation.type}</p>
                    <p className="text-xs text-gray-600">{violation.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(violation.date)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                      {violation.severity}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{violation.points} pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
            <button
              onClick={() => setShowCertifications(!showCertifications)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showCertifications ? 'Hide' : 'Show'} All
            </button>
          </div>
          
          <div className="space-y-3">
            {data.certifications.slice(0, showCertifications ? undefined : 2).map((cert) => (
              <div key={cert.id} className="border-l-4 border-green-400 pl-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                    <p className="text-xs text-gray-600">Expires: {formatDate(cert.expiryDate)}</p>
                    {cert.status === 'EXPIRING_SOON' && (
                      <p className="text-xs text-yellow-600">
                        Expires in {getDaysUntilExpiry(cert.expiryDate)} days
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getCertificationStatusIcon(cert.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                      {cert.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Inspections</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.inspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inspection.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(inspection.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inspection.result === 'PASS' ? 'bg-green-100 text-green-800' :
                      inspection.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inspection.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inspection.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Alerts</h3>
        <div className="space-y-3">
          {data.certifications.some(cert => cert.status === 'EXPIRING_SOON') && (
            <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Certifications expiring soon</span>
            </div>
          )}
          
          {data.violations.some(violation => violation.severity === 'HIGH' || violation.severity === 'CRITICAL') && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">High severity violations detected</span>
            </div>
          )}
          
          {data.overallScore < 80 && (
            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Safety score below recommended threshold</span>
            </div>
          )}
          
          {data.overallScore >= 90 && data.certifications.every(cert => cert.status === 'ACTIVE') && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">All safety metrics are excellent</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>View Full Report</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Download Certificates</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Schedule Training</span>
          </button>
        </div>
      </div>
    </div>
  );
};
