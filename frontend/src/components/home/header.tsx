"use client"

import { useState } from "react"
import { Menu, X, Truck, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Link } from "react-router-dom"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TranslatedText } from "@/components/translated-text"

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Solutions", href: "#solutions" },
  { name: "Services", href: "#features" },
  { name: "Company", href: "#coverage" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-teal-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-teal-900">UrutiX</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-teal-700 hover:text-teal-900 px-3 py-2 rounded-md transition-colors hover:bg-teal-50"
              >
                <TranslatedText text={item.name} />
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-teal-600 hover:bg-teal-50">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu */}
            <Button variant="ghost" size="icon" className="text-teal-600 hover:bg-teal-50">
              <User className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-teal-600 hover:bg-teal-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-white">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-white p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-teal-900">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-teal-600 hover:bg-teal-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-4 py-3 text-base font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TranslatedText text={item.name} />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
