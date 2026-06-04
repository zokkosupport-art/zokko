import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import OfferCard from "@/components/OfferCard";
import { OFFER_ORDER } from "@/lib/offers";

/**
 * Grille des 3 offres payantes.
 * @param {string} [listingId] — pour Boost / Premium sur une annonce précise
 * @param {"default"|"compact"} variant
 * @param {boolean} [showCompareLink]
 */
export default function SellFasterOffers({
  listingId,
  variant = "default",
  showCompareLink = false,
  title = "Vendre plus vite",
  subtitle = "Orange Money · validation sous 24h",
  className = "",
}) {
  return (
    <section className={className} data-testid="sell-faster-offers">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <p className="text-xs uppercase font-bold tracking-wide text-[#D84315]">Options payantes</p>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-[#1A2E22]">{title}</h2>
          <p className="text-sm text-[#4A5D50] mt-1">{subtitle}</p>
        </div>
        {showCompareLink && (
          <Link
            to="/vendre-plus-vite"
            className="text-sm font-semibold text-[#D84315] flex items-center gap-1 hover:underline"
          >
            Tout comparer <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {OFFER_ORDER.map((key) => (
          <OfferCard key={key} purpose={key} listingId={listingId} variant={variant} />
        ))}
      </div>
    </section>
  );
}
