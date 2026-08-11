import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Truck,
  Package,
  Gavel,
  CheckCircle2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Menu,
  X,
  LayoutDashboard,
  Route,
  ShieldCheck,
  Wallet,
  Radio,
  Building2,
  HeartHandshake,
  UserRound,
  Landmark,
  ChevronRight,
  MapPinned,
  FileCheck2,
  CreditCard,
  BadgeCheck,
  Sparkles,
} from "lucide-react"
import logoUrutiX from "../../assets/urutiX Logistics Logo (1).svg"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TranslatedText } from "@/components/translated-text"
import { useContactSettings } from "@/hooks/useContactSettings"

const ROLE_DASHBOARD: Record<string, string> = {
  CARGO_OWNER: "/dashboard",
  TRUCK_OWNER: "/dashboard/fleet",
  FLEET_OWNER: "/dashboard/fleet",
  DRIVER: "/dashboard/driver",
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
  TENANT_ADMIN: "/tenant-admin",
  LENDER: "/lender",
  BROKER: "/dashboard/broker",
  MANAGER: "/dashboard",
  AGENT: "/dashboard",
  USER: "/dashboard",
}

const NAV_LINKS = [
  { label: "Who it's for", href: "#audiences" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Platform", href: "#platform" },
  { label: "Finance", href: "#finance" },
  { label: "Contact", href: "#contact" },
]

const AUDIENCES = [
  {
    id: "cargo",
    label: "Cargo owners",
    icon: Package,
    title: "Move freight with less chasing",
    points: [
      "Post loads once and reach vetted capacity",
      "Choose smart match or run an auction",
      "Track GPS, ETA, and digital proof of delivery",
      "Settle with invoices, escrow, or financing options",
    ],
    cta: "Ship with UrutiX",
  },
  {
    id: "fleet",
    label: "Fleet owners",
    icon: Truck,
    title: "Keep trucks loaded and cash flowing",
    points: [
      "Discover loads that fit your routes and assets",
      "Bid or accept matches with clear trip economics",
      "Manage drivers, fuel, safety, and compliance",
      "Access credits and loans tied to real work",
    ],
    cta: "Grow your fleet ops",
  },
  {
    id: "driver",
    label: "Drivers",
    icon: UserRound,
    title: "Clear missions. Clear earnings.",
    points: [
      "Receive trip assignments and route context",
      "Complete checklists and inspections in-app",
      "Share live location and delivery confirmation",
      "Track earnings and performance history",
    ],
    cta: "Drive with UrutiX",
  },
  {
    id: "broker",
    label: "Brokers",
    icon: HeartHandshake,
    title: "Close deals with full visibility",
    points: [
      "Source loads and capacity in one marketplace",
      "Coordinate parties with status and documents",
      "Track commissions, escrow, and settlements",
      "Verify insurance and compliance readiness",
    ],
    cta: "Broker on UrutiX",
  },
  {
    id: "lender",
    label: "Lenders",
    icon: Landmark,
    title: "Finance freight with operational data",
    points: [
      "Review loan requests linked to real trips",
      "Assess risk with platform activity signals",
      "Disburse and track repayments in one place",
      "Serve transporters inside the logistics network",
    ],
    cta: "Lend on UrutiX",
  },
] as const

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Post the load",
    desc: "Cargo owners publish origin, destination, cargo type, and requirements—or use templates for repeat lanes.",
    icon: Package,
  },
  {
    step: "02",
    title: "Match or auction",
    desc: "UrutiX recommends capacity with smart matching, or you open a reverse/forward auction for competitive bids.",
    icon: Gavel,
  },
  {
    step: "03",
    title: "Assign & move",
    desc: "Confirm truck and driver, start the trip, and monitor GPS, geofences, and operational status in real time.",
    icon: MapPinned,
  },
  {
    step: "04",
    title: "Deliver & settle",
    desc: "Capture digital POD, close the journey, settle payments—and unlock credits or financing when needed.",
    icon: FileCheck2,
  },
] as const

const PILLARS = [
  {
    icon: Route,
    title: "Smart matching",
    desc: "Match cargo to capacity by route fit, asset type, proximity, and performance—not endless phone calls.",
  },
  {
    icon: Gavel,
    title: "Bidding & auctions",
    desc: "Run transparent auctions so shippers find competitive rates and fleets win work on clear terms.",
  },
  {
    icon: Radio,
    title: "Live visibility",
    desc: "Track trips with GPS updates, ETAs, geofences, and audit-ready delivery confirmation.",
  },
  {
    icon: Wallet,
    title: "Embedded finance",
    desc: "Credits, loans, escrow, and settlements sit inside the same freight workflow.",
  },
  {
    icon: Building2,
    title: "White-label marketplace",
    desc: "Launch your own branded freight network on a shared core with tenant controls.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted operations",
    desc: "Roles, ratings, insurance-ready records, and compliance tools keep every party accountable.",
  },
] as const

const FINANCE_ITEMS = [
  {
    icon: CreditCard,
    title: "Credits marketplace",
    desc: "Fleets buy credits to bid, match, and start trips. Tenants control pricing and availability.",
  },
  {
    icon: Wallet,
    title: "Working capital loans",
    desc: "Lenders fund transporters against real platform activity—not paperwork alone.",
  },
  {
    icon: BadgeCheck,
    title: "Escrow & settlement",
    desc: "Hold and release funds against verified milestones so shippers and carriers stay aligned.",
  },
] as const

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeHref, setActiveHref] = useState("#home")
  const { user } = useAuth()
  const { contact } = useContactSettings()
  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? "/dashboard") : null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const ids = ["home", ...NAV_LINKS.map((l) => l.href.replace("#", "")), "marketplace"]
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          setActiveHref(`#${visible[0].target.id}`)
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const isActive = (href: string) =>
    activeHref === href || (href === "#platform" && activeHref === "#marketplace")

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "bg-white border-b border-primary-100"
          : "bg-white/95 border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.25rem]">
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
            onClick={() => setActiveHref("#home")}
          >
            <img
              src={logoUrutiX}
              alt="UrutiX"
              className="h-9 sm:h-10 lg:h-11 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_LINKS.map((item) => {
              const active = isActive(item.href)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setActiveHref(item.href)}
                  className={`relative px-3.5 py-2 text-[13px] font-semibold tracking-tight rounded-md transition-colors ${
                    active
                      ? "text-primary-500"
                      : "text-primary-700 hover:text-primary-500 hover:bg-primary-50"
                  }`}
                >
                  <TranslatedText text={item.label} />
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-3.5 right-3.5 -bottom-0.5 h-0.5 bg-primary-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
            <a
              href={`tel:${contact.phone}`}
              className="hidden xl:inline-flex items-center gap-2 h-10 px-3 text-[13px] font-medium text-primary-700 border border-primary-100 hover:border-primary-300 hover:text-primary-500 transition-colors rounded-lg"
            >
              <Phone className="w-3.5 h-3.5 text-primary-500" />
              {contact.phone}
            </a>

            <div className="flex items-center h-10 px-1 border border-primary-100 rounded-lg">
              <LanguageSwitcher />
            </div>

            {dashboardPath ? (
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 h-10 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold px-4 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <TranslatedText text="Dashboard" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex items-center h-10 px-3.5 text-[13px] font-semibold text-primary-700 border border-primary-200 hover:border-primary-400 hover:text-primary-500 transition-colors rounded-lg"
                >
                  <TranslatedText text="Sign in" />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 h-10 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold px-4 rounded-lg transition-colors"
                >
                  <TranslatedText text="Get started" />
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center w-10 h-10 text-primary-700 border border-primary-100 rounded-lg hover:bg-primary-50 transition-colors"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 top-16 bg-primary-950/35 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-50 md:hidden border-b border-primary-100 bg-white"
            >
              <nav className="px-5 py-3" aria-label="Mobile">
                {NAV_LINKS.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setActiveHref(item.href)
                        setOpen(false)
                      }}
                      className={`flex items-center justify-between py-3.5 border-b border-primary-50 text-sm font-semibold transition-colors ${
                        active ? "text-primary-500" : "text-primary-800"
                      }`}
                    >
                      <TranslatedText text={item.label} />
                      <ChevronRight className={`w-4 h-4 ${active ? "text-primary-500" : "text-primary-300"}`} />
                    </a>
                  )
                })}
              </nav>

              <div className="px-5 pb-5 pt-2 space-y-2.5">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium text-primary-700"
                >
                  <Phone className="w-4 h-4 text-primary-500" />
                  {contact.phone}
                </a>

                {dashboardPath ? (
                  <Link
                    to={dashboardPath}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full h-11 bg-primary-500 text-white text-sm font-semibold rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <TranslatedText text="Dashboard" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-2 w-full h-11 bg-primary-500 text-white text-sm font-semibold rounded-lg"
                    >
                      <TranslatedText text="Get started" />
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center w-full h-11 border border-primary-200 text-primary-700 text-sm font-semibold rounded-lg"
                    >
                      <TranslatedText text="Sign in" />
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

function Hero() {
  return (
    <section id="home" className="relative min-h-[100svh] flex items-end lg:items-center pt-16 lg:pt-[4.25rem]">
      <div
        className="absolute inset-0 bg-primary-950"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-primary-950/80" aria-hidden />

      <div className="relative z-10 w-full mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <p className="font-manrope text-white text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-none mb-5">
            UrutiX
          </p>
          <h1 className="font-manrope text-xl sm:text-2xl lg:text-3xl font-semibold text-primary-100 tracking-tight leading-snug mb-4">
            <TranslatedText text="The freight network for Africa’s shippers, fleets, and lenders" />
          </h1>
          <p className="text-primary-200 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
            <TranslatedText text="Match loads, run auctions, track every trip, and settle with embedded finance—on one platform you can also white-label." />
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              <TranslatedText text="Join the network" />
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#marketplace"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              <TranslatedText text="Launch your marketplace" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function AudiencesSection() {
  const [active, setActive] = useState<(typeof AUDIENCES)[number]["id"]>("cargo")
  const current = AUDIENCES.find((a) => a.id === active) ?? AUDIENCES[0]
  const Icon = current.icon

  return (
    <section id="audiences" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 lg:mb-12">
          <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <TranslatedText text="Who it’s for" />
          </p>
          <h2 className="font-manrope text-3xl lg:text-4xl font-bold text-primary-900 tracking-tight leading-tight mb-3">
            <TranslatedText text="Built for every side of the freight deal" />
          </h2>
          <p className="text-primary-600/80 text-base leading-relaxed">
            <TranslatedText text="Choose your role to see how UrutiX fits your day-to-day—then start in the right workspace." />
          </p>
        </div>

        {/* Interactive role tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin"
          role="tablist"
          aria-label="Audience roles"
        >
          {AUDIENCES.map((role) => {
            const selected = role.id === active
            const RoleIcon = role.icon
            return (
              <button
                key={role.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(role.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  selected
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "bg-white border-primary-200 text-primary-700 hover:border-primary-400 hover:text-primary-500"
                }`}
              >
                <RoleIcon className="w-4 h-4" />
                <TranslatedText text={role.label} />
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="border border-primary-100 bg-primary-50 p-6 sm:p-8 lg:p-10"
            role="tabpanel"
          >
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <div className="w-12 h-12 flex items-center justify-center bg-primary-500 text-white mb-5">
                  <Icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-primary-900 mb-3">
                  <TranslatedText text={current.title} />
                </h3>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  <TranslatedText text={current.cta} />
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                {current.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 bg-white border border-primary-100 p-4"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-primary-800 leading-relaxed">
                      <TranslatedText text={point} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const step = JOURNEY_STEPS[activeStep]
  const StepIcon = step.icon

  return (
    <section id="how-it-works" className="bg-primary-50 py-20 lg:py-28 border-y border-primary-100">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <TranslatedText text="How it works" />
          </p>
          <h2 className="font-manrope text-3xl lg:text-4xl font-bold text-primary-900 tracking-tight leading-tight mb-3">
            <TranslatedText text="From load post to settlement—one clear journey" />
          </h2>
          <p className="text-primary-600/80 text-base leading-relaxed">
            <TranslatedText text="Click each step to follow the same lifecycle your teams use inside UrutiX." />
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-5 space-y-2">
            {JOURNEY_STEPS.map((item, index) => {
              const selected = index === activeStep
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`w-full text-left border px-4 py-4 transition-colors ${
                    selected
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-white border-primary-100 text-primary-800 hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-manrope text-sm font-bold tracking-wider ${
                        selected ? "text-primary-100" : "text-primary-400"
                      }`}
                    >
                      {item.step}
                    </span>
                    <span className="font-semibold text-sm sm:text-base">
                      <TranslatedText text={item.title} />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-7 bg-white border border-primary-100 p-7 sm:p-9 flex flex-col justify-center min-h-[240px]"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-primary-500 text-white mb-6">
                <StepIcon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <p className="text-primary-400 text-xs font-bold uppercase tracking-[0.16em] mb-2">
                <TranslatedText text={`Step ${step.step}`} />
              </p>
              <h3 className="font-manrope text-2xl font-bold text-primary-900 mb-3">
                <TranslatedText text={step.title} />
              </h3>
              <p className="text-primary-600/80 text-base leading-relaxed max-w-xl">
                <TranslatedText text={step.desc} />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section id="platform" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <TranslatedText text="Platform" />
          </p>
          <h2 className="font-manrope text-3xl lg:text-4xl font-bold text-primary-900 tracking-tight leading-tight mb-3">
            <TranslatedText text="Everything needed to run modern road freight" />
          </h2>
          <p className="text-primary-600/80 text-base leading-relaxed">
            <TranslatedText text="Marketplace allocation, fleet operations, visibility, and finance—connected instead of bolted on." />
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-primary-100 border border-primary-100">
          {PILLARS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="bg-white p-7 group hover:bg-primary-50 transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center border border-primary-200 text-primary-500 mb-5 group-hover:bg-primary-500 group-hover:border-primary-500 group-hover:text-white transition-colors">
                <item.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-manrope text-base font-bold text-primary-900 mb-2">
                <TranslatedText text={item.title} />
              </h3>
              <p className="text-sm text-primary-600/75 leading-relaxed">
                <TranslatedText text={item.desc} />
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinanceSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="finance" className="bg-primary-950 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="text-primary-300 text-xs font-bold uppercase tracking-[0.18em] mb-3">
              <TranslatedText text="Embedded finance" />
            </p>
            <h2 className="font-manrope text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
              <TranslatedText text="Cash flow that moves with the load" />
            </h2>
            <p className="text-primary-200/80 text-base leading-relaxed mb-8">
              <TranslatedText text="African freight stalls on payment cycles. UrutiX keeps liquidity inside the same journey as matching, tracking, and delivery." />
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              <TranslatedText text="Explore finance tools" />
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 space-y-3">
            {FINANCE_ITEMS.map((item, index) => {
              const open = openIndex === index
              const ItemIcon = item.icon
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className={`w-full text-left border p-5 sm:p-6 transition-colors ${
                    open
                      ? "bg-primary-900 border-primary-700"
                      : "bg-transparent border-primary-800 hover:border-primary-600"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 shrink-0 flex items-center justify-center ${
                        open ? "bg-primary-500 text-white" : "border border-primary-700 text-primary-300"
                      }`}
                    >
                      <ItemIcon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-manrope text-base sm:text-lg font-bold text-white">
                          <TranslatedText text={item.title} />
                        </h3>
                        <ChevronRight
                          className={`w-4 h-4 text-primary-400 shrink-0 transition-transform ${
                            open ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm text-primary-200/80 leading-relaxed mt-2 overflow-hidden"
                          >
                            <TranslatedText text={item.desc} />
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function MarketplaceSection() {
  const points = [
    "Your brand, subdomain, and customer experience",
    "Tenant users, roles, and feature controls",
    "Credit marketplace priced for your network",
    "Shared core for matching, trips, and finance",
  ]

  return (
    <section id="marketplace" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="border border-primary-100 bg-primary-50 overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-14">
              <div className="inline-flex items-center gap-2 text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <TranslatedText text="For logistics operators" />
              </div>
              <h2 className="font-manrope text-3xl lg:text-4xl font-bold text-primary-900 tracking-tight leading-tight mb-4">
                <TranslatedText text="Run your own branded freight marketplace" />
              </h2>
              <p className="text-primary-600/80 text-base leading-relaxed mb-8">
                <TranslatedText text="UrutiX is multi-tenant by design. Launch a white-label network for your shippers and carriers without rebuilding matching, tracking, or finance from scratch." />
              </p>
              <ul className="space-y-3 mb-9">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-primary-800 font-medium">
                      <TranslatedText text={point} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
              >
                <TranslatedText text="Talk to us about white-label" />
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Interactive product glimpse */}
            <div className="bg-primary-950 p-8 sm:p-10 lg:p-12 flex items-center border-t lg:border-t-0 lg:border-l border-primary-900">
              <div className="w-full space-y-3">
                <p className="text-primary-300 text-xs font-bold uppercase tracking-[0.16em] mb-4">
                  <TranslatedText text="Workspace preview" />
                </p>
                {[
                  { label: "Active loads", value: "Matching · Auction" },
                  { label: "Live trips", value: "GPS · Geofence · ETA" },
                  { label: "Finance queue", value: "Credits · Loans · Escrow" },
                  { label: "Tenant controls", value: "Brand · Roles · Features" },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between gap-4 border border-primary-800 bg-primary-900/60 px-4 py-3.5 cursor-default"
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
      </div>
    </section>
  )
}

function TrustSection() {
  const items = [
    { title: "Role-based access", desc: "Shipper, fleet, driver, broker, lender, and admin workspaces." },
    { title: "Digital POD", desc: "Confirm delivery with records ready for settlement and audit." },
    { title: "Insurance-ready", desc: "Keep policy and claim context close to the trip." },
    { title: "Reputation signals", desc: "Ratings and performance history support better matching." },
  ]

  return (
    <section className="bg-white pb-8 lg:pb-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-primary-100 border border-primary-100">
          {items.map((item) => (
            <div key={item.title} className="bg-white p-6">
              <h3 className="font-manrope text-sm font-bold text-primary-900 mb-1.5">
                <TranslatedText text={item.title} />
              </h3>
              <p className="text-sm text-primary-600/75 leading-relaxed">
                <TranslatedText text={item.desc} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="bg-primary-500 px-8 py-12 lg:px-14 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="font-manrope text-2xl lg:text-3xl font-bold text-white tracking-tight mb-3">
              <TranslatedText text="Ready to move freight on UrutiX?" />
            </h2>
            <p className="text-primary-100 text-base leading-relaxed">
              <TranslatedText text="Join as a shipper, fleet, broker, or lender—or launch a branded marketplace for your own network." />
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-primary-50 text-primary-700 font-semibold px-6 py-3.5 rounded-lg text-sm transition-colors"
            >
              <TranslatedText text="Create account" />
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 border border-white/40 hover:border-white text-white font-semibold px-6 py-3.5 rounded-lg text-sm transition-colors"
            >
              <TranslatedText text="Contact sales" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { contact } = useContactSettings()

  return (
    <footer id="contact" className="bg-primary-950 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <img
              src={logoUrutiX}
              alt="UrutiX"
              className="h-9 w-auto brightness-0 invert mb-5 object-contain"
            />
            <p className="text-primary-300/70 text-sm leading-relaxed mb-6 max-w-xs">
              <TranslatedText text="Africa’s smart logistics platform for matching, visibility, and embedded finance across road freight." />
            </p>
            <div className="flex gap-2">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 border border-primary-800 flex items-center justify-center text-primary-400 hover:text-white hover:border-primary-500 hover:bg-primary-500 transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-4">
              <TranslatedText text="Product" />
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Who it’s for", href: "#audiences" },
                { label: "How it works", href: "#how-it-works" },
                { label: "Platform", href: "#platform" },
                { label: "Finance", href: "#finance" },
                { label: "White-label", href: "#marketplace" },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-primary-300/60 text-sm hover:text-primary-200 transition-colors">
                    <TranslatedText text={item.label} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-4">
              <TranslatedText text="Get started" />
            </p>
            <ul className="space-y-2.5">
              {["Cargo owners", "Fleet owners", "Drivers", "Brokers", "Lenders"].map((item) => (
                <li key={item}>
                  <Link to="/auth" className="text-primary-300/60 text-sm hover:text-primary-200 transition-colors">
                    <TranslatedText text={item} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-4">
              <TranslatedText text="Contact" />
            </p>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <span className="text-primary-300/60 text-sm">{contact.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary-400 shrink-0" />
                <a href={`tel:${contact.phone}`} className="text-primary-300/60 text-sm hover:text-primary-200 transition-colors">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary-400 shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-primary-300/60 text-sm hover:text-primary-200 transition-colors">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-primary-400/50 text-xs">
            © {new Date().getFullYear()} UrutiX. <TranslatedText text="All rights reserved." />
          </p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Cookies"].map((item) => (
              <a key={item} href="#" className="text-primary-400/50 text-xs hover:text-primary-300 transition-colors">
                <TranslatedText text={item} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased bg-white text-primary-900">
      <Navbar />
      <Hero />
      <AudiencesSection />
      <HowItWorksSection />
      <PlatformSection />
      <FinanceSection />
      <MarketplaceSection />
      <TrustSection />
      <CtaBand />
      <Footer />
    </div>
  )
}
