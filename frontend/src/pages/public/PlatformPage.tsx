import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Route,
  Gavel,
  Radio,
  Wallet,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Layers,
  MapPin,
  FileCheck2,
} from "lucide-react"
import { PublicNavbar } from "@/components/home/PublicNavbar"
import { PublicFooter } from "@/components/home/PublicFooter"
import { TranslatedText } from "@/components/translated-text"

const PLATFORM_PILLARS = [
  {
    id: "smart-matching",
    icon: Route,
    badge: "Allocation Engine",
    title: "Smart matching & backhaul optimization",
    summary:
      "Connect cargo to capacity using route geometry, equipment specifications, carrier tier scores, and return-leg availability—eliminating manual phone dispatching.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
    capabilities: [
      "Automated matching by truck body type, tonnage, volume, and special cargo requirements",
      "Backhaul matching engine that pairs returning trucks with corridor loads to cut empty miles",
      "Carrier tier rankings based on on-time delivery, safety inspections, and dispute-free history",
      "Interactive load map and spare-capacity listings for immediate spot dispatch",
    ],
  },
  {
    id: "bidding-auctions",
    icon: Gavel,
    badge: "Procurement & Pricing",
    title: "Transparent bidding & freight auctions",
    summary:
      "Run structured forward or reverse auctions with real-time bid comparison, counter-offers, and automated digital contract generation.",
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&q=80",
    capabilities: [
      "Configurable auction windows with reserve prices and instant-book thresholds",
      "Side-by-side carrier bid evaluation showing price, fleet rating, and equipment readiness",
      "Built-in contract negotiation and digital agreement signing before dispatch",
      "Reusable load templates and bulk upload tools for high-volume enterprise shippers",
    ],
  },
  {
    id: "live-visibility",
    icon: Radio,
    badge: "Telemetry & Tracking",
    title: "Live GPS visibility, geofences & e-POD",
    summary:
      "Track every trip from loading dock to destination with real-time GPS updates, custom geofence alerts, customs checkpoint tracking, and digital proof of delivery.",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80",
    capabilities: [
      "Live map tracking with predictive ETA and route deviation notifications",
      "Custom geofence zones for origin warehouses, border crossings, and delivery hubs",
      "Integrated customs officer inspection workflows and clearance status tracking",
      "Photo-backed pre/post-trip inspections and tamper-evident digital e-POD",
    ],
  },
  {
    id: "trusted-operations",
    icon: ShieldCheck,
    badge: "Governance & Compliance",
    title: "Trusted operations, safety & compliance",
    summary:
      "Keep every participant accountable with granular role permissions, verified vehicle and driver records, reputation scoring, and structured dispute resolution.",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&q=80",
    capabilities: [
      "Role-based workspaces for Shippers, Fleets, Drivers, Brokers, Lenders, Customs, and Parking Officers",
      "Compliance dashboard tracking truck insurance, roadworthiness, and driver licenses",
      "Two-way reputation ratings, driver safety leaderboards, and performance rewards",
      "Evidence-backed Dispute Resolution Center with full trip audit logs",
    ],
  },
] as const

export default function PlatformPage() {
  const location = useLocation()

  useEffect(() => {
    const hash = location.hash.replace("#", "")
    if (hash) {
      const el = document.getElementById(hash)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
        return
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [location.pathname, location.hash])

  return (
    <div className="min-h-screen font-sans antialiased bg-white text-primary-900">
      <PublicNavbar alwaysSolid />

      {/* Hero */}
      <section aria-labelledby="platform-hero-title" className="relative isolate bg-[#0e1c2a] text-white py-16 lg:py-24 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80"
          alt=""
          decoding="async"
          loading="eager"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(90deg, rgba(14,28,42,0.98) 0%, rgba(14,28,42,0.9) 42%, rgba(14,28,42,0.58) 65%, rgba(14,28,42,0.18) 100%)" }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#0e1c2a]/60 lg:hidden" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0e1c2a]/60 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <TranslatedText text="UrutiX Platform" />
            </p>
            <h1 id="platform-hero-title" className="font-manrope text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 drop-shadow-sm">
              <TranslatedText text="Everything needed to run modern road freight in one core" />
            </h1>
            <p className="max-w-2xl text-slate-100 text-base sm:text-lg leading-relaxed mb-8">
              <TranslatedText text="Marketplace allocation, fleet management, live GPS visibility, customs checkpoints, corridor parking, and embedded finance—connected natively instead of bolted on." />
            </p>
            <div className="flex flex-wrap gap-2.5">
              {PLATFORM_PILLARS.map((p) => {
                const Icon = p.icon
                return (
                  <a
                    key={p.id}
                    href={`#${p.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0e1c2a]/55 backdrop-blur-sm hover:bg-primary-500 text-white text-xs font-bold uppercase tracking-wider border border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1c2a]"
                  >
                    <Icon className="w-4 h-4" />
                    <TranslatedText text={p.badge} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <div className="divide-y divide-slate-100">
        {PLATFORM_PILLARS.map((pillar, index) => {
          const Icon = pillar.icon
          const isEven = index % 2 === 0
          return (
            <section
              key={pillar.id}
              id={pillar.id}
              className={`py-16 lg:py-24 scroll-mt-36 ${isEven ? "bg-white" : "bg-[#F4F7FA]"}`}
            >
              <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  <div className={`lg:col-span-6 ${!isEven ? "lg:order-2" : ""}`}>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-4">
                      <Icon className="w-4 h-4 text-primary-600" />
                      <TranslatedText text={pillar.badge} />
                    </div>
                    <h2 className="font-manrope text-2xl sm:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-4">
                      <TranslatedText text={pillar.title} />
                    </h2>
                    <p className="text-primary-700/80 text-base leading-relaxed mb-6">
                      <TranslatedText text={pillar.summary} />
                    </p>
                    <ul className="space-y-3.5 mb-8">
                      {pillar.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-primary-800 leading-relaxed">
                            <TranslatedText text={cap} />
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/auth"
                      className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
                    >
                      <TranslatedText text="Explore in workspace" />
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className={`lg:col-span-6 ${!isEven ? "lg:order-1" : ""}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4 }}
                      className="rounded-[2rem] overflow-hidden shadow-md border border-slate-100 bg-white"
                    >
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={pillar.image} alt={pillar.title} className="w-full h-full object-cover" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* Connected Ecosystem Cards: Embedded Finance, White-Label Marketplace, Corridor Parking */}
      <section className="py-16 lg:py-24 bg-primary-950 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-primary-400 text-xs font-bold uppercase tracking-[0.18em] mb-3">
              <TranslatedText text="Connected Modules" />
            </p>
            <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-3">
              <TranslatedText text="Extend the platform across finance, white-label & parking" />
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wallet,
                title: "Embedded Finance",
                desc: "Credits marketplace, working-capital freight loans, and milestone escrow built directly into trip execution.",
                to: "/finance",
                cta: "Explore Finance",
              },
              {
                icon: Building2,
                title: "White-Label Marketplace",
                desc: "Launch your own branded multi-tenant freight network with custom domains, roles, and credit pricing.",
                to: "/marketplace",
                cta: "Explore Marketplace",
              },
              {
                icon: MapPin,
                title: "Corridor Truck Parking",
                desc: "Reserve secure truck parking bays, manage facility fees, and look up booking statuses online.",
                to: "/parking-reservation",
                cta: "Reserve Parking",
              },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="group rounded-[1.75rem] bg-white/5 hover:bg-white/10 border border-white/10 p-7 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-manrope text-xl font-bold text-white mb-2">
                      <TranslatedText text={card.title} />
                    </h3>
                    <p className="text-sm text-primary-200/80 leading-relaxed mb-6">
                      <TranslatedText text={card.desc} />
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-400 group-hover:text-white">
                    <TranslatedText text={card.cta} />
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Analytics & Reporting Highlight */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-[#F4F7FA] p-8 sm:p-12 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-2">
                <TranslatedText text="Intelligence & Reporting" />
              </p>
              <h2 className="font-manrope text-2xl sm:text-3xl font-extrabold text-primary-900 mb-3">
                <TranslatedText text="Predictive analytics and custom report builders" />
              </h2>
              <p className="text-primary-700/80 text-sm sm:text-base leading-relaxed mb-6">
                <TranslatedText text="Every role gets real-time dashboards, custom report generation, and predictive logistics insights to track cost per ton-km, fleet utilization, and on-time performance." />
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: BarChart3, label: "Operational & Financial KPIs" },
                  { icon: Layers, label: "Custom Report Builder" },
                  { icon: FileCheck2, label: "Audit & Compliance Exports" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                      <Icon className="w-5 h-5 text-primary-500 shrink-0" />
                      <span className="text-xs font-bold text-primary-900">
                        <TranslatedText text={item.label} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="lg:col-span-5 flex lg:justify-end">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold uppercase tracking-wider text-xs px-8 py-4 rounded-full transition-colors"
              >
                <TranslatedText text="Launch Platform Workspace" />
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

