import { useEffect, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import api from "@/lib/api";
import { getFavoriteIds } from "@/lib/favorites";
import ListingCard from "@/components/ListingCard";

export default function FavoriteListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const ids = getFavoriteIds();
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      ids.map((id) => api.get(`/listings/${id}`).then((r) => r.data).catch(() => null))
    );
    setItems(results.filter(Boolean));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("zokko-favorites-changed", onChange);
    return () => window.removeEventListener("zokko-favorites-changed", onChange);
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 mb-4">
      <h2 className="font-heading font-semibold text-lg text-[#1A2E22] flex items-center gap-2 mb-4">
        <Heart size={20} weight="fill" className="text-[#D84315]" /> Mes favoris
      </h2>
      {loading ? (
        <p className="text-sm text-[#4A5D50]">Chargement…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
