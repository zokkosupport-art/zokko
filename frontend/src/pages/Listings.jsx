import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useResetOnNavigate } from "@/lib/useResetOnNavigate";
import { MagnifyingGlass, X, Funnel, SlidersHorizontal, CaretLeft, CaretRight } from "@phosphor-icons/react";
import api from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { CONAKRY_QUARTIERS } from "@/lib/quartiers";
import { citySeoPath, categorySeoPath, CITY_SEO_SLUGS } from "@/lib/listingLabels";
import { applyPageSeo, listingsFilterSeo, absoluteUrl } from "@/lib/seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const PAGE_SIZE = 24;

function ListingsFilterPanel({ category, city, quartier, type, categories, cities, onUpdate, onClose }) {
  return (
    <div className="space-y-4">
      <h3 className="font-heading font-semibold text-[#1A2E22]">Catégories</h3>
      <div className="space-y-1">
        <button type="button" onClick={() => onUpdate("category", "")} className={`w-full text-left px-3 py-3 rounded-lg text-sm min-h-[44px] ${!category ? "bg-[#D84315] text-white" : "text-[#4A5D50]"}`}>Toutes</button>
        {categories.map((c) => (
          <button key={c.slug} type="button" onClick={() => onUpdate("category", c.slug)} className={`w-full text-left px-3 py-3 rounded-lg text-sm min-h-[44px] ${category === c.slug ? "bg-[#D84315] text-white" : "text-[#4A5D50]"}`}>
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
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const hadItems = useRef(false);

  useResetOnNavigate(() => setFilterOpen(false));

  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const quartier = params.get("quartier") || "";
  const q = params.get("q") || "";
  const type = params.get("type") || "";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
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
    const isSoft = hadItems.current;
    if (isSoft) setSoftLoading(true);
    else setLoading(true);
    setFetchError(false);

    const p = new URLSearchParams();
    if (category) p.append("category", category);
    if (city) p.append("city", city);
    if (quartier) p.append("quartier", quartier);
    if (q) p.append("q", q);
    if (type) p.append("type", type);
    p.append("limit", String(PAGE_SIZE));
    p.append("skip", String((page - 1) * PAGE_SIZE));

    api.get(`/listings?${p.toString()}`, { signal: controller.signal })
      .then(({ data }) => {
        const list = data.items || [];
        setItems(list);
        setTotal(typeof data.total === "number" ? data.total : list.length);
        if (list.length > 0) hadItems.current = true;
      })
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          setFetchError(true);
          setItems([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSoftLoading(false);
        }
      });
    return () => controller.abort();
  }, [category, city, quartier, q, type, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages && total > 0) {
      const np = new URLSearchParams(params);
      np.delete("page");
      setParams(np, { replace: true });
    }
  }, [page, totalPages, total, params, setParams]);

  const update = (key, val) => {
    const np = new URLSearchParams(params);
    if (val) np.set(key, val);
    else np.delete(key);
    if (key === "city" && val !== "Conakry") np.delete("quartier");
    np.delete("page");
    setParams(np);
  };

  const goToPage = (nextPage) => {
    const p = Math.min(Math.max(1, nextPage), totalPages);
    const np = new URLSearchParams(params);
    if (p <= 1) np.delete("page");
    else np.set("page", String(p));
    setParams(np);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSearch = (e) => {
    e.preventDefault();
    update("q", search.trim());
  };

  const clearAll = () => {
    hadItems.current = false;
    setParams({});
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (category) n += 1;
    if (city) n += 1;
    if (quartier) n += 1;
    if (type) n += 1;
    if (q) n += 1;
    return n;
  }, [category, city, quartier, type, q]);

  const pageTitle = useMemo(() => {
    const parts = [];
    if (category) parts.push(categories.find((c) => c.slug === category)?.name || category);
    if (city) parts.push(city);
    if (quartier) parts.push(quartier);
    if (q) parts.push(`« ${q} »`);
    return parts.length ? parts.join(" · ") : "Toutes les annonces";
  }, [category, city, quartier, q, categories]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const max = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="font-heading font-bold text-xl sm:text-3xl text-[#1A2E22] mb-3 sm:mb-4 line-clamp-2">{pageTitle}</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-3">
        <div className="flex-1 relative min-w-0">
          <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D50]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-10 h-12 text-base bg-white border-[#E5E0D8] rounded-xl" />
        </div>
        <Button type="submit" className="bg-[#D84315] text-white rounded-xl px-4 h-12 min-w-[48px] shrink-0 touch-manipulation">OK</Button>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="relative h-12 w-12 rounded-xl border-[#E5E0D8] md:hidden shrink-0 touch-manipulation" data-testid="toggle-filters-btn" aria-label="Filtres">
              <SlidersHorizontal size={22} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#D84315] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
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
        <button type="button" onClick={() => update("category", "")} className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold touch-manipulation ${!category ? "bg-[#D84315] text-white" : "bg-white border border-[#E5E0D8] text-[#4A5D50]"}`}>Tout</button>
        {categories.map((c) => (
          <button key={c.slug} type="button" onClick={() => update("category", c.slug)} className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap touch-manipulation ${category === c.slug ? "bg-[#D84315] text-white" : "bg-white border border-[#E5E0D8] text-[#4A5D50]"}`}>
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
        <div className={softLoading ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
          {fetchError && (
            <div className="bg-[#FFF3E0] border border-[#FFCC80] rounded-2xl p-4 mb-4 text-sm text-[#1A2E22]">
              Impossible de charger les annonces. Vérifiez votre connexion et réessayez.
            </div>
          )}
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] bg-[#F0EBE1] rounded-2xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-12 text-center">
              <p className="text-[#4A5D50] text-lg font-heading">Aucune annonce trouvée</p>
              <Link to="/publish" className="inline-block mt-4 bg-[#D84315] text-white px-6 py-2.5 rounded-full font-semibold">Publier</Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#4A5D50] mb-3">
                {total} annonce{total > 1 ? "s" : ""}
                {totalPages > 1 && (
                  <span> · page {page} / {totalPages}</span>
                )}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {items.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-8 flex-wrap" aria-label="Pagination" data-testid="listings-pagination">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1 || softLoading}
                    onClick={() => goToPage(page - 1)}
                    className="rounded-full border-[#E5E0D8] gap-1"
                  >
                    <CaretLeft size={18} /> Précédent
                  </Button>
                  {pageNumbers.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={n === page ? "default" : "outline"}
                      onClick={() => goToPage(n)}
                      disabled={softLoading}
                      className={`min-w-[40px] rounded-full ${n === page ? "bg-[#D84315] text-white" : "border-[#E5E0D8]"}`}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page >= totalPages || softLoading}
                    onClick={() => goToPage(page + 1)}
                    className="rounded-full border-[#E5E0D8] gap-1"
                  >
                    Suivant <CaretRight size={18} />
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
