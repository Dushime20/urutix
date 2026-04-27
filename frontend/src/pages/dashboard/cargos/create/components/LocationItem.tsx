import { cn } from "@/utils/cn";
import React from "react";
import { FaMapPin, FaCheck, FaPlus } from "react-icons/fa";

interface Location {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationItemProps {
  type: "pickup" | "delivery";
  location: Location | null;
  isActive: boolean;
  onSelect: () => void;
  className?: string;
  showCard?: boolean;
  disabled?: boolean;
}

const LocationItem: React.FC<LocationItemProps> = ({
  type,
  location,
  isActive,
  onSelect,
  className = "",
  showCard = true,
  disabled = false,
}) => {
  const getColorScheme = () => {
    if (type === "pickup") {
      return {
        primary: "blue",
        active:
          "border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-blue-100 dark:shadow-blue-900/20",
        inactive:
          "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-25 dark:hover:bg-blue-900/20",
        focus: "focus:ring-blue-400 dark:focus:ring-blue-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
        card: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm",
        title: "text-blue-900 dark:text-blue-300",
        content: "text-blue-700 dark:text-blue-400",
        placeholder: "text-blue-500 dark:text-blue-400",
        icon: "text-blue-600 dark:text-blue-400",
        success: "text-blue-600 dark:text-blue-400",
      };
    } else {
      return {
        primary: "green",
        active:
          "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-green-100 dark:shadow-green-900/20",
        inactive:
          "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-25 dark:hover:bg-green-900/20",
        focus: "focus:ring-green-400 dark:focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
        card: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 shadow-sm",
        title: "text-green-900 dark:text-green-300",
        content: "text-green-700 dark:text-green-400",
        placeholder: "text-green-500 dark:text-green-400",
        icon: "text-green-600 dark:text-green-400",
        success: "text-green-600 dark:text-green-400",
      };
    }
  };

  const colors = getColorScheme();

  const getButtonStyles = () => {
    const baseStyles = cn(
      "relative w-full p-6 rounded-xl border-2 transition-all duration-300 font-medium",
      "flex flex-col items-center justify-center gap-4",
      "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
      "transform hover:scale-[1.02] active:scale-[0.98]",
      "group cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none"
    );

    if (isActive) {
      return cn(
        baseStyles,
        colors.active,
        "shadow-lg ring-2 ring-offset-2",
        `ring-${colors.primary}-200`
      );
    } else {
      return cn(baseStyles, colors.inactive, colors.focus);
    }
  };

  const getIconStyles = () => {
    const baseStyles = "transition-all duration-300";
    if (isActive) {
      return cn(baseStyles, colors.success, "scale-110");
    } else {
      return cn(baseStyles, colors.icon, "group-hover:scale-110");
    }
  };

  const getStatusIcon = () => {
    if (location) {
      return <FaCheck className={cn("w-4 h-4", colors.success)} />;
    } else {
      return <FaPlus className={cn("w-4 h-4", colors.icon)} />;
    }
  };

  const getButtonText = () => {
    if (type === "pickup") {
      return location ? "Change Pickup" : "Select Pickup Location";
    }
    return location ? "Change Delivery" : "Select Delivery Location";
  };

  const getTitle = () => {
    return type === "pickup" ? "Pickup Location" : "Delivery Location";
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(getButtonStyles(), className)}
      aria-label={getButtonText()}
      disabled={disabled}
    >
      {/* Header with Icon and Status */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-full",
              isActive ? "bg-white/50 dark:bg-slate-700/50" : "bg-gray-50 dark:bg-slate-700"
            )}
          >
            <FaMapPin className={getIconStyles()} />
          </div>
          <div className="text-left">
            <div className={cn("font-semibold text-lg", colors.title)}>
              {getTitle()}
            </div>
            <div className={cn("text-sm", colors.content)}>
              {getButtonText()}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "p-2 rounded-full transition-all duration-300",
            isActive ? "bg-white/50 dark:bg-slate-700/50" : "bg-gray-50 dark:bg-slate-700 group-hover:bg-white/50 dark:group-hover:bg-slate-700/50"
          )}
        >
          {getStatusIcon()}
        </div>
      </div>

      {/* Location Content */}
      {showCard && location && (
        <div className={cn("text-xs space-y-2 w-full", colors.content)}>
          <div className="flex justify-between">
            <span className="font-medium">Name:</span>
            <span>{location.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Coordinates:</span>
            <span className="font-mono text-xs">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Active State Indicator */}
      {isActive && (
        <div
          className={cn(
            "absolute top-2 right-2 w-3 h-3 rounded-full animate-pulse",
            `bg-${colors.primary}-500`
          )}
        />
      )}
    </button>
  );
};

export default LocationItem;
