import React, { useState } from 'react';
import { X, Package, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cargoOwnerAPI } from '../../services/cargoApi';
import { createLocation } from '../../services/locationApi';
import CargoDetailsForm from '../CargoOwnerJourney/CargoDetailsForm';
import DocumentUploadSection, { type PendingDocument } from './DocumentUploadSection';
import { uploadCargoDocumentsWithRetry, getUploadProgressMessage } from '../../services/documentUploadService';

// Define the interface locally if not exported, or just use 'any' if it causes circular deps issues, 
// but better to match the source file. For now, I'll rely on the structure I saw.
interface CargoDetails {
    title: string;
    description: string;
    cargoType: string;
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    pickupLocation: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates?: { lat: number; lng: number };
    };
    deliveryLocation: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates?: { lat: number; lng: number };
    };
    pickupDate: string;
    deliveryDate: string;
    specialRequirements: string[];
    photos: File[];
    insuranceRequired: boolean;
    isHazmat: boolean;
    isFragile: boolean;
    isRefrigerated: boolean;
    estimatedValue: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface CreateCargoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (loadId: string, loadValue: number, loadTitle: string) => void;
}

const CreateCargoModal: React.FC<CreateCargoModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; status: string } | null>(null);

    if (!isOpen) return null;

    const handleFormSubmit = async (details: any) => {
        setIsSubmitting(true);
        setError(null);
        setUploadProgress(null);

        try {
            // 1. Create Pickup Location
            const pickupLocationPayload = {
                name: `Pickup - ${details.title}`,
                address: details.pickupLocation.address,
                city: details.pickupLocation.city,
                state: details.pickupLocation.state,
                postalCode: details.pickupLocation.zipCode,
                country: 'Rwanda', // Default
                latitude: details.pickupLocation.coordinates?.lat || 0,
                longitude: details.pickupLocation.coordinates?.lng || 0,
                type: 'PICKUP'
            };
            const pickupResponse = await createLocation(pickupLocationPayload);
            const pickupLocationId = pickupResponse.id;

            // 2. Create Delivery Location
            const deliveryLocationPayload = {
                name: `Delivery - ${details.title}`,
                address: details.deliveryLocation.address,
                city: details.deliveryLocation.city,
                state: details.deliveryLocation.state,
                postalCode: details.deliveryLocation.zipCode,
                country: 'Rwanda', // Default
                latitude: details.deliveryLocation.coordinates?.lat || 0,
                longitude: details.deliveryLocation.coordinates?.lng || 0,
                type: 'DELIVERY'
            };
            const deliveryResponse = await createLocation(deliveryLocationPayload);
            const deliveryLocationId = deliveryResponse.id;

            // Map cargo type to backend enum
            const cargoTypeMap: Record<string, string> = {
                'General Freight': 'GENERAL',
                'Food & Beverage': 'FOOD',
                'Electronics': 'ELECTRONICS',
                'Hazardous Materials': 'CHEMICALS',
                'Automotive': 'AUTOMOTIVE',
                'Machinery': 'MACHINERY',
                'Textiles': 'TEXTILES',
                'Pharmaceuticals': 'CHEMICALS',
                'Oversized Load': 'MACHINERY',
                'Refrigerated': 'FOOD',
                'Furniture': 'GENERAL',
                'Other': 'GENERAL'
            };

            // Transform CargoDetails to API payload
            // Aligning with the structure used in CargoOwnerJourney.tsx which works with the new API
            const cargoPayload = {
                title: details.title,
                description: details.description,
                cargoType: cargoTypeMap[details.cargoType] || 'GENERAL',
                weight: Number(details.weight),
                // Volume in cubic inches or same unit as dims product
                volume: details.dimensions.length * details.dimensions.width * details.dimensions.height,
                loadValue: Number(details.estimatedValue),
                currencyCode: 'USD',

                pickupLocationId: pickupLocationId,
                deliveryLocationId: deliveryLocationId,

                pickupDate: details.pickupDate || new Date().toISOString(),
                deliveryDate: details.deliveryDate || new Date(Date.now() + 86400000).toISOString(),

                isHazardous: details.isHazmat,
                requiresRefrigeration: details.isRefrigerated,
                autoMatchEnabled: true,
                urgencyLevel: details.urgency === 'MEDIUM' ? 'NORMAL' : details.urgency,

                status: 'DRAFT',
                dimensions: details.dimensions,
                specialRequirements: details.specialRequirements,
                photos: []
            };

            const response = await cargoOwnerAPI.createLoad(cargoPayload);
            const loadId = response?.data?.id || (response.data && response.data.data?.id) || 'mock-id-' + Date.now();

            toast.success('Cargo created successfully!');

            // Upload documents if any
            if (pendingDocuments.length > 0) {
                setUploadProgress({ current: 0, total: pendingDocuments.length, status: 'Uploading documents...' });
                
                const uploadResult = await uploadCargoDocumentsWithRetry(
                    loadId,
                    pendingDocuments,
                    2, // max retries
                    (current, total, status) => {
                        setUploadProgress({ current, total, status });
                    }
                );

                if (uploadResult.failed > 0) {
                    toast.error(
                        `${uploadResult.successful} of ${uploadResult.total} documents uploaded. ${uploadResult.failed} failed.`,
                        { duration: 5000 }
                    );
                } else {
                    toast.success(`All ${uploadResult.successful} documents uploaded successfully!`);
                }
            }

            onSuccess(loadId, Number(details.estimatedValue), details.title);
            onClose();
            
            // Reset state
            setPendingDocuments([]);
            setUploadProgress(null);

        } catch (err: any) {
            console.error('Failed to create cargo:', err);
            setError(err.response?.data?.message || 'Failed to create cargo. Please try again.');
            toast.error('Failed to create cargo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                                <Package size={20} />
                            </div>
                            Post New Load
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {/* We wrap the inner form in a padding container */}
                    <div className="p-8 space-y-8">
                        <CargoDetailsForm
                            onSubmit={handleFormSubmit}
                            loading={isSubmitting}
                            error={error}
                        />

                        {/* Document Upload Section */}
                        <div className="border-t border-slate-200 pt-8">
                            <DocumentUploadSection
                                documents={pendingDocuments}
                                onDocumentsChange={setPendingDocuments}
                                maxFiles={10}
                                maxFileSize={10}
                            />
                        </div>
                    </div>
                </div>

                {/* Upload Progress Overlay */}
                {uploadProgress && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
                        <div className="text-center space-y-4 p-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                                <Upload className="text-[#345E85] animate-bounce" size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">
                                    {uploadProgress.status}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {uploadProgress.current} of {uploadProgress.total} documents
                                </p>
                            </div>
                            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#345E85] transition-all duration-300"
                                    style={{
                                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateCargoModal;
