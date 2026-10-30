import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Building2,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Globe,
  CreditCard,
  ShieldCheck,
  Route,
  Users,
} from "lucide-react"
import { PublicHeroBackdrop } from "@/components/home/PublicHeroBackdrop"
import { PublicNavbar } from "@/components/home/PublicNavbar"
import { PublicFooter } from "@/components/home/PublicFooter"
import { TranslatedText } from "@/components/translated-text"

const MARKETPLACE_CAPABILITIES = [
  {
    icon: Package,
    title: "Spot & Contract Load Board",
    desc: "Shippers publish spot shipments, recurring distribution campaigns, or bulk CSV loads with transparent lane requirements.",
  },
  {
    icon: Truck,
    title: "Spare Capacity & Backhaul Exchange",
    desc: "Carriers list available truck space and return legs so shippers can book vetted trucks already moving on their corridor.",
  },
  {
    icon: Route,
    title: "AI Smart Matching & Live Auctions",
    desc: "Match freight instantly by route geometry and carrier score, or open competitive auctions for market-driven pricing.",
  },
] as const

const TENANT_CONTROLS = [
  {
    icon: Globe,
    title: "Custom Brand & Domain",
    desc: "Configure your organization’s logo, color palette, email templates, and custom subdomain in Branding Settings.",
  },
  {
    icon: Users,
    title: "Tenant User & Role Governance",
    desc: "Onboard shippers, fleet owners, drivers, brokers, and lenders under your tenant with fine-grained permissions.",
  },
  {
    icon: CreditCard,
    title: "Custom Credit Marketplace",
    desc: "Set your own credit packages, partner billing tiers, and transaction pricing rules to monetize your freight network.",
  },
  {
    icon: Sliders,
    title: "Integrations & Feature Controls",
    desc: "Enable or restrict modules, configure webhooks and ERP integrations, and manage corridor geofences.",
  },
] as const

export default function MarketplacePage() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [location.pathname])

  return (
    <div className="min-h-screen font-sans antialiased bg-white text-primary-900">
      <PublicNavbar alwaysSolid />

      {/* Hero */}
      <section className="relative isolate bg-[#0e1c2a] text-white py-16 lg:py-24 overflow-hidden">
        <PublicHeroBackdrop image="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <TranslatedText text="Freight Exchange & White-Label Network" />
            </p>
            <h1 className="font-manrope text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 drop-shadow-sm">
              <TranslatedText text="Trade freight on the open network—or launch your own branded marketplace" />
            </h1>
            <p className="max-w-2xl text-slate-100 text-base sm:text-lg leading-relaxed mb-8">
              <TranslatedText text="UrutiX powers both a high-liquidity freight marketplace for shippers and carriers and a multi-tenant white-label engine that lets logistics organizations run their own digital freight network." />
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Join the Marketplace" />
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#white-label"
                className="inline-flex items-center gap-2 border border-white/30 hover:bg-[#0e1c2a]/55 backdrop-blur-sm text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <TranslatedText text="White-Label for Operators" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Freight Exchange Capabilities */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
              <TranslatedText text="Digital Freight Exchange" />
            </p>
            <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-3">
              <TranslatedText text="Where verified cargo meets vetted truck capacity" />
            </h2>
            <p className="text-primary-600/80 text-base leading-relaxed">
              <TranslatedText text="Move spot loads, contract lanes, and backhaul capacity with transparent pricing and verified carrier credentials." />
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {MARKETPLACE_CAPABILITIES.map((cap) => {
              const Icon = cap.icon
              return (
                <div key={cap.title} className="rounded-[1.75rem] bg-[#F4F7FA] p-7">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-manrope text-xl font-bold text-primary-900 mb-2">
                    <TranslatedText text={cap.title} />
                  </h3>
                  <p className="text-sm text-primary-700/80 leading-relaxed">
                    <TranslatedText text={cap.desc} />
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* White-Label Multi-Tenant Marketplace Section */}
      <section id="white-label" className="py-16 lg:py-24 bg-[#F4F7FA] scroll-mt-36">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] overflow-hidden bg-white shadow-sm mb-12">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-14">
                <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-4">
                  <TranslatedText text="Multi-Tenant White-Label" />
                </p>
                <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-4">
                  <TranslatedText text="Run your own branded freight marketplace" />
                </h2>
                <p className="text-primary-600/80 text-base leading-relaxed mb-8">
                  <TranslatedText text="UrutiX is multi-tenant by design. Logistics companies, associations, and enterprise 3PLs can launch a private or public white-label network for their shippers and carriers without building matching, GPS tracking, or embedded finance from scratch." />
                </p>
                <ul className="space-y-3 mb-9">
                  {[
                    "Your brand, subdomain, and customer experience",
                    "Tenant users, roles, governance, and feature controls",
                    "Credit marketplace and subscription plans priced for your network",
                    "Shared core for smart matching, live trips, parking, and finance",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-primary-800 font-medium">
                        <TranslatedText text={point} />
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
                  >
                    <TranslatedText text="Launch Your Tenant Workspace" />
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/support"
                    className="inline-flex items-center gap-2 border border-primary-200 hover:border-primary-400 text-primary-800 font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
                  >
                    <TranslatedText text="Talk to Enterprise Sales" />
                  </Link>
                </div>
              </div>

              <div className="bg-primary-950 p-8 sm:p-10 lg:p-12 flex items-center">
                <div className="w-full space-y-3">
                  <p className="text-primary-300 text-xs font-bold uppercase tracking-[0.16em] mb-4">
                    <TranslatedText text="Tenant Admin Command Center" />
                  </p>
                  {[
                    { label: "Active loads", value: "Matching · Auction · Campaigns" },
                    { label: "Live trips", value: "GPS · Geofence · e-POD" },
                    { label: "Finance queue", value: "Credits · Loans · Escrow" },
                    { label: "Tenant controls", value: "Brand · Roles · Integrations" },
                    { label: "Corridor facilities", value: "Parking Bays · Fee Rules" },
                  ].map((row, i) => (
                    <motion.div
                      key={row.label}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5"
                    >
                      <span className="text-sm text-primary-100 font-medium">
                        <TranslatedText text={row.label} />
                      </span>
                      <span className="text-xs text-primary-300 text-right">
                        <TranslatedText text={row.value} />
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Controls Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TENANT_CONTROLS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white rounded-[1.75rem] p-6 shadow-sm">
                  <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-manrope text-base font-bold text-primary-900 mb-2">
                    <TranslatedText text={item.title} />
                  </h3>
                  <p className="text-xs text-primary-600/80 leading-relaxed">
                    <TranslatedText text={item.desc} />
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom Trust Banner */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] bg-primary-50 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-manrope text-xl font-bold text-primary-900 mb-1">
                  <TranslatedText text="Isolated tenant governance with shared network liquidity" />
                </h3>
                <p className="text-sm text-primary-700/80">
                  <TranslatedText text="Keep your customer relationships, pricing, and data isolated while benefiting from enterprise-grade infrastructure." />
                </p>
              </div>
            </div>
            <Link
              to="/who-its-for"
              className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-bold uppercase tracking-wider text-xs px-6 py-3.5 rounded-full shrink-0 transition-colors"
            >
              <TranslatedText text="See All Roles" />
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

