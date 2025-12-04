import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { TranslatedText } from "@/components/translated-text";

export function Hero() {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/busniess.jpg')",
        }}
      >
        {/* Overlay for better text readability */}
        {/* <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" /> */}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full py-20">
        <div className="max-w-3xl space-y-8">
       

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-200">
            <span className="text-primary">
              <TranslatedText text="Unified" />
            </span>
            <br />
            <span className="text-balance">
              <TranslatedText text="Logistics And Finance Platform" />
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-50 max-w-2xl leading-relaxed">
            <TranslatedText text="Unlock unequaled business performance with real-time insights, automation, an expanding marketplace, and digital payments. Join the logistics revolution." />
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-start pt-4">
            <Button
              asChild
              size="lg"
              className="bg-primary-600 hover:bg-primary/90 text-white px-8"
            >
              <Link to="/auth">
                <TranslatedText text="Get Started" />
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border text-white hover:bg-muted bg-transparent"
            >
              <TranslatedText text="Watch Demo" />
            </Button>
          </div>
             {/* Badge */}
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-white">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <TranslatedText text="Live tracking across 150+ countries" />
          </div>
        </div>
      </div>
    </section>
  );
}
