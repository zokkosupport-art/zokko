import { Link } from "react-router-dom";
import { MapPin, Crown } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/api";
import FavoriteButton from "@/components/FavoriteButton";
import ListingImage from "@/components/ListingImage";
import ListingPromoBadges from "@/components/ListingPromoBadges";

export default function ListingCard({ listing }) {
  const isPro = listing.owner_is_pro || listing.owner?.is_pro;
  return (
    <Link
      to={`/listings/${listing.id}`}
      className={`block rounded-2xl overflow-hidden gm-card-hover active:scale-[0.98] transition-transform ${
        isPro
          ? "gm-card-pro border-[3px] border-[#FBC02D] bg-gradient-to-b from-[#FFFDE7] to-white"
          : "border border-[#E5E0D8] bg-white gm-shadow-soft"
      }`}
      data-testid={`listing-card-${listing.id}`}
    >
      <div className="aspect-[4/3] bg-[#F0EBE1] relative overflow-hidden">
        <ListingImage listing={listing} alt={listing.title} />
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton listingId={listing.id} size={20} />
        </div>
        <ListingPromoBadges listing={listing} />
      </div>
      <div className={`p-2.5 sm:p-4 space-y-1 ${isPro ? "border-t-2 border-[#FBC02D]/50" : ""}`}>
        <h3 className="font-heading font-semibold text-[#1A2E22] line-clamp-2 leading-snug text-sm sm:text-base">
          {isPro && <Crown size={14} weight="fill" className="hidden sm:inline-block text-[#FBC02D] mr-1 -mt-0.5" aria-hidden />}
          {listing.title}
        </h3>
        <p className="text-[#D84315] font-bold text-sm sm:text-lg font-heading leading-tight">{formatPrice(listing.price, listing.currency)}</p>
        <p className="flex items-center gap-1 text-[11px] sm:text-xs text-[#4A5D50] line-clamp-1">
          <MapPin size={12} weight="regular" className="flex-shrink-0" />
          {listing.city}{listing.quartier ? `, ${listing.quartier}` : ""}
        </p>
      </div>
    </Link>
  );
}
