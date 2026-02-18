import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTruck, FaCheck, FaRocket, FaBookmark } from "react-icons/fa";
import JourneySelectionModal from "@/components/CargoOwnerJourney/JourneySelectionModal";
import BrokerAssignmentStep from "@/components/CargoOwnerJourney/BrokerAssignmentStep";
import PhotoUploadModal from "@/components/CargoDashboard/PhotoUploadModal";
import TemplateSelectionModal from "./components/TemplateSelectionModal";
import AISuggestionsModal from "@/components/CargoDashboard/AISuggestionsModal";
import { errorMessage } from "@/utils/error";
import toast from "react-hot-toast";
import EnhancedCargoForm from "./components/form";
import ActionCard from "./components/ActionCard";
import { loadsAPI } from "@/services/load";
import type { ICargoBody } from "./types/cargo";
import { FileText, X } from "lucide-react";

const CargoCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showEnhancedForm, setShowEnhancedForm] = useState(false);
  const [showJourneySelection, setShowJourneySelection] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [cargoData, setCargoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showBrokerAssignment, setShowBrokerAssignment] = useState(false);
  const [assignedBrokerId, setAssignedBrokerId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for editCargo in navigation state and auto-open form with data
  useEffect(() => {
    const editCargo = (location.state as any)?.editCargo;
    if (editCargo) {
      console.log("📝 Opening form with cargo data for editing:", editCargo);
      setSelectedTemplate(editCargo);
      setEditMode(editCargo.status !== 'DRAFT'); // Set edit mode for non-draft cargos
      setShowEnhancedForm(true);
      // Clear the navigation state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch drafts on mount
  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await loadsAPI.getAll({ status: "DRAFT" });
      const draftsData = response?.data?.cargos || response?.data?.items || response?.data || [];
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  };

  // Quick action handlers
  const handleQuickCreate = () => {
    if (drafts.length > 0) {
      setShowDraftModal(true);
    } else {
      setShowEnhancedForm(true);
    }
  };

  const handleContinueDraft = (draft: any) => {
    setSelectedTemplate(draft);
    setShowDraftModal(false);
    setShowEnhancedForm(true);
  };

  const handleCreateNew = () => {
    setShowDraftModal(false);
    setShowEnhancedForm(true);
  };

  const handleTemplateCreate = () => {
    setShowTemplateSelection(true);
  };

  const handleSaveDraft = async (formData: any) => {
    setLoading(true);
    try {
      // Helper function to safely convert to ISO date
      const toISODate = (date: any): string => {
        if (!date) return new Date().toISOString();
        const d = new Date(date);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      };

      // Ensure dates are in ISO format
      const sanitizedData = {
        ...formData,
        status: "DRAFT",
        photos: uploadedPhotos,
        pickupDate: toISODate(formData.pickupDate),
        deliveryDate: toISODate(formData.deliveryDate),
        // Sanitize locations dates
        locations: formData.locations?.map((loc: any) => ({
          ...loc,
          scheduledDate: toISODate(loc.scheduledDate),
        })) || [],
      };

      const response = await loadsAPI.saveDraft(sanitizedData);

      if (response.status >= 200 && response.status < 300) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
        toast.success("Draft saved successfully!");
        fetchDrafts();
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleCargoSubmit = async (formData: ICargoBody) => {
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (
        !formData.title ||
        !formData.cargoType ||
        !formData.weight ||
        !formData.loadValue
      )
        throw new Error(
          "Please fill in all required fields (title, cargo type, weight, and load value)"
        );

      if (!formData.locations || formData.locations.length < 2)
        throw new Error("Please select both pickup and delivery locations");

      // Add photos to form data
      const submissionData = {
        ...formData,
        photos: uploadedPhotos,
        aiSuggestions: aiSuggestions,
      };

      console.log("Submitting cargo data:", submissionData);

      // Check if we have an access token
      const token = localStorage.getItem("accessToken");
      if (!token)
        throw new Error("No authentication token found. Please log in again.");

      // Save cargo details to backend using axios
      const response = await loadsAPI.create(submissionData);

      // console.log("Cargo saved successfully:", response);
      const createdLoadId = response?.id || response?.data?.id || response?.load?.id;
      setCargoData({
        ...submissionData,
        id: createdLoadId,
      });
      setShowEnhancedForm(false);

      // Show broker assignment step before journey selection
      setShowBrokerAssignment(true);

      return response;
    } catch (error) {
      const message = errorMessage(error);
      console.error("Cargo creation error:", message);
      toast.error(message);
      setError(`Failed to save cargo details: ${message}. Please try again.`);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBrokerAssigned = (brokerId: string, contractId?: string) => {
    setAssignedBrokerId(brokerId);
    setShowBrokerAssignment(false);
    // If broker is assigned, skip journey selection and go directly to cargo list
    // The broker will handle the journey
    toast.success("Broker assigned! The broker will manage this load.");
    navigate("/dashboard/cargos/list", {
      state: {
        message: "Cargo created and broker assigned successfully!",
      },
    });
  };

  const handleSkipBrokerAssignment = () => {
    setShowBrokerAssignment(false);
    setShowJourneySelection(true);
  };

  const handleJourneySelection = async (
    journey: "smart-matching" | "publish-bid"
  ) => {
    setShowJourneySelection(false);

    // Navigate to the journey page with cargo data
    navigate("/dashboard/journey", {
      state: {
        cargoData: cargoData,
        selectedJourney: journey,
        message: `Cargo created! ${journey === "smart-matching" ? "Smart matching" : "Bidding"
          } initiated.`,
      },
    });
  };

  const handleTemplateSelected = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateSelection(false);
    setShowEnhancedForm(true);
  };

  const handlePhotosUploaded = (photos: string[]) => {
    setUploadedPhotos((prev) => [...prev, ...photos]);
    setShowPhotoUpload(false);
  };

  const handleAISuggestionsReceived = (suggestions: any) => {
    setAiSuggestions(suggestions);
    setShowAISuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaTruck className="text-blue-500 mr-3" size={24} />
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Cargo
            </h1>
          </div>
          <p className="text-gray-600">
            Choose your preferred way to create cargo and start your journey
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ActionCard
            icon={FaRocket}
            title="Quick Create"
            description="Start from scratch"
            buttonText="Start Creating"
            color="blue"
            onClick={handleQuickCreate}
          />

          <ActionCard
            icon={FaBookmark}
            title="Use Template"
            description="Frequently shipped cargo"
            buttonText="Choose Template"
            color="green"
            onClick={handleTemplateCreate}
          />
        </div>

        {/* Draft Status */}
        {draftSaved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaCheck className="text-green-500 mr-2" />
              <span className="text-green-800">Draft saved successfully!</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Recent Drafts */}
        {drafts.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Drafts ({drafts.length})
            </h3>
            <div className="space-y-3">
              {drafts.slice(0, 3).map((draft: any) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{draft.title || "Untitled Draft"}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleContinueDraft(draft)}
                    className="px-4 py-2 bg-[#345E85] text-white rounded-xl hover:bg-slate-800 transition-all font-black text-xs"
                  >
                    CONTINUE
                  </button>
                </div>
              ))}
            </div>
            {drafts.length > 3 && (
              <button
                onClick={() => navigate("/cargo-owner/cargos/list?tab=drafts")}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all {drafts.length} drafts →
              </button>
            )}
          </div>
        )}

        {/* Enhanced Cargo Form Modal */}
        <EnhancedCargoForm
          isOpen={showEnhancedForm}
          onClose={() => {
            setShowEnhancedForm(false);
            setSelectedTemplate(null);
            setEditMode(false);
          }}
          onSubmit={handleCargoSubmit}
          mode={editMode ? "edit" : "create"}
          initialData={selectedTemplate}
          showTruckSelection={false}
          onSaveDraft={handleSaveDraft}
          uploadedPhotos={uploadedPhotos}
          aiSuggestions={aiSuggestions}
        />

        {/* Broker Assignment Step */}
        {showBrokerAssignment && cargoData?.id && (
          <BrokerAssignmentStep
            isOpen={showBrokerAssignment}
            onClose={() => {
              setShowBrokerAssignment(false);
              setShowJourneySelection(true);
            }}
            loadId={cargoData.id}
            loadTitle={cargoData.title}
            loadValue={cargoData.loadValue}
            onBrokerAssigned={handleBrokerAssigned}
            onSkip={handleSkipBrokerAssignment}
          />
        )}

        {/* Journey Selection Modal */}
        {showJourneySelection && !assignedBrokerId && (
          <JourneySelectionModal
            isOpen={showJourneySelection}
            onClose={() => setShowJourneySelection(false)}
            onJourneySelected={handleJourneySelection}
            cargoData={cargoData}
            loading={loading}
          />
        )}

        {/* Photo Upload Modal */}
        {showPhotoUpload && (
          <PhotoUploadModal
            isOpen={showPhotoUpload}
            onClose={() => setShowPhotoUpload(false)}
            onPhotosUploaded={handlePhotosUploaded}
            existingPhotos={uploadedPhotos}
          />
        )}

        {/* Template Selection Modal */}
        {showTemplateSelection && (
          <TemplateSelectionModal
            isOpen={showTemplateSelection}
            onClose={() => setShowTemplateSelection(false)}
            onTemplateSelected={handleTemplateSelected}
          />
        )}

        {/* AI Suggestions Modal */}
        {showAISuggestions && (
          <AISuggestionsModal
            isOpen={showAISuggestions}
            onClose={() => setShowAISuggestions(false)}
            onSuggestionsReceived={handleAISuggestionsReceived}
          />
        )}

        {/* Draft Selection Modal */}
        {showDraftModal && mounted && createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Continue with Draft?</h2>
                  <button
                    onClick={() => setShowDraftModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  You have {drafts.length} saved draft{drafts.length > 1 ? "s" : ""}. Would you like to continue with one of them or create a new cargo?
                </p>

                <div className="space-y-3 mb-6">
                  {drafts.map((draft: any) => (
                    <button
                      key={draft.id}
                      onClick={() => handleContinueDraft(draft)}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">{draft.title || "Untitled Draft"}</h3>
                          </div>
                          {draft.description && (
                            <p className="text-sm text-gray-600 mb-2">{draft.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Last updated: {new Date(draft.updatedAt).toLocaleDateString()}</span>
                            {draft.weight && <span>Weight: {draft.weight} kg</span>}
                            {draft.cargoType && <span>Type: {draft.cargoType}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateNew}
                    className="flex-1 px-4 py-3 bg-[#345E85] text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-sm shadow-lg shadow-blue-900/10"
                  >
                    CREATE NEW CARGO
                  </button>
                  <button
                    onClick={() => setShowDraftModal(false)}
                    className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default CargoCreatePage;
