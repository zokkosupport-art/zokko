/** SEO helpers — titles, meta, JSON-LD (Guinée marketplace). */

export const SITE_NAME = "Zokko";
export const SITE_URL_DEFAULT = "https://www.zokko.net";

export const DEFAULT_KEYWORDS =
  "Zokko, marketplace Guinée, petites annonces Guinée, vendre Conakry, acheter Conakry, " +
  "annonces gratuites Guinée, téléphone occasion Conakry, voiture occasion Guinée, immobilier Conakry, " +
  "WhatsApp vente, Orange Money, +224, Labé, Kankan, Kindia, boutique en ligne Guinée";

export function siteUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.REACT_APP_SITE_URL || SITE_URL_DEFAULT;
}

export function absoluteUrl(path = "/") {
  const base = siteUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

const ROUTES = {
  "/": {
    title: "Zokko · Marketplace Guinée — Petites annonces gratuites Conakry",
    description:
      "Achetez et vendez en Guinée sur Zokko : immobilier, véhicules, téléphones, mode, services. " +
      "Annonces gratuites, inscription +224, contact WhatsApp. Conakry et tout le pays.",
    keywords: DEFAULT_KEYWORDS,
  },
  "/listings": {
    title: "Annonces Guinée — Rechercher sur Zokko",
    description:
      "Parcourez les annonces Zokko en Guinée : filtres par catégorie, ville et quartier. " +
      "Contactez les vendeurs sur WhatsApp.",
    keywords: "annonces Guinée, recherche Zokko, vente occasion Conakry, marketplace GN",
  },
  "/login": {
    title: "Connexion — Zokko Guinée",
    description: "Créez votre compte Zokko avec votre numéro +224 et un code à 6 chiffres. Gratuit.",
    keywords: "inscription Zokko, compte Guinée +224",
  },
  "/publish": {
    title: "Publier une annonce gratuite — Zokko",
    description: "Déposez votre annonce en Guinée : photos, prix en GNF, ville et quartier. Gratuit sur Zokko.",
    keywords: "publier annonce Guinée, vendre gratuit Conakry",
  },
  "/legal": {
    title: "Conditions d'utilisation — Zokko",
    description: "CGU et informations légales de la marketplace Zokko en Guinée. Contact support@zokko.net",
    keywords: "Zokko CGU, conditions marketplace Guinée",
  },
};

export function seoForPath(pathname) {
  if (ROUTES[pathname]) return { ...ROUTES[pathname] };
  if (pathname.startsWith("/annonces/")) {
    return annoncesSeoFromPath(pathname);
  }
  if (pathname.startsWith("/listings/") && pathname !== "/listings") {
    return {
      title: "Annonce — Zokko Guinée",
      description: "Détail annonce sur Zokko, marketplace guinéenne.",
      keywords: DEFAULT_KEYWORDS,
    };
  }
  return {
    title: `${SITE_NAME} · Marketplace Guinée`,
    description: ROUTES["/"].description,
    keywords: DEFAULT_KEYWORDS,
  };
}

const CATEGORY_SEO_NAMES = {
  immobilier: "Immobilier",
  vehicules: "Véhicules",
  electronique: "Électronique",
  mode: "Mode",
  services: "Services",
  emploi: "Emploi",
  alimentation: "Alimentation",
};

const CITY_SEO_NAMES = {
  conakry: "Conakry",
  kankan: "Kankan",
  labe: "Labé",
  kindia: "Kindia",
  nzerekore: "Nzérékoré",
  boke: "Boké",
  faranah: "Faranah",
  mamou: "Mamou",
  siguiri: "Siguiri",
  kissidougou: "Kissidougou",
};

function annoncesSeoFromPath(pathname) {
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts[0] !== "annonces") return ROUTES["/"];
  if (parts[1] === "categorie" && parts[2]) {
    const cat = CATEGORY_SEO_NAMES[parts[2]] || parts[2];
    return {
      title: `${cat} en Guinée — Annonces Zokko`,
      description: `Achetez et vendez ${cat.toLowerCase()} partout en Guinée. Annonces gratuites, WhatsApp, prix en GNF.`,
      keywords: `${cat}, annonces Guinée, Zokko, marketplace`,
    };
  }
  const city = CITY_SEO_NAMES[parts[1]] || parts[1];
  const cat = parts[2] ? CATEGORY_SEO_NAMES[parts[2]] || parts[2] : null;
  if (cat) {
    return {
      title: `${cat} à ${city} — Annonces Zokko Guinée`,
      description: `Annonces ${cat.toLowerCase()} à ${city}. Photos, prix GNF, contact WhatsApp sur Zokko.`,
      keywords: `${cat} ${city}, annonces ${city}, Zokko Guinée`,
    };
  }
  return {
    title: `Annonces ${city} — Marketplace Zokko Guinée`,
    description: `Petites annonces à ${city} : véhicules, mode, électronique, immobilier, services. Gratuit sur Zokko.`,
    keywords: `annonces ${city}, marketplace ${city}, Zokko Guinée`,
  };
}

export function listingsFilterSeo({ category, city, categoryName, cityName }) {
  const cat = categoryName || CATEGORY_SEO_NAMES[category] || category;
  const cty = cityName || city;
  if (cty && cat) {
    return {
      title: `${cat} à ${cty} — Annonces Zokko`,
      description: `Parcourez les annonces ${String(cat).toLowerCase()} à ${cty} sur Zokko. Contact WhatsApp, prix en GNF.`,
      keywords: `${cat} ${cty}, annonces ${cty}, Zokko`,
    };
  }
  if (cty) {
    return {
      title: `Annonces ${cty} — Zokko Guinée`,
      description: `Toutes les annonces à ${cty} sur Zokko marketplace.`,
      keywords: `annonces ${cty}, Zokko Guinée`,
    };
  }
  if (cat) {
    return {
      title: `${cat} en Guinée — Zokko`,
      description: `Annonces ${String(cat).toLowerCase()} en Guinée.`,
      keywords: `${cat}, annonces Guinée, Zokko`,
    };
  }
  return seoForPath("/listings");
}

export function listingSeo(listing, imageUrl) {
  const title = (listing.title || "Annonce").slice(0, 60);
  const price = listing.price != null ? `${Number(listing.price).toLocaleString("fr-FR")} ${listing.currency || "GNF"}` : "";
  const city = listing.city || "Guinée";
  const quartier = listing.quartier ? ` · ${listing.quartier}` : "";
  const description =
    `${title} — ${price} — ${city}${quartier}. ${(listing.description || "").slice(0, 120)}`.trim();
  return {
    title: `${title} | Zokko Guinée`,
    description: description.slice(0, 160),
    keywords: `${title}, ${city}, annonce ${listing.category || ""} Guinée, Zokko`,
    image: imageUrl,
    type: "product",
    canonical: absoluteUrl(`/listings/${listing.id}`),
    jsonLd: productJsonLd(listing, imageUrl),
  };
}

function productJsonLd(listing, imageUrl) {
  const url = absoluteUrl(`/listings/${listing.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: (listing.description || listing.title || "").slice(0, 500),
    image: imageUrl ? [imageUrl] : undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency || "GNF",
      availability: "https://schema.org/InStock",
      url,
    },
    brand: { "@type": "Brand", name: SITE_NAME },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: absoluteUrl("/branding/icon-512.png"),
    description: ROUTES["/"].description,
    areaServed: { "@type": "Country", name: "Guinée" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@zokko.net",
      availableLanguage: ["French"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    description: ROUTES["/"].description,
    inLanguage: "fr-GN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl()}/listings?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function applyPageSeo({
  title,
  description,
  keywords,
  image,
  canonical,
  type = "website",
  jsonLd,
  noindex = false,
}) {
  if (typeof document === "undefined") return;

  document.title = title || `${SITE_NAME} · Guinée`;

  const setMeta = (attr, key, content) => {
    if (!content && content !== false) return;
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", String(content));
  };

  setMeta("name", "description", description);
  if (keywords) setMeta("name", "keywords", keywords);
  setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");

  const ogImage = image || absoluteUrl("/branding/icon-512.png");
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", type);
  setMeta("property", "og:image", ogImage);
  setMeta("property", "og:url", canonical || window.location.href);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("property", "og:locale", "fr_GN");

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", ogImage);

  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical || window.location.href.split("#")[0];

  const old = document.getElementById("zokko-jsonld");
  if (old) old.remove();
  const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  if (blocks.length) {
    const script = document.createElement("script");
    script.id = "zokko-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks);
    document.head.appendChild(script);
  }
}
