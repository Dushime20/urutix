import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Package,
  Truck,
  UserRound,
  HeartHandshake,
  Landmark,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MapPinned,
  Wallet,
  BarChart3,
  FileCheck2,
  Gavel,
} from "lucide-react"
import { PublicHeroBackdrop } from "@/components/home/PublicHeroBackdrop"
import { PublicNavbar } from "@/components/home/PublicNavbar"
import { PublicFooter } from "@/components/home/PublicFooter"
import { TranslatedText } from "@/components/translated-text"

const ROLES = [
  {
    id: "cargo",
    badge: "Cargo Owners & Shippers",
    label: "Cargo owners",
    icon: Package,
    headline: "Move freight across Africa with full control and zero phone-tag",
    summary:
      "Publish spot loads or recurring contract lanes, compare vetted carriers through smart matching or transparent auctions, monitor live GPS & geofences, and settle with digital proof of delivery.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=80",
    cta: "Start shipping on UrutiX",
    metrics: [
      { label: "Load Allocation", value: "Smart Match & Auction" },
      { label: "Visibility", value: "Live GPS + Geofences" },
      { label: "Documentation", value: "Automated e-POD & Invoices" },
    ],
    features: [
      "Post single loads, bulk CSV uploads, or save templates for repeat corridors",
      "Run forward/reverse bidding auctions or accept instant AI-recommended truck matches",
      "Track active shipments with real-time GPS telemetry, ETA alerts, and customs inspection updates",
      "Manage receivers, digital inspections, escrow milestones, and multi-currency invoicing in one workspace",
    ],
    highlights: [
      { icon: Gavel, title: "Competitive Procurement", desc: "Compare carrier bids side-by-side with verified reputation and safety scores." },
      { icon: MapPinned, title: "End-to-End Tracking", desc: "Monitor origin departure, border checkpoints, and final delivery confirmation." },
      { icon: FileCheck2, title: "Audit-Ready Settlement", desc: "Release escrow or pay invoices only when digital e-POD is verified." },
    ],
  },
  {
    id: "fleet",
    badge: "Fleet & Truck Owners",
    label: "Fleet owners",
    icon: Truck,
    headline: "Keep your trucks loaded, reduce empty backhauls, and accelerate cash flow",
    summary:
      "Discover profitable freight matched to your routes and equipment, manage drivers and compliance in one dashboard, and unlock working capital tied directly to your active trips.",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1400&q=80",
    cta: "Register your fleet",
    metrics: [
      { label: "Utilization", value: "Backhaul & Lane Matching" },
      { label: "Operations", value: "Drivers, Fuel & Safety" },
      { label: "Liquidity", value: "Trip-Linked Financing" },
    ],
    features: [
      "Browse high-fit loads on an interactive load map or receive automated smart-booking requests",
      "Sell available spare truck capacity and eliminate empty return legs with backhaul matching",
      "Track truck maintenance records, driver assignments, fuel expenses, and trip profitability",
      "Purchase marketplace credits and request working-capital advances against confirmed bookings",
    ],
    highlights: [
      { icon: BarChart3, title: "Clear Trip Economics", desc: "See route distance, fuel estimates, and net margins before placing a bid." },
      { icon: ShieldCheck, title: "Fleet Compliance & Safety", desc: "Keep vehicle insurance, inspections, and driver credentials up to date." },
      { icon: Wallet, title: "Fast Settlement & Credit", desc: "Get paid faster through escrow and access fuel/working capital loans." },
    ],
  },
  {
    id: "driver",
    badge: "Professional Drivers",
    label: "Drivers",
    icon: UserRound,
    headline: "Clear missions, guided inspections, and transparent earnings on every trip",
    summary:
      "Receive structured trip assignments on your phone, complete pre-trip checklists and cargo inspections, share live route progress, and capture digital proof of delivery.",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1400&q=80",
    cta: "Join as a driver",
    metrics: [
      { label: "Workflow", value: "Guided Pre/Post-Trip" },
      { label: "Safety", value: "Digital Checklists" },
      { label: "Recognition", value: "Ratings & Leaderboard" },
    ],
    features: [
      "View assigned missions with pickup/dropoff coordinates, receiver contacts, and special cargo handling notes",
      "Complete digital vehicle checklists, pre-trip safety inspections, and post-trip reports in-app",
      "Reserve secure truck parking bays along your corridor and track reservation status",
      "Build a verified safety and on-time performance record that unlocks rewards and higher-tier trips",
    ],
    highlights: [
      { icon: FileCheck2, title: "Paperless Inspections", desc: "Log vehicle condition and cargo photos directly from your mobile workspace." },
      { icon: MapPinned, title: "Corridor Parking & Navigation", desc: "Book verified rest bays and navigate checkpoints with fewer delays." },
      { icon: BarChart3, title: "Earnings & Reputation", desc: "Track completed trips, driver payouts, and performance rankings." },
    ],
  },
  {
    id: "broker",
    badge: "Freight Brokers & Agents",
    label: "Brokers",
    icon: HeartHandshake,
    headline: "Coordinate shippers and carriers with structured deals and protected commissions",
    summary:
      "Source cargo and verified truck capacity in a single marketplace, facilitate multi-stop contracts, verify insurance readiness, and automate commission payouts.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80",
    cta: "Broker on UrutiX",
    metrics: [
      { label: "Deal Flow", value: "Smart Discovery & Matching" },
      { label: "Protection", value: "Automated Commissions" },
      { label: "Compliance", value: "Insurance & Escrow" },
    ],
    features: [
      "Discover open shipper loads and match them with vetted fleet capacity across regional corridors",
      "Manage contract negotiations, multi-stop routing, and document packets for both parties",
      "Verify carrier insurance policies, customs readiness, and compliance before dispatch",
      "Track broker commissions, escrow milestones, and automated payout settlements transparently",
    ],
    highlights: [
      { icon: HeartHandshake, title: "Deal Facilitation Hub", desc: "Keep shippers and carriers aligned with shared status and contract terms." },
      { icon: ShieldCheck, title: "Risk & Insurance Verification", desc: "Validate carrier credentials and cargo coverage before loading." },
      { icon: Wallet, title: "Commission Transparency", desc: "Track earned commissions and settlement payouts across every brokered deal." },
    ],
  },
  {
    id: "lender",
    badge: "Financial Institutions & Lenders",
    label: "Lenders",
    icon: Landmark,
    headline: "Finance real freight movement backed by live operational and escrow data",
    summary:
      "Underwrite working-capital loans for transporters and shippers using verified trip history, platform reputation scores, and milestone-linked repayment structures.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&q=80",
    cta: "Partner as a lender",
    metrics: [
      { label: "Underwriting", value: "Real Trip Telemetry" },
      { label: "Controls", value: "Custom Lending Policies" },
      { label: "Collections", value: "Settlement-Linked Repayment" },
    ],
    features: [
      "Review loan applications tied to real, active freight bookings and verified contracts",
      "Assess borrower creditworthiness using historical trip completion, fleet utilization, and reputation data",
      "Configure custom lending policies, interest rates, risk thresholds, and approval workflows",
      "Automate disbursements, track principal/interest repayments, and monitor portfolio risk analytics",
    ],
    highlights: [
      { icon: BarChart3, title: "Data-Driven Credit Assessment", desc: "Replace guesswork with live operational signals and verified transaction history." },
      { icon: ShieldCheck, title: "Policy & Risk Governance", desc: "Define automated eligibility rules, exposure limits, and team permissions." },
      { icon: Wallet, title: "Closed-Loop Repayments", desc: "Link loan disbursements and repayments directly to platform freight settlements." },
    ],
  },
] as const

export default function WhoItsForPage() {
  const location = useLocation()
  const [selectedRole, setSelectedRole] = useState<string>("cargo")

  useEffect(() => {
    const hash = location.hash.replace("#", "")
    if (hash && ROLES.some((r) => r.id === hash)) {
      setSelectedRole(hash)
      const el = document.getElementById(hash)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [location.pathname, location.hash])

  return (
    <div className="min-h-screen font-sans antialiased bg-white text-primary-900">
      <PublicNavbar alwaysSolid />

      {/* Hero Section */}
      <section className="relative isolate bg-[#0e1c2a] text-white py-16 lg:py-24 overflow-hidden">
        <PublicHeroBackdrop image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <TranslatedText text="Who it’s for" />
            </p>
            <h1 className="font-manrope text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 drop-shadow-sm">
              <TranslatedText text="Purpose-built workspaces for every participant in road freight" />
            </h1>
            <p className="max-w-2xl text-slate-100 text-base sm:text-lg leading-relaxed mb-8">
              <TranslatedText text="UrutiX connects cargo owners, fleet operators, drivers, brokers, and lenders on a single shared data core—giving each role the exact tools they need to move freight faster and get paid on time." />
            </p>
            <div className="flex flex-wrap gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon
                const active = selectedRole === role.id
                return (
                  <a
                    key={role.id}
                    href={`#${role.id}`}
                    onClick={() => setSelectedRole(role.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1c2a] transition-all ${
                      active
                        ? "bg-primary-500 text-white shadow-lg"
                        : "bg-[#0e1c2a]/55 backdrop-blur-sm text-white hover:bg-white/20 border border-white/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <TranslatedText text={role.label} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Role Deep-Dive Sections */}
      <div className="divide-y divide-slate-100">
        {ROLES.map((role, index) => {
          const Icon = role.icon
          const isEven = index % 2 === 0
          return (
            <section
              key={role.id}
              id={role.id}
              className={`py-16 lg:py-24 scroll-mt-36 ${isEven ? "bg-white" : "bg-[#F4F7FA]"}`}
            >
              <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  <div className={`lg:col-span-6 ${!isEven ? "lg:order-2" : ""}`}>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-4">
                      <Icon className="w-4 h-4 text-primary-600" />
                      <TranslatedText text={role.badge} />
                    </div>
                    <h2 className="font-manrope text-2xl sm:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-4">
                      <TranslatedText text={role.headline} />
                    </h2>
                    <p className="text-primary-700/80 text-base leading-relaxed mb-6">
                      <TranslatedText text={role.summary} />
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {role.metrics.map((m) => (
                        <div key={m.label} className="rounded-2xl bg-primary-50/80 border border-primary-100 p-3.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500 mb-1">
                            <TranslatedText text={m.label} />
                          </p>
                          <p className="font-manrope text-xs sm:text-sm font-extrabold text-primary-900">
                            <TranslatedText text={m.value} />
                          </p>
                        </div>
                      ))}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {role.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-primary-800 leading-relaxed">
                            <TranslatedText text={feat} />
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        to="/auth"
                        className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
                      >
                        <TranslatedText text={role.cta} />
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/how-it-works"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-600 hover:text-primary-800"
                      >
                        <TranslatedText text="See how trips work" />
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className={`lg:col-span-6 ${!isEven ? "lg:order-1" : ""}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4 }}
                      className="rounded-[2rem] overflow-hidden bg-white shadow-md border border-slate-100"
                    >
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img src={role.image} alt={role.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
                          <span className="font-manrope text-lg font-extrabold">
                            <TranslatedText text={role.badge} />
                          </span>
                          <span className="px-3 py-1 rounded-full bg-primary-500 text-[11px] font-bold uppercase tracking-wider">
                            <TranslatedText text="Dedicated Workspace" />
                          </span>
                        </div>
                      </div>
                      <div className="p-6 sm:p-8 grid gap-4">
                        {role.highlights.map((h) => {
                          const HIcon = h.icon
                          return (
                            <div key={h.title} className="flex items-start gap-4 p-4 rounded-2xl bg-primary-50/60">
                              <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0">
                                <HIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-manrope text-sm font-bold text-primary-900 mb-1">
                                  <TranslatedText text={h.title} />
                                </h3>
                                <p className="text-xs text-primary-700/80 leading-relaxed">
                                  <TranslatedText text={h.desc} />
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="bg-primary-900 rounded-[2rem] px-8 py-12 lg:px-14 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 text-white">
            <div className="max-w-xl">
              <h2 className="font-manrope text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-3">
                <TranslatedText text="Operate your own logistics network?" />
              </h2>
              <p className="text-primary-200 text-base leading-relaxed">
                <TranslatedText text="Launch a white-label multi-tenant freight marketplace with your own brand, domain, and custom credit rules." />
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Explore White-Label Marketplace" />
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 border border-white/40 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Create account" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

