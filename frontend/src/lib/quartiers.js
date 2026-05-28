/** Quartiers courants de Conakry (communes + zones fréquentes). */
export const CONAKRY_QUARTIERS = [
  "Ratoma",
  "Matam",
  "Kaloum",
  "Dixinn",
  "Matoto",
  "Kagbelen",
  "Sonfonia",
  "Kipé",
  "Hamdallaye",
  "Lambanyi",
  "Tombolia",
  "Gbessia",
  "Cosa",
  "Bambeto",
  "Almamya",
  "Madina",
  "Autre",
];

export function isConakry(city) {
  return (city || "").trim().toLowerCase() === "conakry";
}
