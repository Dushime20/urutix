import { TranslatedText } from "@/components/translated-text";

const stats = [
    { value: "150+", label: "Countries Covered", suffix: "" },
    { value: "99.9", label: "Uptime SLA", suffix: "%" },
    { value: "50M+", label: "Shipments Tracked", suffix: "" },
    { value: "24/7", label: "Global Support", suffix: "" },
  ]
  
  export function Stats() {
    return (
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  {stat.value}
                  <span className="text-primary">{stat.suffix}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <TranslatedText text={stat.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  