import { cn } from "@/utils/cn";
import type { IconType } from "react-icons";

interface ActionCardProps {
  icon: IconType;
  title: string;
  description: string;
  buttonText: string;
  color: "blue" | "green" | "purple" | "orange";
  onClick: () => void;
}

const colorConfig = {
  blue: {
    border: "border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonBg: "bg-blue-600 hover:bg-blue-700",
  },
  green: {
    border: "border-green-200 hover:border-green-400",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    buttonBg: "bg-green-600 hover:bg-green-700",
  },
  purple: {
    border: "border-purple-200 hover:border-purple-400",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    buttonBg: "bg-purple-600 hover:bg-purple-700",
  },
  orange: {
    border: "border-orange-200 hover:border-orange-400",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    buttonBg: "bg-orange-600 hover:bg-orange-700",
  },
};

export default function ActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  color,
  onClick,
}: ActionCardProps) {
  const config = colorConfig[color];

  return (
    <div
      className={cn(
        `bg-white rounded-lg shadow-lg p-6 border-2 ${config.border} transition-colors`
      )}
    >
      <div className="flex items-center mb-4">
        <div className={`${config.iconBg} rounded-full p-3 mr-4`}>
          <Icon className={config.iconColor} size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full px-4 py-2 ${config.buttonBg} text-white rounded-lg transition-colors`}
      >
        {buttonText}
      </button>
    </div>
  );
}
