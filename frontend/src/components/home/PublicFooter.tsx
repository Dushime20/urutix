import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  MessageCircle,
  Clock,
} from "lucide-react"
import { TranslatedText } from "@/components/translated-text"
import { useContactSettings } from "@/hooks/useContactSettings"

export function PublicFooter() {
  const { contact } = useContactSettings()
  const [panel, setPanel] = useState<"contact" | "sites" | null>("contact")
  const chatPhone = contact.chatPhone || contact.phone
  const hasContact =
    Boolean(contact.phone || contact.email || chatPhone || contact.address || contact.workingHours)

  const moreSites = [
    { label: "Marketplace", to: "/marketplace" },
    { label: "Who it’s for", to: "/who-its-for" },
    { label: "How it works", to: "/how-it-works" },
    { label: "Platform", to: "/platform" },
    { label: "Finance", to: "/finance" },
    { label: "Truck parking", to: "/parking-reservation" },
    { label: "Support", to: "/support" },
  ]

  const roleLinks = [
    { label: "Cargo owners", to: "/who-its-for#cargo" },
    { label: "Fleet owners", to: "/who-its-for#fleet" },
    { label: "Drivers", to: "/who-its-for#driver" },
    { label: "Brokers", to: "/who-its-for#broker" },
    { label: "Lenders", to: "/who-its-for#lender" },
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
          <Link
            to="/parking-reservation"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-primary-300"
          >
            <MapPin className="w-5 h-5 text-primary-400" />
            <TranslatedText text="Coverage map" />
          </Link>
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
                <Link to={item.to} className="text-sm text-white hover:text-primary-400 capitalize">
                  <TranslatedText text={item.label} />
                </Link>
              </li>
            ))}
            {roleLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-sm text-white hover:text-primary-400 capitalize">
                  <TranslatedText text={item.label} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 pt-8 border-t-2 border-white/10">
          {[
            { label: "Terms & Conditions", to: "/support#terms" },
            { label: "Privacy Policy", to: "/support#privacy" },
            { label: "Cookies", to: "/support#cookies" },
          ].map((item) => (
            <Link key={item.label} to={item.to} className="text-sm text-white hover:text-primary-400">
              <TranslatedText text={item.label} />
            </Link>
          ))}
        </div>
        <p className="text-white text-xs uppercase mt-8">
          © {new Date().getFullYear()} UrutiX. <TranslatedText text="All rights reserved." />
        </p>
      </div>
    </footer>
  )
}

