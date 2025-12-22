import {
  Package,
  Navigation,
  FileText,
  Clock3,
  Target,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";

interface CargoDetailsTabsProps {
  activeTab: string;
  showAdvancedOptions: boolean;
  autoRefresh: boolean;
  searchQuery: string;
  selectedFilter: string;
  onTabChange: (tab: string) => void;
  onAdvancedOptionsToggle: () => void;
  onAutoRefreshToggle: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onClearFilters: () => void;
}

const CargoDetailsTabs = ({
  activeTab,
  showAdvancedOptions,
  autoRefresh,
  searchQuery,
  selectedFilter,
  onTabChange,
  onAdvancedOptionsToggle,
  onAutoRefreshToggle,
  onSearchChange,
  onFilterChange,
  onClearFilters,
}: CargoDetailsTabsProps) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: Package },
    { id: "tracking", label: "Tracking", icon: Navigation },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "history", label: "History", icon: Clock3 },
    { id: "matching", label: "Matching", icon: Target },
  ];

  return (
    <div className="border-b">
      <div className="grid md:grid-cols-[1fr_auto] gap-2">
        <div className="-mb-px flex-1 sm:overflow-x-auto sm:scrollbar-hide sm:scroll-smooth">
          <nav className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 py-2.5 sm:py-3 md:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 rounded-none whitespace-nowrap flex-1 sm:flex-initial min-w-0 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 bg-primary-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate text-[11px] sm:text-sm">{tab.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onAdvancedOptionsToggle}
            className="h-9 px-3 rounded-lg border-gray-200 hover:border-gray-300 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Options
            {showAdvancedOptions ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onAutoRefreshToggle}
            className={`h-9 px-3 rounded-lg border-gray-200 hover:border-gray-300 transition-colors ${
              autoRefresh
                ? "text-emerald-600 border-emerald-300 bg-emerald-50"
                : ""
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto Refresh
          </Button>
        </div>
      </div>

      {showAdvancedOptions && (
        <div className="px-2 py-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label
                htmlFor="search"
                className="text-sm font-medium text-gray-700 mb-1 block"
              >
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search in cargo details..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>

            <div>
              <Label
                htmlFor="filter"
                className="text-sm font-medium text-gray-700 mb-1 block"
              >
                Filter
              </Label>
              <Select value={selectedFilter} onValueChange={onFilterChange}>
                <SelectTrigger className="h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                  <SelectValue placeholder="Select a filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="urgent">Urgent Only</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-9 px-4 rounded-lg border-gray-200 hover:border-gray-300 transition-colors"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoDetailsTabs;
