import { Link } from "react-router-dom";
import { MapPin, Lightning, Star, SealCheck, Storefront, Crown, Wrench } from "@phosphor-icons/react";
import { formatPrice } from "@/lib/api";
import FavoriteButton from "@/components/FavoriteButton";
import ListingImage from "@/components/ListingImage";
import { premiumBadgeClass } from "@/lib/offerColors";

/** Pastille photo : icône seule sur mobile, texte à partir de sm. */
function ListingPhotoBadge({ className, label, children }) {
  return (
    <span
      className={`rounded-full flex items-center justify-center gap-1 font-bold uppercase shrink-0 w-8 h-8 sm:w-auto sm:h-auto sm:px-2 sm:py-1 sm:text-[10px] ${className}`}
      title={label}
      aria-label={label}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export default function ListingCard({ listing }) {
  const isBoosted = listing.boosted_until && new Date(listing.boosted_until) > new Date();
  const isPro = listing.owner_is_pro || listing.owner?.is_pro;
  const isBoutique = listing.owner_account_type === "entreprise" && !isPro;
  return (
    <Link
      to={`/listings/${listing.id}`}
      className={`block rounded-2xl overflow-hidden gm-card-hover ${
        isPro
          ? "gm-card-pro border-[3px] border-[#FBC02D] bg-gradient-to-b from-[#FFFDE7] to-white"
          : "border border-[#E5E0D8] bg-white gm-shadow-soft"
      }`}
      data-testid={`listing-card-${listing.id}`}
    >
      <div className="aspect-[4/3] bg-[#F0EBE1] relative overflow-hidden">
        <ListingImage listing={listing} alt={listing.title} />
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton listingId={listing.id} />
        </div>
        <div className="absolute top-2 left-2 flex flex-row flex-wrap gap-1 max-w-[calc(100%-3rem)]">
          {listing.premium && (
            <ListingPhotoBadge className={premiumBadgeClass} label="Premium">
              <Star size={14} weight="fill" className="sm:w-3 sm:h-3" />
            </ListingPhotoBadge>
          )}
          {isBoosted && (
            <ListingPhotoBadge className="bg-[#D84315] text-white" label="Boosté">
              <Lightning size={14} weight="fill" className="sm:w-3 sm:h-3" />
            </ListingPhotoBadge>
          )}
          {isPro && (
            <ListingPhotoBadge
              className="bg-[#1A2E22] text-[#FBC02D] border-2 border-[#FBC02D] shadow-md shadow-[#FBC02D]/40"
              label="Boutique Pro"
            >
              <Crown size={14} weight="fill" className="sm:w-3 sm:h-3" />
            </ListingPhotoBadge>
          )}
          {isBoutique && (
            <ListingPhotoBadge className="bg-[#2E7D32] text-white" label="Boutique">
              <Storefront size={14} weight="fill" className="sm:w-3 sm:h-3" />
            </ListingPhotoBadge>
          )}
        </div>
        {listing.type === "service" && (
          <ListingPhotoBadge
            className="absolute bottom-2 left-2 bg-[#2E7D32] text-white"
            label="Service"
          >
            <Wrench size={14} weight="fill" className="sm:w-3 sm:h-3" />
          </ListingPhotoBadge>
        )}
      </div>
      <div className={`p-3 sm:p-4 space-y-1.5 ${isPro ? "border-t-2 border-[#FBC02D]/50" : ""}`}>
        <h3 className="font-heading font-semibold text-[#1A2E22] line-clamp-2 leading-tight text-sm sm:text-base">
          {isPro && <Crown size={14} weight="fill" className="hidden sm:inline-block text-[#FBC02D] mr-1 -mt-0.5" aria-hidden />}
          {listing.title}
        </h3>
        <p className="text-[#D84315] font-bold text-base sm:text-lg font-heading">{formatPrice(listing.price, listing.currency)}</p>
        <div className="flex items-center justify-between text-xs text-[#4A5D50]">
          <span className="flex items-center gap-1"><MapPin size={12} weight="regular" />{listing.city}{listing.quartier ? `, ${listing.quartier}` : ""}</span>
          <span className="flex items-center gap-1 text-[#2E7D32]"><SealCheck size={12} weight="fill" /> Vérifié</span>
        </div>
      </div>
    </Link>
  );
}
