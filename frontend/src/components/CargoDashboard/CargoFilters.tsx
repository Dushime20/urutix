import React from "react";
import { Search, Filter, Layers, Box } from "lucide-react";
import FilterSelect, {
  type FilterSelectOption,
} from "@/components/common/FilterSelect";
import { TranslatedText } from "../translated-text";

// Status options - labels will be translated in FilterSelect component
const statusOptions: FilterSelectOption[] = [
  { value: "", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "CREATED", label: "Created" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

// Cargo type options - labels will be translated in FilterSelect component
const cargoTypeOptions: FilterSelectOption[] = [
  { value: "", label: "All Types" },
  { value: "GENERAL", label: "General" },
  { value: "FRAGILE", label: "Fragile" },
  { value: "HAZARDOUS", label: "Hazardous" },
  { value: "REFRIGERATED", label: "Refrigerated" },
  { value: "LIQUID", label: "Liquid" },
  { value: "OVERSIZED", label: "Oversized" },
  { value: "VALUABLE", label: "Valuable" },
];

interface CargoFiltersProps {
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  search?: string;
  setSearch?: (value: string) => void;
}

export const CargoFilters: React.FC<CargoFiltersProps> = ({
  filters,
  setFilters,
  search,
  setSearch,
}) => {
  const handleStatusChange = (value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      status: value || undefined,
    }));
  };

  const handleCargoTypeChange = (value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      cargoType: value || undefined,
    }));
  };

  return (
    <form
      className="mb-4 sm:mb-6"
      role="search"
      aria-label="Cargo search and filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-r from-gray-100/50 via-white to-gray-100/50 p-3 sm:p-4 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Only show search if props are provided */}
          {search !== undefined && setSearch && (
            <div className="relative w-full sm:min-w-[220px] sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="search"
                className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-white/80 py-2.5 sm:py-2.5 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm text-slate-700 shadow-inner transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 touch-manipulation min-h-[44px] sm:min-h-0"
                placeholder="Search by ID, name, or description..."
                value={search}
                onChange={(e) => setSearch?.(e.target.value)}
                aria-label="Search cargo"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial">
              <FilterSelect
                label={<TranslatedText text="Status" />}
                value={filters.status || ""}
                options={statusOptions}
                onChange={handleStatusChange}
                icon={<Layers className="text-purple-500 w-4 h-4" />}
              />
            </div>
            <div className="flex-1 sm:flex-initial">
              <FilterSelect
                label={<TranslatedText text="Cargo Type" />}
                value={filters.cargoType || ""}
                options={cargoTypeOptions}
                onChange={handleCargoTypeChange}
                icon={<Box className="text-blue-500 w-4 h-4" />}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFilters({});
              setSearch?.("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-transparent bg-navy-700 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-navy-700/10 transition hover:scale-[1.01] hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2 touch-manipulation min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            aria-label="Clear filters"
          >
            <Filter className="w-3 h-3" />
            <TranslatedText text="Clear filters" />
          </button>
        </div>
      </div>
    </form>
  );
};
