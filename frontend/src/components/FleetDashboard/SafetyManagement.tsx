import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaExclamationTriangle, FaClipboardCheck, FaUserGraduate, 
  FaChartLine, FaBell, FaPlus, FaEye, FaEdit, FaTrash, FaDownload,
  FaCarCrash, FaTools, FaCheckCircle, FaTimes, FaClock, FaCalendarAlt,
  FaMapMarkerAlt, FaUser, FaTruck, FaDollarSign, FaFileAlt, FaSearch,
  FaFilter, FaSort, FaSortUp, FaSortDown, FaChartBar, FaChartPie, FaSpinner
} from 'react-icons/fa';
import type { 
  SafetyIncident, SafetyInspection, DriverSafetyScore, SafetyTraining, 
  SafetyAlert, SafetyInspectionItem 
} from '../../types/fleet';
import { fleetApi } from '../../services/fleetApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SafetyManagementProps {
  fleetId?: string;
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ fleetId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<SafetyInspection | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<SafetyTraining | null>(null);
  const [isEditingIncident, setIsEditingIncident] = useState(false);
  const [isEditingInspection, setIsEditingInspection] = useState(false);
  const [isEditingTraining, setIsEditingTraining] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showViewIncidentModal, setShowViewIncidentModal] = useState(false);
  const [showViewInspectionModal, setShowViewInspectionModal] = useState(false);
  const [showViewTrainingModal, setShowViewTrainingModal] = useState(false);
  const [viewingIncident, setViewingIncident] = useState<SafetyIncident | null>(null);
  const [viewingInspection, setViewingInspection] = useState<SafetyInspection | null>(null);
  const [viewingTraining, setViewingTraining] = useState<SafetyTraining | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [inspections, setInspections] = useState<SafetyInspection[]>([]);
  const [trainings, setTrainings] = useState<SafetyTraining[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [inspectionsCount, setInspectionsCount] = useState(0);

  // Form state for incident report
  const [incidentForm, setIncidentForm] = useState({
    type: 'accident' as 'accident' | 'near_miss' | 'injury' | 'property_damage' | 'traffic_violation',
    severity: 'minor' as 'minor' | 'moderate' | 'major' | 'critical',
    date: new Date().toISOString().split('T')[0],
    location: '',
    description: '',
    driverId: '',
    truckId: '',
    weatherConditions: '',
    roadConditions: '',
    injuries: '',
    propertyDamage: 0,
    policeReport: false,
    reportNumber: '',
    status: 'reported' as 'reported' | 'investigating' | 'resolved' | 'closed',
    assignedTo: '',
    correctiveActions: [] as string[],
    cost: 0,
    insuranceClaim: false,
    claimNumber: '',
  });

  // Load incidents from API
  const loadIncidents = async () => {
    setLoadingIncidents(true);
    try {
      const data = await fleetApi.getSafetyIncidents();
      // Convert date strings to Date objects
      const incidentsWithDates = data.map((inc: any) => ({
        ...inc,
        date: inc.date ? new Date(inc.date) : new Date(),
      }));
      setIncidents(incidentsWithDates);
      setIncidentsCount(incidentsWithDates.length);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Failed to load incidents');
      setIncidentsCount(0);
    } finally {
      setLoadingIncidents(false);
    }
  };

  // Load trucks and drivers for dropdowns
  const loadTrucksAndDrivers = async () => {
    try {
      const [trucksData, driversData] = await Promise.all([
        fleetApi.getTrucks({}),
        fleetApi.getDrivers({}),
      ]);
      setTrucks(trucksData || []);
      setDrivers(driversData || []);
    } catch (error) {
      console.error('Error loading trucks and drivers:', error);
    }
  };


  // Handle form submission
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get driver and truck names
      const selectedDriver = drivers.find(d => d.id === incidentForm.driverId);
      const selectedTruck = trucks.find(t => t.id === incidentForm.truckId);

      const incidentData = {
        ...incidentForm,
        driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : '',
        truckPlate: selectedTruck?.plateNumber || '',
        date: new Date(incidentForm.date).toISOString(),
      };

      if (isEditingIncident && selectedIncident) {
        await fleetApi.updateSafetyIncident(selectedIncident.id, incidentData);
        toast.success('Incident updated successfully');
      } else {
        await fleetApi.createSafetyIncident(incidentData);
        toast.success('Incident reported successfully');
      }
      
      setShowIncidentModal(false);
      resetForm();
      setIsEditingIncident(false);
      setSelectedIncident(null);
      loadIncidents();
    } catch (error: any) {
      console.error('Error submitting incident:', error);
      toast.error(error.message || 'Failed to save incident');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit incident
  const handleEditIncident = (incident: SafetyIncident) => {
    setSelectedIncident(incident);
    setIsEditingIncident(true);
    
    // Format date for datetime-local input
    const incidentDate = incident.date instanceof Date 
      ? incident.date 
      : new Date(incident.date);
    const dateStr = incidentDate.toISOString().slice(0, 16);
    
    setIncidentForm({
      type: incident.type as any,
      severity: incident.severity as any,
      date: dateStr,
      location: incident.location || '',
      description: incident.description || '',
      driverId: incident.driverId || '',
      truckId: incident.truckId || '',
      weatherConditions: incident.weatherConditions || '',
      roadConditions: incident.roadConditions || '',
      injuries: incident.injuries || '',
      propertyDamage: incident.propertyDamage || 0,
      policeReport: incident.policeReport || false,
      reportNumber: incident.reportNumber || '',
      status: incident.status as any,
      assignedTo: incident.assignedTo || user?.name || '',
      correctiveActions: incident.correctiveActions || [],
      cost: incident.cost || 0,
      insuranceClaim: incident.insuranceClaim || false,
      claimNumber: incident.claimNumber || '',
    });
    
    setShowIncidentModal(true);
  };

  // Form state for inspection
  const [inspectionForm, setInspectionForm] = useState({
    type: 'pre_trip' as 'pre_trip' | 'post_trip' | 'weekly' | 'monthly' | 'annual' | 'random',
    inspector: user?.name || '',
    inspectionDate: new Date().toISOString().split('T')[0],
    truckId: '',
    driverId: '',
    status: 'passed' as 'passed' | 'failed' | 'conditional',
    score: 0,
    maxScore: 100,
    items: [] as any[],
    notes: '',
    nextInspectionDate: '',
    complianceStatus: 'compliant' as 'compliant' | 'non_compliant',
  });

  // Load inspections from API
  const loadInspections = async () => {
    setLoadingInspections(true);
    try {
      const data = await fleetApi.getSafetyInspections();
      // Convert date strings to Date objects
      const inspectionsWithDates = data.map((insp: any) => ({
        ...insp,
        inspectionDate: insp.inspectionDate ? new Date(insp.inspectionDate) : new Date(),
        nextInspectionDate: insp.nextInspectionDate ? new Date(insp.nextInspectionDate) : null,
      }));
      setInspections(inspectionsWithDates);
      setInspectionsCount(inspectionsWithDates.length);
    } catch (error) {
      console.error('Error loading inspections:', error);
      toast.error('Failed to load inspections');
      setInspectionsCount(0);
    } finally {
      setLoadingInspections(false);
    }
  };

  // Load trainings from API
  const loadTrainings = async () => {
    setLoadingTrainings(true);
    try {
      const data = await fleetApi.getSafetyTrainings();
      // Convert date strings to Date objects
      const trainingsWithDates = data.map((train: any) => ({
        ...train,
        scheduledDate: train.scheduledDate ? new Date(train.scheduledDate) : new Date(),
        nextDue: train.nextDue ? new Date(train.nextDue) : new Date(),
        lastCompleted: train.lastCompleted ? new Date(train.lastCompleted) : null,
      }));
      setTrainings(trainingsWithDates);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast.error('Failed to load trainings');
    } finally {
      setLoadingTrainings(false);
    }
  };

  useEffect(() => {
    loadIncidents();
    loadInspections();
    loadTrainings();
    loadTrucksAndDrivers();
  }, []);

  // Handle inspection form submission
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get driver and truck names
      const selectedDriver = drivers.find(d => d.id === inspectionForm.driverId);
      const selectedTruck = trucks.find(t => t.id === inspectionForm.truckId);

      const inspectionData = {
        ...inspectionForm,
        driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : '',
        truckPlate: selectedTruck?.plateNumber || '',
        inspectionDate: new Date(inspectionForm.inspectionDate).toISOString(),
        nextInspectionDate: inspectionForm.nextInspectionDate ? new Date(inspectionForm.nextInspectionDate).toISOString() : undefined,
      };

      if (isEditingInspection && selectedInspection) {
        await fleetApi.updateSafetyInspection(selectedInspection.id, inspectionData);
        toast.success('Inspection updated successfully');
      } else {
        await fleetApi.createSafetyInspection(inspectionData);
        toast.success('Inspection scheduled successfully');
      }
      
      setShowInspectionModal(false);
      resetInspectionForm();
      setIsEditingInspection(false);
      setSelectedInspection(null);
      loadInspections();
    } catch (error: any) {
      console.error('Error submitting inspection:', error);
      toast.error(error.message || 'Failed to save inspection');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit inspection
  const handleEditInspection = (inspection: SafetyInspection) => {
    setSelectedInspection(inspection);
    setIsEditingInspection(true);
    
    // Format dates for inputs
    const inspectionDate = inspection.inspectionDate instanceof Date 
      ? inspection.inspectionDate 
      : new Date(inspection.inspectionDate);
    const dateStr = inspectionDate.toISOString().split('T')[0];
    
    const nextDateStr = inspection.nextInspectionDate 
      ? (inspection.nextInspectionDate instanceof Date 
          ? inspection.nextInspectionDate 
          : new Date(inspection.nextInspectionDate)).toISOString().split('T')[0]
      : '';
    
    setInspectionForm({
      type: inspection.type as any,
      inspector: inspection.inspector || user?.name || '',
      inspectionDate: dateStr,
      truckId: inspection.truckId || '',
      driverId: inspection.driverId || '',
      status: inspection.status as any,
      score: inspection.score || 0,
      maxScore: inspection.maxScore || 100,
      items: inspection.items || [],
      notes: inspection.notes || '',
      nextInspectionDate: nextDateStr,
      complianceStatus: inspection.complianceStatus as any,
    });
    
    setShowInspectionModal(true);
  };

  const resetForm = () => {
    setIncidentForm({
      type: 'accident',
      severity: 'minor',
      date: new Date().toISOString().split('T')[0],
      location: '',
      description: '',
      driverId: '',
      truckId: '',
      weatherConditions: '',
      roadConditions: '',
      injuries: '',
      propertyDamage: 0,
      policeReport: false,
      reportNumber: '',
      status: 'reported',
      assignedTo: user?.name || '',
      correctiveActions: [],
      cost: 0,
      insuranceClaim: false,
      claimNumber: '',
    });
  };

  const resetInspectionForm = () => {
    setInspectionForm({
      type: 'pre_trip',
      inspector: user?.name || '',
      inspectionDate: new Date().toISOString().split('T')[0],
      truckId: '',
      driverId: '',
      status: 'passed',
      score: 0,
      maxScore: 100,
      items: [],
      notes: '',
      nextInspectionDate: '',
      complianceStatus: 'compliant',
    });
  };

  // Form state for training
  const [trainingForm, setTrainingForm] = useState({
    type: 'defensive_driving' as 'defensive_driving' | 'hazmat' | 'first_aid' | 'emergency_procedures' | 'regulations' | 'technology',
    title: '',
    description: '',
    duration: 1,
    required: false,
    frequency: 'once' as 'once' | 'annually' | 'biannually' | 'quarterly',
    scheduledDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
    nextDue: new Date().toISOString().split('T')[0],
    driverId: '',
    instructor: user?.name || '',
    status: 'pending' as 'completed' | 'pending' | 'overdue',
    score: undefined as number | undefined,
    certificate: '',
  });

  const resetTrainingForm = () => {
    setTrainingForm({
      type: 'defensive_driving',
      title: '',
      description: '',
      duration: 1,
      required: false,
      frequency: 'once',
      scheduledDate: new Date().toISOString().slice(0, 16),
      nextDue: new Date().toISOString().split('T')[0],
      driverId: '',
      instructor: user?.name || '',
      status: 'pending',
      score: undefined,
      certificate: '',
    });
  };

  // Handle training form submission
  const handleSubmitTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get driver name
      const selectedDriver = drivers.find(d => d.id === trainingForm.driverId);

      const trainingData = {
        ...trainingForm,
        driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : '',
        scheduledDate: new Date(trainingForm.scheduledDate).toISOString(),
        nextDue: new Date(trainingForm.nextDue).toISOString(),
      };

      if (isEditingTraining && selectedTraining) {
        await fleetApi.updateSafetyTraining(selectedTraining.id, trainingData);
        toast.success('Training updated successfully');
      } else {
        await fleetApi.createSafetyTraining(trainingData);
        toast.success('Training scheduled successfully');
      }
      
      setShowTrainingModal(false);
      resetTrainingForm();
      setIsEditingTraining(false);
      setSelectedTraining(null);
      loadTrainings();
    } catch (error: any) {
      console.error('Error submitting training:', error);
      toast.error(error.message || 'Failed to save training');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit training
  const handleEditTraining = (training: SafetyTraining) => {
    setSelectedTraining(training);
    setIsEditingTraining(true);
    
    // Format dates for inputs
    const scheduledDate = training.scheduledDate instanceof Date 
      ? training.scheduledDate 
      : new Date(training.scheduledDate);
    const scheduledDateStr = scheduledDate.toISOString().slice(0, 16);
    
    const nextDue = training.nextDue instanceof Date 
      ? training.nextDue 
      : new Date(training.nextDue);
    const nextDueStr = nextDue.toISOString().split('T')[0];
    
    setTrainingForm({
      type: training.type as any,
      title: training.title || '',
      description: training.description || '',
      duration: training.duration || 1,
      required: training.required || false,
      frequency: training.frequency as any || 'once',
      scheduledDate: scheduledDateStr,
      nextDue: nextDueStr,
      driverId: training.driverId || '',
      instructor: training.instructor || user?.name || '',
      status: training.status as any,
      score: training.score,
      certificate: training.certificate || '',
    });
    
    setShowTrainingModal(true);
  };

  const handleModalClose = () => {
    setShowIncidentModal(false);
    resetForm();
    setIsEditingIncident(false);
    setSelectedIncident(null);
  };

  const handleInspectionModalClose = () => {
    setShowInspectionModal(false);
    resetInspectionForm();
    setIsEditingInspection(false);
    setSelectedInspection(null);
  };

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
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Safety Management</h1>
            <p className="text-xs text-gray-600">Monitor and manage fleet safety performance</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1.5 text-sm font-medium transition-colors">
              <FaDownload className="w-3.5 h-3.5" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <FaShieldAlt className="w-4 h-4 text-gray-600" />
            </div>
            <div className="ml-2.5">
              <p className="text-xs font-medium text-gray-500">Safety Score</p>
              <p className="text-lg font-bold text-gray-900">92%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <FaCarCrash className="w-4 h-4 text-gray-600" />
            </div>
            <div className="ml-2.5">
              <p className="text-xs font-medium text-gray-500">Incidents</p>
              <p className="text-lg font-bold text-gray-900">{loadingIncidents ? '...' : incidentsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <FaClipboardCheck className="w-4 h-4 text-gray-600" />
            </div>
            <div className="ml-2.5">
              <p className="text-xs font-medium text-gray-500">Inspections</p>
              <p className="text-lg font-bold text-gray-900">{loadingInspections ? '...' : inspectionsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-4">
        <nav className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartLine },
            { id: 'incidents', label: 'Incidents', icon: FaCarCrash },
            { id: 'inspections', label: 'Inspections', icon: FaClipboardCheck },
            { id: 'training', label: 'Training', icon: FaUserGraduate }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-800 border border-gray-200 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
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
          <div className="p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Safety Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Safety Metrics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Safety Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-600">Total Incidents</span>
                    <span className="text-sm font-semibold text-gray-700">2</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-600">Days Since Last Incident</span>
                    <span className="text-sm font-semibold text-gray-700">12</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-600">Average Driver Score</span>
                    <span className="text-sm font-semibold text-gray-700">88.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-md">
                    <span className="text-xs text-gray-600">Training Completion</span>
                    <span className="text-sm font-semibold text-gray-700">95%</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
                <div className="space-y-2">
                  {mockSafetyData.alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className={`p-2.5 rounded-md border ${getAlertTypeColor(alert.type)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-xs">{alert.title}</p>
                          <p className="text-xs opacity-75 mt-0.5">{alert.message}</p>
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
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Safety Incidents</h2>
              <button 
                onClick={() => {
                  resetForm();
                  setShowIncidentModal(true);
                }}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center gap-1.5 font-medium transition-colors"
              >
                <FaPlus className="w-3.5 h-3.5" />
                Report Incident
              </button>
            </div>
            {loadingIncidents ? (
              <div className="text-center py-12">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Loading incidents...</p>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FaCarCrash className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Reported</h3>
                <p className="text-sm text-gray-600 mb-4">Click "Report Incident" to add a new safety incident</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map(incident => (
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
                        <span className="ml-2">{incident.date instanceof Date ? incident.date.toLocaleDateString() : new Date(incident.date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2">{incident.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Driver:</span>
                        <span className="ml-2">{incident.driverName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <span className="ml-2">${(incident.cost || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => {
                          setViewingIncident(incident);
                          setShowViewIncidentModal(true);
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <FaEye className="w-3 h-3 inline mr-1" />
                        View Details
                      </button>
                      <button 
                        onClick={() => handleEditIncident(incident)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <FaEdit className="w-3 h-3 inline mr-1" />
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspections' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Safety Inspections</h2>
              <button 
                onClick={() => {
                  resetInspectionForm();
                  setShowInspectionModal(true);
                }}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Schedule Inspection
              </button>
            </div>
            {loadingInspections ? (
              <div className="text-center py-12">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Loading inspections...</p>
              </div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FaClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inspections Scheduled</h3>
                <p className="text-sm text-gray-600 mb-4">Click "Schedule Inspection" to add a new safety inspection</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inspections.map(inspection => (
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
                      <span className="ml-2">
                        {inspection.inspectionDate instanceof Date 
                          ? inspection.inspectionDate.toLocaleDateString() 
                          : new Date(inspection.inspectionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Truck:</span>
                      <span className="ml-2">{inspection.truckPlate || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2">{inspection.driverName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Due:</span>
                      <span className="ml-2">
                        {inspection.nextInspectionDate 
                          ? (inspection.nextInspectionDate instanceof Date 
                              ? inspection.nextInspectionDate.toLocaleDateString() 
                              : new Date(inspection.nextInspectionDate).toLocaleDateString())
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {inspection.items && inspection.items.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Inspection Items:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {inspection.items.map((item: any) => (
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
                  )}
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => {
                        setViewingInspection(inspection);
                        setShowViewInspectionModal(true);
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <FaEye className="w-3 h-3 inline mr-1" />
                      View Details
                    </button>
                    <button 
                      onClick={() => handleEditInspection(inspection)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <FaEdit className="w-3 h-3 inline mr-1" />
                      Update
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Driver Scores tab hidden */}
        {false && activeTab === 'drivers' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Driver Safety Scores</h2>
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
              <button 
                onClick={() => {
                  resetTrainingForm();
                  setShowTrainingModal(true);
                }}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Schedule Training
              </button>
            </div>
            {loadingTrainings ? (
              <div className="text-center py-12">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Loading trainings...</p>
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FaUserGraduate className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trainings Scheduled</h3>
                <p className="text-sm text-gray-600 mb-4">Click "Schedule Training" to add a new safety training</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainings.map(training => (
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
                      <span className="ml-2">
                        {training.lastCompleted 
                          ? (training.lastCompleted instanceof Date 
                              ? training.lastCompleted.toLocaleDateString() 
                              : new Date(training.lastCompleted).toLocaleDateString())
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Due:</span>
                      <span className="ml-2">
                        {training.nextDue instanceof Date 
                          ? training.nextDue.toLocaleDateString() 
                          : new Date(training.nextDue).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Scheduled Date:</span>
                      <span className="ml-2">
                        {training.scheduledDate instanceof Date 
                          ? training.scheduledDate.toLocaleDateString() 
                          : new Date(training.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Instructor:</span>
                      <span className="ml-2">{training.instructor || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => {
                        setViewingTraining(training);
                        setShowViewTrainingModal(true);
                      }}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <FaEye className="w-3 h-3 inline mr-1" />
                      View Details
                    </button>
                    <button 
                      onClick={() => handleEditTraining(training)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <FaEdit className="w-3 h-3 inline mr-1" />
                      Update
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts tab hidden */}
        {false && activeTab === 'alerts' && (
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

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Report Safety Incident</h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitIncident} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Incident Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Incident Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incidentForm.type}
                    onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="accident">Accident</option>
                    <option value="near_miss">Near Miss</option>
                    <option value="injury">Injury</option>
                    <option value="property_damage">Property Damage</option>
                    <option value="traffic_violation">Traffic Violation</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={incidentForm.date}
                    onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={incidentForm.location}
                    onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                    placeholder="Enter incident location"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Driver */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Driver <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incidentForm.driverId}
                    onChange={(e) => setIncidentForm({ ...incidentForm, driverId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Truck */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Truck <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={incidentForm.truckId}
                    onChange={(e) => setIncidentForm({ ...incidentForm, truckId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Truck</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.plateNumber} - {truck.make} {truck.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weather Conditions */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weather Conditions</label>
                  <input
                    type="text"
                    value={incidentForm.weatherConditions}
                    onChange={(e) => setIncidentForm({ ...incidentForm, weatherConditions: e.target.value })}
                    placeholder="e.g., Clear, Rainy, Foggy"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Road Conditions */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Road Conditions</label>
                  <input
                    type="text"
                    value={incidentForm.roadConditions}
                    onChange={(e) => setIncidentForm({ ...incidentForm, roadConditions: e.target.value })}
                    placeholder="e.g., Dry, Wet, Icy"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Injuries */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Injuries</label>
                  <input
                    type="text"
                    value={incidentForm.injuries}
                    onChange={(e) => setIncidentForm({ ...incidentForm, injuries: e.target.value })}
                    placeholder="Describe any injuries"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Property Damage */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Property Damage ($)</label>
                  <input
                    type="number"
                    value={incidentForm.propertyDamage}
                    onChange={(e) => setIncidentForm({ ...incidentForm, propertyDamage: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Cost ($)</label>
                  <input
                    type="number"
                    value={incidentForm.cost}
                    onChange={(e) => setIncidentForm({ ...incidentForm, cost: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Police Report */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={incidentForm.policeReport}
                    onChange={(e) => setIncidentForm({ ...incidentForm, policeReport: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-xs font-medium text-gray-700">Police Report Filed</label>
                </div>

                {/* Report Number */}
                {incidentForm.policeReport && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Police Report Number</label>
                    <input
                      type="text"
                      value={incidentForm.reportNumber}
                      onChange={(e) => setIncidentForm({ ...incidentForm, reportNumber: e.target.value })}
                      placeholder="Enter report number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Insurance Claim */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={incidentForm.insuranceClaim}
                    onChange={(e) => setIncidentForm({ ...incidentForm, insuranceClaim: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-xs font-medium text-gray-700">Insurance Claim Filed</label>
                </div>

                {/* Claim Number */}
                {incidentForm.insuranceClaim && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Insurance Claim Number</label>
                    <input
                      type="text"
                      value={incidentForm.claimNumber}
                      onChange={(e) => setIncidentForm({ ...incidentForm, claimNumber: e.target.value })}
                      placeholder="Enter claim number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Assigned To */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={incidentForm.assignedTo}
                    onChange={(e) => setIncidentForm({ ...incidentForm, assignedTo: e.target.value })}
                    placeholder="Enter assignee name"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  placeholder="Provide a detailed description of the incident"
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      Report Incident
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditingInspection ? 'Edit Safety Inspection' : 'Schedule Safety Inspection'}
              </h2>
              <button
                onClick={handleInspectionModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Inspection Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Inspection Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inspectionForm.type}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, type: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="pre_trip">Pre-Trip</option>
                    <option value="post_trip">Post-Trip</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="random">Random</option>
                  </select>
                </div>

                {/* Inspector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Inspector <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inspectionForm.inspector}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, inspector: e.target.value })}
                    placeholder="Enter inspector name"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Inspection Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Inspection Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={inspectionForm.inspectionDate}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Next Inspection Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Next Inspection Date</label>
                  <input
                    type="date"
                    value={inspectionForm.nextInspectionDate}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, nextInspectionDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Truck */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Truck</label>
                  <select
                    value={inspectionForm.truckId}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, truckId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Truck</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.plateNumber} - {truck.make} {truck.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Driver</label>
                  <select
                    value={inspectionForm.driverId}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, driverId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inspectionForm.status}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="conditional">Conditional</option>
                  </select>
                </div>

                {/* Compliance Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Compliance Status</label>
                  <select
                    value={inspectionForm.complianceStatus}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, complianceStatus: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="compliant">Compliant</option>
                    <option value="non_compliant">Non-Compliant</option>
                  </select>
                </div>

                {/* Score */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Score</label>
                  <input
                    type="number"
                    value={inspectionForm.score}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, score: parseInt(e.target.value) || 0 })}
                    min="0"
                    max={inspectionForm.maxScore}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Max Score */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={inspectionForm.maxScore}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, maxScore: parseInt(e.target.value) || 100 })}
                    min="0"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                  placeholder="Add inspection notes or observations"
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleInspectionModalClose}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      {isEditingInspection ? 'Update Inspection' : 'Schedule Inspection'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Training Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditingTraining ? 'Edit Safety Training' : 'Schedule Safety Training'}
              </h2>
              <button
                onClick={() => {
                  setShowTrainingModal(false);
                  resetTrainingForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTraining} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* Training Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Training Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={trainingForm.type}
                    onChange={(e) => setTrainingForm({ ...trainingForm, type: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="defensive_driving">Defensive Driving</option>
                    <option value="hazmat">HAZMAT</option>
                    <option value="first_aid">First Aid</option>
                    <option value="emergency_procedures">Emergency Procedures</option>
                    <option value="regulations">Regulations</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trainingForm.title}
                    onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                    placeholder="e.g., Defensive Driving Course 2024"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Scheduled Date & Time */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={trainingForm.scheduledDate}
                    onChange={(e) => setTrainingForm({ ...trainingForm, scheduledDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Next Due Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Next Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={trainingForm.nextDue}
                    onChange={(e) => setTrainingForm({ ...trainingForm, nextDue: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Driver */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Driver</label>
                  <select
                    value={trainingForm.driverId}
                    onChange={(e) => setTrainingForm({ ...trainingForm, driverId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Instructor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trainingForm.instructor}
                    onChange={(e) => setTrainingForm({ ...trainingForm, instructor: e.target.value })}
                    placeholder="Enter instructor name"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={trainingForm.duration}
                    onChange={(e) => setTrainingForm({ ...trainingForm, duration: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={trainingForm.frequency}
                    onChange={(e) => setTrainingForm({ ...trainingForm, frequency: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="once">Once</option>
                    <option value="annually">Annually</option>
                    <option value="biannually">Biannually</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                {/* Required */}
                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={trainingForm.required}
                    onChange={(e) => setTrainingForm({ ...trainingForm, required: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="required" className="text-xs font-medium text-gray-700">Required Training</label>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={trainingForm.status}
                    onChange={(e) => setTrainingForm({ ...trainingForm, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Score */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Score (%)</label>
                  <input
                    type="number"
                    value={trainingForm.score || ''}
                    onChange={(e) => setTrainingForm({ ...trainingForm, score: e.target.value ? parseInt(e.target.value) : undefined })}
                    min="0"
                    max="100"
                    placeholder="Optional"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={trainingForm.description}
                  onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                  placeholder="Add training description or notes"
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowTrainingModal(false);
                    resetTrainingForm();
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      {isEditingTraining ? 'Update Training' : 'Schedule Training'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Incident Modal */}
      {showViewIncidentModal && viewingIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Incident Details</h2>
              <button
                onClick={() => {
                  setShowViewIncidentModal(false);
                  setViewingIncident(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
                  <p className="text-sm text-gray-900">{viewingIncident.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(viewingIncident.severity)}`}>
                    {viewingIncident.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-sm text-gray-900">
                    {viewingIncident.date instanceof Date 
                      ? viewingIncident.date.toLocaleDateString() 
                      : new Date(viewingIncident.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingIncident.status)}`}>
                    {viewingIncident.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-sm text-gray-900">{viewingIncident.location || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <p className="text-sm text-gray-900">{viewingIncident.driverName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck</label>
                  <p className="text-sm text-gray-900">{viewingIncident.truckPlate || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                  <p className="text-sm text-gray-900">${(viewingIncident.cost || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weather Conditions</label>
                  <p className="text-sm text-gray-900">{viewingIncident.weatherConditions || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Road Conditions</label>
                  <p className="text-sm text-gray-900">{viewingIncident.roadConditions || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Damage</label>
                  <p className="text-sm text-gray-900">${(viewingIncident.propertyDamage || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Injuries</label>
                  <p className="text-sm text-gray-900">{viewingIncident.injuries || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Police Report</label>
                  <p className="text-sm text-gray-900">{viewingIncident.policeReport ? 'Yes' : 'No'}</p>
                  {viewingIncident.policeReport && viewingIncident.reportNumber && (
                    <p className="text-xs text-gray-600 mt-1">Report #: {viewingIncident.reportNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Claim</label>
                  <p className="text-sm text-gray-900">{viewingIncident.insuranceClaim ? 'Yes' : 'No'}</p>
                  {viewingIncident.insuranceClaim && viewingIncident.claimNumber && (
                    <p className="text-xs text-gray-600 mt-1">Claim #: {viewingIncident.claimNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <p className="text-sm text-gray-900">{viewingIncident.assignedTo || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingIncident.description || 'N/A'}</p>
              </div>
              {viewingIncident.correctiveActions && viewingIncident.correctiveActions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Actions</label>
                  <ul className="list-disc list-inside text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {viewingIncident.correctiveActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewIncidentModal(false);
                    setViewingIncident(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Inspection Modal */}
      {showViewInspectionModal && viewingInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Inspection Details</h2>
              <button
                onClick={() => {
                  setShowViewInspectionModal(false);
                  setViewingInspection(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Type</label>
                  <p className="text-sm text-gray-900">{viewingInspection.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                  <p className="text-sm text-gray-900">{viewingInspection.inspector || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                  <p className="text-sm text-gray-900">
                    {viewingInspection.inspectionDate instanceof Date 
                      ? viewingInspection.inspectionDate.toLocaleDateString() 
                      : new Date(viewingInspection.inspectionDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingInspection.status)}`}>
                    {viewingInspection.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Truck</label>
                  <p className="text-sm text-gray-900">{viewingInspection.truckPlate || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <p className="text-sm text-gray-900">{viewingInspection.driverName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                  <p className="text-sm text-gray-900">{viewingInspection.score}/{viewingInspection.maxScore}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    viewingInspection.complianceStatus === 'compliant' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingInspection.complianceStatus}
                  </span>
                </div>
                {viewingInspection.nextInspectionDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Inspection Date</label>
                    <p className="text-sm text-gray-900">
                      {viewingInspection.nextInspectionDate instanceof Date 
                        ? viewingInspection.nextInspectionDate.toLocaleDateString() 
                        : new Date(viewingInspection.nextInspectionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {viewingInspection.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingInspection.notes}</p>
                </div>
              )}
              {viewingInspection.items && viewingInspection.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Items</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {viewingInspection.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                          <span className="text-xs font-medium">{item.item || item.category || 'N/A'}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'pass' ? 'bg-green-100 text-green-800' :
                            item.status === 'fail' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewInspectionModal(false);
                    setViewingInspection(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Training Modal */}
      {showViewTrainingModal && viewingTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Training Details</h2>
              <button
                onClick={() => {
                  setShowViewTrainingModal(false);
                  setViewingTraining(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Training Type</label>
                  <p className="text-sm text-gray-900">{viewingTraining.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-sm text-gray-900">{viewingTraining.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <p className="text-sm text-gray-900">
                    {viewingTraining.scheduledDate instanceof Date 
                      ? viewingTraining.scheduledDate.toLocaleDateString() 
                      : new Date(viewingTraining.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                  <p className="text-sm text-gray-900">
                    {viewingTraining.nextDue instanceof Date 
                      ? viewingTraining.nextDue.toLocaleDateString() 
                      : new Date(viewingTraining.nextDue).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <p className="text-sm text-gray-900">{viewingTraining.driverName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  <p className="text-sm text-gray-900">{viewingTraining.instructor || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-sm text-gray-900">{viewingTraining.duration} hours</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingTraining.status)}`}>
                    {viewingTraining.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <p className="text-sm text-gray-900">{viewingTraining.frequency || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required</label>
                  <p className="text-sm text-gray-900">{viewingTraining.required ? 'Yes' : 'No'}</p>
                </div>
                {viewingTraining.score !== undefined && viewingTraining.score !== null && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                    <p className="text-sm text-gray-900">{viewingTraining.score}%</p>
                  </div>
                )}
                {viewingTraining.certificate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate</label>
                    <p className="text-sm text-gray-900">{viewingTraining.certificate}</p>
                  </div>
                )}
                {viewingTraining.lastCompleted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Completed</label>
                    <p className="text-sm text-gray-900">
                      {viewingTraining.lastCompleted instanceof Date 
                        ? viewingTraining.lastCompleted.toLocaleDateString() 
                        : new Date(viewingTraining.lastCompleted).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {viewingTraining.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{viewingTraining.description}</p>
                </div>
              )}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewTrainingModal(false);
                    setViewingTraining(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 