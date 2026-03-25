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
    border: "border-slate-100 hover:border-blue-400/30",
    iconBg: "bg-blue-50",
    iconColor: "text-[#345E85]",
    buttonBg: "bg-[#345E85] hover:bg-slate-800",
    shadow: "hover:shadow-blue-900/10",
  },
  green: {
    border: "border-slate-100 hover:border-emerald-400/30",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700",
    shadow: "hover:shadow-emerald-900/10",
  },
  purple: {
    border: "border-slate-100 hover:border-purple-400/30",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    buttonBg: "bg-purple-600 hover:bg-purple-700",
    shadow: "hover:shadow-purple-900/10",
  },
  orange: {
    border: "border-slate-100 hover:border-orange-400/30",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    buttonBg: "bg-orange-600 hover:bg-orange-700",
    shadow: "hover:shadow-orange-900/10",
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
        "group bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        config.border,
        config.shadow
      )}
    >
      <div className="flex items-center gap-5 mb-6">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", config.iconBg)}>
          <Icon className={config.iconColor} size={28} />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#0f172a] tracking-tight">{title}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={cn(
          "w-full px-6 py-3 text-white rounded-2xl transition-all font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-900/10",
          config.buttonBg
        )}
      >
        {buttonText}
      </button>
    </div>
  );
}
