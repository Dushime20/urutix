import React, { useState, useEffect, useRef } from 'react';
import {
    FaTimes, FaTruck, FaSave, FaCheck, FaChevronLeft, FaChevronRight, FaTools
} from 'react-icons/fa';
import { Truck, FileText, Settings, Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import type { FleetItem } from '../../types/fleet';

interface FleetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData: FleetItem | null;
    mode: 'create' | 'edit';
    activeTab: 'trucks' | 'drivers';
}

// Step definitions
const STEPS = [
    { id: 1, title: 'Basic Info', subtitle: 'Vehicle identity', icon: Truck },
    { id: 2, title: 'Specifications', subtitle: 'Capacity & type', icon: Settings },
    { id: 3, title: 'Equipment', subtitle: 'Features & compliance', icon: Wrench },
    { id: 4, title: 'Review', subtitle: 'Confirm details', icon: CheckCircle },
];

const FleetFormEnhanced: React.FC<FleetFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
    activeTab
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<any>({
        // Initialize with defaults
        hasForklift: false,
        hasCrane: false,
        hasLoadingDock: false,
        hasSideRails: false,
        hasTarps: false,
        hasStraps: false,
        hasChains: false,
        hasWinch: false,
        hasTailLift: false,
        hasSideLift: false,
        hasRollerBed: false,
        hasGPS: false,
        hasRefrigeration: false,
        hasLiftGate: false,
        hasHazmatPermit: false,
        isActive: true,
        status: 'AVAILABLE',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const initializedRef = useRef(false);

    // Initialize form data
    useEffect(() => {
        if (!isOpen) {
            initializedRef.current = false;
            setCurrentStep(1);
            return;
        }

        if (initializedRef.current) return;

        if (initialData) {
            // Cast to any to handle properties that may exist at runtime but not in type
            const data = initialData as any;
            setFormData({
                plateNumber: data.plateNumber || '',
                vin: data.vin || '',
                make: data.make || '',
                model: data.model || '',
                year: data.year || '',
                color: data.color || '',
                fuelType: data.fuelType || '',
                capacityWeight: data.capacityWeight || '',
                capacityVolume: data.capacityVolume || '',
                registrationNumber: data.registrationNumber || '',
                registrationExpiry: data.registrationExpiry || '',
                insurancePolicy: data.insurancePolicy || '',
                insuranceExpiry: data.insuranceExpiry || '',
                roadworthyCertExpiry: data.roadworthyCertExpiry || '',
                mileage: data.mileage || '',
                truckType: data.truckType || '',
                trailerType: data.trailerType || '',
                maxLength: data.maxLength || '',
                maxWidth: data.maxWidth || '',
                maxHeight: data.maxHeight || '',
                hasRefrigeration: data.hasRefrigeration || false,
                hasLiftGate: data.hasLiftGate || false,
                hasGPS: data.hasGPS || data.hasGps || false,
                hasHazmatPermit: data.hasHazmatPermit || false,
                isActive: data.isActive !== undefined ? data.isActive : true,
                status: data.status || 'AVAILABLE',
                hasSideRails: data.hasSideRails || false,
                hasTarps: data.hasTarps || false,
                hasStraps: data.hasStraps || false,
                hasChains: data.hasChains || false,
                hasWinch: data.hasWinch || false,
                hasTailLift: data.hasTailLift || false,
                hasSideLift: data.hasSideLift || false,
                hasRollerBed: data.hasRollerBed || false,
                hasForklift: data.loadingCapabilities?.hasForklift || data.hasForklift || false,
                hasCrane: data.loadingCapabilities?.hasCrane || data.hasCrane || false,
                hasLoadingDock: data.loadingCapabilities?.hasLoadingDock || data.hasLoadingDock || false,
                maxLoadingTime: data.loadingCapabilities?.maxLoadingTime || data.maxLoadingTime || '',
                maxUnloadingTime: data.loadingCapabilities?.maxUnloadingTime || data.maxUnloadingTime || '',
            });
            initializedRef.current = true;
        } else {
            setFormData({
                plateNumber: '', vin: '', make: '', model: '', year: '', color: '',
                fuelType: '', capacityWeight: '', capacityVolume: '', registrationNumber: '',
                registrationExpiry: '', insurancePolicy: '', insuranceExpiry: '',
                roadworthyCertExpiry: '', mileage: '', truckType: '', trailerType: '',
                maxLength: '', maxWidth: '', maxHeight: '',
                hasRefrigeration: false, hasLiftGate: false, hasGPS: false, hasHazmatPermit: false,
                isActive: true, status: 'AVAILABLE',
                hasSideRails: false, hasTarps: false, hasStraps: false, hasChains: false,
                hasWinch: false, hasTailLift: false, hasSideLift: false, hasRollerBed: false,
                hasForklift: false, hasCrane: false, hasLoadingDock: false,
                maxLoadingTime: '', maxUnloadingTime: '',
            });
            initializedRef.current = true;
        }
    }, [initialData, isOpen]);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    // Validation per step
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.plateNumber?.trim()) newErrors.plateNumber = 'License plate is required';
            if (!formData.vin?.trim()) newErrors.vin = 'VIN is required';
            else if (formData.vin.length !== 17) newErrors.vin = 'VIN must be 17 characters';
            if (!formData.make?.trim()) newErrors.make = 'Make is required';
            if (!formData.model?.trim()) newErrors.model = 'Model is required';
            if (!formData.year) newErrors.year = 'Year is required';
        }

        if (step === 2) {
            if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';
            if (!formData.capacityWeight) newErrors.capacityWeight = 'Capacity weight is required';
            if (!formData.capacityVolume) newErrors.capacityVolume = 'Capacity volume is required';
            if (!formData.truckType) newErrors.truckType = 'Truck type is required';
        }

        if (step === 3) {
            if (!formData.registrationNumber?.trim()) newErrors.registrationNumber = 'Registration number is required';
            if (!formData.registrationExpiry) newErrors.registrationExpiry = 'Registration expiry is required';
            if (!formData.insurancePolicy?.trim()) newErrors.insurancePolicy = 'Insurance policy is required';
            if (!formData.insuranceExpiry) newErrors.insuranceExpiry = 'Insurance expiry is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 4));
        }
    };

    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            // Structure the form data for backend
            const structuredData: any = { ...formData };

            if (activeTab === 'trucks') {
                structuredData.loadingCapabilities = {
                    hasForklift: Boolean(formData.hasForklift),
                    hasCrane: Boolean(formData.hasCrane),
                    hasLoadingDock: Boolean(formData.hasLoadingDock),
                    hasSideLift: formData.hasSideLift || false,
                    hasTailLift: formData.hasTailLift || false,
                    hasRollerBed: formData.hasRollerBed || false,
                    maxLoadingTime: formData.maxLoadingTime || undefined,
                    maxUnloadingTime: formData.maxUnloadingTime || undefined,
                };

                structuredData.securityFeatures = {
                    hasGps: formData.hasGPS || false,
                };
            }

            await onSubmit(structuredData);
            initializedRef.current = false;
            setCurrentStep(1);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Step Progress Indicator
    const StepIndicator = () => (
        <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const StepIcon = step.icon;

                return (
                    <React.Fragment key={step.id}>
                        <button
                            onClick={() => isCompleted && setCurrentStep(step.id)}
                            className={`flex flex-col items-center gap-2 transition-all ${isCompleted ? 'cursor-pointer' : 'cursor-default'
                                }`}
                            type="button"
                        >
                            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-all
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-400'}
              `}>
                                {isCompleted ? (
                                    <FaCheck className="w-5 h-5" />
                                ) : (
                                    <StepIcon className="w-5 h-5" />
                                )}
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-bold ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {step.title}
                                </p>
                                <p className="text-[10px] text-slate-400 hidden sm:block">{step.subtitle}</p>
                            </div>
                        </button>

                        {index < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'
                                }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    // Form field components
    const InputField = ({
        label, field, type = 'text', required = false, placeholder = '', maxLength, min, max, step: inputStep
    }: {
        label: string; field: string; type?: string; required?: boolean; placeholder?: string; maxLength?: number; min?: number; max?: number; step?: number;
    }) => (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={formData[field] || ''}
                onChange={(e) => handleInputChange(field, type === 'number' ? (parseFloat(e.target.value) || '') : e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                placeholder={placeholder}
                maxLength={maxLength}
                min={min}
                max={max}
                step={inputStep}
            />
            {errors[field] && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors[field]}
                </p>
            )}
        </div>
    );

    const SelectField = ({ label, field, options, required = false }: {
        label: string; field: string; options: { value: string; label: string }[]; required?: boolean;
    }) => (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                value={formData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white ${errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
            >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {errors[field] && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors[field]}
                </p>
            )}
        </div>
    );

    const ToggleCard = ({ label, field, description, icon: Icon }: {
        label: string; field: string; description?: string; icon?: any;
    }) => (
        <label className={`
      flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
      ${formData[field]
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-white'}
    `}>
            <div className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        ${formData[field] ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}
      `}>
                {Icon ? <Icon className="w-5 h-5" /> : <FaTools className="w-5 h-5" />}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-slate-800">{label}</p>
                {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
            <div className={`
        w-12 h-7 rounded-full p-1 transition-all
        ${formData[field] ? 'bg-blue-500' : 'bg-slate-200'}
      `}>
                <div className={`
          w-5 h-5 rounded-full bg-white shadow-sm transition-all
          ${formData[field] ? 'translate-x-5' : 'translate-x-0'}
        `} />
            </div>
            <input
                type="checkbox"
                checked={formData[field] || false}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                className="sr-only"
            />
        </label>
    );

    // Step 1: Basic Information
    const Step1Content = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Vehicle Identity</h3>
                    <p className="text-sm text-slate-500">Basic information about your truck</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="License Plate" field="plateNumber" required placeholder="e.g., KBZ 123A" maxLength={20} />
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        VIN <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.vin || ''}
                        onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                            if (value.length <= 17) handleInputChange('vin', value);
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formData.vin?.length === 17
                            ? 'border-emerald-400 bg-emerald-50'
                            : errors.vin
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        placeholder="17-character VIN"
                        maxLength={17}
                    />
                    <div className="flex justify-between mt-1">
                        <span className={`text-xs ${formData.vin?.length === 17 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {formData.vin?.length || 0}/17 characters
                        </span>
                        {formData.vin?.length === 17 && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Valid length
                            </span>
                        )}
                    </div>
                    {errors.vin && <p className="mt-1 text-xs text-red-500">{errors.vin}</p>}
                </div>
                <InputField label="Make" field="make" required placeholder="e.g., Volvo, Scania" maxLength={100} />
                <InputField label="Model" field="model" required placeholder="e.g., FH16, R730" maxLength={100} />
                <InputField label="Year" field="year" type="number" required min={1900} max={2030} placeholder="e.g., 2022" />
                <InputField label="Color" field="color" placeholder="e.g., White, Blue" maxLength={50} />
            </div>
        </div>
    );

    // Step 2: Specifications
    const Step2Content = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Capacity & Type</h3>
                    <p className="text-sm text-slate-500">Specifications and cargo capacity</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                    label="Fuel Type"
                    field="fuelType"
                    required
                    options={[
                        { value: 'DIESEL', label: 'Diesel' },
                        { value: 'GASOLINE', label: 'Gasoline' },
                        { value: 'ELECTRIC', label: 'Electric' },
                        { value: 'HYBRID', label: 'Hybrid' },
                        { value: 'CNG', label: 'CNG' },
                        { value: 'LNG', label: 'LNG' },
                    ]}
                />
                <InputField label="Mileage (km)" field="mileage" type="number" min={0} placeholder="e.g., 150000" />
                <InputField label="Capacity Weight (kg)" field="capacityWeight" type="number" required min={1} placeholder="e.g., 25000" />
                <InputField label="Capacity Volume (m³)" field="capacityVolume" type="number" required min={1} placeholder="e.g., 80" />
                <SelectField
                    label="Truck Type"
                    field="truckType"
                    required
                    options={[
                        { value: 'FLATBED', label: 'Flatbed' },
                        { value: 'BOX_TRUCK', label: 'Box Truck' },
                        { value: 'TANKER', label: 'Tanker' },
                        { value: 'REFRIGERATED', label: 'Refrigerated' },
                        { value: 'CONTAINER', label: 'Container' },
                        { value: 'CAR_CARRIER', label: 'Car Carrier' },
                        { value: 'HEAVY_HAUL', label: 'Heavy Haul' },
                        { value: 'LOWBED', label: 'Lowbed' },
                        { value: 'CURTAIN_SIDE', label: 'Curtain Side' },
                        { value: 'VAN', label: 'Van' },
                        { value: 'DUMP', label: 'Dump' },
                    ]}
                />
                <SelectField
                    label="Trailer Type"
                    field="trailerType"
                    options={[
                        { value: 'FLATBED', label: 'Flatbed' },
                        { value: 'DRY_VAN', label: 'Dry Van' },
                        { value: 'REFRIGERATED', label: 'Refrigerated' },
                        { value: 'TANKER', label: 'Tanker' },
                        { value: 'CONTAINER', label: 'Container' },
                        { value: 'LOWBED', label: 'Lowbed' },
                    ]}
                />
            </div>

            <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-4">Dimensions (Optional)</h4>
                <div className="grid grid-cols-3 gap-4">
                    <InputField label="Length (m)" field="maxLength" type="number" min={0} placeholder="13.6" />
                    <InputField label="Width (m)" field="maxWidth" type="number" min={0} placeholder="2.45" />
                    <InputField label="Height (m)" field="maxHeight" type="number" min={0} placeholder="2.7" />
                </div>
            </div>
        </div>
    );

    // Step 3: Equipment & Compliance
    const Step3Content = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Compliance & Equipment</h3>
                    <p className="text-sm text-slate-500">Registration, insurance and features</p>
                </div>
            </div>

            {/* Compliance Section */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Documents & Compliance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Registration Number" field="registrationNumber" required maxLength={50} />
                    <InputField label="Registration Expiry" field="registrationExpiry" type="date" required />
                    <InputField label="Insurance Policy" field="insurancePolicy" required maxLength={50} />
                    <InputField label="Insurance Expiry" field="insuranceExpiry" type="date" required />
                    <InputField label="Roadworthy Cert Expiry" field="roadworthyCertExpiry" type="date" />
                </div>
            </div>

            {/* Equipment Section */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Equipment & Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ToggleCard label="GPS Tracking" field="hasGPS" description="Real-time location tracking" />
                    <ToggleCard label="Refrigeration" field="hasRefrigeration" description="Temperature-controlled cargo" />
                    <ToggleCard label="Lift Gate" field="hasLiftGate" description="Hydraulic loading gate" />
                    <ToggleCard label="Hazmat Permit" field="hasHazmatPermit" description="Dangerous goods certified" />
                    <ToggleCard label="Forklift" field="hasForklift" description="On-board forklift" />
                    <ToggleCard label="Crane" field="hasCrane" description="Built-in crane" />
                    <ToggleCard label="Tail Lift" field="hasTailLift" description="Rear loading lift" />
                    <ToggleCard label="Side Rails" field="hasSideRails" description="Cargo protection rails" />
                </div>
            </div>
        </div>
    );

    // Step 4: Review
    const Step4Content = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Review Your Truck</h3>
                    <p className="text-sm text-slate-500">Confirm all details before submitting</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
                {/* Basic Info Summary */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Basic Information
                        </h4>
                        <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="text-slate-400">Plate:</span> <span className="font-semibold text-slate-700">{formData.plateNumber || '-'}</span></div>
                        <div><span className="text-slate-400">VIN:</span> <span className="font-semibold text-slate-700 font-mono text-xs">{formData.vin || '-'}</span></div>
                        <div><span className="text-slate-400">Make:</span> <span className="font-semibold text-slate-700">{formData.make || '-'}</span></div>
                        <div><span className="text-slate-400">Model:</span> <span className="font-semibold text-slate-700">{formData.model || '-'}</span></div>
                        <div><span className="text-slate-400">Year:</span> <span className="font-semibold text-slate-700">{formData.year || '-'}</span></div>
                        <div><span className="text-slate-400">Color:</span> <span className="font-semibold text-slate-700">{formData.color || '-'}</span></div>
                    </div>
                </div>

                {/* Specifications Summary */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Specifications
                        </h4>
                        <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="text-slate-400">Type:</span> <span className="font-semibold text-slate-700">{formData.truckType?.replace('_', ' ') || '-'}</span></div>
                        <div><span className="text-slate-400">Fuel:</span> <span className="font-semibold text-slate-700">{formData.fuelType || '-'}</span></div>
                        <div><span className="text-slate-400">Capacity:</span> <span className="font-semibold text-slate-700">{formData.capacityWeight ? `${formData.capacityWeight} kg` : '-'}</span></div>
                        <div><span className="text-slate-400">Volume:</span> <span className="font-semibold text-slate-700">{formData.capacityVolume ? `${formData.capacityVolume} m³` : '-'}</span></div>
                        <div><span className="text-slate-400">Trailer:</span> <span className="font-semibold text-slate-700">{formData.trailerType?.replace('_', ' ') || 'None'}</span></div>
                        <div><span className="text-slate-400">Mileage:</span> <span className="font-semibold text-slate-700">{formData.mileage ? `${formData.mileage} km` : '-'}</span></div>
                    </div>
                </div>

                {/* Equipment Summary */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <Wrench className="w-4 h-4" /> Equipment
                        </h4>
                        <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.hasGPS && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">GPS</span>}
                        {formData.hasRefrigeration && <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">Refrigeration</span>}
                        {formData.hasLiftGate && <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Lift Gate</span>}
                        {formData.hasHazmatPermit && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Hazmat</span>}
                        {formData.hasForklift && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Forklift</span>}
                        {formData.hasCrane && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Crane</span>}
                        {formData.hasTailLift && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Tail Lift</span>}
                        {formData.hasSideRails && <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">Side Rails</span>}
                        {!formData.hasGPS && !formData.hasRefrigeration && !formData.hasLiftGate && !formData.hasHazmatPermit &&
                            !formData.hasForklift && !formData.hasCrane && !formData.hasTailLift && !formData.hasSideRails && (
                                <span className="text-sm text-slate-400">No equipment selected</span>
                            )}
                    </div>
                </div>
            </div>

            {/* Confirmation Alert */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                    <p className="font-semibold text-emerald-800">Ready to add your truck</p>
                    <p className="text-sm text-emerald-600">Click the button below to add this truck to your fleet.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <FaTruck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {mode === 'create' ? 'Add New Truck' : 'Edit Truck'}
                            </h2>
                            <p className="text-sm text-slate-400">Step {currentStep} of {STEPS.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-6 pb-2 border-b border-slate-100">
                    <StepIndicator />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {currentStep === 1 && <Step1Content />}
                    {currentStep === 2 && <Step2Content />}
                    {currentStep === 3 && <Step3Content />}
                    {currentStep === 4 && <Step4Content />}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={currentStep === 1 ? onClose : handlePrev}
                        className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-slate-800 font-semibold transition-colors"
                    >
                        <FaChevronLeft className="w-3 h-3" />
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all"
                        >
                            Continue
                            <FaChevronRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <FaSave className="w-4 h-4" />
                                    Add Truck
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export { FleetFormEnhanced };
export default FleetFormEnhanced;
