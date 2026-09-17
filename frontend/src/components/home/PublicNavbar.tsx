import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  Search,
  Package,
  Truck,
  UserRound,
  HeartHandshake,
  Landmark,
  Route,
  Gavel,
  Radio,
  Wallet,
  Building2,
  ShieldCheck,
  MapPin,
} from "lucide-react"
import logoUrutiX from "../../assets/urutiX Logistics Logo (1).svg"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TranslatedText } from "@/components/translated-text"

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
  PARKING_RESERVATION_MANAGER: "/dashboard/parking/reservations",
}

const SEGMENT_TABS = [
  { label: "Marketplace", to: "/", match: "home" as const },
  { label: "Parking", to: "/parking-reservation", match: "parking" as const },
  { label: "Finance", to: "/#finance", match: "finance" as const },
  { label: "Platform", to: "/#platform", match: "platform" as const },
  { label: "Support", to: "/#contact", match: "support" as const },
]

const AUDIENCE_ITEMS = [
  { label: "Cargo owners", href: "#audiences", icon: Package, desc: "Post loads and track delivery" },
  { label: "Fleet owners", href: "#audiences", icon: Truck, desc: "Keep trucks loaded" },
  { label: "Drivers", href: "#audiences", icon: UserRound, desc: "Clear missions and earnings" },
  { label: "Brokers", href: "#audiences", icon: HeartHandshake, desc: "Close deals with visibility" },
  { label: "Lenders", href: "#finance", icon: Landmark, desc: "Finance real freight work" },
]

const PLATFORM_ITEMS = [
  { label: "Smart matching", href: "#platform", icon: Route },
  { label: "Bidding & auctions", href: "#platform", icon: Gavel },
  { label: "Live visibility", href: "#platform", icon: Radio },
  { label: "Embedded finance", href: "#finance", icon: Wallet },
  { label: "White-label marketplace", href: "#marketplace", icon: Building2 },
  { label: "Trusted operations", href: "#platform", icon: ShieldCheck },
]

const PARKING_LINKS = [
  { label: "Reserve Truck Parking", to: "/parking-reservation", desc: "Book a bay for your truck" },
  { label: "Look up reservation", to: "/parking-reservation/lookup", desc: "Check status and pay" },
]

const SEARCH_ITEMS = [
  { label: "Who it's for", href: "/#audiences" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Platform", href: "/#platform" },
  { label: "Finance", href: "/#finance" },
  { label: "White-label marketplace", href: "/#marketplace" },
  { label: "Contact", href: "/#contact" },
  { label: "Reserve Truck Parking", href: "/parking-reservation" },
  { label: "Look up reservation", href: "/parking-reservation/lookup" },
  { label: "Sign in", href: "/auth" },
]

function segmentActive(match: (typeof SEGMENT_TABS)[number]["match"], pathname: string, hash: string) {
  if (match === "parking") return pathname.startsWith("/parking-reservation")
  if (match === "finance") return pathname === "/" && hash === "#finance"
  if (match === "platform") return pathname === "/" && (hash === "#platform" || hash === "#marketplace")
  if (match === "support") return pathname === "/" && hash === "#contact"
  return pathname === "/" && !["#finance", "#platform", "#marketplace", "#contact"].includes(hash)
}

export function PublicNavbar({ alwaysSolid = false }: { alwaysSolid?: boolean }) {
  const [open, setOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeHref, setActiveHref] = useState("#home")
  const menuTimeout = useRef<number | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const { user } = useAuth()
  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? "/dashboard") : null
  const isHome = location.pathname === "/"
  const overlay = isHome && !alwaysSolid
  const parkingActive = location.pathname.startsWith("/parking-reservation")
  const pageHash = isHome ? (activeHref.startsWith("#") ? activeHref : location.hash) : location.hash

  useEffect(() => {
    if (!isHome) return
    const ids = ["home", "audiences", "how-it-works", "platform", "finance", "marketplace", "contact"]
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (!elements.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActiveHref(`#${visible[0].target.id}`)
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [isHome])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setSearchOpen(false)
        setOpenMenu(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    setOpenMenu(null)
    setOpen(false)
    setSearchOpen(false)
    setSearchQuery("")
  }, [location.pathname, location.hash])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    window.addEventListener("mousedown", onPointerDown)
    return () => window.removeEventListener("mousedown", onPointerDown)
  }, [])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`)

  const openMega = (id: string) => {
    if (menuTimeout.current) window.clearTimeout(menuTimeout.current)
    setOpenMenu(id)
    setSearchOpen(false)
  }

  const closeMegaSoon = () => {
    if (menuTimeout.current) window.clearTimeout(menuTimeout.current)
    menuTimeout.current = window.setTimeout(() => setOpenMenu(null), 160)
  }

  const filteredSearch = SEARCH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  const navItemClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-2 text-[15px] font-medium text-[#202020] hover:text-primary-500 transition-colors ${
      active ? "font-bold text-primary-500" : ""
    }`

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 ${overlay ? "" : "bg-primary-950"}`}>
        {overlay && (
          <div
            className="absolute inset-x-0 top-0 h-44 pointer-events-none bg-gradient-to-b from-primary-950/96 to-transparent"
            aria-hidden
          />
        )}

        <div className="relative px-[4%] lg:px-[5%] pt-3 pb-2">
          <div className="flex items-center justify-between gap-3">
            <nav className="hidden md:flex items-center" aria-label="Segments">
              {SEGMENT_TABS.map((tab) => {
                const active = segmentActive(tab.match, location.pathname, pageHash)
                return (
                  <Link
                    key={tab.label}
                    to={tab.to}
                    className={`relative uppercase text-[13px] tracking-wide text-white px-3 lg:px-5 py-1 ${
                      active ? "font-bold" : "font-normal"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-primary-400 text-lg leading-none">
                        •
                      </span>
                    )}
                    <TranslatedText text={tab.label} />
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-1 ml-auto" ref={searchRef}>
              <LanguageSwitcher variant="light" />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((v) => !v)
                  setOpenMenu(null)
                }}
                className="w-9 h-9 inline-flex items-center justify-center text-white hover:text-primary-300 transition-colors"
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-[4%] top-full mt-1 w-[min(22rem,calc(100vw-2rem))] bg-white rounded shadow-xl border border-black/5 p-3 z-50"
                  >
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search UrutiX"
                      className="w-full h-10 px-3 rounded border border-neutral-200 text-sm text-[#202020] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                    <ul className="mt-2 max-h-64 overflow-auto">
                      {filteredSearch.length === 0 ? (
                        <li className="px-3 py-3 text-sm text-neutral-500">
                          <TranslatedText text="No matches" />
                        </li>
                      ) : (
                        filteredSearch.map((item) => (
                          <li key={item.href}>
                            <Link
                              to={item.href}
                              onClick={() => setSearchOpen(false)}
                              className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#202020] hover:bg-primary-50"
                            >
                              <TranslatedText text={item.label} />
                              <ArrowRight className="w-3.5 h-3.5 text-primary-400" />
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative mx-[2.5%] lg:mx-[2.34%]">
          <div className="bg-white rounded shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-visible">
            <div className="flex items-center justify-between h-14 lg:h-20 px-3 sm:px-5 lg:px-7">
              <Link to="/" className="shrink-0" onClick={() => setActiveHref("#home")}>
                <img src={logoUrutiX} alt="UrutiX" className="h-9 sm:h-11 lg:h-12 w-auto object-contain" />
              </Link>

              <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
                <div className="relative" onMouseEnter={() => openMega("audiences")} onMouseLeave={closeMegaSoon}>
                  <a href={sectionHref("#audiences")} className={navItemClass(isHome && activeHref === "#audiences")}>
                    <TranslatedText text="Who it's for" />
                    <ChevronDown className={`w-3.5 h-3.5 ${openMenu === "audiences" ? "rotate-180" : ""}`} />
                  </a>
                </div>
                <a
                  href={sectionHref("#how-it-works")}
                  onClick={() => setActiveHref("#how-it-works")}
                  className={navItemClass(isHome && activeHref === "#how-it-works")}
                >
                  <TranslatedText text="How it works" />
                </a>
                <div className="relative" onMouseEnter={() => openMega("platform")} onMouseLeave={closeMegaSoon}>
                  <a
                    href={sectionHref("#platform")}
                    className={navItemClass(isHome && (activeHref === "#platform" || activeHref === "#marketplace"))}
                  >
                    <TranslatedText text="Platform" />
                    <ChevronDown className={`w-3.5 h-3.5 ${openMenu === "platform" ? "rotate-180" : ""}`} />
                  </a>
                </div>
                <a
                  href={sectionHref("#finance")}
                  onClick={() => setActiveHref("#finance")}
                  className={navItemClass(isHome && activeHref === "#finance")}
                >
                  <TranslatedText text="Finance" />
                </a>
                <div className="relative" onMouseEnter={() => openMega("parking")} onMouseLeave={closeMegaSoon}>
                  <button
                    type="button"
                    onClick={() => setOpenMenu((v) => (v === "parking" ? null : "parking"))}
                    className={navItemClass(parkingActive)}
                    aria-expanded={openMenu === "parking"}
                  >
                    <TranslatedText text="Truck Parking" />
                    <ChevronDown className={`w-3.5 h-3.5 ${openMenu === "parking" ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </nav>

              <div className="hidden md:flex items-center gap-3">
                {dashboardPath ? (
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-2 h-10 px-4 text-[13px] font-semibold text-[#202020] hover:text-primary-500"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <TranslatedText text="Dashboard" />
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" className="text-[14px] font-medium text-[#202020] hover:text-primary-500">
                      <TranslatedText text="Sign in" />
                    </Link>
                    <Link
                      to="/auth"
                      className="inline-flex items-center h-10 px-5 border-2 border-[#202020] text-[#202020] text-[13px] font-medium uppercase rounded-full hover:bg-primary-500 hover:border-primary-500 hover:text-white transition-colors"
                    >
                      <TranslatedText text="Get started" />
                    </Link>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 text-[#202020]"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            <AnimatePresence>
              {openMenu && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden lg:block overflow-hidden border-t border-neutral-200"
                  onMouseEnter={() => openMenu && openMega(openMenu)}
                  onMouseLeave={closeMegaSoon}
                >
                  <div className="px-7 py-6">
                    {openMenu === "audiences" && (
                      <div className="grid grid-cols-3 gap-x-10 gap-y-4">
                        {AUDIENCE_ITEMS.map((item) => {
                          const Icon = item.icon
                          return (
                            <a
                              key={item.label}
                              href={sectionHref(item.href)}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-start gap-3 py-2 hover:text-primary-500"
                            >
                              <Icon className="w-5 h-5 text-primary-500 mt-0.5" />
                              <span>
                                <span className="block text-[15px] font-semibold text-[#202020]">
                                  <TranslatedText text={item.label} />
                                </span>
                                <span className="block text-sm text-neutral-500 mt-0.5">
                                  <TranslatedText text={item.desc} />
                                </span>
                              </span>
                            </a>
                          )
                        })}
                      </div>
                    )}
                    {openMenu === "platform" && (
                      <div className="grid grid-cols-3 gap-x-10 gap-y-3">
                        {PLATFORM_ITEMS.map((item) => {
                          const Icon = item.icon
                          return (
                            <a
                              key={item.label}
                              href={sectionHref(item.href)}
                              onClick={() => setOpenMenu(null)}
                              className="flex items-center gap-3 py-2 text-[15px] font-medium text-[#202020] hover:text-primary-500"
                            >
                              <Icon className="w-4 h-4 text-primary-500" />
                              <TranslatedText text={item.label} />
                            </a>
                          )
                        })}
                      </div>
                    )}
                    {openMenu === "parking" && (
                      <div className="grid grid-cols-2 gap-6 max-w-xl">
                        {PARKING_LINKS.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setOpenMenu(null)}
                            className="block py-2"
                          >
                            <span className="block text-[15px] font-semibold text-[#202020]">
                              <TranslatedText text={item.label} />
                            </span>
                            <span className="block text-sm text-neutral-500 mt-0.5">
                              <TranslatedText text={item.desc} />
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {open && (
                <motion.div
                  id="mobile-nav"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden overflow-hidden border-t border-neutral-200 max-h-[70vh] overflow-y-auto"
                >
                  <nav className="px-4 py-3" aria-label="Mobile">
                    {SEGMENT_TABS.map((tab) => (
                      <Link
                        key={tab.label}
                        to={tab.to}
                        onClick={() => setOpen(false)}
                        className="block py-2.5 text-[13px] uppercase text-[#202020] border-b border-neutral-100"
                      >
                        <TranslatedText text={tab.label} />
                      </Link>
                    ))}
                    {AUDIENCE_ITEMS.map((item) => (
                      <a
                        key={item.label}
                        href={sectionHref(item.href)}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-3 border-b border-neutral-100 text-sm font-medium text-[#202020]"
                      >
                        <item.icon className="w-4 h-4 text-primary-500" />
                        <TranslatedText text={item.label} />
                      </a>
                    ))}
                    <a href={sectionHref("#how-it-works")} onClick={() => setOpen(false)} className="block py-3 border-b border-neutral-100 text-sm font-medium">
                      <TranslatedText text="How it works" />
                    </a>
                    <a href={sectionHref("#platform")} onClick={() => setOpen(false)} className="block py-3 border-b border-neutral-100 text-sm font-medium">
                      <TranslatedText text="Platform" />
                    </a>
                    <a href={sectionHref("#finance")} onClick={() => setOpen(false)} className="block py-3 border-b border-neutral-100 text-sm font-medium">
                      <TranslatedText text="Finance" />
                    </a>
                    {PARKING_LINKS.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 py-3 border-b border-neutral-100 text-sm font-medium"
                      >
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <TranslatedText text={item.label} />
                      </Link>
                    ))}
                    {dashboardPath ? (
                      <Link to={dashboardPath} onClick={() => setOpen(false)} className="flex items-center gap-2 py-4 font-semibold">
                        <LayoutDashboard className="w-4 h-4" />
                        <TranslatedText text="Dashboard" />
                      </Link>
                    ) : (
                      <div className="py-4 flex flex-col gap-3">
                        <Link to="/auth" onClick={() => setOpen(false)} className="text-sm font-medium">
                          <TranslatedText text="Sign in" />
                        </Link>
                        <Link
                          to="/auth"
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center justify-center h-11 border-2 border-[#202020] rounded-full text-sm font-medium uppercase"
                        >
                          <TranslatedText text="Get started" />
                        </Link>
                      </div>
                    )}
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      {!overlay && <div className="h-[7.25rem] lg:h-[8.75rem]" aria-hidden />}
    </>
  )
}
