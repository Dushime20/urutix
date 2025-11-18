import React, { useState, useCallback } from 'react';
import { FaTimes, FaUpload, FaCamera, FaTrash, FaEye } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosUploaded: (photos: string[]) => void;
  existingPhotos?: string[];
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onPhotosUploaded,
  existingPhotos = []
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = acceptedFiles.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Please upload only JPEG, PNG, or WebP images.');
      return;
    }

    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Some files are too large. Maximum size is 5MB per image.');
      return;
    }

    // Create preview URLs
    const newPreviewUrls = acceptedFiles.map(file => URL.createObjectURL(file));
    
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  const removePhoto = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please select at least one photo to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file, index) => {
        formData.append('photos', file);
      });

      // Upload to backend
      const response = await fetch('/api/loads/photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const photoUrls = result.photoUrls || [];
        
        // Clean up preview URLs
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        
        onPhotosUploaded(photoUrls);
      } else {
        throw new Error('Failed to upload photos');
      }
    } catch (error: any) {
      setError(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setUploadedFiles([]);
    setPreviewUrls([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Cargo Photos</h2>
              <p className="text-gray-600 mt-1">Add photos to help truck owners understand your cargo</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <FaUpload className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
            </h3>
            <p className="text-gray-600 mb-4">
              or click to select files (JPEG, PNG, WebP up to 5MB each)
            </p>
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select Photos
            </button>
          </div>

          {/* Photo Preview Grid */}
          {previewUrls.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Cargo photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => removePhoto(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Photos */}
          {existingPhotos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingPhotos.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Existing cargo photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Tips */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Photo Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Take clear, well-lit photos of your cargo</li>
              <li>• Include photos from multiple angles</li>
              <li>• Show any special handling requirements</li>
              <li>• Include photos of packaging and dimensions</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || uploadedFiles.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="w-4 h-4 mr-2" />
                  Upload Photos ({uploadedFiles.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal; 