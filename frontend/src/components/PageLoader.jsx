/** Placeholder léger pendant le chargement d'une route (pas d'écran blanc plein). */
export default function PageLoader({ variant = "grid" }) {
  if (variant === "detail") {
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 animate-pulse" aria-busy="true" aria-label="Chargement">
        <div className="h-4 bg-[#F0EBE1] rounded w-24 mb-4" />
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-4 md:gap-6">
          <div>
            <div className="aspect-[4/3] bg-[#F0EBE1] rounded-2xl" />
            <div className="mt-6 bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-3">
              <div className="h-5 bg-[#F0EBE1] rounded w-1/3" />
              <div className="h-4 bg-[#F0EBE1] rounded w-full" />
              <div className="h-4 bg-[#F0EBE1] rounded w-5/6" />
            </div>
          </div>
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-4 h-fit">
            <div className="h-7 bg-[#F0EBE1] rounded w-3/4" />
            <div className="h-8 bg-[#F0EBE1] rounded w-1/2" />
            <div className="h-12 bg-[#F0EBE1] rounded-xl" />
            <div className="h-12 bg-[#F0EBE1] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="h-8 bg-[#F0EBE1] rounded-xl w-2/5 max-w-xs mb-4" />
      <div className="h-12 bg-[#F0EBE1] rounded-xl w-full max-w-lg mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-[#E5E0D8] bg-white">
            <div className="aspect-[4/3] bg-[#F0EBE1]" />
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-4 bg-[#F0EBE1] rounded w-full" />
              <div className="h-4 bg-[#F0EBE1] rounded w-2/3" />
              <div className="h-3 bg-[#F0EBE1] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
