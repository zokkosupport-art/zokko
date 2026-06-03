import { formatPrice, BACKEND_URL } from "./api";

export const LISTING_STATUS_LABELS = {
  pending: "En attente",
  approved: "Publiée",
  rejected: "Rejetée",
  hidden: "Masquée",
};

export const CITY_SEO_SLUGS = {
  Conakry: "conakry",
  Kankan: "kankan",
  Labé: "labe",
  Kindia: "kindia",
  "Nzérékoré": "nzerekore",
  Boké: "boke",
  Faranah: "faranah",
  Mamou: "mamou",
  Siguiri: "siguiri",
  Kissidougou: "kissidougou",
};

export function listingStatusLabel(status) {
  return LISTING_STATUS_LABELS[status] || status;
}

export function listingShareUrl(listingId) {
  const base =
    process.env.REACT_APP_PUBLIC_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://www.zokko.net");
  return `${base.replace(/\/$/, "")}/listings/${listingId}`;
}

export function listingOgShareUrl(listingId) {
  const backend =
    process.env.REACT_APP_BACKEND_URL ||
    BACKEND_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://www.zokko.net");
  return `${backend.replace(/\/$/, "")}/api/s/${listingId}`;
}

export function citySeoPath(city) {
  const slug = CITY_SEO_SLUGS[city] || encodeURIComponent(city);
  return `/annonces/${slug}`;
}

export function categorySeoPath(categorySlug) {
  return `/annonces/categorie/${categorySlug}`;
}

export function facebookShareUrl(url) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function listingWhatsappShareUrl(listing) {
  const shareUrl = listingOgShareUrl(listing.id);
  const shareText = `${listing.title} - ${formatPrice(listing.price, listing.currency)} - ${listing.city}\n\n${shareUrl}\n\nVu sur Zokko 🇬🇳`;
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}

export function listingFacebookShareUrl(listingId) {
  return facebookShareUrl(listingOgShareUrl(listingId));
}

/** Texte prêt à coller sur la Page Facebook (évite le share dialog qui bloque souvent). */
export function listingFacebookPostText(listing) {
  const link = listingOgShareUrl(listing.id);
  const price = formatPrice(listing.price, listing.currency);
  const line = (listing.description || "").split("\n").find((s) => s.trim())?.trim() || "";
  const extra = line.length > 100 ? `${line.slice(0, 100)}…` : line;
  return `${listing.title} — ${listing.city}

💰 ${price}
📍 ${listing.city}${extra ? `\n\n${extra}` : ""}

👉 Voir photos et contacter le vendeur :
${link}

🇬🇳 Zokko — marketplace Guinée`;
}
