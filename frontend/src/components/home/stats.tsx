import { TranslatedText } from "@/components/translated-text";

const stats = [
  { value: "150+", label: "Countries Covered", suffix: "" },
  { value: "99.9", label: "Uptime SLA", suffix: "%" },
  { value: "50M+", label: "Shipments Tracked", suffix: "" },
  { value: "24/7", label: "Global Support", suffix: "" },
];

export function Stats() {
  return (
    <section className="py-20 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group cursor-default">
              <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight group-hover:text-primary-600 transition-colors duration-300">
                {stat.value}
                <span className="text-primary-500 text-3xl ml-1">{stat.suffix}</span>
              </div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <TranslatedText text={stat.label} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
