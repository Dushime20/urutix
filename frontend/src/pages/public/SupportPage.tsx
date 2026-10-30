import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  HelpCircle,
  Truck,
  ShieldCheck,
  Wallet,
  Package,
  ArrowRight,
  ChevronDown,
} from "lucide-react"
import { PublicNavbar } from "@/components/home/PublicNavbar"
import { PublicFooter } from "@/components/home/PublicFooter"
import { TranslatedText } from "@/components/translated-text"
import { useContactSettings } from "@/hooks/useContactSettings"

const FAQS = [
  {
    category: "Getting Started",
    question: "How do I choose the right role when registering on UrutiX?",
    answer:
      "When you sign up at /auth, you can select Cargo Owner (to ship freight), Fleet/Truck Owner (to bid on loads and manage trucks), Driver (to execute assigned trips), Broker (to facilitate deals), or Lender (to finance verified shipments).",
  },
  {
    category: "Marketplace & Matching",
    question: "What is the difference between Smart Matching and Auctions?",
    answer:
      "Smart Matching immediately recommends vetted trucks based on route fit, capacity, and carrier tier score for fast booking. Auctions open a competitive bidding window where carriers submit offers and you select the best bid.",
  },
  {
    category: "Embedded Finance",
    question: "How do Marketplace Credits and Escrow work?",
    answer:
      "Fleet owners use Marketplace Credits to bid and accept matches. Once a trip is contracted, shipper payments are held in milestone escrow and released automatically when digital proof of delivery (e-POD) is confirmed.",
  },
  {
    category: "Truck Parking",
    question: "Can I reserve or look up truck parking without logging in?",
    answer:
      "Yes. You can submit a truck parking reservation request at /parking-reservation and check your approval status or complete payment anytime at /parking-reservation/lookup using your reference code and email.",
  },
  {
    category: "White-Label Tenants",
    question: "How can my logistics company launch a white-label marketplace?",
    answer:
      "UrutiX supports multi-tenant white-label deployments with custom branding, subdomains, user governance, and custom credit pricing. Contact our enterprise team below or register a tenant workspace to get started.",
  },
] as const

export default function SupportPage() {
  const location = useLocation()
  const { contact } = useContactSettings()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const chatPhone = contact.chatPhone || contact.phone

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
      <section className="relative bg-primary-950 text-white py-16 lg:py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/90 to-primary-900/70" />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-primary-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              <TranslatedText text="Support & Help Center" />
            </p>
            <h1 className="font-manrope text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
              <TranslatedText text="We’re here to keep your freight moving" />
            </h1>
            <p className="text-primary-100/90 text-base sm:text-lg leading-relaxed mb-8">
              <TranslatedText text="Reach our operations and support team, look up a corridor parking reservation, or browse quick answers for shippers, fleets, drivers, brokers, and lenders." />
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <TranslatedText text="Sign in for In-App Ticket Support" />
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/parking-reservation/lookup"
                className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs px-7 py-3.5 rounded-full transition-colors"
              >
                <Truck className="w-4 h-4" />
                <TranslatedText text="Look Up Parking Reservation" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Contact Channels */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-primary-500 text-xs font-bold uppercase tracking-[0.18em] mb-2">
              <TranslatedText text="Direct Channels" />
            </p>
            <h2 className="font-manrope text-3xl font-extrabold text-primary-900 tracking-tight">
              <TranslatedText text="Contact UrutiX Operations" />
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-[1.75rem] bg-[#F4F7FA] p-6">
              <div className="w-11 h-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">
                <TranslatedText text="Call Support" />
              </p>
              <h3 className="font-manrope text-lg font-bold text-primary-900 mb-2">
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="hover:text-primary-600">
                    {contact.phone}
                  </a>
                ) : (
                  <TranslatedText text="Toll-Free Dispatch Line" />
                )}
              </h3>
              <p className="text-xs text-primary-600/80 leading-relaxed">
                <TranslatedText text="Direct assistance for active trips, urgent load matching, and corridor emergencies." />
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-[#F4F7FA] p-6">
              <div className="w-11 h-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">
                <TranslatedText text="Email Desk" />
              </p>
              <h3 className="font-manrope text-lg font-bold text-primary-900 mb-2 break-all">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="hover:text-primary-600">
                    {contact.email}
                  </a>
                ) : (
                  "support@urutix.com"
                )}
              </h3>
              <p className="text-xs text-primary-600/80 leading-relaxed">
                <TranslatedText text="For enterprise onboarding, white-label tenant inquiries, billing, and compliance." />
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-[#F4F7FA] p-6">
              <div className="w-11 h-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">
                <TranslatedText text="Chat & Ticket Center" />
              </p>
              <h3 className="font-manrope text-lg font-bold text-primary-900 mb-2">
                {chatPhone ? (
                  <a href={`tel:${chatPhone}`} className="hover:text-primary-600">
                    {chatPhone}
                  </a>
                ) : (
                  <TranslatedText text="24/7 In-App Support" />
                )}
              </h3>
              <p className="text-xs text-primary-600/80 leading-relaxed">
                <TranslatedText text="Open tracked support tickets and dispute resolutions inside your role dashboard." />
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-[#F4F7FA] p-6">
              <div className="w-11 h-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-1">
                <TranslatedText text="Office & Hours" />
              </p>
              <h3 className="font-manrope text-base font-bold text-primary-900 mb-1">
                {contact.address || <TranslatedText text="Kigali, Rwanda · Regional Corridors" />}
              </h3>
              <p className="text-xs text-primary-600/80 leading-relaxed inline-flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                <span>{contact.workingHours || "Mon – Sun · 24/7 Operations"}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Self-Service Quick Links */}
      <section className="py-16 bg-[#F4F7FA]">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <h2 className="font-manrope text-2xl sm:text-3xl font-extrabold text-primary-900 tracking-tight mb-8">
            <TranslatedText text="Self-Service & Guides by Topic" />
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Package,
                title: "Shipper & Load Guide",
                desc: "How to post loads, run auctions, track GPS, and verify e-POD.",
                to: "/who-its-for#cargo",
              },
              {
                icon: Truck,
                title: "Fleet & Parking Help",
                desc: "Book truck parking bays, manage drivers, and find backhaul loads.",
                to: "/parking-reservation",
              },
              {
                icon: Wallet,
                title: "Credits, Loans & Escrow",
                desc: "Understand marketplace credits, working-capital advances, and settlements.",
                to: "/finance",
              },
              {
                icon: ShieldCheck,
                title: "Platform & Compliance",
                desc: "Learn about customs inspections, geofences, and dispute resolution.",
                to: "/platform#trusted-operations",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group bg-white rounded-[1.75rem] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center mb-4 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-manrope text-base font-bold text-primary-900 mb-1.5">
                      <TranslatedText text={item.title} />
                    </h3>
                    <p className="text-xs text-primary-600/80 leading-relaxed mb-4">
                      <TranslatedText text={item.desc} />
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
                    <TranslatedText text="View guide" />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle className="w-4 h-4" />
              <TranslatedText text="Frequently Asked Questions" />
            </div>
            <h2 className="font-manrope text-3xl font-extrabold text-primary-900 tracking-tight">
              <TranslatedText text="Common questions about UrutiX" />
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-slate-200/80 bg-[#F4F7FA]/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-primary-500 mb-1">
                        <TranslatedText text={faq.category} />
                      </span>
                      <span className="font-manrope text-base font-bold text-primary-900">
                        <TranslatedText text={faq.question} />
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-primary-500 shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-primary-700/85 leading-relaxed border-t border-slate-200/50 pt-4">
                      <TranslatedText text={faq.answer} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

