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
  Heart,
  Map as MapIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { RouteSelectionComponent } from '../RouteSelectionComponent';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 AddDriverDocumentModal: Form submitted');
    console.log('📝 AddDriverDocumentModal: Form data:', { file, docData });
    
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
      
      console.log('📄 AddDriverDocumentModal: New document:', newDoc);
      
      await onSave(newDoc);
      console.log('✅ AddDriverDocumentModal: Document saved successfully');
      toast.success('Document added successfully!');
      onClose();
    } catch (error) {
      console.error('❌ AddDriverDocumentModal: Error saving document:', error);
      toast.error('Failed to add document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center">
              <FilePlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Document</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
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
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-900 mb-2">Upload Document</p>
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
                    <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-900 mb-2">{file.name}</p>
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

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={onClose} 
                disabled={loading}
                className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || !file || !docData.title || !docData.documentType}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Document
                  </>
                )}
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
    console.log('📝 DriverInformationStep: handleAddDocument called');
    console.log('📄 DriverInformationStep: Document to add:', doc);
    console.log('📋 DriverInformationStep: Current documents:', documents);
    
    const updatedDocs = [...documents, doc];
    console.log('📋 DriverInformationStep: Updated documents:', updatedDocs);
    
    setDocuments(updatedDocs);
    handleInputChange('documents', updatedDocs);
    
    console.log('✅ DriverInformationStep: Document added to state');
    toast.success(`Document "${doc.title}" added successfully!`);
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
    handleInputChange('documents', updatedDocs);
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4 mb-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-white text-primary-500 flex items-center justify-center shadow-sm">
          <User className="w-6 h-6 font-black" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Driver Information</h3>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Personnel Credentials</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Personal Information
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">First Name *</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
                placeholder="e.g. Samuel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Last Name *</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
                placeholder="e.g. Karanja"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date of Birth *</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address *</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
                placeholder="e.g. Nairobi, Kenya"
              />
            </div>
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            License Information
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2 space-y-4"> {/* Increased height requested */}
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">License Number *</label>
            <div className="relative group">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={formData.licenseNumber || ''}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
                placeholder="e.G. DL-987654321"
              />
            </div>
          </div>

          <div className="space-y-2 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">License Type *</label>
            <select
              value={formData.licenseType || ''}
              onChange={(e) => handleInputChange('licenseType', e.target.value)}
              className="w-full px-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
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

          <div className="space-y-2 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Years of Experience *</label>
            <input
              type="number"
              value={formData.experience || ''}
              onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || '')}
              className="w-full px-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
              required
              min={0}
              max={50}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">License Issue Date *</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="date"
                value={formData.licenseIssueDate || ''}
                onChange={(e) => handleInputChange('licenseIssueDate', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">License Expiry Date *</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="date"
                value={formData.licenseExpiry || ''}
                onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">License State *</label>
            <input
              type="text"
              value={formData.licenseState || ''}
              onChange={(e) => handleInputChange('licenseState', e.target.value)}
              className="w-full px-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
              required
              placeholder="e.g. Nairobi"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">License Country *</label>
            <input
              type="text"
              value={formData.licenseCountry || ''}
              onChange={(e) => handleInputChange('licenseCountry', e.target.value)}
              className="w-full px-4 py-4 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
              required
              placeholder="Kenya"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Contact Information
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number *</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="tel"
                value={formData.contactInfo?.phone || ''}
                onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
                placeholder="+254 7..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address *</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="email"
                value={formData.contactInfo?.email || ''}
                onChange={(e) => handleInputChange('contactInfo', { ...formData.contactInfo, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                required
                placeholder="driver@urutix.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employment */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Employment
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Employment Type *</label>
            <select
              value={formData.employmentType || ''}
              onChange={(e) => handleInputChange('employmentType', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
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
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hire Date *</label>
            <input
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status *</label>
            <select
              value={formData.status || ''}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
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

      {/* Route Assignment */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <MapIcon className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Route Assignment (Optional)
          </h4>
        </div>

        <RouteSelectionComponent 
          selectedRoutes={formData.routeIds || []}
          onRouteChange={(routeIds) => handleInputChange('routeIds', routeIds)}
        />
      </div>

      {/* Compliance & Safety */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Compliance & Safety
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Medical Certificate Expiry</label>
            <input
              type="date"
              value={formData.medicalCertExpiry || ''}
              onChange={(e) => handleInputChange('medicalCertExpiry', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Last Drug Test Date</label>
            <input
              type="date"
              value={formData.drugTestDate || ''}
              onChange={(e) => handleInputChange('drugTestDate', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Background Check Date</label>
            <input
              type="date"
              value={formData.backgroundCheckDate || ''}
              onChange={(e) => handleInputChange('backgroundCheckDate', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Training Completion Date</label>
            <input
              type="date"
              value={formData.trainingCompletionDate || ''}
              onChange={(e) => handleInputChange('trainingCompletionDate', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Financial Details (Optional)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hourly Rate ($)</label>
            <div className="relative group">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="number"
                step="0.01"
                value={formData.hourlyRate || ''}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mileage Rate ($/km)</label>
            <div className="relative group">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="number"
                step="0.01"
                value={formData.mileageRate || ''}
                onChange={(e) => handleInputChange('mileageRate', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
            <StickyNote className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
            Additional Information
          </h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Special Certifications</label>
            <textarea
              value={formData.specialCertifications || ''}
              onChange={(e) => handleInputChange('specialCertifications', e.target.value)}
              className="w-full px-4 py-4 bg-white border border-slate-100 rounded-[24px] text-sm font-medium text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
              rows={5}
              placeholder="Enter any special certifications (e.g., Hazmat, Tanker, etc.)"
            />
          </div>

          <div className="space-y-2 px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes</label>
            <textarea
              value={formData.driverNotes || ''}
              onChange={(e) => handleInputChange('driverNotes', e.target.value)}
              className="w-full px-4 py-4 bg-white border border-slate-100 rounded-[24px] text-sm font-medium text-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm transition-all"
              rows={5}
              placeholder="Enter any additional notes about the driver"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
            Emergency Contact
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
              <input
                type="text"
                value={formData.emergencyContact?.name || ''}
                onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none shadow-sm transition-all"
                placeholder="Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
              <input
                type="tel"
                value={formData.emergencyContact?.phone || ''}
                onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none shadow-sm transition-all"
                placeholder="+254..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Relationship</label>
            <input
              type="text"
              value={formData.emergencyContact?.relationship || ''}
              onChange={(e) => handleInputChange('emergencyContact', { ...formData.emergencyContact, relationship: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none shadow-sm transition-all"
              placeholder="e.g., Spouse"
            />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-primary-500 flex items-center justify-center shadow-sm">
              <FilePlus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Driver Documents</h4>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Licenses, certificates & permits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        </div>

        {/* Document List (ReadOnly Cards) */}
        {documents.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center bg-slate-50/50">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No documents added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc, index) => (
              <div key={index} className="group bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{doc.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {doc.documentType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {(doc.file.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {doc.description && (
                  <p className="text-xs font-medium text-slate-500 mt-4 pl-16 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-50">{doc.description}</p>
                )}
                {doc.expiryDate && (
                  <div className="mt-4 pl-16 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-rose-400" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Expires: {doc.expiryDate}</span>
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



