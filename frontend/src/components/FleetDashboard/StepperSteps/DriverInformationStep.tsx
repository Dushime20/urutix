import React, { useState, useRef } from 'react';
import { FaUser, FaIdCard, FaPhone, FaFileUpload, FaTrash, FaPlus, FaTimes, FaFileAlt, FaUpload } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface DriverInformationStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

interface DriverDocument {
  file: File;
  documentType: string;
  title: string;
  description?: string;
  expiryDate?: string;
}

// Internal Modal Component for adding documents
interface AddDriverDocumentModalProps {
  onClose: () => void;
  onSave: (doc: DriverDocument) => void;
}

const AddDriverDocumentModal: React.FC<AddDriverDocumentModalProps> = ({ onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [docData, setDocData] = useState<Partial<DriverDocument>>({
    documentType: 'DRIVER_LICENSE',
    title: '',
    description: '',
    expiryDate: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'DRIVER_LICENSE', label: 'Driver License' },
    { value: 'DRIVER_MEDICAL_CERT', label: 'Medical Certificate' },
    { value: 'DRIVER_DRUG_TEST', label: 'Drug Test' },
    { value: 'DRIVER_BACKGROUND_CHECK', label: 'Background Check' },
    { value: 'DRIVER_TRAINING_CERT', label: 'Training Certificate' },
    { value: 'DRIVER_INSURANCE', label: 'Insurance' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload an image, PDF, or Word document.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    setFile(selectedFile);
    // Auto-fill title if empty
    if (!docData.title) {
      setDocData(prev => ({ ...prev, title: selectedFile.name }));
    }

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docData.title || !docData.documentType) {
      toast.error('Please fill in all required fields and select a file.');
      return;
    }
    onSave({
      file,
      documentType: docData.documentType,
      title: docData.title,
      description: docData.description,
      expiryDate: docData.expiryDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaFileAlt className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-gray-900">Add Document</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
              <select
                value={docData.documentType}
                onChange={(e) => setDocData({ ...docData, documentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Title *</label>
              <input
                type="text"
                value={docData.title}
                onChange={(e) => setDocData({ ...docData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                placeholder="Enter document title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={docData.description || ''}
                onChange={(e) => setDocData({ ...docData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={docData.expiryDate || ''}
                  onChange={(e) => setDocData({ ...docData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document File *</label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!file ? (
                  <div>
                    <FaUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Upload Document</p>
                    <p className="text-gray-500 mb-4">Drag and drop or click to browse</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      Choose File
                    </button>
                    <p className="text-xs text-gray-400 mt-2">Supported: PDF, Word, Images (Max 10MB)</p>
                  </div>
                ) : (
                  <div>
                    <FaFileAlt className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-4">{(file.size / 1024).toFixed(2)} KB</p>
                    {preview && <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded border mb-4" />}
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2">
                <FaPlus className="w-4 h-4" />
                Add Document
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DriverInformationStep: React.FC<DriverInformationStepProps> = ({
  formData,
  handleInputChange
}) => {
  const [documents, setDocuments] = useState<DriverDocument[]>(formData.documents || []);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddDocument = (doc: DriverDocument) => {
    const updatedDocs = [...documents, doc];
    setDocuments(updatedDocs);
    handleInputChange('documents', updatedDocs);
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    handleInputChange('documents', updatedDocs);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FaUser className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Driver Information</h3>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaUser className="w-5 h-5 mr-2 text-gray-600" />
          Personal Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Enter first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Street, City, Country"
            />
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaIdCard className="w-5 h-5 mr-2 text-gray-600" />
          License Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
            <input
              type="text"
              value={formData.licenseNumber || ''}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Enter license number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Type *</label>
            <select
              value={formData.licenseType || ''}
              onChange={(e) => handleInputChange('licenseType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select license type</option>
              <option value="CLASS_A">Class A - Heavy Combination</option>
              <option value="CLASS_B">Class B - Heavy Rigid</option>
              <option value="CLASS_C">Class C - Medium Rigid</option>
              <option value="CLASS_D">Class D - Light Rigid</option>
              <option value="CLASS_E">Class E - Car</option>
              <option value="CLASS_F">Class F - Tractor</option>
              <option value="CLASS_G">Class G - Motorcycle</option>
              <option value="CLASS_H">Class H - Moped</option>
              <option value="CLASS_I">Class I - Special Purpose</option>
              <option value="CLASS_J">Class J - Learner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
            <input
              type="number"
              value={formData.experience || ''}
              onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              min={0}
              max={50}
              placeholder="Enter years of experience"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Issue Date *</label>
            <input
              type="date"
              value={formData.licenseIssueDate || ''}
              onChange={(e) => handleInputChange('licenseIssueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry Date *</label>
            <input
              type="date"
              value={formData.licenseExpiry || ''}
              onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License State *</label>
            <input
              type="text"
              value={formData.licenseState || ''}
              onChange={(e) => handleInputChange('licenseState', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="State/Province"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Country *</label>
            <input
              type="text"
              value={formData.licenseCountry || ''}
              onChange={(e) => handleInputChange('licenseCountry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800 flex items-center">
          <FaPhone className="w-5 h-5 mr-2 text-gray-600" />
          Contact Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={formData.contactInfo?.phone || ''}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              value={formData.contactInfo?.email || ''}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="Enter email address"
            />
          </div>
        </div>
      </div>

      {/* Employment */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Employment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
            <select
              value={formData.employmentType || ''}
              onChange={(e) => handleInputChange('employmentType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select employment type</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="OWNER_OPERATOR">Owner Operator</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
            <input
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Additional Information</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Certifications</label>
          <textarea
            value={formData.specialCertifications || ''}
            onChange={(e) => handleInputChange('specialCertifications', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Enter any special certifications (e.g., Hazmat, Tanker, etc.)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={formData.driverNotes || ''}
            onChange={(e) => handleInputChange('driverNotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Enter any additional notes about the driver"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-800">Emergency Contact</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
            <input
              type="text"
              value={formData.emergencyContact?.name || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter emergency contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
            <input
              type="tel"
              value={formData.emergencyContact?.phone || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter emergency contact phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <input
              type="text"
              value={formData.emergencyContact?.relationship || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, relationship: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Spouse, Parent, etc."
            />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-800 flex items-center">
              <FaFileUpload className="w-5 h-5 mr-2 text-gray-600" />
              Driver Documents
            </h4>
            <p className="text-sm text-gray-600">
              Upload relevant documents such as driver's license, medical certificate, insurance, etc.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Add Document
          </button>
        </div>

        {/* Document List (ReadOnly Cards) */}
        {documents.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <FaFileAlt className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No documents added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 text-primary-500 rounded-lg">
                      <FaFileAlt className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{doc.title}</h5>
                      <p className="text-xs text-gray-500">
                        {doc.documentType.replace(/_/g, ' ')} • {(doc.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 mt-2 pl-12">{doc.description}</p>
                )}
                {doc.expiryDate && (
                  <div className="mt-2 pl-12">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Expires: {doc.expiryDate}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDriverDocumentModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddDocument}
        />
      )}
    </div>
  );
};

export default DriverInformationStep;



