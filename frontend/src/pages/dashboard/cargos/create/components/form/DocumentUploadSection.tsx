import React, { useRef, useState } from 'react';
import {
    FaCloudUploadAlt,
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaCheckCircle,
    FaTrash,
    FaEdit
} from 'react-icons/fa';
import { documentApi, type Document } from '@/services/documents/documentApi';
import toast from 'react-hot-toast';

// Pending document type for documents not yet uploaded
export interface PendingDocument {
    id: string;
    file: File;
    title: string;
    description?: string;
    documentType: string;
    category: string;
    priority?: string;
    preview?: string;
    isPending: true; // Flag to identify pending documents
}

interface DocumentUploadSectionProps {
    cargoId: string | null;
    documents: (Document | PendingDocument)[];
    onDocumentsChange: (docs: (Document | PendingDocument)[]) => void;
    onRequireSave?: () => Promise<string | null>; // Callback to trigger save if cargoId is missing
    allowPendingDocuments?: boolean; // New prop to enable pending document mode
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
    cargoId,
    documents,
    onDocumentsChange,
    onRequireSave,
    allowPendingDocuments = true // Default to true for new behavior
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

    const createFilePreview = (file: File): Promise<string | undefined> => {
        return new Promise((resolve) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(undefined);
                reader.readAsDataURL(file);
            } else {
                resolve(undefined);
            }
        });
    };

    const handleUpload = async (file: File) => {
        // NEW BEHAVIOR: If allowPendingDocuments is true and no cargoId, store as pending
        if (allowPendingDocuments && !cargoId) {
            try {
                setIsUploading(true);

                // Validate file
                if (file.size > 10 * 1024 * 1024) {
                    toast.error('File size exceeds 10MB limit');
                    return;
                }

                const preview = await createFilePreview(file);

                const pendingDoc: PendingDocument = {
                    id: `pending-${Date.now()}-${Math.random()}`,
                    file,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    documentType: 'OTHER',
                    category: 'CARGO',
                    priority: 'MEDIUM',
                    preview,
                    isPending: true,
                };

                onDocumentsChange([...documents, pendingDoc]);
                toast.success('Document added. It will be uploaded when cargo is saved.');
            } catch (error) {
                console.error('Error adding document:', error);
                toast.error('Failed to add document');
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
            return;
        }

        // OLD BEHAVIOR: Try to save cargo first if no cargoId
        let targetCargoId = cargoId;

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
                entityType: 'CARGO',
                entityId: targetCargoId,
                documentType: 'OTHER',
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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = async (doc: Document | PendingDocument) => {
        // Check if it's a pending document
        if ('isPending' in doc && doc.isPending) {
            // Just remove from list, no API call needed
            onDocumentsChange(documents.filter(d => d.id !== doc.id));
            toast.success("Document removed");
            return;
        }

        // It's an uploaded document, delete from server
        try {
            await documentApi.deleteDocument(doc.id);
            onDocumentsChange(documents.filter(d => d.id !== doc.id));
            toast.success("Document removed");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to remove document");
        }
    };

    const getFileIcon = (doc: Document | PendingDocument) => {
        const mimeType = 'isPending' in doc && doc.isPending
            ? doc.file.type
            : (doc as Document).mimeType;

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

    const getDocumentSize = (doc: Document | PendingDocument): number => {
        return 'isPending' in doc && doc.isPending ? doc.file.size : (doc as Document).fileSize;
    };

    const getDocumentTitle = (doc: Document | PendingDocument): string => {
        if ('isPending' in doc && doc.isPending) {
            return doc.title;
        }
        return (doc as Document).title || (doc as Document).fileName;
    };

    const getDocumentDate = (doc: Document | PendingDocument): string => {
        if ('isPending' in doc && doc.isPending) {
            return 'Pending upload';
        }
        return new Date((doc as Document).createdAt).toLocaleDateString();
    };

    const isPendingDoc = (doc: Document | PendingDocument): doc is PendingDocument => {
        return 'isPending' in doc && doc.isPending === true;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <span className="text-sm text-gray-500">
                    {documents.length} file{documents.length !== 1 ? 's' : ''}
                    {documents.filter(isPendingDoc).length > 0 &&
                        ` (${documents.filter(isPendingDoc).length} pending)`
                    }
                </span>
            </div>

            {/* Info message for pending documents */}
            {allowPendingDocuments && !cargoId && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <FaCloudUploadAlt className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-900">
                        Documents will be uploaded automatically when you save the cargo.
                    </p>
                </div>
            )}

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
                        {isUploading ? 'Processing...' : 'Click to upload or drag and drop'}
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
                            className={`flex items-center p-3 border rounded-lg hover:shadow-sm transition-shadow ${isPendingDoc(doc)
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className="mr-3">
                                {getFileIcon(doc)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {getDocumentTitle(doc)}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 space-x-2">
                                    <span>{formatSize(getDocumentSize(doc))}</span>
                                    <span>•</span>
                                    <span>{getDocumentDate(doc)}</span>
                                    {!isPendingDoc(doc) && (doc as Document).status === 'VERIFIED' && (
                                        <span className="flex items-center text-green-600">
                                            <FaCheckCircle className="w-3 h-3 mr-1" />
                                            Verified
                                        </span>
                                    )}
                                    {isPendingDoc(doc) && (
                                        <span className="flex items-center text-amber-600">
                                            <FaCloudUploadAlt className="w-3 h-3 mr-1" />
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(doc);
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
