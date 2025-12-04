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
    <div className="mt-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-100">
      <div className="text-center mb-4">
        <h4 className="text-sm font-semibold text-teal-900 mb-1">
          Why Use Templates?
        </h4>
        <p className="text-teal-700 text-xs">
          Streamline your shipping process with our pre-configured templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div
              key={index}
              className="text-center group hover:transform hover:-translate-y-1 transition-all duration-300"
            >
                                              <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-300 border border-teal-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-white w-4 h-4" />
                  </div>
                  <h5 className="font-medium text-teal-900 mb-1 text-xs">
                    {benefit.title}
                  </h5>
                  <p className="text-xs text-teal-700 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100 rounded-full">
          <span className="text-teal-600 text-xs font-medium">
            💡 Pro Tip: Templates can be customized after selection
          </span>
        </div>
      </div>
    </div>
  );
};

export default TemplateBenefits;
