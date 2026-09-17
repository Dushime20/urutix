import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Truck,
  Package,
  Gavel,
  CheckCircle2,
  Route,
  ShieldCheck,
  Wallet,
  Radio,
  Building2,
  HeartHandshake,
  UserRound,
  Landmark,
  ChevronRight,
  ChevronLeft,
  MapPinned,
  FileCheck2,
  CreditCard,
  BadgeCheck,
  MessageCircle,
  Clock,
} from "lucide-react"
import { TranslatedText } from "@/components/translated-text"
import { useContactSettings } from "@/hooks/useContactSettings"
import { PublicNavbar } from "./PublicNavbar"

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
    tile: "bg-primary-500 text-white",
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
    tile: "bg-primary-900 text-white",
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
    tile: "bg-primary-100 text-primary-900",
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
    tile: "bg-primary-700 text-white",
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
    tile: "bg-primary-50 text-primary-900",
  },
] as const

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Post the load",
    desc: "Cargo owners publish origin, destination, cargo type, and requirements—or use templates for repeat lanes.",
    icon: Package,
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1200&q=80",
  },
  {
    step: "02",
    title: "Match or auction",
    desc: "UrutiX recommends capacity with smart matching, or you open a reverse/forward auction for competitive bids.",
    icon: Gavel,
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
  },
  {
    step: "03",
    title: "Assign & move",
    desc: "Confirm truck and driver, start the trip, and monitor GPS, geofences, and operational status in real time.",
    icon: MapPinned,
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80",
  },
  {
    step: "04",
    title: "Deliver & settle",
    desc: "Capture digital POD, close the journey, settle payments—and unlock credits or financing when needed.",
    icon: FileCheck2,
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    href: "#finance",
  },
  {
    icon: Wallet,
    title: "Working capital loans",
    desc: "Lenders fund transporters against real platform activity—not paperwork alone.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    href: "#finance",
  },
  {
    icon: BadgeCheck,
    title: "Escrow & settlement",
    desc: "Hold and release funds against verified milestones so shippers and carriers stay aligned.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    href: "#finance",
  },
] as const

const GET_DOING = [
  {
    title: "You're in control of every load",
    desc: "Post loads once, reach vetted capacity, and manage matching, tracking, and settlement in one place.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&q=80",
    href: "#audiences",
  },
  {
    title: "Keep trucks moving across the network",
    desc: "Discover loads that fit your routes and assets, then run trips with GPS, ETA, and digital proof of delivery.",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1400&q=80",
    href: "#how-it-works",
  },
  {
    title: "Why wait on cash when finance is built in?",
    desc: "Credits, loans, escrow, and settlements sit inside the same freight workflow as matching and delivery.",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1400&q=80",
    href: "#finance",
  },
] as const

const EXPAND_CARDS = [
  {
    title: "Marketplace",
    desc: "Match cargo to capacity by route fit, asset type, proximity, and performance.",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80",
    href: "#platform",
  },
  {
    title: "UrutiX App",
    desc: "The services you use in one place—loads, trips, parking, and finance, no more chasing calls.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80",
    href: "/auth",
  },
  {
    title: "Truck Parking",
    desc: "Reserve a bay, look up your booking, and keep your fleet moving between trips.",
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&q=80",
    href: "/parking-reservation",
  },
] as const

const HERO_COPY =
  "UrutiX is a multi-tenant logistics and embedded-finance platform that turns Africa’s fragmented road-freight market into a single, financeable, data-rich digital network. It connects cargo owners, truck owners, drivers, brokers, fleet operators, lenders, fuel suppliers, and insurers in one ecosystem — and lets any logistics organization launch its own branded marketplace on a shared core."

const HERO_SLIDES = [
  {
    id: "network",
    title: "UrutiX",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80",
  },
  {
    id: "matching",
    title: "Smart matching",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80",
  },
  {
    id: "finance",
    title: "Embedded finance",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1920&q=80",
  },
] as const

const HERO_SLIDE_MS = 8000

function Hero() {
  const [slide, setSlide] = useState(0)
  const reduceMotion = useReducedMotion()
  const current = HERO_SLIDES[slide]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, HERO_SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [slide])

  const goTo = (index: number) => setSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length)

  return (
    <section id="home" className="relative">
      <div className="relative h-[660px] lg:h-[760px] overflow-hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.35 : 0.7 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${current.image}')` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0" style={{ boxShadow: "inset 0px -200px 100px 0px rgba(15,29,43,0.85)" }} />

        <div className="relative z-10 h-full flex flex-col justify-end pb-36 lg:pb-40">
          <div className="w-[84%] max-w-[574px] ml-[8%] mr-[8%]">
            <p className="text-white text-sm lg:text-base leading-6 mb-2">
              <TranslatedText text={current.title === "UrutiX" ? "Logistics & embedded finance" : current.title} />
            </p>
            <h1 className="font-manrope text-white text-[40px] leading-[40px] lg:text-[64px] lg:leading-[64px] font-extrabold m-0">
              UrutiX
            </h1>
            <p className="text-white text-base lg:text-2xl lg:leading-[26px] mt-3 mb-0 max-w-xl line-clamp-4">
              <TranslatedText text={HERO_COPY} className="text-white" />
            </p>
          </div>
        </div>

        <div className="absolute z-20 left-[7.5%] bottom-[118px] flex items-center gap-1.5" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((item, index) => {
            const active = index === slide
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Show slide ${index + 1}`}
                onClick={() => goTo(index)}
                className={`relative w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                  active ? "border-primary-400" : "border-transparent"
                }`}
              >
                <span className={`block w-2.5 h-2.5 rounded-full ${active ? "bg-primary-950" : "bg-[#909090]"}`} />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => goTo(slide - 1)}
          className="absolute z-20 left-3 top-1/2 -translate-y-1/2 w-10 h-10 text-white/80 hover:text-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          type="button"
          onClick={() => goTo(slide + 1)}
          className="absolute z-20 right-3 top-1/2 -translate-y-1/2 w-10 h-10 text-white/80 hover:text-white"
          aria-label="Next slide"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        <div className="absolute z-20 left-[2%] w-[96%] bottom-10 rounded-lg bg-white/30 backdrop-blur-[30px] px-6 py-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center min-w-[216px] border-2 border-white text-white bg-transparent hover:bg-primary-500 hover:border-primary-500 font-medium uppercase text-sm leading-4 px-6 py-3 rounded-full transition-all"
            >
              <TranslatedText text="Join the network" />
            </Link>
            <a
              href="#marketplace"
              className="inline-flex items-center justify-center min-w-[216px] border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary-900 font-medium uppercase text-sm leading-4 px-6 py-3 rounded-full transition-all"
            >
              <TranslatedText text="Launch your marketplace" />
            </a>
          </div>
        </div>
      </div>
      <div className="relative z-10 h-5 -mt-5 bg-white rounded-t-2xl" aria-hidden />
    </section>
  )
}

function TopDeals() {
  const [active, setActive] = useState<(typeof AUDIENCES)[number]["id"]>("cargo")
  const current = AUDIENCES.find((a) => a.id === active) ?? AUDIENCES[0]
  const Icon = current.icon

  return (
    <section id="audiences" className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-2">
              <TranslatedText text="Who it’s for" />
            </p>
            <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight">
              <TranslatedText text="Top deals" />
            </h2>
          </div>
          <a
            href="#platform"
            className="text-xs font-bold uppercase tracking-wider text-primary-500 hover:text-primary-700"
          >
            <TranslatedText text="All deals" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-8">
          {AUDIENCES.map((role) => {
            const selected = role.id === active
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActive(role.id)}
                className={`${role.tile} rounded-[1.75rem] min-h-[7.5rem] sm:min-h-[8.5rem] px-5 py-5 text-left font-manrope text-xl sm:text-2xl font-extrabold leading-tight shadow-sm ring-offset-2 transition-transform hover:-translate-y-0.5 ${
                  selected ? "ring-2 ring-primary-500" : ""
                }`}
              >
                <TranslatedText text={role.label} />
              </button>
            )
          })}
          <a
            href="#marketplace"
            className="bg-primary-600 text-white rounded-[1.75rem] min-h-[7.5rem] sm:min-h-[8.5rem] px-5 py-5 font-manrope text-xl sm:text-2xl font-extrabold leading-tight shadow-sm hover:-translate-y-0.5 transition-transform flex items-end"
          >
            <TranslatedText text="White-label" />
          </a>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-[2rem] bg-primary-50 p-6 sm:p-8 lg:p-10"
          >
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-500 text-white mb-5">
                  <Icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-primary-900 mb-3">
                  <TranslatedText text={current.title} />
                </h3>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary-500 hover:text-primary-700"
                >
                  <TranslatedText text={current.cta} />
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-3">
                {current.points.map((point) => (
                  <li key={point} className="flex gap-3 bg-white rounded-2xl p-4">
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

function GetDoingSection() {
  return (
    <section className="bg-[#F4F7FA] py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight mb-10">
          <TranslatedText text="Get doing with UrutiX" />
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {GET_DOING.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="group bg-white rounded-[1.75rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={card.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="font-manrope text-xl font-bold text-primary-900 mb-2 leading-snug">
                  <TranslatedText text={card.title} />
                </h3>
                <p className="text-sm text-primary-600/80 leading-relaxed">
                  <TranslatedText text={card.desc} />
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const step = JOURNEY_STEPS[activeStep]
  const StepIcon = step.icon

  return (
    <section id="how-it-works" className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <TranslatedText text="How it works" />
          </p>
          <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-3">
            <TranslatedText text="From load post to settlement—one clear journey" />
          </h2>
          <p className="text-primary-600/80 text-base leading-relaxed">
            <TranslatedText text="Click each step to follow the same lifecycle your teams use inside UrutiX." />
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 space-y-3">
            {JOURNEY_STEPS.map((item, index) => {
              const selected = index === activeStep
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`w-full text-left rounded-[1.5rem] px-5 py-4 transition-colors ${
                    selected ? "bg-primary-500 text-white" : "bg-primary-50 text-primary-900 hover:bg-primary-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-manrope text-sm font-bold ${selected ? "text-white/70" : "text-primary-400"}`}>
                      {item.step}
                    </span>
                    <span className="font-semibold">
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
              className="lg:col-span-8 rounded-[2rem] overflow-hidden bg-primary-50"
            >
              <div className="grid sm:grid-cols-2 h-full">
                <div className="min-h-[220px] bg-cover bg-center" style={{ backgroundImage: `url('${step.image}')` }} />
                <div className="p-7 sm:p-9 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-500 text-white mb-5">
                    <StepIcon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <p className="text-primary-400 text-xs font-bold uppercase tracking-[0.16em] mb-2">
                    <TranslatedText text={`Step ${step.step}`} />
                  </p>
                  <h3 className="font-manrope text-2xl font-bold text-primary-900 mb-3">
                    <TranslatedText text={step.title} />
                  </h3>
                  <p className="text-primary-600/80 text-base leading-relaxed">
                    <TranslatedText text={step.desc} />
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section id="platform" className="bg-[#F4F7FA] py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <TranslatedText text="Platform" />
          </p>
          <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-3">
            <TranslatedText text="Everything needed to run modern road freight" />
          </h2>
          <p className="text-primary-600/80 text-base leading-relaxed">
            <TranslatedText text="Marketplace allocation, fleet operations, visibility, and finance—connected instead of bolted on." />
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="bg-white rounded-[1.75rem] p-7 group hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary-50 text-primary-500 mb-5 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                <item.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-manrope text-lg font-bold text-primary-900 mb-2">
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

function PromoCards() {
  return (
    <section id="finance" className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-3">
            <TranslatedText text="Embedded finance" />
          </p>
          <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-3">
            <TranslatedText text="Cash flow that moves with the load" />
          </h2>
          <p className="text-primary-600/80 text-base leading-relaxed">
            <TranslatedText text="African freight stalls on payment cycles. UrutiX keeps liquidity inside the same journey as matching, tracking, and delivery." />
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FINANCE_ITEMS.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group rounded-[1.75rem] overflow-hidden bg-primary-50 hover:shadow-md transition-shadow"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={item.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="font-manrope text-xl font-bold text-primary-900 mb-2">
                  <TranslatedText text={item.title} />
                </h3>
                <p className="text-sm text-primary-600/80 leading-relaxed mb-4">
                  <TranslatedText text={item.desc} />
                </p>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-500">
                  <TranslatedText text="Read more" />
                </span>
              </div>
            </a>
          ))}
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
    <section id="marketplace" className="bg-[#F4F7FA] py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] overflow-hidden bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-14">
              <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-4">
                <TranslatedText text="For logistics operators" />
              </p>
              <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight leading-tight mb-4">
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
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Talk to us about white-label" />
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-primary-950 p-8 sm:p-10 lg:p-12 flex items-center">
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
      </div>
    </section>
  )
}

function ExpandWorld() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <h2 className="font-manrope text-3xl lg:text-4xl font-extrabold text-primary-900 tracking-tight mb-10">
          <TranslatedText text="Expand your world" />
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {EXPAND_CARDS.map((card) => {
            const inner = (
              <>
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={card.image}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-manrope text-2xl font-extrabold text-primary-900 mb-2">
                    <TranslatedText text={card.title} />
                  </h3>
                  <p className="text-sm text-primary-600/80 leading-relaxed">
                    <TranslatedText text={card.desc} />
                  </p>
                </div>
              </>
            )
            const className =
              "group bg-[#F4F7FA] rounded-[1.75rem] overflow-hidden hover:shadow-md transition-shadow"
            return card.href.startsWith("/") ? (
              <Link key={card.title} to={card.href} className={className}>
                {inner}
              </Link>
            ) : (
              <a key={card.title} href={card.href} className={className}>
                {inner}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function HelpBar() {
  const links = [
    { label: "Help", href: "#contact" },
    { label: "Getting started", href: "/auth" },
    { label: "Truck parking", href: "/parking-reservation" },
  ]

  return (
    <section className="bg-white">
      <div className="mx-auto w-[88%] max-w-[1200px] px-0">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 py-6">
          {links.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-[#202020] hover:text-primary-500"
              >
                <TranslatedText text={item.label} />
              </Link>
            ) : (
              <a key={item.label} href={item.href} className="text-sm font-medium text-[#202020] hover:text-primary-500">
                <TranslatedText text={item.label} />
              </a>
            )
          )}
        </div>
      </div>
    </section>
  )
}

function MostViewed() {
  const items = [
    { title: "Role-based access", desc: "Shipper, fleet, driver, broker, lender, and admin workspaces." },
    { title: "Digital POD", desc: "Confirm delivery with records ready for settlement and audit." },
    { title: "Insurance-ready", desc: "Keep policy and claim context close to the trip." },
    { title: "Reputation signals", desc: "Ratings and performance history support better matching." },
  ]

  return (
    <section className="bg-white py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <h2 className="font-manrope text-2xl font-extrabold text-primary-900 tracking-tight mb-6">
          <TranslatedText text="Most viewed topics" />
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] bg-primary-50 p-5">
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
    <section className="bg-white pb-16 lg:pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="bg-primary-500 rounded-[2rem] px-8 py-12 lg:px-14 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="font-manrope text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-3">
              <TranslatedText text="Ready to move freight on UrutiX?" />
            </h2>
            <p className="text-primary-100 text-base leading-relaxed">
              <TranslatedText text="Join as a shipper, fleet, broker, or lender—or launch a branded marketplace for your own network." />
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-primary-50 text-primary-700 font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
            >
              <TranslatedText text="Create account" />
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 border border-white/50 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
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
  const [panel, setPanel] = useState<"contact" | "sites" | null>("contact")
  const chatPhone = contact.chatPhone || contact.phone
  const hasContact =
    Boolean(contact.phone || contact.email || chatPhone || contact.address || contact.workingHours)

  const moreSites = [
    { label: "Who it’s for", href: "#audiences" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Platform", href: "#platform" },
    { label: "Finance", href: "#finance" },
    { label: "White-label", href: "#marketplace" },
    { label: "Truck parking", href: "/parking-reservation" },
  ]

  const socials = [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "LinkedIn", href: "#" },
  ]

  const Badge = ({ children, href }: { children: string; href: string }) => (
    <a
      href={href}
      className="inline-block bg-primary-500 text-white rounded px-2 py-1 text-sm font-bold break-all"
    >
      {children}
    </a>
  )

  return (
    <footer id="contact" className="bg-primary-950 text-white rounded-t-2xl mt-24 pt-16 pb-8">
      <div className="mx-auto w-[88%] max-w-[1200px]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-10 pb-8 border-b-2 border-white/10">
          <a
            href="/parking-reservation"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-primary-300"
          >
            <MapPin className="w-5 h-5 text-primary-400" />
            <TranslatedText text="Coverage map" />
          </a>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === "contact" ? null : "contact"))}
            className="inline-flex items-center gap-2 text-sm font-bold text-white"
          >
            <MessageCircle className="w-5 h-5 text-primary-400" />
            <TranslatedText text="Contact Us" />
          </button>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === "sites" ? null : "sites"))}
            className="inline-flex items-center gap-2 text-sm font-bold text-white"
          >
            <Building2 className="w-5 h-5 text-primary-400" />
            <TranslatedText text="More sites" />
          </button>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:ml-auto">
            {socials.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-primary-400 text-[13px] font-bold uppercase hover:text-white relative after:absolute after:left-0 after:top-6 after:h-px after:w-0 hover:after:w-full after:bg-primary-400 after:transition-all"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {panel === "contact" && (
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 py-10">
            {!hasContact && (
              <p className="sm:col-span-2 text-sm text-white/70">
                <TranslatedText text="Contact details will appear here once they are saved in Admin → Profile → Platform." />
              </p>
            )}
            {contact.phone && (
              <div className="flex items-start gap-4">
                <Phone className="w-10 h-10 text-white shrink-0 mt-1" />
                <div>
                  <p className="text-xs uppercase font-normal mb-2">
                    <TranslatedText text="Call Toll Free" />
                  </p>
                  <Badge href={`tel:${contact.phone}`}>{contact.phone}</Badge>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="flex items-start gap-4">
                <Mail className="w-8 h-8 text-white shrink-0 mt-1" />
                <div>
                  <p className="text-xs uppercase font-normal mb-2">
                    <TranslatedText text="Email" />
                  </p>
                  <Badge href={`mailto:${contact.email}`}>{contact.email}</Badge>
                </div>
              </div>
            )}
            {chatPhone && (
              <div className="flex items-start gap-4">
                <MessageCircle className="w-8 h-8 text-white shrink-0 mt-1" />
                <div>
                  <p className="text-xs uppercase font-normal mb-2">
                    <TranslatedText text="Chat support" />
                  </p>
                  <Badge href={`tel:${chatPhone}`}>{chatPhone}</Badge>
                </div>
              </div>
            )}
            {(contact.address || contact.workingHours) && (
              <div>
                {contact.address && (
                  <>
                    <p className="text-xs uppercase font-bold mb-2">
                      <TranslatedText text="Physical address" />
                    </p>
                    <p className="text-sm text-white/90">{contact.address}</p>
                  </>
                )}
                {contact.workingHours && (
                  <>
                    <p className="text-xs uppercase font-bold mt-4 mb-2 inline-flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <TranslatedText text="Working hours" />
                    </p>
                    <p className="text-sm text-white/90">{contact.workingHours}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {panel === "sites" && (
          <ul className="flex flex-wrap gap-x-10 gap-y-4 py-10">
            {moreSites.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link to={item.href} className="text-sm text-white hover:text-primary-400 capitalize">
                    <TranslatedText text={item.label} />
                  </Link>
                ) : (
                  <a href={item.href} className="text-sm text-white hover:text-primary-400 capitalize">
                    <TranslatedText text={item.label} />
                  </a>
                )}
              </li>
            ))}
            {["Cargo owners", "Fleet owners", "Drivers", "Brokers", "Lenders"].map((item) => (
              <li key={item}>
                <Link to="/auth" className="text-sm text-white hover:text-primary-400 capitalize">
                  <TranslatedText text={item} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 pt-8 border-t-2 border-white/10">
          {["Terms & Conditions", "Privacy Policy", "Cookies"].map((item) => (
            <a key={item} href="#" className="text-sm text-white hover:text-primary-400">
              <TranslatedText text={item} />
            </a>
          ))}
        </div>
        <p className="text-white text-xs uppercase mt-8">
          © {new Date().getFullYear()} UrutiX. <TranslatedText text="All rights reserved." />
        </p>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased bg-white text-primary-900">
      <PublicNavbar />
      <Hero />
      <TopDeals />
      <GetDoingSection />
      <HowItWorksSection />
      <PlatformSection />
      <PromoCards />
      <MarketplaceSection />
      <ExpandWorld />
      <HelpBar />
      <MostViewed />
      <CtaBand />
      <Footer />
    </div>
  )
}
