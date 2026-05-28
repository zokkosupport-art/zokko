import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle, Receipt } from "@phosphor-icons/react";
import api, { formatPrice } from "@/lib/api";

const LABELS = { premium: "Premium", boost: "Boost 7j", pro_subscription: "Abo. Pro" };
const COLORS = { completed: "#2E7D32", pending: "#FBC02D", failed: "#C62828" };
const ICONS = { completed: CheckCircle, pending: Clock, failed: XCircle };

export default function PaymentsHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments/me").then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-heading font-bold text-3xl text-[#1A2E22] mb-5">Historique des paiements</h1>
      {loading ? <p className="text-[#4A5D50]">Chargement…</p> : items.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 text-center">
          <Receipt size={48} className="text-[#4A5D50]/40 mx-auto mb-3" />
          <p className="text-[#4A5D50]">Aucun paiement effectué.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
          {items.map((p) => {
            const Icon = ICONS[p.status] || Clock;
            return (
              <div key={p.id} className="p-4 flex items-center gap-3" data-testid={`payment-${p.id}`}>
                <div className="w-10 h-10 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-bold text-xs">
                  {p.provider === "cinetpay" ? "CP" : "OM"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1A2E22]">{LABELS[p.purpose] || p.purpose}{p.mock && <span className="ml-1 text-[10px] bg-[#FBC02D]/20 text-[#1A2E22] px-1.5 py-0.5 rounded">démo</span>}</p>
                  <p className="text-xs text-[#4A5D50] truncate font-mono">{p.transaction_ref}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-[#1A2E22] whitespace-nowrap">{formatPrice(p.amount, p.currency)}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase mt-0.5" style={{ color: COLORS[p.status] || "#4A5D50" }}>
                    <Icon size={12} weight="fill" /> {p.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
