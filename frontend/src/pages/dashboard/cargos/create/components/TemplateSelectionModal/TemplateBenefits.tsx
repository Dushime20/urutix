import React from "react";
import { FaRocket, FaClock, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

const TemplateBenefits: React.FC = () => {
  const benefits = [
    {
      icon: FaRocket,
      title: "Save Time",
      description: "Pre-configured cargo settings for instant setup"
    },
    {
      icon: FaClock,
      title: "Consistency",
      description: "Standardized specifications for similar shipments"
    },
    {
      icon: FaShieldAlt,
      title: "Optimized Matching",
      description: "Better truck matching with appropriate requirements"
    },
    {
      icon: FaCheckCircle,
      title: "Error Reduction",
      description: "Minimize mistakes with proven configurations"
    }
  ];

  return (
    <div className="mt-8 bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
      <div className="text-center mb-8">
        <h4 className="text-lg font-black text-[#0f172a] tracking-tight mb-2">
          Engineered for Efficiency
        </h4>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Why professional logistics teams use templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="text-center group"
            >
              <div className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all border border-slate-100 h-full">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#345E85] transition-colors">
                  <Icon className="text-[#345E85] group-hover:text-white w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <h5 className="text-sm font-black text-[#0f172a] tracking-tight mb-2">
                  {benefit.title}
                </h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
          <span className="text-[#345E85] text-[10px] font-black uppercase tracking-widest">
            💡 Pro Tip: Customization available after profile selection
          </span>
        </div>
      </div>
    </div>
  );
};

export default TemplateBenefits;
