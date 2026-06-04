import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "@phosphor-icons/react";
import api from "@/lib/api";
import { getFavoriteIds } from "@/lib/favorites";
import ListingCard from "@/components/ListingCard";

export default function Favorites() {
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A2E22] mb-2 flex items-center gap-2">
        <Heart size={28} weight="fill" className="text-[#D84315]" /> Mes favoris
      </h1>
      <p className="text-sm text-[#4A5D50] mb-6">Annonces enregistrées avec le cœur</p>

      {loading ? (
        <p className="text-[#4A5D50]">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center">
          <Heart size={48} className="text-[#E5E0D8] mx-auto mb-3" />
          <p className="text-[#4A5D50] mb-4">Aucun favori pour le moment</p>
          <Link to="/listings" className="bg-[#D84315] text-white rounded-full px-6 py-2.5 font-semibold inline-block">
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
