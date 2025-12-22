import { Link } from "react-router-dom"
import { Truck } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"

const footerLinks = {
  Features: ["Fleet Management", "Cargo Tracking", "Route Planning", "Analytics"],
}

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">UrutiX</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              <TranslatedText text="The unified logistics platform for global fleet and cargo management." />
            </p>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-base mb-4">
                <TranslatedText text={category} />
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link 
                      to="#" 
                      className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 flex items-center group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        <TranslatedText text={link} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-center items-center">
            <p className="text-sm text-gray-500">
              <TranslatedText text="© 2025 UrutiX. All rights reserved." />
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
