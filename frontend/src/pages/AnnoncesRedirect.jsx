import { Navigate, useParams, useLocation } from "react-router-dom";
import { cityFromSeoSlug } from "@/lib/listingLabels";

/** Redirige /annonces/* (SEO serveur) vers l'app React /listings avec filtres. */
export default function AnnoncesRedirect() {
  const { citySlug, categorySlug } = useParams();
  const { pathname } = useLocation();
  const sp = new URLSearchParams();

  if (pathname.includes("/annonces/categorie/")) {
    const slug = categorySlug || pathname.split("/").filter(Boolean).pop();
    if (slug) sp.set("category", slug);
  } else {
    if (citySlug) {
      const city = cityFromSeoSlug(citySlug);
      if (city) sp.set("city", city);
    }
    if (categorySlug) sp.set("category", categorySlug);
  }

  const qs = sp.toString();
  return <Navigate to={`/listings${qs ? `?${qs}` : ""}`} replace />;
}
