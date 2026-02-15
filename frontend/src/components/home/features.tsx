import { Truck, Package, MapPin, BarChart3, Shield, Globe } from "lucide-react";
import { TranslatedText } from "@/components/translated-text";
import { motion } from "framer-motion";

const features = [
  {
    icon: Globe,
    title: "AI Cargo Matching",
    description: "Instantly connect with the perfect transporter. Our AI matches loads to trucks based on route, capacity, and reliability.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: BarChart3,
    title: "Embedded Financing",
    description: "Secure immediate working capital to pay transporters upon loading. Keep your reputation high and shipments moving.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Truck,
    title: "Fleet Tracking",
    description: "Real-time GPS tracking for your entire fleet with predictive ETA and route optimization.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Package,
    title: "Digital Documentation",
    description: "End-to-end cargo visibility from warehouse to delivery with automated e-PODs and invoicing.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Compliance & Safety",
    description: "Automated compliance tracking, driver hours monitoring, and safety alerts.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: MapPin,
    title: "Route Optimization",
    description: "AI-powered routing that reduces fuel costs and delivery times by up to 30%.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-slate-200/30 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase mb-2">
            <TranslatedText text="Powerful Capabilities" />
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            <TranslatedText text="Everything you need to manage" />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
              <TranslatedText text="global logistics" />
            </span>
          </h3>
          <p className="text-slate-600 text-lg">
            <TranslatedText text="Our platform combines advanced tracking, financial management, and operational tools into one seamless experience." />
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-primary-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className={`h-14 w-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-7 w-7 ${feature.color}`} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                <TranslatedText text={feature.title} />
              </h3>

              <p className="text-slate-500 leading-relaxed">
                <TranslatedText text={feature.description} />
              </p>

              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary-500 to-indigo-500 group-hover:w-full transition-all duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
