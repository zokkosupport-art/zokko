export const LISTING_STATUS_LABELS = {
  pending: "En attente",
  approved: "Publiée",
  rejected: "Rejetée",
  hidden: "Masquée",
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
    (typeof window !== "undefined" ? window.location.origin : "https://www.zokko.net");
  return `${backend.replace(/\/$/, "")}/api/s/${listingId}`;
}

export function facebookShareUrl(url) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
