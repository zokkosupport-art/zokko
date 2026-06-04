import { Link } from "react-router-dom";
import { Lightning, Star } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/api";
import { ZOKKO_OFFERS, paymentPath, listingOfferStatus } from "@/lib/offers";

/** Boutons Boost / Premium sous une annonce (style fiche annonce). */
export default function ListingOfferActions({ listing }) {
  if (!listing || listing.status !== "approved") return null;

  const status = listingOfferStatus(listing);
  if (status) {
    const bg =
      status.type === "premium"
        ? "bg-[#FBC02D]/20 text-[#1A2E22]"
        : status.type === "boost"
          ? "bg-[#FF6600]/15 text-[#E65C00]"
          : "bg-[#FFF3E0] text-[#E65100]";
    return (
      <p className={`text-xs font-bold text-center py-2 px-3 rounded-full ${bg}`} data-testid={`listing-offer-status-${listing.id}`}>
        {status.label}
      </p>
    );
  }

  const boost = ZOKKO_OFFERS.boost;
  const premium = ZOKKO_OFFERS.premium;

  return (
    <div className="grid grid-cols-2 gap-2" data-testid={`listing-offer-actions-${listing.id}`}>
      <Link
        to={paymentPath("boost", listing.id)}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#FF6600] hover:bg-[#E65C00] transition-colors"
      >
        <Lightning size={16} weight="fill" />
        Boost · {formatPrice(boost.price, boost.currency)}
      </Link>
      <Link
        to={paymentPath("premium", listing.id)}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-[#1A2E22] bg-[#FBC02D] hover:bg-[#F9A825] transition-colors"
      >
        <Star size={16} weight="fill" />
        Premium · {formatPrice(premium.price, premium.currency)}
      </Link>
    </div>
  );
}
