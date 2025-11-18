import React, { useState } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaChartBar, FaDownload, FaEye, FaEdit, FaPlus } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CoverageAnalysis: React.FC = () => {
  const [selectedTruck, setSelectedTruck] = useState('all');
  const [analysisType, setAnalysisType] = useState('overview');

  // Mock data for coverage analysis
  const coverageData = [
    {
      truckId: 'TRK-001',
      truckPlate: 'ABC-123',
      liability: { covered: true, limit: 500000, recommended: 1000000, status: 'adequate' },
      collision: { covered: true, limit: 500000, recommended: 500000, status: 'adequate' },
      comprehensive: { covered: true, limit: 500000, recommended: 500000, status: 'adequate' },
      cargo: { covered: true, limit: 100000, recommended: 250000, status: 'insufficient' },
      uninsuredMotorist: { covered: false, limit: 0, recommended: 500000, status: 'missing' },
      roadside: { covered: true, limit: 1000, recommended: 1000, status: 'adequate' },
      medical: { covered: false, limit: 0, recommended: 10000, status: 'missing' },
    },
    {
      truckId: 'TRK-002',
      truckPlate: 'XYZ-789',
      liability: { covered: true, limit: 300000, recommended: 1000000, status: 'insufficient' },
      collision: { covered: false, limit: 0, recommended: 500000, status: 'missing' },
      comprehensive: { covered: false, limit: 0, recommended: 500000, status: 'missing' },
      cargo: { covered: true, limit: 150000, recommended: 250000, status: 'adequate' },
      uninsuredMotorist: { covered: false, limit: 0, recommended: 500000, status: 'missing' },
      roadside: { covered: false, limit: 0, recommended: 1000, status: 'missing' },
      medical: { covered: false, limit: 0, recommended: 10000, status: 'missing' },
    },
    {
      truckId: 'TRK-003',
      truckPlate: 'DEF-456',
      liability: { covered: true, limit: 750000, recommended: 1000000, status: 'adequate' },
      collision: { covered: true, limit: 750000, recommended: 500000, status: 'adequate' },
      comprehensive: { covered: true, limit: 750000, recommended: 500000, status: 'adequate' },
      cargo: { covered: true, limit: 300000, recommended: 250000, status: 'adequate' },
      uninsuredMotorist: { covered: true, limit: 500000, recommended: 500000, status: 'adequate' },
      roadside: { covered: true, limit: 1500, recommended: 1000, status: 'adequate' },
      medical: { covered: true, limit: 15000, recommended: 10000, status: 'adequate' },
    },
  ];

  const coverageTypes = [
    { name: 'Liability', description: 'Covers damage to others in accidents', importance: 'Critical' },
    { name: 'Collision', description: 'Covers damage to your truck in accidents', importance: 'High' },
    { name: 'Comprehensive', description: 'Covers non-accident damage (theft, weather)', importance: 'High' },
    { name: 'Cargo', description: 'Covers damage to transported goods', importance: 'Medium' },
    { name: 'Uninsured Motorist', description: 'Covers you if hit by uninsured driver', importance: 'Medium' },
    { name: 'Roadside Assistance', description: 'Provides emergency roadside help', importance: 'Low' },
    { name: 'Medical Payments', description: 'Covers medical expenses after accidents', importance: 'Low' },
  ];

  const riskAssessmentData = [
    { factor: 'Driving Record', score: 85, weight: 30 },
    { factor: 'Vehicle Age', score: 70, weight: 25 },
    { factor: 'Coverage Gaps', score: 45, weight: 20 },
    { factor: 'Claims History', score: 80, weight: 15 },
    { factor: 'Geographic Risk', score: 60, weight: 10 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adequate':
        return 'text-green-600 bg-green-100';
      case 'insufficient':
        return 'text-yellow-600 bg-yellow-100';
      case 'missing':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'adequate':
        return FaCheckCircle;
      case 'insufficient':
        return FaExclamationTriangle;
      case 'missing':
        return FaExclamationTriangle;
      default:
        return FaInfoCircle;
    }
  };

  const calculateCoverageScore = (truck: any) => {
    const coverageItems = [truck.liability, truck.collision, truck.comprehensive, truck.cargo, truck.uninsuredMotorist, truck.roadside, truck.medical];
    const totalItems = coverageItems.length;
    const coveredItems = coverageItems.filter(item => item.covered).length;
    const adequateItems = coverageItems.filter(item => item.status === 'adequate').length;
    
    return {
      coveragePercentage: Math.round((coveredItems / totalItems) * 100),
      adequacyPercentage: Math.round((adequateItems / totalItems) * 100),
      overallScore: Math.round(((coveredItems * 0.6) + (adequateItems * 0.4)) / totalItems * 100)
    };
  };

  const selectedTruckData = selectedTruck === 'all' ? coverageData : coverageData.filter(t => t.truckId === selectedTruck);
  const overallScore = selectedTruck === 'all' 
    ? Math.round(coverageData.reduce((sum, t) => sum + calculateCoverageScore(t).overallScore, 0) / coverageData.length)
    : calculateCoverageScore(selectedTruckData[0]).overallScore;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coverage Analysis</h1>
          <p className="text-gray-600">Comprehensive insurance coverage assessment and recommendations</p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedTruck}
            onChange={(e) => setSelectedTruck(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Trucks</option>
            {coverageData.map(truck => (
              <option key={truck.truckId} value={truck.truckId}>{truck.truckPlate}</option>
            ))}
          </select>
          
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <FaDownload className="mr-2" />
            Export Analysis
          </button>
        </div>
      </div>

      {/* Analysis Type Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'detailed', 'recommendations', 'risk'].map((type) => (
            <button
              key={type}
              onClick={() => setAnalysisType(type)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                analysisType === type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Analysis */}
      {analysisType === 'overview' && (
        <div className="space-y-6">
          {/* Overall Coverage Score */}
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Coverage Score</h3>
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(overallScore / 100) * 352} 352`}
                    className={`text-${overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red'}-500`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{overallScore}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {overallScore >= 80 ? 'Excellent Coverage' : overallScore >= 60 ? 'Good Coverage' : 'Needs Improvement'}
              </p>
            </div>
          </div>

          {/* Coverage Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <FaShieldAlt className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Coverage Gaps</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedTruckData.reduce((sum, t) => {
                      const gaps = [t.liability, t.collision, t.comprehensive, t.cargo, t.uninsuredMotorist, t.roadside, t.medical]
                        .filter(item => item.status === 'missing').length;
                      return sum + gaps;
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Insufficient Limits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedTruckData.reduce((sum, t) => {
                      const insufficient = [t.liability, t.collision, t.comprehensive, t.cargo, t.uninsuredMotorist, t.roadside, t.medical]
                        .filter(item => item.status === 'insufficient').length;
                      return sum + insufficient;
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Adequate Coverage</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedTruckData.reduce((sum, t) => {
                      const adequate = [t.liability, t.collision, t.comprehensive, t.cargo, t.uninsuredMotorist, t.roadside, t.medical]
                        .filter(item => item.status === 'adequate').length;
                      return sum + adequate;
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center">
                <FaChartBar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Risk Level</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallScore >= 80 ? 'Low' : overallScore >= 60 ? 'Medium' : 'High'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Distribution Chart */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="importance" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {analysisType === 'detailed' && (
        <div className="space-y-6">
          {selectedTruckData.map((truck) => (
            <div key={truck.truckId} className="bg-white rounded-lg border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {truck.truckPlate} - Detailed Coverage Analysis
                </h3>
                <p className="text-sm text-gray-600">Truck ID: {truck.truckId}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Limit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(truck).filter(([key]) => key !== 'truckId' && key !== 'truckPlate').map(([coverageType, details]: [string, any]) => (
                      <tr key={coverageType} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {coverageType.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {coverageTypes.find(ct => ct.name.toLowerCase() === coverageType.toLowerCase())?.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {React.createElement(getStatusIcon(details.status), { className: "h-4 w-4 mr-2" })}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(details.status)}`}>
                              {details.status.charAt(0).toUpperCase() + details.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {details.covered ? `$${details.limit.toLocaleString()}` : 'Not Covered'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          ${details.recommended.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <FaEye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <FaEdit className="h-4 w-4" />
                            </button>
                            {!details.covered && (
                              <button className="text-blue-600 hover:text-blue-900">
                                <FaPlus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {analysisType === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Recommendations</h3>
            <div className="space-y-4">
              {coverageTypes.map((coverage) => {
                const missingTrucks = coverageData.filter(truck => {
                  const coverageItem = truck[coverage.name.toLowerCase().replace(/\s+/g, '') as keyof typeof truck] as any;
                  return !coverageItem?.covered;
                });
                
                if (missingTrucks.length === 0) return null;
                
                return (
                  <div key={coverage.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{coverage.name} Coverage</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        coverage.importance === 'Critical' ? 'bg-red-100 text-red-800' :
                        coverage.importance === 'High' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {coverage.importance} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{coverage.description}</p>
                    <div className="text-sm text-gray-500">
                      <strong>Missing from:</strong> {missingTrucks.map(t => t.truckPlate).join(', ')}
                    </div>
                    <div className="mt-3">
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        Add Coverage →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {analysisType === 'risk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment Factors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskAssessmentData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis />
                <Radar name="Risk Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h4 className="font-medium text-gray-900 mb-4">Risk Factors Breakdown</h4>
              <div className="space-y-3">
                {riskAssessmentData.map((factor) => (
                  <div key={factor.factor} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{factor.factor}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{factor.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h4 className="font-medium text-gray-900 mb-4">Risk Mitigation</h4>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-1">Immediate Actions</h5>
                  <p className="text-sm text-yellow-700">Add missing critical coverage types</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-1">Short-term</h5>
                  <p className="text-sm text-blue-700">Increase insufficient coverage limits</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-1">Long-term</h5>
                  <p className="text-sm text-green-700">Implement risk management programs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverageAnalysis;
