import { Link } from "react-router-dom"
import { Truck } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "API", "Changelog"],
  Solutions: ["Fleet Management", "Cargo Tracking", "Route Planning", "Analytics"],
  Resources: ["Documentation", "Blog", "Case Studies", "Webinars"],
  Company: ["About", "Careers", "Contact", "Partners"],
}

export function Footer() {
  return (
    <footer className="bg-[#111828] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-white">UrutiX</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              <TranslatedText text="The unified logistics platform for global fleet and cargo management." />
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">
                <TranslatedText text={category} />
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link to="#" className="text-sm text-gray-300 hover:text-white transition-colors">
                      <TranslatedText text={link} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-300">
            <TranslatedText text="© 2025 UrutiX. All rights reserved." />
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              <TranslatedText text="Privacy Policy" />
            </Link>
            <Link to="#" className="text-sm text-gray-300 hover:text-white transition-colors">
              <TranslatedText text="Terms of Service" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
