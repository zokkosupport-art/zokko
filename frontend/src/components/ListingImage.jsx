import { useState } from "react";
import { Image as ImageIcon } from "@phosphor-icons/react";
import { getListingCoverUrl, CATEGORY_PLACEHOLDER_IMAGES } from "@/lib/api";

/**
 * Listing photo with fallback when Railway local storage was wiped (404 on /api/files/...).
 */
export default function ListingImage({ listing, src: srcOverride, className = "w-full h-full object-cover", alt }) {
  const primary = srcOverride || getListingCoverUrl(listing);
  const fallback = CATEGORY_PLACEHOLDER_IMAGES[listing?.category] || null;
  const [src, setSrc] = useState(primary || fallback);
  const [failed, setFailed] = useState(!primary && !fallback);

  const onError = () => {
    if (fallback && src !== fallback) {
      setSrc(fallback);
      return;
    }
    setFailed(true);
  };

  if (failed || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#4A5D50] text-sm bg-[#F0EBE1]">
        <ImageIcon size={28} weight="duotone" className="text-[#D84315]/40 mb-1" aria-hidden />
        <span className="font-heading text-2xl font-bold text-[#D84315]/30">
          {(listing?.title || "?").charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || listing?.title || "Annonce"}
      loading="lazy"
      decoding="async"
      className={className}
      onError={onError}
    />
  );
}
