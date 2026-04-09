import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { TranslatedText } from "@/components/translated-text";
import { motion } from "framer-motion";
import { HeroMapMockup } from "./hero-map-mockup";


export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-slate-100 transform skew-x-[-12deg] translate-x-1/4" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <TranslatedText text="AI-Driven Cargo Matching & Financing" />
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              <span className="block text-slate-900">
                <TranslatedText text="Match Cargo." />
              </span>
              <span className="block text-primary-600">
                <TranslatedText text="Secure Financing." />
              </span>
              <span className="block text-slate-900">
                <TranslatedText text="Move Faster." />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
              <TranslatedText text="UrutiX uses AI to instantly match cargo with trusted transporters and provides embedded financing to keep your supply chain moving. Pay drivers on time, every time." />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button
                asChild
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 h-12 text-base rounded-full transition-all hover:scale-105"
              >
                <Link to="/auth">
                  <TranslatedText text="Start Free Trial" />
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary-700 h-12 text-base px-8 rounded-full"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                <TranslatedText text="Watch Demo" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-500 font-medium">
              {['14-day free trial', 'No credit card required', '24/7 Support'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <TranslatedText text={item} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Visual Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center lg:justify-end"
          >
            {/* Main Dashboard Card */}
            <div className="relative w-full max-w-[600px] aspect-[4/3] rounded-2xl bg-white border border-slate-200 overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 group">
              <div className="absolute inset-0 bg-slate-50" />

              {/* Mockup Header */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-white border-b border-slate-100 flex items-center px-4 justify-between z-20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
                <div className="h-2 w-32 bg-slate-100 rounded-full" />
                <div className="w-6 h-6 rounded-full bg-primary-100" />
              </div>

              {/* Mockup Sidebar + Body */}
              <div className="absolute top-12 left-0 bottom-0 w-48 bg-slate-50 border-r border-slate-100 p-4 hidden sm:block z-10">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                      <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0" />
                      <div className="space-y-1 w-full">
                        <div className="h-1.5 w-16 bg-slate-200 rounded" />
                        <div className="h-1.5 w-10 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute top-12 left-0 sm:left-48 right-0 bottom-0 bg-slate-50/50 p-4 overflow-hidden">
                <div className="h-full flex flex-col gap-4">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-100">
                        <div className="h-1.5 w-8 bg-slate-200 rounded mb-2" />
                        <div className="h-3 w-12 bg-slate-900 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Main Map Area */}
                  <div className="flex-1 bg-white rounded-xl border border-slate-100 overflow-hidden p-1 relative">
                    <HeroMapMockup />
                  </div>
                </div>
              </div>

              {/* Glass Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none z-30" />
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 lg:-left-12 bg-white p-4 rounded-2xl border border-slate-200 max-w-[220px] z-40 hidden sm:block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute" />
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Credit Limit</div>
                  <div className="text-sm font-bold text-slate-900">Approved: $50,000</div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
