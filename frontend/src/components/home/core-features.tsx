import { Search, Truck, DollarSign } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"

const coreFeatures = [
  {
    icon: Search,
    title: "Match",
    description: "Intelligent cargo-to-truck matching algorithm that connects cargo owners with the right fleet operators instantly.",
  },
  {
    icon: Truck,
    title: "Move",
    description: "End-to-end logistics management with real-time tracking, route optimization, and seamless cargo movement.",
  },
  {
    icon: DollarSign,
    title: "Finance",
    description: "Integrated financing solutions for cargo owners and fleet operators with flexible payment options and loan management.",
  },
]

export function CoreFeatures() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            <TranslatedText text="Pillars of our Platform" />
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreFeatures.map((feature) => (
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

