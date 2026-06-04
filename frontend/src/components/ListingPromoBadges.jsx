import { Lightning, Star, Storefront, Crown, Wrench } from "@phosphor-icons/react";
import { premiumBadgeClass } from "@/lib/offerColors";

/** Pastille sur photo : icône seule sur mobile, texte dès sm. */
export function ListingPhotoBadge({ className, label, children }) {
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

/** Badges Premium / Boost / Pro / Boutique sur l'image d'une annonce. */
export default function ListingPromoBadges({ listing, className = "" }) {
  const isBoosted = listing.boosted_until && new Date(listing.boosted_until) > new Date();
  const isPro = listing.owner_is_pro || listing.owner?.is_pro;
  const isBoutique = listing.owner_account_type === "entreprise" && !isPro;

  return (
    <>
      <div className={`absolute z-10 flex flex-row flex-wrap gap-1 max-w-[calc(100%-3rem)] top-2 left-2 ${className}`}>
        {listing.premium && (
          <ListingPhotoBadge className={premiumBadgeClass} label="Premium">
            <Star size={14} weight="fill" />
          </ListingPhotoBadge>
        )}
        {isBoosted && (
          <ListingPhotoBadge className="bg-[#D84315] text-white" label="Boosté">
            <Lightning size={14} weight="fill" />
          </ListingPhotoBadge>
        )}
        {isPro && (
          <ListingPhotoBadge
            className="bg-[#1A2E22] text-[#FBC02D] border-2 border-[#FBC02D] shadow-md shadow-[#FBC02D]/40"
            label="Boutique Pro"
          >
            <Crown size={14} weight="fill" />
          </ListingPhotoBadge>
        )}
        {isBoutique && (
          <ListingPhotoBadge className="bg-[#2E7D32] text-white" label="Boutique">
            <Storefront size={14} weight="fill" />
          </ListingPhotoBadge>
        )}
      </div>
      {listing.type === "service" && (
        <ListingPhotoBadge
          className="absolute bottom-2 left-2 bg-[#2E7D32] text-white"
          label="Service"
        >
          <Wrench size={14} weight="fill" />
        </ListingPhotoBadge>
      )}
    </>
  );
}
