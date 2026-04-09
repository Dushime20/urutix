"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronRight, Zap } from "lucide-react";
import logoUrutiX from "../../assets/urutiX Logistics Logo (1).svg";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslatedText } from "@/components/translated-text";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Solutions", href: "#solutions" },
  { name: "Service", href: "#features" },
  { name: "Coverage", href: "#coverage" },
  { name: "Enterprise", href: "#enterprise" },
];

export function Header() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#345E85] to-primary-600 text-white overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-6 py-2 flex items-center justify-between text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <Zap className="h-3 w-3 text-yellow-300" />
                </span>
                <p>
                  <TranslatedText text="New: 0% Interest Financing for First-Time Transporters!" />
                </p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="ml-4 p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${showBanner ? "top-[40px]" : "top-0"
          } ${isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 py-3"
            : "bg-transparent py-8"
          }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center group">
            <img
              src={logoUrutiX}
              alt="UrutiX Logistics Logo"
              className="h-20 md:h-28 lg:h-36 w-auto object-contain transition-all duration-300 group-hover:scale-110 drop-shadow-sm"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`text-sm font-medium relative group py-2 ${isScrolled ? "text-slate-600" : "text-slate-700"
                  }`}
              >
                <TranslatedText text={item.name} />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <LanguageSwitcher variant="default" />

            {isAuthenticated ? (
              <Button
                asChild
                className="rounded-full bg-primary-600 hover:bg-primary-700 text-white transition-all hover:scale-105"
              >
                <Link to="/dashboard">
                  <TranslatedText text="Go to Dashboard" />
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className={`text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors ${isScrolled ? "text-slate-700" : "text-slate-700"
                    }`}
                >
                  <TranslatedText text="Log in" />
                </Link>

                <Button
                  asChild
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all hover:scale-105"
                >
                  <Link to="/auth">
                    <TranslatedText text="Get Started" />
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-700 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 bg-white lg:hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  <img src={logoUrutiX} alt="UrutiX Logo" className="h-10 w-auto object-contain" />
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-md p-2.5 text-slate-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-6 flow-root px-6">
                <div className="-my-6 divide-y divide-slate-100">
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-900 hover:bg-slate-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <TranslatedText text={item.name} />
                      </a>
                    ))}
                  </div>
                  <div className="py-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Language</span>
                      <LanguageSwitcher />
                    </div>
                    {isAuthenticated ? (
                      <Button asChild className="w-full justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-xl h-12 text-base transition-all">
                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <TranslatedText text="Go to Dashboard" />
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button asChild className="w-full justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 text-base transition-all">
                          <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                            <TranslatedText text="Get Started" />
                          </Link>
                        </Button>
                        <div className="text-center">
                          <Link
                            to="/auth"
                            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <TranslatedText text="Already have an account? Log in" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
