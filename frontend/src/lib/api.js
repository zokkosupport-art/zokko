import axios from "axios";

export const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API, timeout: 45000 });

/** Retry on cold start (Railway sleep) / timeout / 503. */
export function isRetryableApiError(err) {
  if (!err) return false;
  const code = err.code;
  if (code === "ECONNABORTED" || code === "ERR_NETWORK") return true;
  const status = err.response?.status;
  return status === 503 || status === 502 || status === 504;
}

export async function withApiRetry(fn, { attempts = 4, delayMs = 2500 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableApiError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

/** Poll until Railway + MongoDB are ready (avoids admin errors on cold start). */
export async function waitForBackendReady({ maxWaitMs = 120000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + maxWaitMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await axios.get(`${BACKEND_URL}/health/ready`, { timeout: 15000 });
      if (res.data?.status === "ok") return true;
    } catch (err) {
      lastErr = err;
      try {
        const db = await axios.get(`${BACKEND_URL}/health/db`, { timeout: 15000 });
        if (db.data?.status === "ok") return true;
      } catch (dbErr) {
        lastErr = dbErr;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  if (lastErr) throw lastErr;
  throw new Error("Serveur indisponible");
}

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
      const path = window.location.pathname;
      if (path.startsWith("/admin") && path !== "/admin-login") {
        window.location.assign("/admin-login");
      } else if (path !== "/login" && path !== "/register" && path !== "/admin-login") {
        const protectedPrefixes = ["/my-ads", "/profile", "/messages", "/payment", "/favorites", "/publish", "/payments"];
        if (protectedPrefixes.some((p) => path.startsWith(p))) {
          window.location.assign(`/login?next=${encodeURIComponent(path + window.location.search)}`);
        }
      }
    }
    return Promise.reject(err);
  }
);

export const fileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\/?api\/files\//i, "");
  return `${API}/files/${clean}`;
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
