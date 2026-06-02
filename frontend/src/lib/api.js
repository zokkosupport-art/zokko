import axios from "axios";

export const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("gm_token");
    }
    return Promise.reject(err);
  }
);

export const fileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API}/files/${path}`;
};

/** First listing image from API fields (photos, images, image_urls, photo). */
export const getListingCoverPath = (listing) => {
  if (!listing) return null;
  if (listing.photos?.length) return listing.photos[0];
  if (listing.images?.length) return listing.images[0];
  if (listing.image_urls?.length) return listing.image_urls[0];
  if (listing.photo) return listing.photo;
  if (listing.cover_image) return listing.cover_image;
  return null;
};

export const getListingCoverUrl = (listing) => fileUrl(getListingCoverPath(listing));

/** @deprecated Stock placeholders removed — use ListingImage (honest "Photo indisponible"). */
export const CATEGORY_PLACEHOLDER_IMAGES = {};

export const getListingThumbnailUrl = (listing) => getListingCoverUrl(listing) || null;

export const formatPrice = (price, currency = "GNF") => {
  if (typeof price !== "number") return "";
  if (currency === "GNF") {
    return `${price.toLocaleString("fr-FR")} GNF`;
  }
  return `${price.toLocaleString("fr-FR")} ${currency}`;
};

export const formatApiError = (err) => {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || "Une erreur est survenue";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(", ");
  return JSON.stringify(d);
};

export default api;
