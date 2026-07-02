import React, { useState, useRef } from 'react';
import { 
  User, 
  CreditCard, 
  Phone, 
  FilePlus, 
  Trash2, 
  Plus, 
  X, 
  FileText, 
  Upload, 
  Mail, 
  MapPin, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  DollarSign, 
  StickyNote, 
  Heart
} from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    console.log('📝 AddDriverDocumentModal: Save button clicked');
    console.log('📝 AddDriverDocumentModal: Form data:', { file, docData });
    console.log('📝 AddDriverDocumentModal: Event details:', {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget
    });
    
    if (!file || !docData.title || !docData.documentType) {
      console.error('❌ AddDriverDocumentModal: Validation failed:', {
        hasFile: !!file,
        hasTitle: !!docData.title,
        hasDocumentType: !!docData.documentType
      });
      toast.error('Please fill in all required fields and select a file.');
      return;
    }
    
    setLoading(true);
    console.log('✅ AddDriverDocumentModal: Validation passed, creating document');
    
    try {
      const newDoc = {
        file,
        documentType: docData.documentType,
        title: docData.title,
        description: docData.description,
        expiryDate: docData.expiryDate,
      };
      
      onSave(newDoc);
      toast.success('Document added successfully!');
    } catch (error: any) {
      console.error('❌ AddDriverDocumentModal: Error in handleSubmit:', error);
      toast.error('Failed to add document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={(e) => {
        console.log('🔘 AddDriverDocumentModal: Backdrop clicked');
        console.log('🔘 AddDriverDocumentModal: Click target:', e.target);
        console.log('🔘 AddDriverDocumentModal: Current target:', e.currentTarget);
        console.log('🔘 AddDriverDocumentModal: Loading state:', loading);
        
        if (e.target === e.currentTarget && !loading) {
          console.log('✅ AddDriverDocumentModal: Valid backdrop click - closing modal');
          console.trace('📍 AddDriverDocumentModal: Backdrop click stack trace');
          onClose();
        } else {
          console.log('❌ AddDriverDocumentModal: Invalid backdrop click - not closing');
          console.log('❌ AddDriverDocumentModal: Reason:', {
            isBackdrop: e.target === e.currentTarget,
            isNotLoading: !loading
          });
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-none max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FilePlus className="w-5 h-5" />
            </div>
            <h2 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Add Digital Credential</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Document Type *</label>
                <select
                  value={docData.documentType}
                  onChange={(e) => setDocData({ ...docData, documentType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  required
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Document Title *</label>
                <input
                  type="text"
                  value={docData.title}
                  onChange={(e) => setDocData({ ...docData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  required
                  placeholder="Enter credential name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Detailed Description</label>
              <textarea
                value={docData.description || ''}
                onChange={(e) => setDocData({ ...docData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none resize-none"
                placeholder="Enter document specifics (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Expiration Timeline</label>
              <input
                type="date"
                value={docData.expiryDate || ''}
                onChange={(e) => setDocData({ ...docData, expiryDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Source Asset *</label>
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-all ${file ? 'border-blue-600/30 bg-blue-600/5 dark:bg-blue-600/10' : 'border-gray-200 dark:border-gray-800 hover:border-blue-600/30 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
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
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-600/5 dark:bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-blue-600 dark:text-blue-500 opacity-60" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-1">Upload Source Credential</p>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-tight">Drag and drop or select file system</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all shadow-none"
                    >
                      Browse Files
                    </button>
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest opacity-60">PDF, DOCX, IMG (MAX 10MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-1">{file.name}</p>
                      <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tight">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    {preview && <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-4" />}
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      Reset File
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={loading || !file || !docData.title || !docData.documentType}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
              >
                {loading ? 'Processing...' : (file ? 'Archive Credential' : 'Add Credential')}
              </button>
            </div>
          </div>
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

  // Add logging for modal state changes
  const setShowAddModalWithLogging = (value: boolean) => {
    console.log(`🔄 DriverInformationStep: Modal state changing from ${showAddModal} to ${value}`);
    console.trace('📍 DriverInformationStep: Modal state change stack trace');
    setShowAddModal(value);
  };

  const handleAddDocument = async (doc: DriverDocument) => {
    console.log('📝 DriverInformationStep: handleAddDocument called');
    console.log('📄 DriverInformationStep: Document to add:', doc);
    console.log('📋 DriverInformationStep: Current documents before adding:', documents);
    try {
      const updatedDocs = [...documents, doc];
      setDocuments(updatedDocs);
      
      try {
        handleInputChange('documents', updatedDocs);
      } catch (inputChangeError: any) {
        console.error('❌ DriverInformationStep: Error in handleInputChange:', inputChangeError);
        throw inputChangeError;
      }
      
      toast.success(`Document "${doc.title}" added!`);
      
      setTimeout(() => {
        setShowAddModalWithLogging(false);
      }, 100);
      
    } catch (error: any) {
      console.error('❌ DriverInformationStep: Error in handleAddDocument:', error);
      console.error('❌ DriverInformationStep: Error type:', typeof error);
      console.error('❌ DriverInformationStep: Error message:', error?.message);
      console.error('❌ DriverInformationStep: Error stack:', error?.stack);
      console.error('❌ DriverInformationStep: Full error object:', JSON.stringify(error, null, 2));
      console.error('❌ DriverInformationStep: Document that caused error:', doc);
      console.error('❌ DriverInformationStep: Current documents when error occurred:', documents);
      
      // Check if this error might be causing modal closure issues
      console.error('🚨 DriverInformationStep: ERROR IN PARENT COMPONENT - This might cause both modals to close!');
      console.error('🚨 DriverInformationStep: Checking if handleInputChange is the culprit...');
      
      toast.error('Failed to add document. Please try again.');
      
      // Don't close the modal on error
      console.log('⚠️ DriverInformationStep: Not closing modal due to error');
    }
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    handleInputChange('documents', updatedDocs);
  };

  return (
    <div className="space-y-12 text-gray-900 dark:text-white">
      <div className="flex items-center gap-2 mb-8">
        <User className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Personnel & Operator Protocol</h3>
      </div>

      {/* Personal Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Identity & Personnel Profile</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">First Name *</label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="e.g. Samuel"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Last Name *</label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="e.g. Karanja"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Primary Residence *</label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="e.g. Nairobi, Kenya"
            />
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Regulatory Authorization & Documentation</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">License Registry ID *</label>
            <input
              type="text"
              value={formData.licenseNumber || ''}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              onBlur={(e) => {
                const val = e.target.value.trim();
                const el = e.target;
                const hint = el.parentElement?.querySelector('.license-hint') as HTMLElement | null;
                if (val && val.length < 10) {
                  el.classList.add('border-red-400', 'dark:border-red-500', 'focus:border-red-400');
                  el.classList.remove('border-gray-100', 'dark:border-gray-700');
                  if (hint) { hint.textContent = 'Minimum 10 characters required'; hint.classList.remove('hidden'); }
                } else {
                  el.classList.remove('border-red-400', 'dark:border-red-500', 'focus:border-red-400');
                  el.classList.add('border-gray-100', 'dark:border-gray-700');
                  if (hint) hint.classList.add('hidden');
                }
              }}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              minLength={10}
              placeholder="e.g. DL-987654321"
            />
            <p className="license-hint hidden text-[10px] font-semibold text-red-500 px-1">Minimum 10 characters required</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Authorization Class *</label>
            <select
              value={formData.licenseType || ''}
              onChange={(e) => handleInputChange('licenseType', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            >
              <option value="">Select license type</option>
              <option value="CLASS_A">Class A - Heavy Combination</option>
              {/* ... other options omitted for brevity but should remain in the actual file ... */}
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

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Operational Tenure (Years) *</label>
            <input
              type="number"
              value={formData.experience || ''}
              onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || '')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              min={0}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Issue Timestamp *</label>
            <input
              type="date"
              value={formData.licenseIssueDate || ''}
              onChange={(e) => handleInputChange('licenseIssueDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Expiry Horizon *</label>
            <input
              type="date"
              value={formData.licenseExpiry || ''}
              onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Jurisdiction State *</label>
            <input
              type="text"
              value={formData.licenseState || ''}
              onChange={(e) => handleInputChange('licenseState', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="e.g. Nairobi"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Issuing Country *</label>
            <input
              type="text"
              value={formData.licenseCountry || ''}
              onChange={(e) => handleInputChange('licenseCountry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="e.g. Kenya"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Communication Protocols</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Signal Phone *</label>
            <input
              type="tel"
              value={formData.contactInfo?.phone || ''}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="+254 7..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Digital Mailbox *</label>
            <input
              type="email"
              value={formData.contactInfo?.email || ''}
              onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
              placeholder="driver@urutix.com"
            />
          </div>
        </div>
      </div>

      {/* Employment */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contractual Engagement</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Engagement Type *</label>
            <select
              value={formData.employmentType || ''}
              onChange={(e) => handleInputChange('employmentType', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
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
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Activation Date *</label>
            <input
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Operational Status *</label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
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

      {/* Compliance & Safety */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Compliance & Safety Registry</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Medical Clearance Expiry</label>
            <input
              type="date"
              value={formData.medicalCertExpiry || ''}
              onChange={(e) => handleInputChange('medicalCertExpiry', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Subs. Screening Date</label>
            <input
              type="date"
              value={formData.drugTestDate || ''}
              onChange={(e) => handleInputChange('drugTestDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Security Vetting Date</label>
            <input
              type="date"
              value={formData.backgroundCheckDate || ''}
              onChange={(e) => handleInputChange('backgroundCheckDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Skill Refresh Date</label>
            <input
              type="date"
              value={formData.trainingCompletionDate || ''}
              onChange={(e) => handleInputChange('trainingCompletionDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Financial Remuneration (Optional)</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Base Hourly Yield ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.hourlyRate || ''}
              onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Distance Unit Rate ($/KM)</label>
            <input
              type="number"
              step="0.01"
              value={formData.mileageRate || ''}
              onChange={(e) => handleInputChange('mileageRate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <StickyNote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Supplemental Observations</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Special Accreditation Notes</label>
            <textarea
              value={formData.specialCertifications || ''}
              onChange={(e) => handleInputChange('specialCertifications', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none resize-none"
              rows={4}
              placeholder="Hazmat, Tanker, etc."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Personnel Directives</label>
            <textarea
              value={formData.driverNotes || ''}
              onChange={(e) => handleInputChange('driverNotes', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none resize-none"
              rows={4}
              placeholder="Additional operational notes"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500" />
          <h4 className="text-[10px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-widest">Emergency Escalation Logic</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Responder Alias</label>
            <input
              type="text"
              value={formData.emergencyContact?.name || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="Full Name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Urgent Signal Access</label>
            <input
              type="tel"
              value={formData.emergencyContact?.phone || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="+254..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Kinship Relation</label>
            <input
              type="text"
              value={formData.emergencyContact?.relationship || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, relationship: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="e.g. Spouse"
            />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-blue-600/5 dark:bg-blue-600/10 p-5 rounded-lg border border-blue-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-500 flex items-center justify-center shadow-none border border-blue-600/10">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Credential Repository</h4>
              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-500/70 uppercase tracking-tight mt-0.5">Verified Authorization Assets</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModalWithLogging(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all shadow-none"
          >
            Digital Upload
          </button>
        </div>

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-10 text-center bg-gray-50/50 dark:bg-gray-800/20">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-4 opacity-50" />
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">DRIVE_VAULT EMPTY: NO CREDENTIALS DETECTED</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((doc, index) => (
              <div key={index} className="group bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700 rounded-lg p-4 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 text-blue-600 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{doc.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-wider">
                          {doc.documentType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter opacity-70">
                          {(doc.file.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="p-2 text-gray-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {doc.description && (
                  <div className="mt-3 pl-14">
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-tight">{doc.description}</p>
                  </div>
                )}
                {doc.expiryDate && (
                  <div className="mt-2 pl-14 flex items-center gap-2">
                    <span className="text-[9px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest">DEPROVISIONING DATE: {doc.expiryDate}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDriverDocumentModal
          onClose={() => {
            console.log('🔘 DriverInformationStep: Document modal onClose called');
            console.trace('📍 DriverInformationStep: onClose stack trace');
            setShowAddModalWithLogging(false);
          }}
          onSave={handleAddDocument}
        />
      )}
    </div>
  );
};

export default DriverInformationStep;



