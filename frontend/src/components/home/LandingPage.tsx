import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Phone, Mail, MapPin, ChevronRight, ArrowRight,
  Truck, Package, Plane, CheckCircle2,
  Facebook, Twitter, Linkedin, Instagram, Menu, X,
  TrendingUp, Users, Globe, LayoutDashboard
} from "lucide-react"
import logoUrutiX from "../../assets/urutiX Logistics Logo (1).svg"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TranslatedText } from "@/components/translated-text"

// ─── Role → dashboard route map ───────────────────────────────────────────────
const ROLE_DASHBOARD: Record<string, string> = {
  CARGO_OWNER:  "/dashboard",
  TRUCK_OWNER:  "/dashboard/fleet",
  FLEET_OWNER:  "/dashboard/fleet",
  DRIVER:       "/dashboard/driver",
  ADMIN:        "/admin",
  SUPER_ADMIN:  "/admin",
  TENANT_ADMIN: "/tenant-admin",
  LENDER:       "/lender",
  BROKER:       "/dashboard/broker",
  MANAGER:      "/dashboard",
  AGENT:        "/dashboard",
  USER:         "/dashboard",
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? "/dashboard") : null

  return (
    <header style={{ backgroundColor: "#0D3D4A" }} className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/">
          <img src={logoUrutiX} alt="UrutiX" className="h-8 w-auto brightness-0 invert" />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/80">
          {["Home","Services","Projects","Team","Blog","Contact"].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className="hover:text-white transition-colors">
              <TranslatedText text={n} />
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <Phone className="w-4 h-4 text-orange-400" />
            <span>+1 800 123 4567</span>
          </div>
          <LanguageSwitcher variant="light" />
          {dashboardPath ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <TranslatedText text="Dashboard" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-5 py-2.5 rounded transition-colors"
            >
              <TranslatedText text="Start Now" />
            </Link>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu — full height, 70% width, slides in from left */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            style={{ backgroundColor: "#0D3D4A", width: "70%" }}
            className="fixed top-0 left-0 h-full z-50 flex flex-col md:hidden shadow-2xl"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10 flex-shrink-0">
              <Link to="/" onClick={() => setOpen(false)}>
                <img src={logoUrutiX} alt="UrutiX" className="h-8 w-auto brightness-0 invert" />
              </Link>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col px-6 pt-6 gap-1 overflow-y-auto">
              {["Home","Services","Projects","Team","Blog","Contact"].map(n => (
                <a
                  key={n}
                  href={`#${n.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className="text-white/80 hover:text-white text-base font-medium py-3 border-b border-white/10 transition-colors"
                >
                  <TranslatedText text={n} />
                </a>
              ))}

              {/* Language switcher row */}
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-white/50 text-sm"><TranslatedText text="Language" /></span>
                <LanguageSwitcher variant="light" />
              </div>
            </nav>

            {/* CTA button pinned to bottom */}
            <div className="px-6 pb-8 flex-shrink-0">
              {dashboardPath ? (
                <Link
                  to={dashboardPath}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3.5 rounded transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <TranslatedText text="Dashboard" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-3.5 rounded transition-colors"
                >
                  <TranslatedText text="Start Now" />
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </header>
  )
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "#0D3D4A", minHeight: "580px", marginTop: "64px" }}
    >
      {/* Diagonal bottom clip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 bg-white"
        style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }}
      />

      {/* Ship image — top right */}
      <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden opacity-40">
        <div
          className="w-full h-full"
          style={{
            background: "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800') center/cover no-repeat",
          }}
        />
      </div>

      {/* Dark overlay on right */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full"
        style={{ background: "linear-gradient(to right, #0D3D4A 0%, transparent 60%)" }}
      />

      <div className="relative z-10 max-w-full px-0 pt-8 pb-32">
        {/* Centered text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto px-6 lg:px-8"
        >
          <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-3">
            <TranslatedText text="Logistics Transport Solutions" />
          </p>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            <TranslatedText text="Welcome To UrutiX Cargo Transport Services" />
          </h1>
          <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            <TranslatedText text="We are your most trusted partner for smart cargo management tools, logistics solutions, and a clear view of your entire supply chain." />
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 py-3 rounded text-sm transition-colors"
            >
              <TranslatedText text="Explore Services" /> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Truck image — bottom left, large circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="absolute z-0 pointer-events-none w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[480px] lg:h-[480px] left-4 lg:left-8 -bottom-12 lg:-bottom-24"
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "3px solid rgba(249,115,22,0.35)" }}
        />
        {/* Second ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: "14px",
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        />
        {/* Image circle */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            inset: "24px",
            backgroundImage: "url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=700')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </motion.div>
    </section>
  )
}

// ─── PARTNER STRIP ────────────────────────────────────────────────────────────
function PartnerStrip() {
  const partners = [
    { name: "Logistics Co", icon: <Truck className="w-5 h-5" /> },
    { name: "FreightPro", icon: <Package className="w-5 h-5" /> },
    { name: "AirCargo", icon: <Plane className="w-5 h-5" /> },
    { name: "TruckLines", icon: <Truck className="w-5 h-5" /> },
    { name: "GlobalShip", icon: <Globe className="w-5 h-5" /> },
  ]
  return (
    <section className="bg-white py-10 mt-36">
      <div className="max-w-full px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
          {partners.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors cursor-default">
              <span className="text-orange-400">{p.icon}</span>
              <span className="text-sm font-bold uppercase tracking-wider">
                <TranslatedText text={p.name} />
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-orange-500 font-bold text-sm cursor-pointer hover:text-orange-400">
            <TranslatedText text="View All" />
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FEATURE SECTION ──────────────────────────────────────────────────────────
function FeatureSection() {
  return (
    <section id="services" className="bg-white py-20">
      <div className="max-w-full px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded mb-4">
              <TranslatedText text="Services" />
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4" style={{ color: "#0D3D4A" }}>
              <TranslatedText text="We'll keep your items damage free" />
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              <TranslatedText text="UrutiX Smart Logistics ensures the safest handling and transport of your cargo with advanced monitoring, vetted carriers, and end-to-end visibility across every route." />
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                "Secure Shipping", "Climate Control",
                "Fast Delivery", "Smart Tracking",
                "Real-time Updates", "Insurance Cover",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-700 text-sm"><TranslatedText text={item} /></span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded transition-colors"
                style={{ backgroundColor: "#0D3D4A" }}
              >
                <TranslatedText text="Get Started" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">4.9 / 5.0</p>
                  <p className="text-xs text-gray-400"><TranslatedText text="Customer Rating" /></p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — stacked images with orange badge */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Main image */}
            <div
              className="rounded-2xl overflow-hidden w-full aspect-[4/3]"
              style={{
                background: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600') center/cover no-repeat",
              }}
            />
            {/* Small overlapping image */}
            <div
              className="absolute -bottom-6 -left-6 w-40 h-28 rounded-xl overflow-hidden"
              style={{
                background: "url('https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=300') center/cover no-repeat",
              }}
            />
            {/* Orange badge */}
            <div
              className="absolute bottom-4 right-4 text-white rounded-xl px-4 py-3 text-center"
              style={{ backgroundColor: "#F97316" }}
            >
              <p className="text-3xl font-extrabold leading-none">20</p>
              <p className="text-xs font-semibold mt-0.5"><TranslatedText text="Years of Experience" /></p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { icon: <TrendingUp className="w-8 h-8" />, value: "50k", label: "Maritime Freight Transportation" },
    { icon: <Truck className="w-8 h-8" />, value: "25k", label: "Land Freight Transportation" },
    { icon: <Globe className="w-8 h-8" />, value: "25+", label: "Countries Worldwide" },
    { icon: <Package className="w-8 h-8" />, value: "125", label: "Train Freight Transportation" },
  ]
  return (
    <section style={{ backgroundColor: "#0D3D4A" }} className="py-14">
      <div className="max-w-full px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="text-orange-400 flex-shrink-0">{s.icon}</div>
              <div>
                <p className="text-3xl font-extrabold text-white leading-none">{s.value}</p>
                <p className="text-white/50 text-xs mt-1 leading-tight">
                  <TranslatedText text={s.label} />
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SERVICES GRID ────────────────────────────────────────────────────────────
function ServicesGrid() {
  const services = [
    {
      img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=500",
      category: "Maritime",
      title: "Maritime Freight Transportation",
      desc: "Global sea freight solutions with full container and bulk cargo options across major shipping lanes.",
    },
    {
      img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500",
      category: "Land",
      title: "Land Freight Transportation",
      desc: "Reliable road and rail freight across the continent with real-time GPS tracking and driver communication.",
    },
    {
      img: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=500",
      category: "Train",
      title: "Train Freight Transportation",
      desc: "Cost-effective rail freight for bulk shipments with scheduled routes and guaranteed delivery windows.",
    },
  ]
  return (
    <section id="projects" className="py-20" style={{ backgroundColor: "#F0F4F8" }}>
      <div className="max-w-full px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded mb-4">
            <TranslatedText text="Our Services" />
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold" style={{ color: "#0D3D4A" }}>
            <TranslatedText text="Wide Variety of Logistics Services" />
          </h2>
          <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto">
            <TranslatedText text="From sea to land to rail, UrutiX delivers end-to-end logistics solutions tailored to your cargo needs." />
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((svc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="bg-white rounded-2xl overflow-hidden group"
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48">
                <div
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  style={{ background: `url('${svc.img}') center/cover no-repeat` }}
                />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded">
                    <TranslatedText text={svc.category} />
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-base mb-2" style={{ color: "#0D3D4A" }}>
                  <TranslatedText text={svc.title} />
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-4">
                  <TranslatedText text={svc.desc} />
                </p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                >
                  <TranslatedText text="Learn More" /> <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contact" style={{ backgroundColor: "#0D3D4A" }} className="pt-14 pb-6">
      <div className="max-w-full px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <img src={logoUrutiX} alt="UrutiX" className="h-8 w-auto brightness-0 invert mb-4" />
            <p className="text-white/40 text-sm leading-relaxed mb-5">
              <TranslatedText text="Africa's smart logistics platform connecting shippers and carriers with AI-powered efficiency." />
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-orange-500 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white text-sm font-bold mb-4"><TranslatedText text="Services" /></p>
            <ul className="space-y-2">
              {["Maritime Freight","Land Freight","Train Freight","Air Cargo","Warehousing"].map(item => (
                <li key={item}><a href="#" className="text-white/40 text-sm hover:text-white/70 transition-colors"><TranslatedText text={item} /></a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-bold mb-4"><TranslatedText text="Company" /></p>
            <ul className="space-y-2">
              {["About Us","Our Team","Careers","News & Blog","Partners"].map(item => (
                <li key={item}><a href="#" className="text-white/40 text-sm hover:text-white/70 transition-colors"><TranslatedText text={item} /></a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-bold mb-4"><TranslatedText text="Contact" /></p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" /><span className="text-white/40 text-sm">Kigali, Rwanda · Nairobi, Kenya</span></li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-400" /><a href="tel:+250700000000" className="text-white/40 text-sm hover:text-white/70">+250 700 000 000</a></li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400" /><a href="mailto:hello@urutix.com" className="text-white/40 text-sm hover:text-white/70">hello@urutix.com</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} UrutiX Smart Logistics. <TranslatedText text="All rights reserved." />
          </p>
          <div className="flex gap-5">
            {["Privacy Policy","Terms of Service","Cookies"].map(item => (
              <a key={item} href="#" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                <TranslatedText text={item} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased">
      <Navbar />
      <Hero />
      <PartnerStrip />
      <FeatureSection />
      <StatsBar />
      <ServicesGrid />
      <Footer />
    </div>
  )
}
