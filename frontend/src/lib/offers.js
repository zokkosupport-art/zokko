import { Lightning, Star, CrownSimple } from "@phosphor-icons/react";
import { ZOKKO_PREMIUM_COLOR } from "@/lib/offerColors";

/** Offres payantes Zokko — alignées backend (MANUAL_OM_PRICES_GNF). */
export const ZOKKO_OFFERS = {
  boost: {
    purpose: "boost",
    label: "Boost 7 jours",
    shortLabel: "Boost",
    price: 10000,
    currency: "GNF",
    period: "7 jours",
    color: "#D84315",
    icon: Lightning,
    tagline: "Une annonce urgente à vendre",
    benefits: [
      "En tête des résultats pendant 7 jours",
      "Plus de vues et de clics WhatsApp",
      "Idéal pour vendre vite",
    ],
    cta: "Booster cette annonce",
    needsListing: true,
  },
  premium: {
    purpose: "premium",
    label: "Annonce Premium",
    shortLabel: "Premium",
    price: 20000,
    currency: "GNF",
    period: "à vie sur l'annonce",
    color: ZOKKO_PREMIUM_COLOR,
    icon: Star,
    tagline: "Votre meilleure annonce, toujours visible",
    benefits: [
      "Badge violet Premium sur l'annonce",
      "Mise en avant permanente",
      "Vous démarquez des autres vendeurs",
    ],
    cta: "Passer Premium",
    needsListing: true,
  },
  pro_subscription: {
    purpose: "pro_subscription",
    label: "Boutique Pro",
    shortLabel: "Boutique Pro",
    price: 50000,
    currency: "GNF",
    period: "par mois",
    color: "#FBC02D",
    icon: CrownSimple,
    tagline: "Pour les vendeurs et boutiques actifs",
    benefits: [
      "Stats vues, WhatsApp et messages",
      "Mise en avant sur tout le site",
      "Image pro pour toute votre boutique",
    ],
    cta: "Activer Boutique Pro",
    needsListing: false,
    recommended: true,
  },
};

export const OFFER_ORDER = ["boost", "premium", "pro_subscription"];

export function paymentPath(purpose, listingId) {
  const p = new URLSearchParams({ purpose });
  if (listingId) p.set("listing", listingId);
  return `/payment?${p.toString()}`;
}

export function listingBoostActive(listing) {
  if (!listing?.boosted_until) return false;
  return new Date(listing.boosted_until) > new Date();
}

export function listingOfferStatus(listing) {
  if (listing?.premium) return { type: "premium", label: "Premium actif" };
  if (listingBoostActive(listing)) {
    const until = new Date(listing.boosted_until).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    return { type: "boost", label: `Boost actif jusqu'au ${until}` };
  }
  if (listing?.pending_payment_status === "pending_admin") {
    return { type: "pending", label: "Paiement en attente" };
  }
  return null;
}
