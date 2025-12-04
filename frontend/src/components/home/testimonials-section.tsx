
import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"
import { TranslatedText } from "@/components/translated-text"

const testimonials = [
  {
    quote:
      "FleetCore transformed our operations. We reduced fuel costs by 35% and improved delivery times by 40% within the first quarter.",
    author: "Marcus Chen",
    title: "VP of Operations",
    company: "Global Freight Solutions",
  },
  {
    quote:
      "The real-time visibility and predictive analytics have been game-changers. We can now proactively address issues before they impact our customers.",
    author: "Sarah Williams",
    title: "Logistics Director",
    company: "TransPacific Shipping",
  },
  {
    quote:
      "Best fleet management platform we've used. The international compliance features alone saved us hundreds of hours in paperwork.",
    author: "Ahmed Hassan",
    title: "CEO",
    company: "Sahara Logistics MENA",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            <TranslatedText text="Trusted by Industry" /> <span className="text-primary"><TranslatedText text="Leaders" /></span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            <TranslatedText text="See why thousands of logistics companies around the world choose FleetCore for their fleet management needs." />
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="pt-6">
                <Quote className="w-8 h-8 text-primary/40 mb-4" />
                <p className="text-foreground mb-6 leading-relaxed">"<TranslatedText text={testimonial.quote} />"</p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText text={testimonial.title} />
                  </p>
                  <p className="text-sm text-primary">{testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
