import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Package,
  Gavel,
  MapPinned,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Radio,
  Wallet,
  Truck,
  ClipboardCheck,
  Scale,
} from "lucide-react"
import { PublicHeroBackdrop } from "@/components/home/PublicHeroBackdrop"
import { PublicNavbar } from "@/components/home/PublicNavbar"
import { PublicFooter } from "@/components/home/PublicFooter"
import { TranslatedText } from "@/components/translated-text"

const LIFECYCLE_STEPS = [
  {
    step: "01",
    id: "post",
    title: "Post the load & set requirements",
    subtitle: "Structured cargo intake",
    desc: "Cargo owners or brokers publish origin, destination, cargo dimensions, weight, equipment requirements, pickup windows, and target pricing—or launch directly from saved lane templates.",
    icon: Package,
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&q=80",
    inputs: [
      "Origin & destination coordinates with multi-stop routing support",
      "Cargo category, tonnage, volume, and special handling instructions",
      "Required truck type, insurance coverage, and customs documentation",
      "Choice of allocation mode: Instant Smart Match or Competitive Auction",
    ],
    outcomes: [
      "Verified load listing broadcasted to matching fleets",
      "Automated route distance and corridor checkpoint mapping",
      "Pre-configured receiver notification and inspection templates",
    ],
  },
  {
    step: "02",
    id: "match",
    title: "Smart match or run an auction",
    subtitle: "Capacity discovery & contracting",
    desc: "UrutiX scores available trucks by route proximity, backhaul fit, safety rating, and capacity—or opens a live bidding window where vetted fleet owners submit competitive offers.",
    icon: Gavel,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
    inputs: [
      "AI-ranked carrier recommendations based on lane history and tier score",
      "Forward or reverse auction bids with transparent trip economics",
      "Automated verification of carrier insurance, compliance, and marketplace credits",
      "Digital contract negotiation and escrow milestone agreement",
    ],
    outcomes: [
      "Binding digital freight contract signed by shipper and carrier",
      "Escrow funds or working-capital financing locked for the trip",
      "Assigned truck and professional driver dispatched with mission brief",
    ],
  },
  {
    step: "03",
    id: "move",
    title: "Assign, inspect & move with live telemetry",
    subtitle: "Active trip execution",
    desc: "Before departure, the driver completes a digital vehicle checklist and cargo loading inspection. Once rolling, GPS telemetry, geofence triggers, and customs checkpoints keep every stakeholder informed.",
    icon: MapPinned,
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80",
    inputs: [
      "Driver pre-trip safety checklist and photo-verified loading inspection",
      "Real-time GPS tracking with predictive ETA and route deviation alerts",
      "Automated geofence arrival/departure logs at warehouses and borders",
      "Corridor truck parking reservations and customs clearance tracking",
    ],
    outcomes: [
      "Zero blind spots from warehouse gate to border crossing to receiver dock",
      "Timestamped audit trail of every checkpoint and inspection event",
      "Proactive exception handling if delays or route changes occur",
    ],
  },
  {
    step: "04",
    id: "settle",
    title: "Confirm delivery, settle & unlock finance",
    subtitle: "Digital POD & financial closure",
    desc: "At the destination, the receiver and driver complete a digital proof of delivery (e-POD) and post-trip inspection. Escrow releases automatically, invoices reconcile, and performance ratings update.",
    icon: FileCheck2,
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&q=80",
    inputs: [
      "Receiver digital signature, cargo condition verification, and e-POD upload",
      "Automated invoice generation and escrow milestone release",
      "Settlement of carrier payout, broker commission, and lender repayment",
      "Two-way reputation scoring for shipper, fleet, and driver",
    ],
    outcomes: [
      "Instant, dispute-free financial settlement backed by verified delivery records",
      "Stronger credit profile unlocking higher lending limits on future trips",
      "Complete operational analytics for cost-per-ton-km and lane optimization",
    ],
  },
] as const

const SAFEGUARDS = [
  {
    icon: ClipboardCheck,
    title: "Pre- & Post-Trip Inspections",
    desc: "Drivers and receivers log structured checklists and photos before departure and upon arrival so cargo condition is never in doubt.",
  },
  {
    icon: Radio,
    title: "Geofences & Customs Checkpoints",
    desc: "Automated zone triggers and customs officer inspection workflows keep cross-border corridors moving with full compliance.",
  },
  {
    icon: Wallet,
    title: "Milestone Escrow Protection",
    desc: "Shipper funds are held securely and released automatically as verified loading, transit, and e-POD milestones are completed.",
  },
  {
    icon: Scale,
    title: "Structured Dispute Resolution",
    desc: "If an exception occurs, our built-in Dispute Resolution Center uses GPS logs, inspection photos, and contracts to resolve claims fairly.",
  },
] as const

export default function HowItWorksPage() {
  const location = useLocation()
  const [activeStep, setActiveStep] = useState(0)
  const current = LIFECYCLE_STEPS[activeStep]
  const StepIcon = current.icon

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [location.pathname])

  return (
    <div className="min-h-screen font-sans antialiased bg-white text-primary-900">
      <PublicNavbar alwaysSolid />

      {/* Hero Section */}
      <section className="relative isolate bg-[#0e1c2a] text-white py-16 lg:py-24 overflow-hidden">
        <PublicHeroBackdrop image="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <TranslatedText text="How UrutiX Works" />
            </p>
            <h1 className="font-manrope text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 drop-shadow-sm">
              <TranslatedText text="From load post to settlement—one connected digital journey" />
            </h1>
            <p className="max-w-2xl text-slate-100 text-base sm:text-lg leading-relaxed mb-8">
              <TranslatedText text="Every shipment on UrutiX follows a transparent, verifiable four-stage lifecycle that connects procurement, fleet dispatch, live GPS tracking, customs compliance, and financial settlement." />
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Start your first shipment" />
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/parking-reservation"
                className="inline-flex items-center gap-2 border border-white/30 hover:bg-[#0e1c2a]/55 backdrop-blur-sm text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <Truck className="w-4 h-4" />
                <TranslatedText text="Reserve Corridor Parking" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Step Explorer */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
              <TranslatedText text="Interactive Lifecycle" />
            </p>
            <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-3">
              <TranslatedText text="Explore each stage of a UrutiX trip" />
            </h2>
            <p className="text-primary-600/80 text-base leading-relaxed">
              <TranslatedText text="Select a step below to inspect the exact inputs, operational controls, and outcomes." />
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-4 space-y-3">
              {LIFECYCLE_STEPS.map((item, index) => {
                const selected = index === activeStep
                const Icon = item.icon
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left rounded-[1.5rem] p-5 transition-all ${
                      selected
                        ? "bg-primary-500 text-white shadow-md"
                        : "bg-primary-50 text-primary-900 hover:bg-primary-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-manrope text-xs font-extrabold uppercase tracking-wider ${selected ? "text-white/80" : "text-primary-500"}`}>
                        <TranslatedText text={`Step ${item.step} · ${item.subtitle}`} />
                      </span>
                      <Icon className={`w-4 h-4 ${selected ? "text-white" : "text-primary-500"}`} />
                    </div>
                    <p className={`font-manrope text-base font-bold ${selected ? "text-white" : "text-primary-900"}`}>
                      <TranslatedText text={item.title} />
                    </p>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="lg:col-span-8 rounded-[2rem] overflow-hidden bg-[#F4F7FA] border border-slate-100"
              >
                <div className="aspect-[21/8] bg-cover bg-center relative" style={{ backgroundImage: `url('${current.image}')` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-950/30 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between text-white">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-500 text-[11px] font-bold uppercase tracking-wider mb-2">
                        <TranslatedText text={`Stage ${current.step}`} />
                      </span>
                      <h3 className="font-manrope text-2xl sm:text-3xl font-extrabold text-white">
                        <TranslatedText text={current.title} />
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                      <StepIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 lg:p-10">
                  <p className="text-primary-800 text-base leading-relaxed mb-8">
                    <TranslatedText text={current.desc} />
                  </p>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h4 className="font-manrope text-xs font-extrabold uppercase tracking-wider text-primary-500 mb-4">
                        <TranslatedText text="What happens in this step" />
                      </h4>
                      <ul className="space-y-3">
                        {current.inputs.map((inp) => (
                          <li key={inp} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-primary-800 leading-relaxed">
                              <TranslatedText text={inp} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-primary-900 text-white rounded-2xl p-6 shadow-sm">
                      <h4 className="font-manrope text-xs font-extrabold uppercase tracking-wider text-primary-300 mb-4">
                        <TranslatedText text="Verified platform outputs" />
                      </h4>
                      <ul className="space-y-3">
                        {current.outcomes.map((out) => (
                          <li key={out} className="flex items-start gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-primary-100 leading-relaxed">
                              <TranslatedText text={out} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Operational Safeguards */}
      <section className="py-16 lg:py-24 bg-[#F4F7FA]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
              <TranslatedText text="Built-In Trust & Accountability" />
            </p>
            <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-3">
              <TranslatedText text="Operational safeguards at every checkpoint" />
            </h2>
            <p className="text-primary-600/80 text-base leading-relaxed">
              <TranslatedText text="UrutiX replaces informal phone updates with verifiable digital checkpoints." />
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAFEGUARDS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white rounded-[1.75rem] p-6 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-manrope text-lg font-bold text-primary-900 mb-2">
                    <TranslatedText text={item.title} />
                  </h3>
                  <p className="text-sm text-primary-600/80 leading-relaxed">
                    <TranslatedText text={item.desc} />
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="bg-primary-500 rounded-[2rem] px-8 py-12 lg:px-14 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 text-white">
            <div className="max-w-xl">
              <h2 className="font-manrope text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-3">
                <TranslatedText text="Ready to run your freight through UrutiX?" />
              </h2>
              <p className="text-primary-100 text-base leading-relaxed">
                <TranslatedText text="Create your account in minutes, select your role, and start matching loads or trucks immediately." />
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-primary-50 text-primary-700 font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Get started now" />
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/who-its-for"
                className="inline-flex items-center justify-center gap-2 border border-white/50 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Explore Role Workspaces" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

