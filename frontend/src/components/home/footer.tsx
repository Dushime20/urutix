import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import logoUrutiX from "../../assets/urutiX Logistics Logo (1).svg";
import { TranslatedText } from "@/components/translated-text";

const footerLinks = {
  Product: ["AI Cargo Matching", "Embedded Finance", "Fleet Tracking", "Route Optimization", "Driver App"],
  Company: ["About UrutiX", "Careers", "Press & Media", "Contact Support", "Trust & Safety"],
  Legal: ["Privacy Policy", "Terms of Service", "Lending Licenses", "Compliance"],
  Connect: ["Twitter", "LinkedIn", "Instagram", "Facebook"],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center">
              <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-16 w-auto object-contain" />
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              <TranslatedText text="The AI-powered logistics engine. We utilize smart matching and embedded capital to empower cargo owners and transporters to move more, faster." />
            </p>
            <div className="flex gap-4 pt-2">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="font-bold text-white text-base">
                <TranslatedText text={category} />
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to="#"
                      className="text-sm hover:text-primary-400 transition-colors duration-200 block"
                    >
                      <TranslatedText text={link} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-slate-800 grid md:grid-cols-2 gap-4 items-center">
          <p className="text-sm text-slate-500 text-center md:text-left">
            <TranslatedText text={`© ${new Date().getFullYear()} UrutiX Inc. All rights reserved.`} />
          </p>
          <div className="flex justify-center md:justify-end gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
