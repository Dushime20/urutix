import { Bookmark, Share2, Download, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { getStatusColor, getStatusDisplayName } from "../../utils";
import type { Cargo } from "@/types/cargo";

interface CargoDetailsHeaderProps {
  cargo: Cargo | null;
  cargoId: string | null;
  isBookmarked: boolean;
  notificationEnabled: boolean;
  onBookmarkToggle: () => void;
  onShare: () => void;
  onExport: () => void;
  onNotificationToggle: () => void;
}

const CargoDetailsHeader = ({
  cargo,
  cargoId,
  isBookmarked,
  notificationEnabled,
  onBookmarkToggle,
  onShare,
  onExport,
  onNotificationToggle,
}: CargoDetailsHeaderProps) => {
  return (
    <div className="flex items-center justify-between max-md:flex-col gap-2 pb-6 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {cargo?.cargoType?.charAt(0).toUpperCase() || "C"}
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {cargo?.title || "Cargo Details"}
          </h2>
          <div className="flex items-center gap-y-1 gap-x-2 mt-1 max-sm:flex-col max-sm:items-start">
            <span className="text-sm text-gray-500 font-mono">
              ID: {cargoId}
            </span>
            {cargo && (
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold shadow-sm border",
                  getStatusColor(cargo.status)
                )}
              >
                {getStatusDisplayName(cargo.status)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmarkToggle}
          className={cn(
            "h-10 w-10 p-0 rounded-lg transition-all duration-200",
            isBookmarked 
              ? "text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          )}
        >
          <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="h-10 w-10 p-0 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="h-10 w-10 p-0 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <Download className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNotificationToggle}
          className={cn(
            "h-10 w-10 p-0 rounded-lg transition-all duration-200",
            notificationEnabled 
              ? "text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          )}
        >
          <Bell className={cn("w-5 h-5", notificationEnabled && "fill-current")} />
        </Button>
      </div>
    </div>
  );
};

export default CargoDetailsHeader;

