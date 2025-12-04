import { Button } from "@/components/ui/Button"
import { Link } from "react-router-dom"
import { TranslatedText } from "@/components/translated-text"
export function CTA() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 70% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
              }}
            />
          </div>

          <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 text-balance">
              <TranslatedText text="Ready to transform your" />
              <br />
              <TranslatedText text="logistics operations?" />
            </h2>
            <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              <TranslatedText text="Join thousands of companies using FleetSync to streamline their fleet and cargo management across the globe." />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary-600 hover:bg-background/90 text-white px-8">
            
                <Link to="/auth">
                  <TranslatedText text="Get Started" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              >
                <TranslatedText text="Contact Sales" />
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/80">
              <TranslatedText text="No credit card required • 14-day free trial • Cancel anytime" />
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
