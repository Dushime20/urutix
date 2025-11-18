import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTruck, FaCheck, FaRocket, FaBookmark } from "react-icons/fa";
import JourneySelectionModal from "@/components/CargoOwnerJourney/JourneySelectionModal";
import PhotoUploadModal from "@/components/CargoDashboard/PhotoUploadModal";
import TemplateSelectionModal from "./components/TemplateSelectionModal";
import AISuggestionsModal from "@/components/CargoDashboard/AISuggestionsModal";
import { errorMessage } from "@/utils/error";
import toast from "react-hot-toast";
import EnhancedCargoForm from "./components/form";
import ActionCard from "./components/ActionCard";
import { loadsAPI } from "@/services/load";
import type { ICargoBody } from "./types/cargo";

const CargoCreatePage: React.FC = () => {
  const navigate = useNavigate();

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

  // Quick action handlers
  const handleQuickCreate = () => {
    setShowEnhancedForm(true);
  };

  const handleTemplateCreate = () => {
    setShowTemplateSelection(true);
  };

  const handleSaveDraft = async (formData: any) => {
    setLoading(true);
    try {
      // Save draft to backend using axios
      const response = await loadsAPI.saveDraft({
        ...formData,
        status: "DRAFT",
        photos: uploadedPhotos,
      });

      if (response.status >= 200 && response.status < 300) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
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
      setCargoData({
        ...submissionData,
        id: response?.id,
      });
      setShowEnhancedForm(false);
      setShowJourneySelection(true);

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

  const handleJourneySelection = async (
    journey: "smart-matching" | "publish-bid"
  ) => {
    setShowJourneySelection(false);

    // Navigate to the journey page with cargo data
    navigate("/dashboard/journey", {
      state: {
        cargoData: cargoData,
        selectedJourney: journey,
        message: `Cargo created! ${
          journey === "smart-matching" ? "Smart matching" : "Bidding"
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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Drafts
          </h3>
          <div className="text-gray-600 text-sm">
            No recent drafts found. Start creating your cargo above.
          </div>
        </div>

        {/* Enhanced Cargo Form Modal */}
        <EnhancedCargoForm
          isOpen={showEnhancedForm}
          onClose={() => setShowEnhancedForm(false)}
          onSubmit={handleCargoSubmit}
          mode="create"
          initialData={selectedTemplate}
          showTruckSelection={false}
          onSaveDraft={handleSaveDraft}
          uploadedPhotos={uploadedPhotos}
          aiSuggestions={aiSuggestions}
        />

        {/* Journey Selection Modal */}
        {showJourneySelection && (
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
      </div>
    </div>
  );
};

export default CargoCreatePage;
