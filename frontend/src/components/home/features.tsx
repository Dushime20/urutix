import { Truck, Package, MapPin, BarChart3, Shield, Globe } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"

const features = [
  {
    icon: Truck,
    title: "Fleet Tracking",
    description: "Real-time GPS tracking for your entire fleet with predictive ETA and route optimization.",
  },
  {
    icon: Package,
    title: "Cargo Management",
    description: "End-to-end cargo visibility from warehouse to delivery with automated documentation.",
  },
  {
    icon: MapPin,
    title: "Route Optimization",
    description: "AI-powered routing that reduces fuel costs and delivery times by up to 30%.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Comprehensive insights into fleet performance, driver behavior, and operational costs.",
  },
  {
    icon: Shield,
    title: "Compliance & Safety",
    description: "Automated compliance tracking, driver hours monitoring, and safety alerts.",
  },
  {
    icon: Globe,
    title: "Global Operations",
    description: "Multi-currency, multi-language support with cross-border logistics integration.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            <TranslatedText text="Everything you need to manage" />
            <br />
            <span className="text-primary">
              <TranslatedText text="global logistics" />
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-border bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                <TranslatedText text={feature.title} />
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <TranslatedText text={feature.description} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
