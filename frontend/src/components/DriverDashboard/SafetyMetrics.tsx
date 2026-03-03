import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Award,
  Eye,
  Download,
  Truck,
  AlertCircle,
  Filter,
  Navigation
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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

  const getScoreColor = (_score: number) => {
    return 'text-[#0f172a]';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (score >= 80) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (score >= 70) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'MEDIUM': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'HIGH': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'CRITICAL': return 'bg-rose-50 text-rose-800 border-rose-100';
      default: return 'bg-slate-50 text-slate-800 border-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'EXPIRING_SOON': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'EXPIRED': return 'bg-rose-50 text-rose-800 border-rose-100';
      default: return 'bg-slate-50 text-slate-800 border-slate-100';
    }
  };

  const getCertificationStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'EXPIRING_SOON': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'EXPIRED': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-end gap-4">

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="h-10 pl-4 pr-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>

          <button className="h-10 px-4 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Safety Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Score - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Shield className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-3xl font-black tracking-tight ${getScoreColor(data.overallScore)}`}>{data.overallScore}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${getScoreBgColor(data.overallScore)}`}>
                {data.overallScore >= 90 ? 'Excellent' : 'Good'}
              </span>
            </div>
            <p className="text-sm font-bold text-[#345E85]">Overall Score</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Safety Index</p>
          </div>
        </motion.div>

        {/* Driving Score - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Navigation className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-3xl font-black tracking-tight ${getScoreColor(data.drivingScore)}`}>{data.drivingScore}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${getScoreBgColor(data.drivingScore)}`}>
                Behavior
              </span>
            </div>
            <p className="text-sm font-bold text-[#345E85]">Driving Score</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">On-Road</p>
          </div>
        </motion.div>

        {/* Compliance Score - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <FileText className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-3xl font-black tracking-tight ${getScoreColor(data.complianceScore)}`}>{data.complianceScore}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${getScoreBgColor(data.complianceScore)}`}>
                Logs
              </span>
            </div>
            <p className="text-sm font-bold text-[#345E85]">Compliance</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Regulatory</p>
          </div>
        </motion.div>

        {/* Vehicle Score - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Truck className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-3xl font-black tracking-tight ${getScoreColor(data.vehicleScore)}`}>{data.vehicleScore}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${getScoreBgColor(data.vehicleScore)}`}>
                Health
              </span>
            </div>
            <p className="text-sm font-bold text-[#345E85]">Vehicle Score</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Maintenance</p>
          </div>
        </motion.div>
      </div>

      {/* Safety Trends */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-50 rounded-xl">
            <TrendingUp className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Performance Trends</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {data.trends.map((trend, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-100 transition-colors">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{trend.period}</span>
              <div className={`text-3xl font-black mb-1 ${getScoreColor(trend.score)}`}>{trend.score}</div>
              <div className={`flex items-center gap-1 text-xs font-bold ${trend.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend.change)} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations and Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Recent Violations
            </h3>
            <button
              onClick={() => setShowViolations(!showViolations)}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors"
            >
              {showViolations ? 'Hide' : 'View All'}
            </button>
          </div>

          <div className="space-y-4">
            {data.violations.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No recent violations</div>
            ) : (
              data.violations.slice(0, showViolations ? undefined : 2).map((violation) => (
                <div key={violation.id} className="p-4 rounded-2xl border border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 transition-all cursor-default group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getSeverityColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-400">{formatDate(violation.date)}</span>
                      </div>
                      <p className="font-bold text-slate-800">{violation.type}</p>
                    </div>
                    <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {violation.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 pl-1 border-l-2 border-slate-200">{violation.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#345E85]" />
              Certifications
            </h3>
            <button
              onClick={() => setShowCertifications(!showCertifications)}
              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors"
            >
              {showCertifications ? 'Hide' : 'View All'}
            </button>
          </div>

          <div className="space-y-4">
            {data.certifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No certifications found</div>
            ) : (
              data.certifications.slice(0, showCertifications ? undefined : 2).map((cert) => (
                <div key={cert.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-default group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getStatusColor(cert.status)}`}>
                          {cert.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800">{cert.name}</p>
                    </div>
                    {getCertificationStatusIcon(cert.status)}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-medium">Expires: {formatDate(cert.expiryDate)}</span>
                    {cert.status === 'EXPIRING_SOON' && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {getDaysUntilExpiry(cert.expiryDate)} days left
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-50 rounded-xl">
            <FileText className="w-5 h-5 text-[#345E85]" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Recent Inspections</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Result</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.inspections.map((inspection) => (
                <tr key={inspection.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{inspection.type}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{formatDate(inspection.date)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${inspection.result === 'PASS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      inspection.result === 'FAIL' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                      {inspection.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{inspection.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Alerts */}
      <AnimatePresence>
        {(data.certifications.some(cert => cert.status === 'EXPIRING_SOON') ||
          data.violations.some(violation => ['HIGH', 'CRITICAL'].includes(violation.severity)) ||
          data.overallScore < 80) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Safety Alerts</h3>
              </div>
              <div className="space-y-4">
                {data.certifications.some(cert => cert.status === 'EXPIRING_SOON') && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-amber-800">Certifications expiring soon - Action Required</span>
                  </div>
                )}

                {data.violations.some(violation => ['HIGH', 'CRITICAL'].includes(violation.severity)) && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-rose-800">High severity violations detected - Review Immediately</span>
                  </div>
                )}

                {data.overallScore < 80 && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-orange-800">Safety score below recommended threshold</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <h3 className="text-lg font-black text-slate-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="py-4 bg-white hover:bg-blue-50 text-[#345E85] rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group border border-slate-100 hover:border-blue-100 shadow-sm">
            <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>View Full Report</span>
          </button>
          <button className="py-4 bg-white hover:bg-blue-50 text-[#345E85] rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group border border-slate-100 hover:border-blue-100 shadow-sm">
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Download Docs</span>
          </button>
          <button className="py-4 bg-white hover:bg-blue-50 text-[#345E85] rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 group border border-slate-100 hover:border-blue-100 shadow-sm">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Schedule Training</span>
          </button>
        </div>
      </div>
    </div>
  );
};
