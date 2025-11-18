import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  List,
  Activity,
  Gavel,
  Package,
  FileText,
} from "lucide-react";
import { CargoLoadConfirmation } from "@/components/LoanRequest";
import CargoDetailsModal from "@/components/CargoDetailsModal";
import { loadsAPI } from "@/services/load";
import EnhancedCargoForm from "../create/components/form";
import BiddingDashboard from "@/components/Bidding/BiddingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import LoadItem from "./components/loadItem";
import TemplateSelectionModal from "../create/components/TemplateSelectionModal";
import type { CargoFormSchemaType } from "../create/components/form/cargoFormSchema";
// Removed unused imports - statistics are now in analytics page
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import type { ICargoBody, ICargoResponse } from "../create/types/cargo";
import FilterSelect from "@/components/common/FilterSelect";
import { FaLayerGroup, FaBox } from "react-icons/fa";

type TabType = "all" | "active" | "create" | "template" | "bidding";

const UnifiedCargoManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial tab based on route
  const getInitialTab = (): TabType => {
    if (location.pathname.includes("/cargos/create")) return "create";
    if (location.pathname.includes("/cargos/active")) return "active";
    if (location.pathname.includes("/bidding")) return "bidding";
    return "all";
  };
  
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<CargoFormSchemaType> | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  // Update tab when route changes
  useEffect(() => {
    const tab = getInitialTab();
    setActiveTab(tab);
  }, [location.pathname]);

  // Update route when tab changes (for navigation)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Extract base path (either /dashboard or /cargo-owner)
    const pathParts = location.pathname.split("/").filter(Boolean);
    const basePath = pathParts[0] ? `/${pathParts[0]}` : "/dashboard";
    
    if (tab === "create") {
      navigate(`${basePath}/cargos/create`, { replace: true });
    } else if (tab === "template") {
      // Open template selection modal immediately
      setShowTemplateModal(true);
      // Don't navigate, keep on current route
    } else if (tab === "active") {
      navigate(`${basePath}/cargos/active`, { replace: true });
    } else if (tab === "bidding") {
      navigate(`${basePath}/bidding`, { replace: true });
    } else {
      navigate(`${basePath}/cargos/list`, { replace: true });
    }
  };
  
  const handleTemplateSelected = (template: Partial<CargoFormSchemaType>) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    setActiveTab("create");
    // Navigate to create tab with template data
    const pathParts = location.pathname.split("/").filter(Boolean);
    const basePath = pathParts[0] ? `/${pathParts[0]}` : "/dashboard";
    navigate(`${basePath}/cargos/create`, { replace: true });
  };
  
  // Auto-open template modal when template tab becomes active
  useEffect(() => {
    if (activeTab === "template" && !showTemplateModal) {
      setShowTemplateModal(true);
    }
  }, [activeTab, showTemplateModal]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState("");
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadConfirmationOpen, setIsLoadConfirmationOpen] = useState(false);
  const [selectedCargoForConfirmation, setSelectedCargoForConfirmation] =
    useState<any>(null);

  const {
    data: loadsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loads", searchTerm, statusFilter, cargoTypeFilter],
    queryFn: async () => {
      try {
        const response = await loadsAPI.getLoadsWithEnrichedLocations();
        return response;
      } catch (error) {
        try {
          const fallbackResponse = await loadsAPI.getAll({
            search: searchTerm,
            status: statusFilter || undefined,
            cargoType: cargoTypeFilter || undefined,
          });
          return fallbackResponse;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Extract loads array from response
  const loadsData = useMemo(() => {
    if (loadsResponse?.data?.cargos) {
      return loadsResponse.data.cargos;
    }
    if (loadsResponse?.data?.items) {
      return loadsResponse.data.items;
    }
    if (Array.isArray(loadsResponse?.data)) {
      return loadsResponse.data;
    }
    if (Array.isArray(loadsResponse)) {
      return loadsResponse;
    }
    return [];
  }, [loadsResponse]);

  // Filter for active shipments
  const activeLoads = useMemo(() => {
    return loadsData.filter(
      (load: any) =>
        load.status === "IN_TRANSIT" ||
        load.status === "ASSIGNED" ||
        load.status === "PUBLISHED"
    );
  }, [loadsData]);

  // Filter loads based on search and filters
  const filteredLoads = useMemo(() => {
    let filtered = activeTab === "active" ? activeLoads : loadsData;

    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (load: any) => {
          // Primary search by cargo name/title (most important)
          const titleMatch = load.title?.toLowerCase().includes(searchLower);
          // Also search by description, reference/ID, and cargo type as fallback
          const descriptionMatch = load.description?.toLowerCase().includes(searchLower);
          const referenceMatch = load.reference?.toLowerCase().includes(searchLower) ||
                                 load.id?.toLowerCase().includes(searchLower);
          const cargoTypeMatch = load.cargoType?.toLowerCase().includes(searchLower);
          
          // Prioritize title match - if title matches, return true immediately
          if (titleMatch) return true;
          // Otherwise check other fields
          return descriptionMatch || referenceMatch || cargoTypeMatch;
        }
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((load: any) => load.status === statusFilter);
    }

    if (cargoTypeFilter) {
      filtered = filtered.filter(
        (load: any) => load.cargoType === cargoTypeFilter
      );
    }

    return filtered;
  }, [loadsData, activeLoads, activeTab, searchTerm, statusFilter, cargoTypeFilter]);

  // Statistics - only calculate what's needed for tab badges
  // Full statistics are available in the analytics page
  const stats = useMemo(() => {
    return {
      total: loadsData.length,
    };
  }, [loadsData]);

  const handleViewClick = (load: any) => {
    setSelectedLoad(load);
    setIsModalOpen(true);
  };

  const handleConfirmLoading = (load: any) => {
    setSelectedCargoForConfirmation(load);
    setIsLoadConfirmationOpen(true);
  };

  const handleDeleteCargo = async (load: any) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${load.title || "this cargo"}"?`
      )
    ) {
      return;
    }

    try {
      await loadsAPI.delete(load.id);
      toast.success("Cargo deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete cargo");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoad(null);
  };

  const handleCloseLoadConfirmation = () => {
    setIsLoadConfirmationOpen(false);
    setSelectedCargoForConfirmation(null);
  };

  const handleCargoSubmit = async (data: ICargoBody): Promise<ICargoResponse> => {
    try {
      const response = await loadsAPI.create(data);
      setActiveTab("all");
      refetch();
      toast.success("Cargo created successfully!");
      return response;
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.join(", ")
          : undefined);
      const message = backendMessage || error?.message || "Failed to create cargo";
      toast.error(message);
      throw new Error(message);
    }
  };

  const handleSaveDraft = async (formData: any) => {
    try {
      await loadsAPI.saveDraft({
        ...formData,
        status: "DRAFT",
      });
      toast.success("Draft saved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save draft");
    }
  };

  const tabs = [
    {
      id: "all" as TabType,
      label: "All Cargo",
      icon: List,
      count: stats.total,
    },
    {
      id: "active" as TabType,
      label: "Active",
      icon: Activity,
      count: activeLoads.length,
    },
    {
      id: "create" as TabType,
      label: "Create Cargo",
      icon: Plus,
    },
    {
      id: "template" as TabType,
      label: "Create from Template",
      icon: FileText,
    },
    {
      id: "bidding" as TabType,
      label: "Bidding",
      icon: Gavel,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Cargo Management</h1>
          <p className="text-gray-600 mt-1">
            Manage shipments, create new cargo, and track bidding
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative bg-white rounded-lg border-2 p-5 transition-all duration-200 hover:shadow-lg group",
                  isActive
                    ? "border-blue-600 shadow-md bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-full",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 group-hover:bg-blue-600 group-hover:text-white"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
                <h3
                  className={cn(
                    "text-base font-semibold text-left",
                    isActive ? "text-blue-900" : "text-gray-900"
                  )}
                >
                  {tab.label}
                </h3>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-b-lg" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">

          {/* Tab Content */}
          <div className="p-6 pt-6">
            {/* Filters - Only show for list views */}
            {(activeTab === "all" || activeTab === "active") && (
              <div className="mb-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search cargo by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-transparent bg-white px-4 py-3 pl-11 text-sm text-gray-700 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      aria-label="Search cargo by name"
                    />
                  </div>
                  <FilterSelect
                    label="Status"
                    icon={<FaLayerGroup className="text-purple-500" />}
                    value={statusFilter}
                    placeholder="All Status"
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "PUBLISHED", label: "Published" },
                      { value: "ASSIGNED", label: "Assigned" },
                      { value: "IN_TRANSIT", label: "In Transit" },
                      { value: "DELIVERED", label: "Delivered" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    onChange={setStatusFilter}
                    className="sm:min-w-[180px]"
                  />
                  <FilterSelect
                    label="Cargo Type"
                    icon={<FaBox className="text-blue-500" />}
                    value={cargoTypeFilter}
                    placeholder="All Types"
                    options={[
                      { value: "GENERAL", label: "General" },
                      { value: "FRAGILE", label: "Fragile" },
                      { value: "HAZARDOUS", label: "Hazardous" },
                      { value: "REFRIGERATED", label: "Refrigerated" },
                      { value: "LIQUID", label: "Liquid" },
                      { value: "OVERSIZED", label: "Oversized" },
                      { value: "VALUABLE", label: "Valuable" },
                    ]}
                    onChange={setCargoTypeFilter}
                    className="sm:min-w-[180px]"
                  />
                </div>
              </div>
            )}

            {/* All Cargo / Active Tab */}
            {(activeTab === "all" || activeTab === "active") && (
              <div>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">
                      {error?.message || "Error loading cargo"}
                    </p>
                  </div>
                ) : filteredLoads.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No cargo found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {activeTab === "active"
                        ? "No active shipments at the moment."
                        : "Create your first cargo shipment to get started."}
                    </p>
                    {activeTab === "all" && (
                      <button
                        onClick={() => setActiveTab("create")}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Cargo
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLoads.map((load: any) => (
                      <LoadItem
                        key={load.id}
                        load={load}
                        handleViewClick={handleViewClick}
                        handleConfirmLoading={handleConfirmLoading}
                        handleDeleteCargo={handleDeleteCargo}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Tab */}
            {activeTab === "create" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Create Cargo
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedTemplate
                      ? "Edit the template details below to create your cargo shipment"
                      : "Fill in the form below to create a new cargo shipment"}
                  </p>
                </div>
                <EnhancedCargoForm
                  isOpen={true}
                  onClose={() => {
                    setActiveTab("all");
                    setSelectedTemplate(null);
                  }}
                  onSubmit={handleCargoSubmit}
                  mode="create"
                  initialData={selectedTemplate}
                  showTruckSelection={false}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            )}
            
            {/* Template Tab - Shows template selection modal */}
            {activeTab === "template" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Create from Template
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select a template to quickly create cargo with pre-filled information
                  </p>
                </div>
                <TemplateSelectionModal
                  isOpen={showTemplateModal}
                  onClose={() => {
                    setShowTemplateModal(false);
                    setActiveTab("all");
                  }}
                  onTemplateSelected={handleTemplateSelected}
                />
              </div>
            )}

            {/* Bidding Tab */}
            {activeTab === "bidding" && (
              <div>
                {user ? (
                  <BiddingDashboard
                    userRole={(user.role as "CARGO_OWNER" | "TRUCK_OWNER") || "CARGO_OWNER"}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      Please log in to access the bidding system.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && selectedLoad && (
        <CargoDetailsModal
          cargoId={selectedLoad.id}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {isLoadConfirmationOpen && selectedCargoForConfirmation && (
        <CargoLoadConfirmation
          cargo={selectedCargoForConfirmation}
          isOpen={isLoadConfirmationOpen}
          onClose={handleCloseLoadConfirmation}
          onConfirm={() => {
            handleCloseLoadConfirmation();
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default UnifiedCargoManagement;

