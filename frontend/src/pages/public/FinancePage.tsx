import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CreditCard,
  Wallet,
  BadgeCheck,
  Landmark,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
} from "lucide-react"
import { PublicHeroBackdrop } from "@/components/home/PublicHeroBackdrop"
import { PublicNavbar } from "@/components/home/PublicNavbar"
import { PublicFooter } from "@/components/home/PublicFooter"
import { TranslatedText } from "@/components/translated-text"

const FINANCE_PRODUCTS = [
  {
    id: "credits",
    icon: CreditCard,
    badge: "Credits Marketplace",
    title: "Prepaid operational credits for seamless marketplace participation",
    summary:
      "Fleet owners purchase credits to bid on loads, accept smart matches, and activate trips—while tenant operators control credit packages, pricing tiers, and promotional bundles.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    points: [
      "Instant credit top-ups via mobile money and bank transfer",
      "Transparent per-action credit consumption for bidding and matching",
      "Tenant-configurable credit packages and volume discounts",
      "Automated credit usage ledgers, receipts, and balance alerts",
    ],
  },
  {
    id: "loans",
    icon: Wallet,
    badge: "Working Capital Loans",
    title: "Trip-backed financing that eliminates 60-day payment bottlenecks",
    summary:
      "Transporters and shippers can request working-capital financing linked directly to active freight bookings—covering fuel, driver allowances, and corridor tolls without waiting weeks for invoice settlement.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    points: [
      "Request advances directly against confirmed loads and signed contracts",
      "Underwriting powered by real platform trip history and reputation scores",
      "Fast disbursement to keep trucks fueled and moving on schedule",
      "Automated repayment deduction upon trip completion and settlement",
    ],
  },
  {
    id: "escrow",
    icon: BadgeCheck,
    badge: "Escrow & Instant Settlement",
    title: "Milestone-verified escrow that protects both shippers and carriers",
    summary:
      "Hold freight payments securely in escrow and release funds automatically as verified loading, transit checkpoints, and digital proof of delivery (e-POD) are completed.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    points: [
      "Structured payment milestones tied to pre-trip inspection and e-POD",
      "Automated multi-party split settlements (carrier, broker commission, lender repayment)",
      "Digital invoices and official payment receipts generated on every transaction",
      "Protected dispute holds if delivery exceptions require investigation",
    ],
  },
] as const

export default function FinancePage() {
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
      <section className="relative isolate bg-[#0e1c2a] text-white py-16 lg:py-24 overflow-hidden">
        <PublicHeroBackdrop image="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1920&q=80" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sky-300 text-xs font-bold uppercase tracking-[0.2em] mb-4">
              <TranslatedText text="Embedded Finance" />
            </p>
            <h1 className="font-manrope text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.12] mb-6 drop-shadow-sm">
              <TranslatedText text="Cash flow that moves at the speed of your freight" />
            </h1>
            <p className="max-w-2xl text-slate-100 text-base sm:text-lg leading-relaxed mb-8">
              <TranslatedText text="African road freight stalls when carriers wait 30 to 90 days for payment. UrutiX embeds marketplace credits, working-capital loans, and milestone escrow directly into the logistics workflow." />
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#credits"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0e1c2a]/55 backdrop-blur-sm hover:bg-primary-500 text-white text-xs font-bold uppercase tracking-wider border border-white/30 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <TranslatedText text="Credits Marketplace" />
              </a>
              <a
                href="#loans"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0e1c2a]/55 backdrop-blur-sm hover:bg-primary-500 text-white text-xs font-bold uppercase tracking-wider border border-white/30 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <TranslatedText text="Working Capital Loans" />
              </a>
              <a
                href="#escrow"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0e1c2a]/55 backdrop-blur-sm hover:bg-primary-500 text-white text-xs font-bold uppercase tracking-wider border border-white/30 transition-colors"
              >
                <BadgeCheck className="w-4 h-4" />
                <TranslatedText text="Escrow & Settlement" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Finance Products */}
      <div className="divide-y divide-slate-100">
        {FINANCE_PRODUCTS.map((product, index) => {
          const Icon = product.icon
          const isEven = index % 2 === 0
          return (
            <section
              key={product.id}
              id={product.id}
              className={`py-16 lg:py-24 scroll-mt-36 ${isEven ? "bg-white" : "bg-[#F4F7FA]"}`}
            >
              <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  <div className={`lg:col-span-6 ${!isEven ? "lg:order-2" : ""}`}>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider mb-4">
                      <Icon className="w-4 h-4 text-primary-600" />
                      <TranslatedText text={product.badge} />
                    </div>
                    <h2 className="font-manrope text-2xl sm:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-4">
                      <TranslatedText text={product.title} />
                    </h2>
                    <p className="text-primary-700/80 text-base leading-relaxed mb-6">
                      <TranslatedText text={product.summary} />
                    </p>
                    <ul className="space-y-3.5 mb-8">
                      {product.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-primary-800 leading-relaxed">
                            <TranslatedText text={pt} />
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/auth"
                      className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
                    >
                      <TranslatedText text="Access Financial Workspace" />
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
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* For Institutional Lenders */}
      <section id="lenders" className="py-16 lg:py-24 bg-primary-950 text-white scroll-mt-36">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-primary-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Landmark className="w-4 h-4 text-primary-400" />
                <TranslatedText text="For Banks & Financial Institutions" />
              </div>
              <h2 className="font-manrope text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
                <TranslatedText text="Deploy capital into verified logistics transactions" />
              </h2>
              <p className="text-primary-200/90 text-base leading-relaxed mb-8">
                <TranslatedText text="The UrutiX Lender Portal gives credit teams real-time visibility into borrower performance, active freight contracts, GPS trip progress, and automated settlement repayments." />
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Partner as a Lender" />
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: TrendingUp,
                  title: "Portfolio & Risk Analytics",
                  desc: "Monitor active loans, default probabilities, interest yield, and borrower concentration in real time.",
                },
                {
                  icon: ShieldCheck,
                  title: "Custom Lending Policies",
                  desc: "Configure automated underwriting rules, minimum carrier tiers, and maximum loan-to-trip ratios.",
                },
                {
                  icon: Receipt,
                  title: "Automated Repayments",
                  desc: "Collect principal and interest automatically when freight escrow settles upon delivery.",
                },
                {
                  icon: Landmark,
                  title: "Team & Role Governance",
                  desc: "Manage credit officers, approval limits, and audit trails inside a dedicated lender workspace.",
                },
              ].map((card) => {
                const Icon = card.icon
                return (
                  <div key={card.title} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-300 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-manrope text-base font-bold text-white mb-1.5">
                      <TranslatedText text={card.title} />
                    </h3>
                    <p className="text-xs text-primary-200/80 leading-relaxed">
                      <TranslatedText text={card.desc} />
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

