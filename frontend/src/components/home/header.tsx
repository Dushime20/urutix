"use client"

import { useState, useEffect } from "react"
import { Menu, X, Truck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Link } from "react-router-dom"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TranslatedText } from "@/components/translated-text"

const navigation = [
  { name: "Solutions", href: "#solutions" },
  { name: "Service", href: "#features" },
  { name: "Company", href: "#coverage" },
  { name: "Pricing", href: "#pricing" },
  { name: "Resources", href: "#resources" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-[#f9fafc] " 
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className={`${isScrolled ? "text-foreground" : "text-white"}`} />
          </div>
          <span className={`text-xl font-bold transition-colors ${
            isScrolled ? "text-foreground" : "text-white"
          }`}>
            FleetSync
          </span>
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isScrolled 
                  ? "text-muted-foreground hover:text-foreground" 
                  : "text-white/90 hover:text-white"
              }`}
            >
              <TranslatedText text={item.name} />
            </a>
          ))}
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <LanguageSwitcher variant={isScrolled ? 'default' : 'light'} />
          <Button asChild className={`${isScrolled ? " text-white bg-primary-600" : "bg-transparent hover:bg-primary/90 text-white border border-white"}`}>
            <Link to="/auth">
              <TranslatedText text="Get Started" />
            </Link>
          </Button>
        </div>

        <button 
          type="button" 
          className={`lg:hidden transition-colors ${
            isScrolled ? "text-foreground" : "text-white"
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed left-0 top-0 bottom-0 w-[70%] bg-[#f9fafc] z-40 pt-6">
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block py-2 text-base font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TranslatedText text={item.name} />
                </a>
              ))}
            </div>
            <div className="pt-4 space-y-3">
              <div className="w-full">
                <LanguageSwitcher />
              </div>
              <Button asChild className="w-full bg-primary-600 text-primary-foreground">
                <Link to="/auth">
                  <TranslatedText text="Get Started" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
