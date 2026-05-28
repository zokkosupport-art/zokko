import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MagnifyingGlass, X, Funnel } from "@phosphor-icons/react";
import api from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { CONAKRY_QUARTIERS } from "@/lib/quartiers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Listings() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const quartier = params.get("quartier") || "";
  const q = params.get("q") || "";
  const type = params.get("type") || "";
  const [search, setSearch] = useState(q);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    api.get("/cities").then(({ data }) => setCities(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (category) p.append("category", category);
    if (city) p.append("city", city);
    if (quartier) p.append("quartier", quartier);
    if (q) p.append("q", q);
    if (type) p.append("type", type);
    p.append("limit", "60");
    api.get(`/listings?${p.toString()}`)
      .then(({ data }) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, [category, city, quartier, q, type]);

  const update = (key, val) => {
    const np = new URLSearchParams(params);
    if (val) np.set(key, val); else np.delete(key);
    setParams(np);
  };

  const onSearch = (e) => {
    e.preventDefault();
    update("q", search);
  };

  const clearAll = () => setParams({});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22] mb-5">Toutes les annonces</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-4" data-testid="search-form">
        <div className="flex-1 relative">
          <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D50]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit, un service…"
            className="pl-10 h-12 bg-white border-[#E5E0D8] rounded-xl"
            data-testid="search-input"
          />
        </div>
        <Button type="submit" className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-xl px-5 h-12" data-testid="search-btn">Rechercher</Button>
        <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:hidden border-[#E5E0D8] h-12 rounded-xl" data-testid="toggle-filters-btn">
          <Funnel size={20} />
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {(category || city || quartier || q || type) && (
          <button onClick={clearAll} className="text-xs bg-[#D84315]/10 text-[#D84315] rounded-full px-3 py-1.5 flex items-center gap-1" data-testid="clear-filters">
            <X size={12} /> Effacer
          </button>
        )}
        {category && <span className="text-xs bg-white border border-[#E5E0D8] rounded-full px-3 py-1.5">Catégorie: {categories.find(c => c.slug === category)?.name || category}</span>}
        {city && <span className="text-xs bg-white border border-[#E5E0D8] rounded-full px-3 py-1.5">Ville: {city}</span>}
        {quartier && <span className="text-xs bg-white border border-[#E5E0D8] rounded-full px-3 py-1.5">Quartier: {quartier}</span>}
        {q && <span className="text-xs bg-white border border-[#E5E0D8] rounded-full px-3 py-1.5">Recherche: {q}</span>}
        {type && <span className="text-xs bg-white border border-[#E5E0D8] rounded-full px-3 py-1.5">Type: {type === "service" ? "Service" : "Produit"}</span>}
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside className={`${showFilters ? "block" : "hidden"} md:block bg-white rounded-2xl border border-[#E5E0D8] p-5 h-fit`}>
          <h3 className="font-heading font-semibold text-[#1A2E22] mb-3">Catégories</h3>
          <div className="space-y-1 mb-4">
            <button onClick={() => update("category", "")} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${!category ? "bg-[#D84315] text-white" : "text-[#4A5D50] hover:bg-[#FAF8F5]"}`} data-testid="filter-cat-all">Toutes</button>
            {categories.map((c) => (
              <button key={c.slug} onClick={() => update("category", c.slug)} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${category === c.slug ? "bg-[#D84315] text-white" : "text-[#4A5D50] hover:bg-[#FAF8F5]"}`} data-testid={`filter-cat-${c.slug}`}>
                {c.name}
              </button>
            ))}
          </div>
          <h3 className="font-heading font-semibold text-[#1A2E22] mb-3">Type</h3>
          <div className="space-y-1 mb-4">
            <button onClick={() => update("type", "")} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${!type ? "bg-[#2E7D32] text-white" : "text-[#4A5D50] hover:bg-[#FAF8F5]"}`}>Tout</button>
            <button onClick={() => update("type", "product")} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${type === "product" ? "bg-[#2E7D32] text-white" : "text-[#4A5D50] hover:bg-[#FAF8F5]"}`}>Produits</button>
            <button onClick={() => update("type", "service")} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${type === "service" ? "bg-[#2E7D32] text-white" : "text-[#4A5D50] hover:bg-[#FAF8F5]"}`}>Services</button>
          </div>
          <h3 className="font-heading font-semibold text-[#1A2E22] mb-3">Ville</h3>
          <select value={city} onChange={(e) => { update("city", e.target.value); if (e.target.value !== "Conakry") update("quartier", ""); }} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm" data-testid="filter-city-select">
            <option value="">Toutes les villes</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(city === "Conakry" || !city) && (
            <>
              <h3 className="font-heading font-semibold text-[#1A2E22] mb-3 mt-4">Quartier (Conakry)</h3>
              <select value={quartier} onChange={(e) => update("quartier", e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm" data-testid="filter-quartier-select">
                <option value="">Tous les quartiers</option>
                {CONAKRY_QUARTIERS.filter((q) => q !== "Autre").map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </>
          )}
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] bg-[#F0EBE1] rounded-2xl gm-img-placeholder" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-12 text-center">
              <p className="text-[#4A5D50] text-lg font-heading">Aucune annonce trouvée</p>
              <Link to="/publish" className="inline-block mt-4 bg-[#D84315] hover:bg-[#BF360C] text-white px-6 py-2.5 rounded-full font-semibold transition-colors">Publier la première</Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#4A5D50] mb-3">{items.length} annonce{items.length > 1 ? "s" : ""}</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
