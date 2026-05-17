import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { FaRocket, FaBookmark } from "react-icons/fa";
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
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
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
      if (editCargo.status === 'DRAFT' && editCargo.id) {
        setCurrentDraftId(editCargo.id); // Track draft ID for updates
      }
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
    setCurrentDraftId(draft.id); // Track which draft we're editing
    setShowDraftModal(false);
    setShowEnhancedForm(true);
  };

  const handleCreateNew = () => {
    setCurrentDraftId(null); // New cargo, no existing draft
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

      let response;

      if (currentDraftId) {
        // Update existing draft instead of creating a new one
        response = await loadsAPI.updateDraft(currentDraftId, sanitizedData);
      } else {
        // Create new draft
        response = await loadsAPI.saveDraft(sanitizedData);
        // Store the new draft ID so subsequent saves update instead of create
        const newDraftId = response?.data?.load?.id || response?.data?.id || response?.data?.data?.id;
        console.log("New draft saved with ID:", newDraftId);
        if (newDraftId) {
          setCurrentDraftId(newDraftId);
        }
      }

      if (response.status >= 200 && response.status < 300) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
        toast.success(currentDraftId ? "Draft updated successfully!" : "Draft saved successfully!");
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

      let response;
      let createdLoadId;

      if (currentDraftId) {
        // Draft exists: update it with final data, then publish it
        // This avoids creating a duplicate — the draft becomes the cargo
        try {
          await loadsAPI.updateDraft(currentDraftId, submissionData);
          const publishResponse = await loadsAPI.publishDraft(currentDraftId);
          response = publishResponse?.data;
          createdLoadId = currentDraftId; // The draft IS the cargo now
        } catch (publishError: any) {
          console.error("Failed to publish draft, falling back to create:", publishError);
          // Fallback: create new and delete draft
          response = await loadsAPI.create(submissionData);
          createdLoadId = (response as any)?.id || (response as any)?.data?.id || (response as any)?.load?.id;
          try {
            await loadsAPI.deleteDraft(currentDraftId);
          } catch (e) {
            console.error("Failed to delete draft:", e);
          }
        }
        setCurrentDraftId(null);
        fetchDrafts(); // Refresh drafts list
      } else {
        // No draft: create a brand new cargo
        const pendingDocs = ((submissionData as any).documents || []).filter((d: any) => d.isPending && d.file instanceof File);
        console.log(`📎 [CreateCargo] Submitting with ${pendingDocs.length} pending file(s):`, pendingDocs.map((d: any) => d.file?.name));
        response = await loadsAPI.create(submissionData);
        createdLoadId = (response as any)?.id || (response as any)?.data?.id || (response as any)?.load?.id;
      }

      setCargoData({
        ...submissionData,
        id: createdLoadId,
      });

      // Always return a normalized object with id so document upload in the form works.
      // Do NOT close the form here — the form's handleSubmit will call onClose() after
      // all documents have finished uploading (Step 3). Closing here unmounts the
      // component and aborts the document upload entirely.
      return { ...(response as any), id: createdLoadId } as any;
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

  const handleBrokerAssigned = (brokerId: string) => {
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
    journey: "smart-matching" | "publish-bid" | "assign-broker"
  ) => {
    if (journey === "assign-broker") {
      setShowJourneySelection(false);
      setShowBrokerAssignment(true);
      return;
    }
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
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Draft Success Notification */}
        {draftSaved && (
          <div className="fixed top-24 right-4 z-50 animate-bounce">
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <FaRocket size={12} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Draft Saved</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-8 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
               <X className="text-rose-600 w-5 h-5" />
             </div>
             <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        )}

        {/* Header - Enlite Prime Style */}
        <div className="mb-10 rounded-[2.5rem] p-8 sm:p-10 bg-white border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <FaRocket className="text-[#345E85]" size={24} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
                Create Cargo
              </h1>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-lg">
              Choose your preferred way to create cargo and start your journey with our smart logistics engine.
            </p>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl"></div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <ActionCard
            icon={FaRocket}
            title="Quick Create"
            description="START FROM SCRATCH"
            buttonText="Start Creating"
            color="blue"
            onClick={handleQuickCreate}
          />

          <ActionCard
            icon={FaBookmark}
            title="Use Template"
            description="FREQUENTLY SHIPPED"
            buttonText="Choose Template"
            color="green"
            onClick={handleTemplateCreate}
          />
        </div>

        {/* Recent Drafts */}
        {drafts.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10 mb-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-[#0f172a] tracking-tight">
                  Recent Drafts
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Pick up where you left off
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-black">
                {drafts.length} TOTAL
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {drafts.slice(0, 4).map((draft: any) => (
                <div
                  key={draft.id}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-slate-50/50 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0 mr-4 mb-4 sm:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <h4 className="font-black text-slate-800 truncate">{draft.title || "Untitled Draft"}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                      {draft.weight && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span>{draft.weight} kg</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleContinueDraft(draft)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 text-white rounded-2xl hover:bg-[#345E85] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/10"
                  >
                    CONTINUE
                  </button>
                </div>
              ))}
            </div>
            
            {drafts.length > 4 && (
              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
                <button
                  onClick={() => navigate("/cargo-owner/cargos/list?tab=drafts")}
                  className="text-[#345E85] hover:text-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  VIEW ALL {drafts.length} DRAFTS 
                  <span className="text-lg">→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Cargo Form Modal */}
        <EnhancedCargoForm
          isOpen={showEnhancedForm}
          onSuccess={() => {
            setShowBrokerAssignment(true);
          }}
          onClose={() => {
            setShowEnhancedForm(false);
            setSelectedTemplate(null);
            setEditMode(false);
            setCurrentDraftId(null); // Reset draft tracking when closing
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
