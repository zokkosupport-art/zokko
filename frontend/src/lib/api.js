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

/** Category fallback when no uploaded photo (demo / legacy listings). */
export const CATEGORY_PLACEHOLDER_IMAGES = {
  vehicules: "https://images.unsplash.com/photo-1623869674694-dcd959eca434?auto=format&fit=crop&w=800&q=80",
  immobilier: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
  electronique: "https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=800",
  services: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  mode: "https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=800",
  alimentation: "https://images.unsplash.com/photo-1586201375767-2b532b21d645?auto=format&fit=crop&w=800&q=80",
  emploi: "https://images.pexels.com/photos/4484078/pexels-photo-4484078.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export const getListingThumbnailUrl = (listing) => {
  const cover = getListingCoverUrl(listing);
  if (cover) return cover;
  return CATEGORY_PLACEHOLDER_IMAGES[listing?.category] || null;
};

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
