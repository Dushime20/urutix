import React, { useRef, useState } from 'react';
import {
    FaCloudUploadAlt,
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaCheckCircle,
    FaTrash
} from 'react-icons/fa';
import { documentApi, type Document } from '@/services/documents/documentApi';
import toast from 'react-hot-toast';

interface DocumentUploadSectionProps {
    cargoId: string | null;
    documents: Document[];
    onDocumentsChange: (docs: Document[]) => void;
    onRequireSave?: () => Promise<string | null>; // Callback to trigger save if cargoId is missing
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
    cargoId,
    documents,
    onDocumentsChange,
    onRequireSave
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        let targetCargoId = cargoId;

        // If no cargoId, try to save draft first
        if (!targetCargoId && onRequireSave) {
            try {
                setIsUploading(true);
                const newId = await onRequireSave();
                if (!newId) {
                    toast.error("Please save the cargo first before uploading documents.");
                    setIsUploading(false);
                    return;
                }
                targetCargoId = newId;
            } catch (err) {
                console.error("Failed to auto-save for upload:", err);
                toast.error("Failed to save cargo. Cannot upload document.");
                setIsUploading(false);
                return;
            }
        } else if (!targetCargoId) {
            toast.error("Cargo ID is missing. Please save the cargo first.");
            return;
        }

        try {
            setIsUploading(true);

            const response = await documentApi.createDocument({
                entityType: 'LOAD',
                entityId: targetCargoId,
                documentType: 'OTHER', // Default, could accept prop or prompt user
                category: 'CARGO',
                title: file.name,
            }, file);

            onDocumentsChange([...documents, response]);
            toast.success("Document uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload document");
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async (docId: string) => {
        try {
            // Optimistic update? Or wait for API?
            // Let's wait for API to ensure it's deleted
            await documentApi.deleteDocument(docId);
            onDocumentsChange(documents.filter(d => d.id !== docId));
            toast.success("Document removed");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to replace document");
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return <FaFilePdf className="text-red-500 text-xl" />;
        if (mimeType.includes('image')) return <FaFileImage className="text-blue-500 text-xl" />;
        return <FaFileAlt className="text-gray-500 text-xl" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <span className="text-sm text-gray-500">{documents.length} files attached</span>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                    {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    ) : (
                        <FaCloudUploadAlt className="text-4xl text-gray-400" />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                        {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">
                        PDF, PNG, JPG up to 10MB
                    </p>
                </div>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                            <div className="mr-3">
                                {getFileIcon(doc.mimeType)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {doc.title || doc.fileName}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                    <span>{formatSize(doc.fileSize)}</span>
                                    <span>•</span>
                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                    {doc.status === 'VERIFIED' && (
                                        <span className="flex items-center text-green-600">
                                            <FaCheckCircle className="w-3 h-3 mr-1" />
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(doc.id);
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove document"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentUploadSection;
