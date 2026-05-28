import { CONAKRY_QUARTIERS, isConakry } from "@/lib/quartiers";
import { Input } from "@/components/ui/input";

export default function QuartierField({ city, value, onChange, className = "", testId = "quartier-input" }) {
  if (!isConakry(city)) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Quartier ou zone"
        className={className || "bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"}
        data-testid={testId}
      />
    );
  }

  const inList = !value || CONAKRY_QUARTIERS.includes(value);
  const selectValue = inList ? (value || "") : "Autre";

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "Autre" && !CONAKRY_QUARTIERS.includes(value) ? value : v === "Autre" ? "" : v);
        }}
        className={className || "w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl h-12 px-3 text-sm"}
        data-testid={testId}
      >
        <option value="">Choisir un quartier…</option>
        {CONAKRY_QUARTIERS.map((q) => (
          <option key={q} value={q}>{q}</option>
        ))}
      </select>
      {selectValue === "Autre" && (
        <Input
          value={inList ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Précisez le quartier"
          className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-11"
          data-testid={`${testId}-custom`}
        />
      )}
    </div>
  );
}
