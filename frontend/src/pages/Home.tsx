import { Header } from "@/components/home/header"
import { Hero } from "@/components/home/hero"
import { Stats } from "@/components/home/stats"
import { CoreFeatures } from "@/components/home/core-features"
import { Features } from "@/components/home/features"
import { GlobalCoverage } from "@/components/home/global-coverage"

import { Footer } from "@/components/home/footer"
import { TestimonialsSection } from "@/components/home/testimonials-section"

import { VideoTutorial } from "@/components/home/video-tutorial"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Stats />
      <CoreFeatures />
      <Features />
      <VideoTutorial />
      <GlobalCoverage />
      <TestimonialsSection />

      <Footer />
    </main>
  )
}
