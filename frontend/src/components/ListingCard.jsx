import { Link } from "react-router-dom";
import { MapPin, Lightning, Star, SealCheck, Storefront, Crown } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/api";
import FavoriteButton from "@/components/FavoriteButton";
import ListingImage from "@/components/ListingImage";

export default function ListingCard({ listing }) {
  const isBoosted = listing.boosted_until && new Date(listing.boosted_until) > new Date();
  const isPro = listing.owner_is_pro || listing.owner?.is_pro;
  const isBoutique = listing.owner_account_type === "entreprise" && !isPro;
  return (
    <Link
      to={`/listings/${listing.id}`}
      className={`block bg-white rounded-2xl border overflow-hidden gm-card-hover gm-shadow-soft ${
        isPro ? "border-[#FBC02D] ring-1 ring-[#FBC02D]/40" : "border-[#E5E0D8]"
      }`}
      data-testid={`listing-card-${listing.id}`}
    >
      <div className="aspect-[4/3] bg-[#F0EBE1] relative overflow-hidden">
        <ListingImage listing={listing} alt={listing.title} />
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton listingId={listing.id} />
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.premium && (
            <span className="bg-[#FBC02D] text-[#1A2E22] text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={12} weight="fill" /> Premium
            </span>
          )}
          {isBoosted && (
            <span className="bg-[#D84315] text-white text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1">
              <Lightning size={12} weight="fill" /> Boosté
            </span>
          )}
          {isPro && (
            <span className="bg-[#1A2E22] text-[#FBC02D] text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1">
              <Crown size={12} weight="fill" /> Boutique Pro
            </span>
          )}
          {isBoutique && (
            <span className="bg-[#2E7D32] text-white text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1">
              <Storefront size={12} weight="fill" /> Boutique
            </span>
          )}
        </div>
        {listing.type === "service" && (
          <span className="absolute bottom-2 left-2 bg-[#2E7D32] text-white text-[10px] font-bold uppercase px-2 py-1 rounded-full">
            Service
          </span>
        )}
      </div>
      <div className="p-3 sm:p-4 space-y-1.5">
        <h3 className="font-heading font-semibold text-[#1A2E22] line-clamp-2 leading-tight text-sm sm:text-base">{listing.title}</h3>
        <p className="text-[#D84315] font-bold text-base sm:text-lg font-heading">{formatPrice(listing.price, listing.currency)}</p>
        <div className="flex items-center justify-between text-xs text-[#4A5D50]">
          <span className="flex items-center gap-1"><MapPin size={12} weight="regular" />{listing.city}{listing.quartier ? `, ${listing.quartier}` : ""}</span>
          <span className="flex items-center gap-1 text-[#2E7D32]"><SealCheck size={12} weight="fill" /> Vérifié</span>
        </div>
      </div>
    </Link>
  );
}
