import { Link } from "react-router-dom";
import { MapPin, Eye, Lightning, Star, SealCheck } from "@phosphor-icons/react";
import { fileUrl, formatPrice } from "@/lib/api";

export default function ListingCard({ listing }) {
  const cover = listing.photos?.[0] ? fileUrl(listing.photos[0]) : null;
  const isBoosted = listing.boosted_until && new Date(listing.boosted_until) > new Date();
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden gm-card-hover gm-shadow-soft"
      data-testid={`listing-card-${listing.id}`}
    >
      <div className="aspect-[4/3] bg-[#F0EBE1] relative overflow-hidden">
        {cover ? (
          <img src={cover} alt={listing.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#4A5D50] text-sm">
            <span className="font-heading text-2xl font-bold text-[#D84315]/30">{listing.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
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
          <span className="flex items-center gap-1"><MapPin size={12} weight="regular" />{listing.city}</span>
          <span className="flex items-center gap-1 text-[#2E7D32]"><SealCheck size={12} weight="fill" /> Vérifié</span>
        </div>
      </div>
    </Link>
  );
}
