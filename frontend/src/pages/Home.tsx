import { Header } from "@/components/home/header"
import { Hero } from "@/components/home/hero"
import { SearchSection } from "@/components/home/search-section"
import { Stats } from "@/components/home/stats"
import { Features } from "@/components/home/features"
import { GlobalCoverage } from "@/components/home/global-coverage"
import { Integrations } from "@/components/home/integrations"

import { Footer } from "@/components/home/footer"
import { TestimonialsSection } from "@/components/home/testimonials-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <SearchSection />
      <Stats />
      <Features />
      <GlobalCoverage />
      <Integrations />
      <TestimonialsSection />
     
      <Footer />
    </main>
  )
}
