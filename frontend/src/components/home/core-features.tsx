import { Truck, Wallet, Zap, ArrowRight } from "lucide-react";
import { TranslatedText } from "@/components/translated-text";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Zap,
    title: "1. Smart Matching",
    headline: "AI-Powered Connections",
    description: "Our proprietary algorithm analyzes thousands of data points—route, capacity, vehicle type, and reputation—to instantly find the perfect transporter for your specific cargo.",
    color: "bg-indigo-600",
    lightColor: "bg-indigo-50",
    textColor: "text-indigo-600",
  },
  {
    icon: Wallet,
    title: "2. Secure Financing",
    headline: "Instant Working Capital",
    description: "Forget 60-day payment terms. We pay transporters immediately upon verified loading, while offering flexible credit lines to approved cargo owners. Liquidity for everyone.",
    color: "bg-emerald-600",
    lightColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    icon: Truck,
    title: "3. Verified Movement",
    headline: "End-to-End Visibility",
    description: "Track your shipment in real-time with satellite-backed GPS. Receive automated status updates, digital proof-of-delivery, and instant invoicing upon completion.",
    color: "bg-blue-600",
    lightColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
];

export function CoreFeatures() {
  return (
    <section className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-base font-semibold leading-7 text-primary-600 uppercase tracking-wide">
            <TranslatedText text="The UrutiX Advantage" />
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-900 sm:text-4xl">
            <TranslatedText text="A Seamless Logistics Engine" />
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            <TranslatedText text="We don't just connect parties; we power the entire transaction. From the first match to the final payment, our platform ensures speed, trust, and reliability." />
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative bg-white rounded-2xl p-8 border border-slate-100 group hover:-translate-y-1 transition-transform duration-300"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-6 left-8 bg-white p-2 rounded-xl border border-slate-100">
                  <div className={`w-12 h-12 rounded-lg ${step.color} flex items-center justify-center text-white`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${step.textColor} mb-2`}>
                    <TranslatedText text={step.title} />
                  </h3>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-900 mb-4">
                    <TranslatedText text={step.headline} />
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    <TranslatedText text={step.description} />
                  </p>
                </div>

                {/* Mobile Connector (Arrow Down) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-8 text-slate-300">
                    <ArrowRight className="w-6 h-6 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

