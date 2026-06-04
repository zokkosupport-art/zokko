/** Digits for wa.me (no +), Guinea E.164 without double 224 prefix. */
export function waMeDigits(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("224") && d.length >= 12) return d;
  if (d.length === 9) return `224${d}`;
  if (d.startsWith("224")) return d.slice(0, 12);
  return d ? `224${d}` : "";
}

export function waMeUrl(phone, text) {
  const digits = waMeDigits(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Display +224 612… whether stored as 9 or 12 digits. */
export function formatGnPhoneDisplay(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (!d) return "—";
  if (d.startsWith("224") && d.length >= 12) return `+224 ${d.slice(3)}`;
  if (d.length === 9) return `+224 ${d}`;
  return `+${d}`;
}
