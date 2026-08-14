import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Phone,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
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
  PARKING_RESERVATION_MANAGER: "/dashboard/parking/reservations",
}

const NAV_LINKS = [
  { label: "Who it's for", href: "#audiences" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Platform", href: "#platform" },
  { label: "Finance", href: "#finance" },
  { label: "Contact", href: "#contact" },
]

const PARKING_LINKS = [
  { label: "Reserve Truck Parking", to: "/parking-reservation" },
  { label: "Look up reservation", to: "/parking-reservation/lookup" },
]

export function PublicNavbar({ alwaysSolid = false }: { alwaysSolid?: boolean }) {
  const [open, setOpen] = useState(false)
  const [parkingOpen, setParkingOpen] = useState(false)
  const [scrolled, setScrolled] = useState(alwaysSolid)
  const [activeHref, setActiveHref] = useState("#home")
  const parkingRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const { user } = useAuth()
  const { contact } = useContactSettings()
  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? "/dashboard") : null
  const isHome = location.pathname === "/"
  const parkingActive = location.pathname.startsWith("/parking-reservation")
  const solid = alwaysSolid || scrolled || open

  useEffect(() => {
    if (alwaysSolid) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [alwaysSolid])

  useEffect(() => {
    if (!isHome) return
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
  }, [isHome])

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

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (parkingRef.current && !parkingRef.current.contains(event.target as Node)) {
        setParkingOpen(false)
      }
    }
    window.addEventListener("mousedown", onPointerDown)
    return () => window.removeEventListener("mousedown", onPointerDown)
  }, [])

  useEffect(() => {
    setParkingOpen(false)
    setOpen(false)
  }, [location.pathname])

  const isActive = (href: string) =>
    isHome && (activeHref === href || (href === "#platform" && activeHref === "#marketplace"))

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`)

  const navItemClass = (active: boolean) =>
    `relative px-3.5 py-2 text-[13px] font-semibold tracking-tight rounded-md transition-colors ${
      active
        ? "text-primary-500"
        : "text-primary-700 hover:text-primary-500 hover:bg-primary-50"
    }`

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        solid
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
                  href={sectionHref(item.href)}
                  onClick={() => setActiveHref(item.href)}
                  className={navItemClass(active)}
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

            <div className="relative" ref={parkingRef}>
              <button
                type="button"
                onClick={() => setParkingOpen((value) => !value)}
                aria-expanded={parkingOpen}
                aria-haspopup="menu"
                className={`${navItemClass(parkingActive)} inline-flex items-center gap-1`}
              >
                <TranslatedText text="Truck Parking" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${parkingOpen ? "rotate-180" : ""}`} />
                {parkingActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-3.5 right-3.5 -bottom-0.5 h-0.5 bg-primary-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              {parkingOpen && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-1 w-60 bg-white border border-primary-100 rounded-lg shadow-lg py-1 z-50"
                >
                  {PARKING_LINKS.map((item) => {
                    const active = location.pathname === item.to
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setParkingOpen(false)}
                        className={`block px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
                          active
                            ? "text-primary-500 bg-primary-50"
                            : "text-primary-700 hover:text-primary-500 hover:bg-primary-50"
                        }`}
                      >
                        <TranslatedText text={item.label} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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

          <div className="flex lg:hidden items-center gap-1.5">
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
              className="fixed inset-0 top-16 bg-primary-950/35 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-50 lg:hidden border-b border-primary-100 bg-white"
            >
              <nav className="px-5 py-3" aria-label="Mobile">
                {NAV_LINKS.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <a
                      key={item.href}
                      href={sectionHref(item.href)}
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
                {PARKING_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between py-3.5 border-b border-primary-50 text-sm font-semibold ${
                      location.pathname === item.to ? "text-primary-500" : "text-primary-800"
                    }`}
                  >
                    <TranslatedText text={item.label} />
                    <ChevronRight className="w-4 h-4 text-primary-300" />
                  </Link>
                ))}
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
