import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaExclamationTriangle, FaClipboardCheck, FaUserGraduate, 
  FaChartLine, FaBell, FaPlus, FaEye, FaEdit, FaTrash, FaDownload,
  FaCarCrash, FaTools, FaCheckCircle, FaTimes, FaClock, FaCalendarAlt,
  FaMapMarkerAlt, FaUser, FaTruck, FaDollarSign, FaFileAlt, FaSearch,
  FaFilter, FaSort, FaSortUp, FaSortDown, FaChartBar, FaChartPie
} from 'react-icons/fa';
import type { 
  SafetyIncident, SafetyInspection, DriverSafetyScore, SafetyTraining, 
  SafetyAlert, SafetyInspectionItem 
} from '../../types/fleet';

interface SafetyManagementProps {
  fleetId?: string;
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ fleetId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Mock data for demonstration
  const mockSafetyData = {
    incidents: [
      {
        id: 'inc-1',
        type: 'accident',
        severity: 'moderate',
        date: new Date('2024-01-15'),
        location: 'I-95, Exit 45, Miami, FL',
        description: 'Rear-end collision during heavy traffic',
        driverId: 'drv-001',
        driverName: 'John Smith',
        truckId: 'truck-001',
        truckPlate: 'ABC-123',
        weatherConditions: 'Rainy',
        roadConditions: 'Wet',
        injuries: 'Minor whiplash',
        propertyDamage: 5000,
        policeReport: true,
        reportNumber: 'PR-2024-001',
        status: 'investigating',
        assignedTo: 'Safety Manager',
        correctiveActions: ['Driver retraining', 'Vehicle inspection'],
        cost: 8000,
        insuranceClaim: true,
        claimNumber: 'CLM-2024-001'
      },
      {
        id: 'inc-2',
        type: 'near_miss',
        severity: 'minor',
        date: new Date('2024-01-20'),
        location: 'US-1, Jacksonville, FL',
        description: 'Close call with pedestrian at crosswalk',
        driverId: 'drv-002',
        driverName: 'Mike Johnson',
        truckId: 'truck-002',
        truckPlate: 'XYZ-789',
        weatherConditions: 'Clear',
        roadConditions: 'Dry',
        injuries: 'None',
        propertyDamage: 0,
        policeReport: false,
        reportNumber: '',
        status: 'resolved',
        assignedTo: 'Safety Manager',
        correctiveActions: ['Defensive driving training'],
        cost: 0,
        insuranceClaim: false
      }
    ],
    inspections: [
      {
        id: 'insp-1',
        type: 'pre_trip',
        inspector: 'Safety Officer',
        inspectionDate: new Date('2024-01-25'),
        truckId: 'truck-001',
        truckPlate: 'ABC-123',
        driverId: 'drv-001',
        driverName: 'John Smith',
        status: 'passed',
        score: 95,
        maxScore: 100,
        items: [
          {
            id: 'item-1',
            category: 'brakes',
            item: 'Brake pedal feel',
            status: 'pass',
            notes: 'Good brake response',
            critical: true
          },
          {
            id: 'item-2',
            category: 'tires',
            item: 'Tire pressure',
            status: 'pass',
            notes: 'All tires properly inflated',
            critical: true
          },
          {
            id: 'item-3',
            category: 'lights',
            item: 'Headlights',
            status: 'pass',
            notes: 'All lights working',
            critical: false
          }
        ],
        notes: 'Vehicle in good condition for trip',
        nextInspectionDate: new Date('2024-01-26'),
        complianceStatus: 'compliant'
      }
    ],
    driverScores: [
      {
        id: 'score-1',
        driverId: 'drv-001',
        driverName: 'John Smith',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        score: 85,
        maxScore: 100,
        percentage: 85,
        grade: 'B',
        metrics: {
          incidents: 1,
          violations: 0,
          inspections: 8,
          trainingHours: 4,
          milesDriven: 2500
        },
        trends: {
          previousScore: 82,
          improvement: 3,
          trend: 'improving'
        }
      },
      {
        id: 'score-2',
        driverId: 'drv-002',
        driverName: 'Mike Johnson',
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        score: 92,
        maxScore: 100,
        percentage: 92,
        grade: 'A',
        metrics: {
          incidents: 0,
          violations: 0,
          inspections: 10,
          trainingHours: 6,
          milesDriven: 2800
        },
        trends: {
          previousScore: 90,
          improvement: 2,
          trend: 'improving'
        }
      }
    ],
    training: [
      {
        id: 'train-1',
        type: 'defensive_driving',
        title: 'Defensive Driving Course',
        description: 'Advanced defensive driving techniques',
        duration: 4,
        required: true,
        frequency: 'annually',
        lastCompleted: new Date('2023-12-15'),
        nextDue: new Date('2024-12-15'),
        status: 'completed',
        driverId: 'drv-001',
        driverName: 'John Smith',
        instructor: 'Safety Academy',
        score: 88,
        certificate: 'CERT-2023-001'
      },
      {
        id: 'train-2',
        type: 'hazmat',
        title: 'Hazmat Transportation',
        description: 'Hazardous materials handling and safety',
        duration: 6,
        required: true,
        frequency: 'biannually',
        lastCompleted: new Date('2023-11-20'),
        nextDue: new Date('2024-05-20'),
        status: 'completed',
        driverId: 'drv-002',
        driverName: 'Mike Johnson',
        instructor: 'Hazmat Institute',
        score: 95,
        certificate: 'CERT-2023-002'
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        type: 'warning',
        title: 'Driver Training Due',
        message: 'John Smith needs to complete defensive driving refresher',
        date: new Date('2024-01-28'),
        priority: 'medium',
        status: 'active',
        relatedTo: 'driver',
        relatedId: 'drv-001',
        assignedTo: 'Safety Manager',
        dueDate: new Date('2024-02-15')
      },
      {
        id: 'alert-2',
        type: 'critical',
        title: 'Vehicle Inspection Failed',
        message: 'Truck ABC-123 failed pre-trip inspection',
        date: new Date('2024-01-27'),
        priority: 'high',
        status: 'active',
        relatedTo: 'truck',
        relatedId: 'truck-001',
        assignedTo: 'Maintenance Team',
        dueDate: new Date('2024-01-28')
      }
    ]
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'major': return 'bg-orange-100 text-orange-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'minor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'investigating':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Management</h1>
            <p className="text-gray-600">Monitor and manage fleet safety performance</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
              <FaPlus className="w-4 h-4" />
              Report Incident
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
              <FaDownload className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaShieldAlt className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Safety Score</p>
              <p className="text-2xl font-bold text-gray-900">92%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaCarCrash className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Incidents</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaClipboardCheck className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inspections</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaBell className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartLine },
            { id: 'incidents', label: 'Incidents', icon: FaCarCrash },
            { id: 'inspections', label: 'Inspections', icon: FaClipboardCheck },
            { id: 'drivers', label: 'Driver Scores', icon: FaUserGraduate },
            { id: 'training', label: 'Training', icon: FaUserGraduate },
            { id: 'alerts', label: 'Alerts', icon: FaBell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Safety Metrics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Safety Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Total Incidents</span>
                    <span className="font-semibold text-red-600">2</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Days Since Last Incident</span>
                    <span className="font-semibold text-green-600">12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Average Driver Score</span>
                    <span className="font-semibold text-blue-600">88.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Training Completion</span>
                    <span className="font-semibold text-green-600">95%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {mockSafetyData.alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className={`p-3 rounded border ${getAlertTypeColor(alert.type)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs opacity-75">{alert.message}</p>
                        </div>
                        <span className="text-xs">{alert.date.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Safety Incidents</h2>
              <button 
                onClick={() => setShowIncidentModal(true)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Report Incident
              </button>
            </div>
            <div className="space-y-4">
              {mockSafetyData.incidents.map(incident => (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaCarCrash className="w-6 h-6 text-red-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{incident.type.replace('_', ' ').toUpperCase()}</h3>
                        <p className="text-sm text-gray-500">{incident.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{incident.date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-2">{incident.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2">{incident.driverName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost:</span>
                      <span className="ml-2">${incident.cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                      <FaEye className="w-3 h-3 inline mr-1" />
                      View Details
                    </button>
                    <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                      <FaEdit className="w-3 h-3 inline mr-1" />
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inspections' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Safety Inspections</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Schedule Inspection
              </button>
            </div>
            <div className="space-y-4">
              {mockSafetyData.inspections.map(inspection => (
                <div key={inspection.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaClipboardCheck className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{inspection.type.replace('_', ' ').toUpperCase()} Inspection</h3>
                        <p className="text-sm text-gray-500">Inspector: {inspection.inspector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {inspection.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Score: {inspection.score}/{inspection.maxScore}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{inspection.inspectionDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Truck:</span>
                      <span className="ml-2">{inspection.truckPlate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2">{inspection.driverName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Due:</span>
                      <span className="ml-2">{inspection.nextInspectionDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Inspection Items:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {inspection.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-xs">{item.item}</span>
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                            item.status === 'pass' ? 'bg-green-100 text-green-800' :
                            item.status === 'fail' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Driver Safety Scores</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaDownload className="w-3 h-3 inline mr-1" />
                Export Scores
              </button>
            </div>
            <div className="space-y-4">
              {mockSafetyData.driverScores.map(score => (
                <div key={score.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaUserGraduate className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{score.driverName}</h3>
                        <p className="text-sm text-gray-500">{score.period} Safety Score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(score.grade)}`}>
                        Grade: {score.grade}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {score.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Incidents:</span>
                      <span className="ml-2">{score.metrics.incidents}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Violations:</span>
                      <span className="ml-2">{score.metrics.violations}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Inspections:</span>
                      <span className="ml-2">{score.metrics.inspections}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Training Hours:</span>
                      <span className="ml-2">{score.metrics.trainingHours}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Trend:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      score.trends.trend === 'improving' ? 'bg-green-100 text-green-800' :
                      score.trends.trend === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {score.trends.trend} ({score.trends.improvement > 0 ? '+' : ''}{score.trends.improvement} pts)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Safety Training</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Schedule Training
              </button>
            </div>
            <div className="space-y-4">
              {mockSafetyData.training.map(training => (
                <div key={training.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaUserGraduate className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{training.title}</h3>
                        <p className="text-sm text-gray-500">{training.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                        {training.status}
                      </span>
                      {training.score && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Score: {training.score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2">{training.driverName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-2">{training.duration} hours</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Completed:</span>
                      <span className="ml-2">{training.lastCompleted?.toLocaleDateString() || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Due:</span>
                      <span className="ml-2">{training.nextDue.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Safety Alerts</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Create Alert
              </button>
            </div>
            <div className="space-y-4">
              {mockSafetyData.alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertTypeColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaBell className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium text-gray-900">{alert.title}</h3>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">Assigned to: {alert.assignedTo}</span>
                      {alert.dueDate && (
                        <span className="text-gray-500">Due: {alert.dueDate.toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        Acknowledge
                      </button>
                      <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 