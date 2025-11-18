import React from "react";
import { FaSearch, FaFilter, FaLayerGroup, FaBox } from "react-icons/fa";
import FilterSelect, {
  type FilterSelectOption,
} from "@/components/common/FilterSelect";

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
  search: string;
  setSearch: (value: string) => void;
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
      className="mb-6"
      role="search"
      aria-label="Cargo search and filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/5 via-white to-slate-900/5 p-4 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[220px] flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-inner transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Search cargo by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search cargo by name"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <FilterSelect
              label="Status"
              value={filters.status || ""}
              options={statusOptions}
              onChange={handleStatusChange}
              icon={<FaLayerGroup className="text-purple-500" />}
            />
            <FilterSelect
              label="Cargo Type"
              value={filters.cargoType || ""}
              options={cargoTypeOptions}
              onChange={handleCargoTypeChange}
              icon={<FaBox className="text-blue-500" />}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFilters({});
              setSearch("");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:scale-[1.01] hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
            aria-label="Clear filters"
          >
            <FaFilter className="text-xs" />
            Clear filters
          </button>
        </div>
      </div>
    </form>
  );
};
