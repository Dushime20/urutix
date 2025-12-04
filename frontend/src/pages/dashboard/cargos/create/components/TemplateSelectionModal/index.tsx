import type { CargoFormSchemaType } from "@/pages/dashboard/cargos/create/components/form/cargoFormSchema";
import React, { useState } from "react";

// Import components
import ModalHeader from "./ModalHeader";
import SearchAndFilter from "./SearchAndFilter";
import TemplateCard from "./TemplateCard";
import TemplateBenefits from "./TemplateBenefits";
import EmptyState from "./EmptyState";

// Import data
import { cargoTemplates, categories } from "./data/cargoTemplates";
import { Dialog, DialogContent } from "@/components/ui";

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected: (template: Partial<CargoFormSchemaType>) => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelected,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = cargoTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: Partial<CargoFormSchemaType>) => {
    onTemplateSelected(template);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl max-h-[90vh] overflow-hidden p-0 flex flex-col gap-0">
        {/* Header */}
        <ModalHeader onClose={onClose} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search and Filter */}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />

          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
            />
          )}

          {/* Benefits Section */}
          {filteredTemplates.length > 0 && <TemplateBenefits />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionModal;
