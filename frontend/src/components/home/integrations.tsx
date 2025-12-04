import { TranslatedText } from "@/components/translated-text"

const integrations = ["SAP", "Oracle", "Salesforce", "Microsoft Dynamics", "QuickBooks", "Shopify"]

export function Integrations() {
  return (
    <section className="py-16 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          <TranslatedText text="Trusted by leading enterprises and integrated with your existing tools" />
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
          {integrations.map((name) => (
            <div
              key={name}
              className="text-lg font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
