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

export const fileUrl = (path) => (path ? `${API}/files/${path}` : null);

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
