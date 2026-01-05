/**
 * Enhanced Dashboard Integration
 * 
 * This file demonstrates how to integrate advanced features into the main Dashboard
 * Copy this code into Dashboard.tsx to enable advanced features
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Mic, 
  Camera, 
  FileText,
  Sparkles 
} from 'lucide-react';

// Import advanced features
import CustomReportBuilder from './dashboard/reports/CustomReportBuilder';
import VoiceCargoInput from '../components/VoiceInput/VoiceCargoInput';
import CameraDocumentScanner from '../components/Camera/CameraDocumentScanner';
import { EnhancedQuickCreateModal } from '../components/Cargo/EnhancedQuickCreateModal';

// Add to existing Dashboard component

export const EnhancedDashboardFeatures = () => {
  const navigate = useNavigate();
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);
  const [showEnhancedCreate, setShowEnhancedCreate] = useState(false);

  // Add this section to your dashboard
  return (
    <>
      {/* Advanced Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Custom Reports */}
        <button
          onClick={() => setShowReportBuilder(true)}
          className="p-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-1">Custom Reports</h3>
          <p className="text-sm text-violet-100">Build your own reports</p>
        </button>

        {/* Voice Input */}
        <button
          onClick={() => setShowVoiceInput(true)}
          className="p-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-1">Voice Create</h3>
          <p className="text-sm text-rose-100">Speak to create cargo</p>
        </button>

        {/* Document Scanner */}
        <button
          onClick={() => setShowDocumentScanner(true)}
          className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-1">Scan Documents</h3>
          <p className="text-sm text-emerald-100">Camera document upload</p>
        </button>

        {/* Enhanced Create */}
        <button
          onClick={() => setShowEnhancedCreate(true)}
          className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white hover:shadow-2xl transition-all group"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-1">Quick Create+</h3>
          <p className="text-sm text-amber-100">All features in one</p>
        </button>
      </div>

      {/* Modals */}
      {showReportBuilder && (
        <div className="fixed inset-0 z-50">
          <CustomReportBuilder />
          <button
            onClick={() => setShowReportBuilder(false)}
            className="absolute top-4 right-4 px-4 py-2 bg-white text-gray-900 rounded-xl hover:bg-gray-100 font-semibold shadow-lg"
          >
            Close
          </button>
        </div>
      )}

      {showVoiceInput && (
        <VoiceCargoInput
          onDataCaptured={(data) => {
            console.log('Voice data captured:', data);
            // Navigate to create page with prefilled data
            setShowVoiceInput(false);
            // TODO: Pass data to creation form
          }}
          onClose={() => setShowVoiceInput(false)}
        />
      )}

      {showDocumentScanner && (
        <CameraDocumentScanner
          documentType="general"
          onDocumentCaptured={(docs) => {
            console.log('Documents captured:', docs);
            setShowDocumentScanner(false);
            // TODO: Upload documents to backend
          }}
          onClose={() => setShowDocumentScanner(false)}
        />
      )}

      {showEnhancedCreate && (
        <EnhancedQuickCreateModal
          isOpen={showEnhancedCreate}
          onClose={() => setShowEnhancedCreate(false)}
          onSuccess={() => {
            setShowEnhancedCreate(false);
            // Refresh dashboard data
          }}
        />
      )}
    </>
  );
};

/**
 * Integration Instructions:
 * 
 * 1. Add this to your Dashboard.tsx imports:
 *    import { EnhancedDashboardFeatures } from './Dashboard.enhanced';
 * 
 * 2. Add <EnhancedDashboardFeatures /> component in your dashboard render:
 *    Place it after the "Smart Insights" section or in the overview tab
 * 
 * 3. Update your App.tsx routes to include custom report builder:
 *    <Route path="reports/builder" element={<CustomReportBuilder />} />
 * 
 * 4. Add navigation link in DashboardHeader or sidebar:
 *    <Link to="/dashboard/reports/builder">
 *      <BarChart3 /> Custom Reports
 *    </Link>
 */

export default EnhancedDashboardFeatures;

