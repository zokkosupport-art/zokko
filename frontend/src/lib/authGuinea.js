export const GUINEA = {
  code: "GN",
  dial: "+224",
  placeholder: "612345678",
  hint: "9 chiffres (ex. 612 51 64 88) — Guinée uniquement",
  minDigits: 9,
};

export const AUTH_REDIRECT = "/listings";

/** Valide ?next= pour redirection post-login (chemins internes uniquement). */
export function safeNextPath(raw) {
  if (!raw) return null;
  try {
    const path = decodeURIComponent(raw);
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    if (path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/admin-login")) return null;
    return path;
  } catch {
    return null;
  }
}
