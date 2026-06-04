import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MagnifyingGlass, X, Funnel, SlidersHorizontal } from "@phosphor-icons/react";
import api from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { CONAKRY_QUARTIERS } from "@/lib/quartiers";
import { citySeoPath, categorySeoPath, CITY_SEO_SLUGS } from "@/lib/listingLabels";
import { applyPageSeo, listingsFilterSeo, absoluteUrl } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function ListingsFilterPanel({ category, city, quartier, type, categories, cities, onUpdate, onClose }) {
  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-[#1A2E22]">Catégories</h3>
      <div className="space-y-1">
        <button type="button" onClick={() => onUpdate("category", "")} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!category ? "bg-[#D84315] text-white" : "text-[#4A5D50]"}`}>Toutes</button>
        {categories.map((c) => (
          <button key={c.slug} type="button" onClick={() => onUpdate("category", c.slug)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${category === c.slug ? "bg-[#D84315] text-white" : "text-[#4A5D50]"}`}>
            {c.name}
          </button>
        ))}
      </div>
      <h3 className="font-heading font-semibold text-[#1A2E22]">Type</h3>
      <div className="flex flex-wrap gap-2">
        {["", "product", "service"].map((t) => (
          <button key={t || "all"} type="button" onClick={() => onUpdate("type", t)} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${type === t ? "bg-[#2E7D32] text-white" : "bg-[#FAF8F5] text-[#4A5D50]"}`}>
            {t === "" ? "Tout" : t === "product" ? "Produits" : "Services"}
          </button>
        ))}
      </div>
      <h3 className="font-heading font-semibold text-[#1A2E22]">Ville</h3>
      <select value={city} onChange={(e) => onUpdate("city", e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm">
        <option value="">Toutes</option>
        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      {(city === "Conakry" || !city) && (
        <>
          <h3 className="font-heading font-semibold text-[#1A2E22]">Quartier</h3>
          <select value={quartier} onChange={(e) => onUpdate("quartier", e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm">
            <option value="">Tous</option>
            {CONAKRY_QUARTIERS.filter((x) => x !== "Autre").map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </>
      )}
      <Button type="button" onClick={onClose} className="w-full bg-[#D84315] text-white rounded-full">Appliquer</Button>
    </div>
  );
}

export default function Listings() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const quartier = params.get("quartier") || "";
  const q = params.get("q") || "";
  const type = params.get("type") || "";
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    api.get("/cities").then(({ data }) => setCities(data));
  }, []);

  useEffect(() => {
    const catName = categories.find((c) => c.slug === category)?.name;
    const cfg = listingsFilterSeo({ category, city, categoryName: catName, cityName: city });
    let canonical = absoluteUrl("/listings");
    if (city && category) {
      const slug = CITY_SEO_SLUGS[city] || city.toLowerCase();
      canonical = absoluteUrl(`/annonces/${slug}/${category}`);
    } else if (city) {
      canonical = absoluteUrl(citySeoPath(city));
    } else if (category) {
      canonical = absoluteUrl(categorySeoPath(category));
    }
    applyPageSeo({ ...cfg, canonical });
  }, [category, city, categories]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFetchError(false);
    const p = new URLSearchParams();
    if (category) p.append("category", category);
    if (city) p.append("city", city);
    if (quartier) p.append("quartier", quartier);
    if (q) p.append("q", q);
    if (type) p.append("type", type);
    p.append("limit", "60");
    api.get(`/listings?${p.toString()}`, { signal: controller.signal })
      .then(({ data }) => setItems(data.items || []))
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          setFetchError(true);
          setItems([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, city, quartier, q, type]);

  const update = (key, val) => {
    const np = new URLSearchParams(params);
    if (val) np.set(key, val);
    else np.delete(key);
    if (key === "city" && val !== "Conakry") np.delete("quartier");
    setParams(np);
  };

  const onSearch = (e) => {
    e.preventDefault();
    update("q", search);
  };

  const clearAll = () => setParams({});

  const pageTitle = useMemo(() => {
    const parts = [];
    if (category) parts.push(categories.find((c) => c.slug === category)?.name || category);
    if (city) parts.push(city);
    if (quartier) parts.push(quartier);
    if (q) parts.push(`« ${q} »`);
    return parts.length ? parts.join(" · ") : "Toutes les annonces";
  }, [category, city, quartier, q, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A2E22] mb-4">{pageTitle}</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D50]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-10 h-11 bg-white border-[#E5E0D8] rounded-xl" />
        </div>
        <Button type="submit" className="bg-[#D84315] text-white rounded-xl px-4 h-11">OK</Button>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="h-11 rounded-xl border-[#E5E0D8] md:hidden" data-testid="toggle-filters-btn">
              <SlidersHorizontal size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader><SheetTitle className="font-heading text-left">Filtres</SheetTitle></SheetHeader>
            <div className="mt-4 pb-6">
              <ListingsFilterPanel
                category={category}
                city={city}
                quartier={quartier}
                type={type}
                categories={categories}
                cities={cities}
                onUpdate={update}
                onClose={() => setFilterOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <Button type="button" variant="outline" onClick={() => setFilterOpen(true)} className="hidden md:flex h-11 rounded-xl border-[#E5E0D8]">
          <Funnel size={20} />
        </Button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-1 px-1" data-testid="category-chips">
        <button type="button" onClick={() => update("category", "")} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${!category ? "bg-[#D84315] text-white" : "bg-white border border-[#E5E0D8] text-[#4A5D50]"}`}>Tout</button>
        {categories.map((c) => (
          <button key={c.slug} type="button" onClick={() => update("category", c.slug)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${category === c.slug ? "bg-[#D84315] text-white" : "bg-white border border-[#E5E0D8] text-[#4A5D50]"}`}>
            {c.name}
          </button>
        ))}
      </div>

      {(category || city || quartier || q || type) && (
        <button type="button" onClick={clearAll} className="text-xs bg-[#D84315]/10 text-[#D84315] rounded-full px-3 py-1.5 flex items-center gap-1 mb-4">
          <X size={12} /> Effacer les filtres
        </button>
      )}

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="hidden md:block bg-white rounded-2xl border border-[#E5E0D8] p-5 h-fit sticky top-20">
          <ListingsFilterPanel
            category={category}
            city={city}
            quartier={quartier}
            type={type}
            categories={categories}
            cities={cities}
            onUpdate={update}
            onClose={() => {}}
          />
        </aside>
        <div>
          {fetchError && (
            <div className="bg-[#FFF3E0] border border-[#FFCC80] rounded-2xl p-4 mb-4 text-sm text-[#1A2E22]">
              Impossible de charger les annonces. Vérifiez votre connexion et réessayez.
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] bg-[#F0EBE1] rounded-2xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-12 text-center">
              <p className="text-[#4A5D50] text-lg font-heading">Aucune annonce trouvée</p>
              <Link to="/publish" className="inline-block mt-4 bg-[#D84315] text-white px-6 py-2.5 rounded-full font-semibold">Publier</Link>
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
