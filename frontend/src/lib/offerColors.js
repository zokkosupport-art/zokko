/** Palette offres Zokko — source unique pour badges et boutons. */
export const ZOKKO_PREMIUM_COLOR = "#7B1FA2";
export const ZOKKO_PREMIUM_HOVER = "#6A1B9A";
export const ZOKKO_PRO_GOLD = "#FBC02D";
export const ZOKKO_BOOST_ORANGE = "#D84315";
export const ZOKKO_BOOST_BRIGHT = "#FF6600";

export const premiumBadgeClass = "bg-[#7B1FA2] text-white";
export const premiumButtonClass = "bg-[#7B1FA2] hover:bg-[#6A1B9A] text-white";
export const premiumStatusClass = "bg-[#7B1FA2]/15 text-[#7B1FA2]";

const PURPOSE_BADGE = {
  boost: "bg-[#FF6600] text-white",
  premium: premiumBadgeClass,
  pro_subscription: "bg-[#FBC02D] text-[#1A2E22]",
};

export function purposeBadgeClass(purpose) {
  return PURPOSE_BADGE[purpose] || "bg-[#4A5D50]/15 text-[#4A5D50]";
}

export function purposeLabel(purpose) {
  const labels = { boost: "Boost", premium: "Premium", pro_subscription: "Boutique Pro" };
  return labels[purpose] || purpose;
}
