import React, { useState, useEffect } from 'react';
import { fleetApi, type FleetItem, type Driver } from '../services/fleetApi'; // Import FleetItem and Driver types
import { FleetFormEnhanced as FleetForm } from '../components/FleetDashboard/FleetFormEnhanced';
import DocumentAssignmentModal from '../components/FleetDashboard/DocumentAssignmentModal';
import DriverFormModal from '../components/FleetDashboard/DriverFormModal';
import VehicleDetailsModal from '../components/FleetDashboard/VehicleDetailsModal';
import AssignmentModal from '../components/FleetDashboard/AssignmentModal';
import InspectionModal from '../components/FleetDashboard/InspectionModal';
import toast from 'react-hot-toast';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logoUrutiX from '../assets/logo-urutix.svg';
import { ProtectedAction } from '../components/common/ProtectedAction';
import ModernLoader from '../components/common/ModernLoader';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';
import { usePermission } from '../contexts/PermissionContext';

// Types
interface Vehicle {
    id: string;
    vinNumber: string;
    licensePlate: string;
    make: string; // Added make
    model: string; // Added model
    assetCategory: 'Heavy Truck' | 'Logistics Bus' | 'Van Delivery' | 'Heavy Hauler' | 'Other';
    categoryIcon: string;
    categoryColor: string;
    assignedDriver: {
        name: string;
        avatar: string;
    } | null;
    compliance: 'ACTIVE' | 'MAINTENANCE' | 'EXPIRED' | 'PENDING';
    lastInspection: string;
    inspectionExpired?: boolean;
}

interface DashboardStats {
    totalAssets: number;
    totalAssetsChange: number;
    totalAssetsUp: boolean;
    driverCompliance: number;
    complianceChange: number;
    complianceUp: boolean;
    availableVehicles: number;
    availableChange: number;
    availableUp: boolean;
    safetyAlerts: number;
}

const NewFleetManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [complianceFilter, setComplianceFilter] = useState('all');

    // Data States
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]); // Drivers state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const [stats, setStats] = useState<DashboardStats>({
        totalAssets: 0,
        totalAssetsChange: 0,
        totalAssetsUp: true,
        driverCompliance: 0,
        complianceChange: 0,
        complianceUp: true,
        availableVehicles: 0,
        availableChange: 0,
        availableUp: true,
        safetyAlerts: 0
    });

    // Compliance distribution state
    const [complianceData, setComplianceData] = useState({
        active: 0,
        renewed: 0,
        pending: 0,
        expired: 0,
        total: 0,
    });

    // Recent inspections state
    const [recentInspections, setRecentInspections] = useState<Array<{ id: string; vehicle: string; description: string; time: string }>>([]);

    // Document Modal State
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedEntityForDocs, setSelectedEntityForDocs] = useState<{ id: string, name: string, type: 'truck' | 'driver' } | null>(null);

    // Truck Form State
    const [showTruckForm, setShowTruckForm] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingTruck, setEditingTruck] = useState<FleetItem | null>(null);

    // Details Modal State
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTruckForDetails, setSelectedTruckForDetails] = useState<{ id: string } | null>(null);

    // Assignment Modal State
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedTruckForAssignment, setSelectedTruckForAssignment] = useState<{ id: string, name: string } | null>(null);

    // Inspection Modal State
    const [showInspectionModal, setShowInspectionModal] = useState(false);

    // Bulk Actions State
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

    const handleBulkAction = async (action: 'delete' | 'update', status?: string) => {
        if (selectedVehicleIds.length === 0) return;

        try {
            if (action === 'delete') {
                if (window.confirm(`Are you sure you want to delete ${selectedVehicleIds.length} vehicles?`)) {
                    const success = await fleetApi.bulkDeleteTrucks(selectedVehicleIds);
                    if (success) {
                        toast.success(`Successfully deleted ${selectedVehicleIds.length} vehicles`);
                        setVehicles(vehicles.filter(v => !selectedVehicleIds.includes(v.id)));
                        setSelectedVehicleIds([]);
                    }
                }
            } else if (action === 'update' && status) {
                const success = await fleetApi.bulkUpdateTruckStatus(selectedVehicleIds, status);
                if (success) {
                    toast.success(`Updated status for ${selectedVehicleIds.length} vehicles`);
                    // Refresh vehicles or update local state
                    setVehicles(vehicles.map(v => selectedVehicleIds.includes(v.id) ? { ...v, compliance: status as any } : v));
                    setSelectedVehicleIds([]);
                }
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
            toast.error('Failed to perform bulk action');
        }
    };
    const [selectedTruckForInspection, setSelectedTruckForInspection] = useState<{ id: string, name: string } | null>(null);

    // Driver Modal State
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [driverFormMode, setDriverFormMode] = useState<'create' | 'edit'>('create');
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize useNavigate
    const { hasPermission } = usePermission();

    // Fetch Fleet Data
    const loadFleetData = async () => {
        setLoading(true);
        try {
            // Fetch basic data
            const [trucksData, driversData] = await Promise.all([
                fleetApi.getTrucks(),
                fleetApi.getDrivers()
            ]);

            setDrivers(driversData); // Store drivers in state

            // Calculate Stats
            const totalAssets = trucksData.length;
            const availableVehicles = trucksData.filter(t => t.status === 'AVAILABLE').length;
            const activeDrivers = driversData.filter(d => d.status === 'ACTIVE').length;
            const complianceRate = driversData.length > 0
                ? Math.round((activeDrivers / driversData.length) * 100)
                : 100;

            // Calculate compliance data from trucks
            const activeCompliance = trucksData.filter(t => t.status !== 'MAINTENANCE' && t.status !== 'OUT_OF_SERVICE').length;
            const maintenanceCompliance = trucksData.filter(t => t.status === 'MAINTENANCE').length;
            const expiredCompliance = trucksData.filter(t => t.status === 'OUT_OF_SERVICE').length;

            setComplianceData({
                active: activeCompliance,
                renewed: 0,
                pending: maintenanceCompliance,
                expired: expiredCompliance,
                total: totalAssets
            });

            setStats({
                totalAssets,
                totalAssetsChange: 2, // Mock change for now
                totalAssetsUp: true,
                driverCompliance: complianceRate,
                complianceChange: 1.5,
                complianceUp: true,
                availableVehicles,
                availableChange: 5,
                availableUp: true,
                safetyAlerts: 3 // Mock alerts
            });

            // Derive Recent Inspections from Trucks
            const derivedInspections = trucksData
                .filter(t => t.lastMaintenanceDate)
                .map(t => ({
                    id: t.id,
                    vehicle: `${t.make} ${t.model} (${t.plateNumber})`,
                    description: 'Scheduled Maintenance',
                    time: new Date(t.lastMaintenanceDate!).toLocaleDateString()
                }))
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .slice(0, 5);

            setRecentInspections(derivedInspections);

            // Map Trucks to View Model
            const mappedVehicles: Vehicle[] = trucksData.map(truck => {
                // Determine category icon and color
                let categoryIcon = 'local_shipping';
                let categoryColor = 'text-blue-600';
                let category: Vehicle['assetCategory'] = 'Heavy Truck';

                // Simple logic to map random types if not specified
                // In a real app, you'd map truck.truckType
                const type = (truck as any).truckType || 'FLATBED'; // Cast as any if type missing

                if (type === 'VAN') {
                    category = 'Van Delivery';
                    categoryIcon = 'airport_shuttle';
                    categoryColor = 'text-indigo-600';
                } else if (type === 'BUS') {
                    category = 'Logistics Bus';
                    categoryIcon = 'directions_bus';
                    categoryColor = 'text-orange-600';
                } else if (type === 'HEAVY_HAUL') {
                    category = 'Heavy Hauler';
                    categoryIcon = 'rv_hookup';
                    categoryColor = 'text-purple-600';
                }

                // Map Driver
                let assignedDriver = null;
                if (truck.assignedDrivers && truck.assignedDrivers.length > 0) {
                    const driver = truck.assignedDrivers[0];
                    assignedDriver = {
                        name: driver.driverName,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.driverName}`
                    };
                }

                // Map Compliance
                let compliance: Vehicle['compliance'] = 'ACTIVE';
                if (truck.status === 'MAINTENANCE') compliance = 'MAINTENANCE';
                else if (truck.status === 'OUT_OF_SERVICE') compliance = 'EXPIRED';

                // Check Inspection status
                const nextMaintenanceDate = truck.nextMaintenanceDate ? new Date(truck.nextMaintenanceDate) : null;
                const isExpired = nextMaintenanceDate ? nextMaintenanceDate < new Date() : false;

                return {
                    id: truck.id,
                    vinNumber: (truck as any).vin || `VN-${truck.plateNumber}`,
                    licensePlate: truck.plateNumber,
                    make: truck.make, // Added make
                    model: truck.model, // Added model
                    assetCategory: category,
                    categoryIcon,
                    categoryColor,
                    assignedDriver,
                    compliance,
                    lastInspection: (truck as any).lastMaintenanceDate
                        ? new Date((truck as any).lastMaintenanceDate).toLocaleDateString()
                        : 'N/A',
                    inspectionExpired: isExpired
                };
            });

            setVehicles(mappedVehicles);

        } catch (error) {
            console.error('Failed to load fleet data:', error);
            toast.error('Failed to load fleet data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFleetData();
    }, []);

    // Filtering Logic
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => {
            const matchesSearch = v.vinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.assignedDriver?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

            let matchesCategory = true;
            if (categoryFilter !== 'all') {
                if (categoryFilter === 'Heavy Truck') matchesCategory = v.assetCategory === 'Heavy Truck';
                else matchesCategory = v.assetCategory.toLowerCase().includes(categoryFilter.toLowerCase()) ||
                    v.assetCategory === categoryFilter; // Loose matching for simplicity
            }

            const matchesCompliance = complianceFilter === 'all' || v.compliance.toLowerCase() === complianceFilter;

            return matchesSearch && matchesCategory && matchesCompliance;
        });
    }, [vehicles, searchQuery, categoryFilter, complianceFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const paginatedVehicles = filteredVehicles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Filtered Drivers
    const filteredDrivers = useMemo(() => {
        return drivers.filter(d =>
            `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [drivers, searchQuery]);

    // Handlers
    const handleCreateTruck = () => {
        setEditingTruck(null);
        setFormMode('create');
        setShowTruckForm(true);
    };

    const handleEditTruck = async (truckId: string) => {
        try {
            const truck = await fleetApi.getTruck(truckId);
            if (truck) {
                setEditingTruck(truck);
                setFormMode('edit');
                setShowTruckForm(true);
            }
        } catch (error) {
            console.error('Error fetching truck details:', error);
            toast.error('Failed to load truck details');
        }
    };

    const handleDeleteTruck = async (truckId: string) => {
        if (!window.confirm('Are you sure you want to delete this truck? This action cannot be undone.')) {
            return;
        }

        try {
            await fleetApi.deleteTruck(truckId);
            toast.success('Truck deleted successfully');
            loadFleetData(); // Refresh list
        } catch (error) {
            console.error('Error deleting truck:', error);
            toast.error('Failed to delete truck');
        }
    };

    const handleOpenDocuments = (truckId: string, make: string, model: string, plate: string) => {
        setSelectedEntityForDocs({
            id: truckId,
            name: `${make} ${model} (${plate})`,
            type: 'truck'
        });
        setShowDocumentModal(true);
    };

    const handleOpenDriverDocuments = (driver: Driver) => {
        setSelectedEntityForDocs({
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            type: 'driver'
        });
        setShowDocumentModal(true);
    };

    const handleAssignDriver = (truck: any) => {
        const make = truck.make || truck.model?.split(' ')[0] || 'Truck';
        const model = truck.model?.split(' ').slice(1).join(' ') || truck.model || '';
        const plate = truck.licensePlate || truck.plateNumber || '';

        setSelectedTruckForAssignment({
            id: truck.id,
            name: `${make} ${model} (${plate})`
        });
        setShowAssignmentModal(true);
    };

    const handleScheduleInspection = (truck: any) => {
        const make = truck.make || truck.model?.split(' ')[0] || 'Truck';
        const model = truck.model?.split(' ').slice(1).join(' ') || truck.model || '';
        const plate = truck.licensePlate || truck.plateNumber || '';

        setSelectedTruckForInspection({
            id: truck.id,
            name: `${make} ${model} (${plate})`
        });
        setShowInspectionModal(true);
    };

    const handleSubmitTruck = async (data: any) => {
        try {
            let truck;
            if (formMode === 'create') {
                truck = await fleetApi.createTruck(data);
                console.log('✅ Truck created successfully:', truck);
                toast.success('Truck registered successfully!');
            } else if (editingTruck) {
                truck = await fleetApi.updateTruck(editingTruck.id, data);
                toast.success('Truck updated successfully!');
            }
            setShowTruckForm(false);
            setEditingTruck(null);
            
            // Wait for data refresh to complete before returning
            await loadFleetData();
            
            return truck;
        } catch (error) {
            console.error('Error saving truck:', error);
            toast.error('Failed to save truck. Please try again.');
            throw error;
        }
    };

    const handleCloseTruckForm = () => {
        setShowTruckForm(false);
        setEditingTruck(null);
    };

    // Driver Handlers
    const handleRegisterDriver = () => {
        setDriverFormMode('create');
        setEditingDriver(null);
        setShowDriverModal(true);
    };

    const handleSubmitDriver = async (data: any) => {
        try {
            if (driverFormMode === 'create') {
                const createdDriver = await fleetApi.createDriver(data);
                console.log('✅ Driver created successfully:', createdDriver);
                toast.success('Driver registered successfully!');
            } else if (editingDriver) {
                await fleetApi.updateDriver(editingDriver.id, data);
                toast.success('Driver updated successfully!');
            }
            setShowDriverModal(false);
            setEditingDriver(null); // Clear editing state
            
            // Wait for data refresh to complete
            await loadFleetData();
        } catch (error) {
            console.error('Error saving driver:', error);
            toast.error('Failed to save driver. Please try again.');
        }
    };

    const vehicleColumns: Column<Vehicle>[] = useMemo(() => [
        {
            key: 'vinNumber',
            label: 'VIN Number',
            sortable: true,
            render: (_: unknown, vehicle: Vehicle) => (
                <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-white font-mono font-semibold text-[13px]">{vehicle.vinNumber}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Registered 2023</span>
                </div>
            ),
        },
        {
            key: 'licensePlate',
            label: 'License Plate',
            sortable: true,
            render: (_: unknown, vehicle: Vehicle) => (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-100 to-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="material-symbols-outlined text-[#135bec] text-sm">credit_card</span>
                    <span className="text-slate-800 dark:text-slate-100 font-bold text-[13px] tracking-wide">{vehicle.licensePlate}</span>
                </div>
            ),
        },
        {
            key: 'assetCategory',
            label: 'Asset Category',
            sortable: true,
            render: (_: unknown, vehicle: Vehicle) => (
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${vehicle.assetCategory === 'Heavy Truck' ? 'from-blue-100 to-blue-50' :
                        vehicle.assetCategory === 'Logistics Bus' ? 'from-orange-100 to-orange-50' :
                            vehicle.assetCategory === 'Van Delivery' ? 'from-indigo-100 to-indigo-50' :
                                'from-purple-100 to-purple-50'
                        } flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm`}>
                        <span className={`material-symbols-outlined ${vehicle.categoryColor} text-lg`}>
                            {vehicle.categoryIcon}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-800 dark:text-slate-100 font-medium">{vehicle.assetCategory}</span>
                        <span className="text-[10px] text-slate-400">25 tons capacity</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'assignedDriver',
            label: 'Assigned Driver',
            sortable: true,
            render: (_: unknown, vehicle: Vehicle) => (
                vehicle.assignedDriver ? (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div
                                className="w-9 h-9 rounded-full bg-slate-200 bg-cover bg-center ring-2 ring-white shadow-md"
                                style={{ backgroundImage: `url('${vehicle.assignedDriver.avatar}')` }}
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-800 dark:text-slate-100 font-medium">{vehicle.assignedDriver.name}</span>
                            <span className="text-[10px] text-slate-400">Active since 2022</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-400 text-sm">person_add</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-orange-600 text-xs font-medium">Unassigned</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignDriver(vehicle);
                                }}
                                className="text-[10px] text-[#135bec] hover:underline text-left"
                            >
                                Assign driver
                            </button>
                        </div>
                    </div>
                )
            ),
        },
        {
            key: 'compliance',
            label: 'Compliance',
            sortable: true,
            render: (_: unknown, vehicle: Vehicle) => (
                <StatusBadge
                    label={vehicle.compliance}
                    variant={
                        vehicle.compliance === 'ACTIVE' ? 'success'
                            : vehicle.compliance === 'MAINTENANCE' ? 'info'
                                : vehicle.compliance === 'EXPIRED' ? 'error'
                                    : 'neutral'
                    }
                    icon={
                        vehicle.compliance === 'ACTIVE' ? (
                            <span className="material-symbols-outlined text-xs">verified</span>
                        ) : vehicle.compliance === 'EXPIRED' ? (
                            <span className="material-symbols-outlined text-xs">error</span>
                        ) : undefined
                    }
                />
            ),
        },
        {
            key: 'lastInspection',
            label: 'Last Inspection',
            sortable: true,
            render: (_: unknown, vehicle: Vehicle) => (
                <div className="flex flex-col">
                    <span className={`font-medium ${vehicle.inspectionExpired ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                        {vehicle.lastInspection}
                    </span>
                    <span className={`text-[10px] ${vehicle.inspectionExpired ? 'text-red-500' : 'text-slate-400'}`}>
                        {vehicle.inspectionExpired ? 'Overdue by 396 days' : 'Next: Jan 15, 2024'}
                    </span>
                </div>
            ),
        },
    ], []);

    const vehicleRowActions: TableAction<Vehicle>[] = useMemo(() => [
        {
            key: 'view',
            label: 'View Details',
            icon: <span className="material-symbols-outlined text-lg">visibility</span>,
            onClick: (vehicle) => {
                setSelectedTruckForDetails({ id: vehicle.id });
                setShowDetailsModal(true);
            },
        },
        {
            key: 'edit',
            label: 'Edit Vehicle',
            icon: <span className="material-symbols-outlined text-lg">edit</span>,
            hidden: () => !hasPermission('truck:update'),
            onClick: (vehicle) => handleEditTruck(vehicle.id),
        },
        {
            key: 'inspect',
            label: 'Schedule Inspection',
            icon: <span className="material-symbols-outlined text-lg">event</span>,
            onClick: (vehicle) => handleScheduleInspection(vehicle),
        },
        {
            key: 'documents',
            label: 'Manage Documents',
            icon: <span className="material-symbols-outlined text-lg">description</span>,
            onClick: (vehicle) => handleOpenDocuments(vehicle.id, vehicle.make, vehicle.model, vehicle.licensePlate),
        },
        {
            key: 'delete',
            label: 'Delete Vehicle',
            icon: <span className="material-symbols-outlined text-lg">delete</span>,
            variant: 'danger',
            divider: true,
            hidden: () => !hasPermission('truck:delete'),
            onClick: (vehicle) => handleDeleteTruck(vehicle.id),
        },
    ], [hasPermission]);

    const driverColumns: Column<Driver>[] = useMemo(() => [
        {
            key: 'firstName',
            label: 'Name',
            sortable: true,
            render: (_: unknown, driver: Driver) => (
                <div className="flex items-center gap-3">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.firstName}${driver.lastName}`}
                        alt={`${driver.firstName} ${driver.lastName}`}
                        className="w-10 h-10 rounded-full bg-slate-200"
                    />
                    <div>
                        <div className="font-bold text-slate-900 dark:text-white">{driver.firstName} {driver.lastName}</div>
                        <div className="text-xs text-slate-500">ID: {driver.id.substring(0, 8)}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (_: unknown, driver: Driver) => (
                <StatusBadge label={driver.status} status={driver.status} />
            ),
        },
        {
            key: 'licenseNumber',
            label: 'License Number',
            sortable: true,
            render: (_: unknown, driver: Driver) => (
                <span className="font-mono text-sm">{driver.licenseNumber}</span>
            ),
        },
        {
            key: 'phone',
            label: 'Contact',
            render: (_: unknown, driver: Driver) => (
                <span className="text-sm text-slate-600 dark:text-slate-300">{driver.phone || 'N/A'}</span>
            ),
        },
    ], []);

    const driverRowActions: TableAction<Driver>[] = useMemo(() => [
        {
            key: 'documents',
            label: 'Manage Documents',
            icon: <span className="material-symbols-outlined text-[18px]">description</span>,
            onClick: (driver) => handleOpenDriverDocuments(driver),
        },
        {
            key: 'edit',
            label: 'Edit Driver',
            icon: <span className="material-symbols-outlined text-[18px]">edit</span>,
            onClick: (driver) => {
                setDriverFormMode('edit');
                setEditingDriver(driver);
                setShowDriverModal(true);
            },
        },
    ], []);


    if (loading) {
        return <ModernLoader isLoading={true} type="page" />;
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8] text-slate-900 dark:text-white font-['Inter']">
            {/* Link to Material Symbols */}
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            {/* Marquee Alert Bar */}
            <div className="bg-[#0a101f] text-white py-2 overflow-hidden border-b border-white/5">
                <div className="flex items-center animate-marquee whitespace-nowrap">
                    <div className="flex gap-16 items-center text-[11px] font-bold tracking-widest uppercase opacity-80">
                        <span className="flex items-center gap-2 text-amber-400">
                            <span className="material-symbols-outlined text-sm">warning</span> Maintenance Alert: TRK-004 brake service required
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-blue-400">water_drop</span> Heavy Rain Alert: Nairobi-Mombasa Route
                        </span>
                        <span className="flex items-center gap-2 text-green-400">
                            <span className="material-symbols-outlined text-sm">check_circle</span> All border crossings operating normally
                        </span>
                        <span className="flex items-center gap-2 text-amber-400">
                            <span className="material-symbols-outlined text-sm">local_gas_station</span> Fuel Surcharge Update: +2% effective Jan 15th
                        </span>
                    </div>
                </div>
            </div>

            {/* Header Section - Dark Theme (matches Fleet Owner Dashboard) */}
            <div className="bg-[#0f172a] text-white">
                <header className="max-w-[1920px] mx-auto flex items-center justify-between px-4 md:px-8 lg:px-12 xl:px-20 py-5 border-b border-white/10">
                    <div className="flex items-center gap-4 md:gap-10">
                        {/* Logo */}
                        <a className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard/fleet')}>
                            <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-14 md:h-20 w-auto object-contain py-1" />
                        </a>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet">Dashboard</a>
                            <a className="text-white text-sm font-bold relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500" href="/fleet-manager">Fleet</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/drivers">Drivers</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/maintenance">Maintenance</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/bids">Load Board</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/smart-bookings">Bookings</a>
                            <a className="text-white/60 hover:text-white text-sm font-semibold transition-all" href="/dashboard/fleet/reports">Reports</a>
                        </nav>

                        {/* Search Bar */}
                        <div className="hidden xl:flex items-center relative ml-8 group">
                            <span className="material-symbols-outlined absolute left-3 text-white/40 group-focus-within:text-blue-500 transition-colors text-base">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search trucks, drivers, IDs..."
                                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 w-64 transition-all placeholder:text-white/40"
                            />
                            <span className="absolute right-3 text-[10px] font-bold text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Fleet Status Badge */}
                        <div className="hidden 2xl:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                            <span className="text-blue-400">🚛</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Commander</span>
                        </div>

                        {/* Quick Actions Button */}
                        <a
                            href="/dashboard/fleet/dispatch"
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">bolt</span> Dispatch
                        </a>

                        {/* Notification Bell */}
                        <button className="p-2 text-white/60 hover:text-white transition-all relative">
                            <span className="material-symbols-outlined text-2xl">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0f172a]"></span>
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold">Fleet Manager</p>
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Fleet Owner</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/20 shadow-inner overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fleet" alt="User" className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            <main className="max-w-[1440px] mx-auto p-6 lg:px-20 lg:py-10">
                {/* Dashboard Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Assets */}
                    <div className="bg-[#161B22] p-6 rounded-xl border border-[#324467] shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider">Total Vehicles</p>
                            <span className="material-symbols-outlined text-[#135bec]">inventory_2</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white leading-none">{stats.totalAssets}</h3>
                            <span className={`text-sm font-bold flex items-center ${stats.totalAssetsUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                <span className="material-symbols-outlined text-xs">{stats.totalAssetsUp ? 'trending_up' : 'trending_down'}</span> {stats.totalAssetsChange}%
                            </span>
                        </div>
                        <p className="text-[#6b7c9e] text-xs mt-2">Active</p>
                    </div>

                    {/* Driver Compliance */}
                    <div className="bg-[#161B22] p-6 rounded-xl border border-[#324467] shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider">Compliance</p>
                            <span className="material-symbols-outlined text-emerald-400">verified_user</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white leading-none">{stats.driverCompliance}%</h3>
                            <span className={`text-sm font-bold flex items-center ${stats.complianceUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                <span className="material-symbols-outlined text-xs">{stats.complianceUp ? 'trending_up' : 'trending_down'}</span> {stats.complianceChange}%
                            </span>
                        </div>
                        <p className="text-[#6b7c9e] text-xs mt-2">Requires review</p>
                    </div>

                    {/* Available Vehicles */}
                    <div className="bg-[#161B22] p-6 rounded-xl border border-[#324467] shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider">Available</p>
                            <span className="material-symbols-outlined text-blue-400">event_available</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white leading-none">{stats.availableVehicles}</h3>
                            <span className={`text-sm font-bold flex items-center ${stats.availableUp ? 'text-emerald-400' : 'text-red-400'}`}>
                                <span className="material-symbols-outlined text-xs">{stats.availableUp ? 'trending_up' : 'trending_down'}</span> {stats.availableChange}%
                            </span>
                        </div>
                        <p className="text-[#6b7c9e] text-xs mt-2">Ready for deployment</p>
                    </div>

                    {/* Safety Alerts */}
                    <div className="bg-[#161B22] p-6 rounded-xl border border-[#324467] shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider">Safety Alerts</p>
                            <span className="material-symbols-outlined text-orange-400">warning</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-white leading-none">{String(stats.safetyAlerts).padStart(2, '0')}</h3>
                            <span className="bg-orange-400/10 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">URGENT</span>
                        </div>
                        <p className="text-[#6b7c9e] text-xs mt-2">Maintenance overdue</p>
                    </div>
                </div>

                {/* Main Content Area with Tabs */}
                <div className="bg-[#111722] border border-[#324467] rounded-xl overflow-hidden shadow-2xl">
                    {/* Tab Navigation & Toolbar */}
                    <div className="border-b border-[#324467] px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-8">
                                <button
                                    onClick={() => setActiveTab('vehicles')}
                                    className={`flex items-center gap-2 border-b-2 py-5 text-sm font-bold tracking-wide transition-colors ${activeTab === 'vehicles'
                                        ? 'border-[#135bec] text-white'
                                        : 'border-transparent text-[#92a4c9] hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">commute</span>
                                    Vehicles
                                </button>
                                <button
                                    onClick={() => setActiveTab('drivers')}
                                    className={`flex items-center gap-2 border-b-2 py-5 text-sm font-bold tracking-wide transition-colors ${activeTab === 'drivers'
                                        ? 'border-[#135bec] text-white'
                                        : 'border-transparent text-[#92a4c9] hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-lg">badge</span>
                                    Drivers
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex bg-[#161B22] border border-[#324467] rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 px-3 rounded-md text-xs font-bold uppercase ${viewMode === 'grid' ? 'bg-[#135bec]/20 text-[#135bec]' : 'text-[#92a4c9] hover:text-white'
                                            }`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 px-3 rounded-md text-xs font-bold uppercase ${viewMode === 'list' ? 'bg-[#135bec]/20 text-[#135bec]' : 'text-[#92a4c9] hover:text-white'
                                            }`}
                                    >
                                        List
                                    </button>
                                </div>
                                <div className="h-8 w-px bg-[#324467] mx-2" />
                                <ProtectedAction permission={activeTab === 'vehicles' ? 'truck:create' : 'driver:create'}>
                                    <button
                                        onClick={activeTab === 'vehicles' ? handleCreateTruck : handleRegisterDriver}
                                        className="bg-[#135bec] hover:bg-[#135bec]/90 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg"
                                    >
                                        <span className="material-symbols-outlined text-xl">add</span>
                                        {activeTab === 'vehicles' ? 'Add Vehicle' : 'Add Driver'}
                                    </button>
                                </ProtectedAction>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar / Filters */}
                    <div className="px-6 py-4 flex flex-wrap gap-4 items-center justify-between bg-[#161B22]/50">
                        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                            <div className="relative flex-1 max-w-sm">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92a4c9] text-sm">filter_alt</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full bg-[#111722] border border-[#324467] rounded-lg py-2 pl-9 pr-4 text-sm text-[#92a4c9] focus:ring-1 focus:ring-[#135bec] appearance-none"
                                >
                                    <option value="all">Filter by Category: All</option>
                                    <option value="Heavy Hauler">Heavy Hauler</option>
                                    <option value="Heavy Truck">Heavy Truck</option>
                                    <option value="Van Delivery">Van Delivery</option>
                                    <option value="Logistics Bus">Logistics Bus</option>
                                </select>
                            </div>
                            <div className="relative flex-1 max-w-sm">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#92a4c9] text-sm">circle</span>
                                <select
                                    value={complianceFilter}
                                    onChange={(e) => setComplianceFilter(e.target.value)}
                                    className="w-full bg-[#111722] border border-[#324467] rounded-lg py-2 pl-9 pr-4 text-sm text-[#92a4c9] focus:ring-1 focus:ring-[#135bec] appearance-none"
                                >
                                    <option value="all">Compliance Status: All</option>
                                    <option value="active">Active</option>
                                    <option value="pending">Pending Inspection</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-[#161B22] border border-[#324467] rounded-lg text-[#92a4c9] hover:text-white">
                                <span className="material-symbols-outlined">download</span>
                            </button>
                            <button className="p-2 bg-[#161B22] border border-[#324467] rounded-lg text-[#92a4c9] hover:text-white">
                                <span className="material-symbols-outlined">print</span>
                            </button>
                        </div>
                    </div>

                    {/* Content Section - Based on Active Tab */}
                    <div className="overflow-x-auto bg-white dark:bg-slate-900">
                        {activeTab === 'vehicles' ? (
                            <StandardDataTable
                                embedded
                                searchable={false}
                                columnVisibility={false}
                                pagination={false}
                                columns={vehicleColumns}
                                data={paginatedVehicles}
                                getRowId={(row) => row.id}
                                selectable
                                selectedIds={selectedVehicleIds}
                                onSelectionChange={setSelectedVehicleIds}
                                rowActions={vehicleRowActions}
                                actionsLabel="Quick Actions"
                                emptyMessage="No vehicles found matching your filters."
                                ariaLabel="Fleet vehicles"
                            />
                        ) : (
                            <StandardDataTable
                                embedded
                                searchable={false}
                                columnVisibility={false}
                                pagination={false}
                                columns={driverColumns}
                                data={filteredDrivers}
                                getRowId={(row) => row.id}
                                rowActions={driverRowActions}
                                emptyMessage="No drivers found."
                                ariaLabel="Fleet drivers"
                            />
                        )}
                    </div>

                    {/* Enhanced Pagination - Light Theme */}
                    <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-slate-500">Showing <span className="text-slate-800 dark:text-slate-100 font-semibold">{paginatedVehicles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-slate-800 dark:text-slate-100 font-semibold">{Math.min(currentPage * itemsPerPage, filteredVehicles.length)}</span> of <span className="text-slate-800 dark:text-slate-100 font-semibold">{filteredVehicles.length}</span> results</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Per page:</span>
                                <select
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-[#135bec] shadow-sm"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page
                                    }}
                                >
                                    <option>5</option>
                                    <option>10</option>
                                    <option>25</option>
                                    <option>50</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-lg">first_page</span>
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <div className="flex items-center gap-1 mx-2">
                                {/* Simple Pagination Logic */}
                                <button className="w-8 h-8 bg-[#135bec] border border-[#135bec] rounded-lg text-xs text-white font-bold shadow-sm">{currentPage}</button>
                                <span className="text-slate-400 px-1">of {totalPages}</span>
                            </div>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-lg">last_page</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Secondary Section: Quick Insights */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Compliance Distribution */}
                    <div className="bg-[#161B22] border border-[#324467] p-6 rounded-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#135bec]">analytics</span>
                                Compliance Distribution
                            </h4>
                            <button className="text-xs text-[#135bec] font-bold hover:underline">View Detailed Report</button>
                        </div>
                        <div className="flex items-center gap-6">
                            {/* Donut Chart */}
                            <div className="w-32 h-32 rounded-full relative flex items-center justify-center"
                                style={{
                                    background: `conic-gradient(
                                        #135bec 0deg ${(complianceData.active / (complianceData.total || 1)) * 360}deg,
                                        #34d399 ${(complianceData.active / (complianceData.total || 1)) * 360}deg ${((complianceData.active + complianceData.renewed) / (complianceData.total || 1)) * 360}deg,
                                        #fb923c ${((complianceData.active + complianceData.renewed) / (complianceData.total || 1)) * 360}deg ${((complianceData.active + complianceData.renewed + complianceData.pending) / (complianceData.total || 1)) * 360}deg,
                                        #f87171 ${((complianceData.active + complianceData.renewed + complianceData.pending) / (complianceData.total || 1)) * 360}deg 360deg
                                    )`
                                }}
                            >
                                <div className="w-20 h-20 bg-[#161B22] rounded-full flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold text-white">{complianceData.total}</span>
                                    <span className="text-[10px] text-[#92a4c9] uppercase font-bold">Total</span>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="flex-1 grid grid-cols-2 gap-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#135bec]" />
                                    <span className="text-xs text-[#92a4c9]">Active ({complianceData.active})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-xs text-[#92a4c9]">Renewed ({complianceData.renewed})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                                    <span className="text-xs text-[#92a4c9]">Pending ({complianceData.pending})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-xs text-[#92a4c9]">Expired ({complianceData.expired})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Inspections */}
                    <div className="bg-[#161B22] border border-[#324467] p-6 rounded-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400">task_alt</span>
                                Recent Inspections
                            </h4>
                        </div>
                        <div className="space-y-4">
                            {recentInspections.map((inspection) => (
                                <div key={inspection.id} className="flex items-center justify-between p-3 bg-[#111722] rounded-lg border border-[#324467]/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-400/10 text-emerald-400 rounded-lg">
                                            <span className="material-symbols-outlined">health_and_safety</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{inspection.vehicle}</p>
                                            <p className="text-[10px] text-[#92a4c9]">{inspection.description}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[#6b7c9e]">{inspection.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-[1440px] mx-auto px-6 lg:px-20 py-10 border-t border-[#324467] mt-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-[#6b7c9e] text-xs">
                        <span>© 2024 UrutiX Smart Cargo Matching</span>
                        <span className="w-1 h-1 rounded-full bg-[#324467]" />
                        <a className="hover:text-[#135bec] transition-colors cursor-pointer">Terms of Service</a>
                        <span className="w-1 h-1 rounded-full bg-[#324467]" />
                        <a className="hover:text-[#135bec] transition-colors cursor-pointer">Privacy Policy</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] text-[#6b7c9e] uppercase font-bold tracking-widest">Network Status:</p>
                        <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> ALL SYSTEMS OPERATIONAL
                        </span>
                    </div>
                </div>
            </footer>

            {/* Bulk Actions Toolbar */}
            {selectedVehicleIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-700">
                    <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedVehicleIds.length}</span>
                        <span className="text-sm font-medium">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkAction('update', 'MAINTENANCE')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px] text-slate-400">build</span>
                            Set Maintenance
                        </button>
                        <button
                            onClick={() => handleBulkAction('update', 'AVAILABLE')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px] text-slate-400">check_circle</span>
                            Set Available
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-2"></div>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Delete
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedVehicleIds([])}
                        className="ml-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}

            {/* Document Assignment Modal */}
            {selectedEntityForDocs && (
                <DocumentAssignmentModal
                    isOpen={showDocumentModal}
                    onClose={() => {
                        setShowDocumentModal(false);
                        setSelectedEntityForDocs(null);
                    }}
                    entityId={selectedEntityForDocs.id}
                    entityName={selectedEntityForDocs.name}
                    entityType={selectedEntityForDocs.type}
                />
            )}

            {/* Truck Registration Form Modal */}
            <FleetForm
                isOpen={showTruckForm}
                onClose={handleCloseTruckForm}
                onSubmit={handleSubmitTruck}
                initialData={editingTruck as any}
                mode={formMode}
                activeTab="trucks"
            />

            {/* Vehicle Details Modal */}
            {selectedTruckForDetails && (
                <VehicleDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedTruckForDetails(null);
                    }}
                    truckId={selectedTruckForDetails.id}
                />
            )}

            {/* Assignment Modal */}
            {selectedTruckForAssignment && (
                <AssignmentModal
                    isOpen={showAssignmentModal}
                    onClose={() => {
                        setShowAssignmentModal(false);
                        setSelectedTruckForAssignment(null);
                    }}
                    truckId={selectedTruckForAssignment.id}
                    truckName={selectedTruckForAssignment.name}
                    onAssignSuccess={() => {
                        loadFleetData(); // Refresh list to show assigned driver
                    }}
                />
            )}

            {/* Inspection Modal */}
            {selectedTruckForInspection && (
                <InspectionModal
                    isOpen={showInspectionModal}
                    onClose={() => {
                        setShowInspectionModal(false);
                        setSelectedTruckForInspection(null);
                    }}
                    truckId={selectedTruckForInspection.id}
                    truckName={selectedTruckForInspection.name}
                    onInspectionScheduled={() => {
                        // Optionally refresh list or update specific truck status
                        toast.success('Inspection scheduled');
                    }}
                />
            )}

            {/* Driver Registration Form Modal */}
            <DriverFormModal
                isOpen={showDriverModal}
                onClose={() => setShowDriverModal(false)}
                onSubmit={handleSubmitDriver}
                initialData={editingDriver}
                mode={driverFormMode}
            />
        </div>
    );
};

export default NewFleetManager;
