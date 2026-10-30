/** Keep photography visible while protecting text contrast across public-page heroes. */
export function PublicHeroBackdrop({ image }: { image: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      <img src={image} alt="" decoding="async" loading="eager" className="h-full w-full object-cover object-center" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, rgba(14,28,42,0.98) 0%, rgba(14,28,42,0.9) 42%, rgba(14,28,42,0.58) 65%, rgba(14,28,42,0.18) 100%)" }}
      />
      <div className="absolute inset-0 bg-[#0e1c2a]/60 lg:hidden" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c2a]/60 via-transparent to-transparent" />
    </div>
  )
}
