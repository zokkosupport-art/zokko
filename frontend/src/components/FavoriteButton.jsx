import { useEffect, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export default function FavoriteButton({ listingId, className = "", size = 22 }) {
  const [saved, setSaved] = useState(() => isFavorite(listingId));

  useEffect(() => {
    const sync = () => setSaved(isFavorite(listingId));
    window.addEventListener("zokko-favorites-changed", sync);
    setSaved(isFavorite(listingId));
    return () => window.removeEventListener("zokko-favorites-changed", sync);
  }, [listingId]);

  return (
    <button
      type="button"
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(toggleFavorite(listingId));
      }}
      className={`rounded-full p-2 transition-colors ${saved ? "text-[#D84315] bg-[#D84315]/10" : "text-[#4A5D50] bg-white/90 hover:text-[#D84315]"} ${className}`}
      data-testid={`favorite-btn-${listingId}`}
    >
      <Heart size={size} weight={saved ? "fill" : "regular"} />
    </button>
  );
}
