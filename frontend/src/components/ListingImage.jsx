import { useEffect, useState } from "react";
import { Image as ImageIcon } from "@phosphor-icons/react";
import { getListingCoverUrl } from "@/lib/api";

/**
 * Listing photo — no stock placeholders; show honest message when upload is missing (404).
 */
export default function ListingImage({
  listing,
  src: srcOverride,
  className = "w-full h-full object-cover",
  alt,
  sizes = "(max-width: 768px) 50vw, 280px",
  priority = false,
}) {
  const primary = srcOverride || getListingCoverUrl(listing);
  const [src, setSrc] = useState(primary);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(primary);
    setFailed(!primary);
  }, [primary, listing?.id]);

  const onError = () => setFailed(true);

  if (failed || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#4A5D50] text-xs bg-[#F0EBE1] px-2 text-center">
        <ImageIcon size={28} weight="duotone" className="text-[#D84315]/40 mb-1 shrink-0" aria-hidden />
        <span className="font-semibold text-[#4A5D50] leading-tight">Photo indisponible</span>
        <span className="font-heading text-xl font-bold text-[#D84315]/25 mt-0.5">
          {(listing?.title || "?").charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || listing?.title || "Annonce"}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      sizes={sizes}
      className={className}
      onError={onError}
    />
  );
}
