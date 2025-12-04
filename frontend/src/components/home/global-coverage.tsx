import { CheckCircle } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"

const regions = [
  { name: "North America", countries: ["USA", "Canada", "Mexico"] },
  { name: "Europe", countries: ["UK", "Germany", "France", "Netherlands"] },
  { name: "Asia Pacific", countries: ["China", "Japan", "Singapore", "Australia"] },
  { name: "Middle East", countries: ["UAE", "Saudi Arabia", "Qatar"] },
]

export function GlobalCoverage() {
  return (
    <section id="coverage" className="py-24 lg:py-32 bg-muted/50 border-y border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              <TranslatedText text="Global reach," />
              <br />
              <span className="text-primary">
                <TranslatedText text="local expertise" />
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              <TranslatedText text="Operating in over 150 countries with local teams that understand regional regulations, customs requirements, and business practices." />
            </p>

            <div className="grid grid-cols-2 gap-6">
              {regions.map((region) => (
                <div key={region.name}>
                  <h4 className="font-semibold text-foreground mb-2">
                    <TranslatedText text={region.name} />
                  </h4>
                  <ul className="space-y-1">
                    {region.countries.map((country) => (
                      <li key={country} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {country}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square">
            <img
              src="/world-map-with-connection-lines-light-blue-theme-l.jpg"
              alt="Global Coverage Map"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}


