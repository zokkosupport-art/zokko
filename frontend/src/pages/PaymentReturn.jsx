import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Clock, XCircle, ArrowRight } from "@phosphor-icons/react";
import api, { formatApiError, formatPrice } from "@/lib/api";
import { Button } from "@/components/ui/button";

const LABELS = { premium: "Annonce Premium", boost: "Boost 7 jours", pro_subscription: "Abonnement Pro" };

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const tx = params.get("tx");
  const isMock = params.get("mock") === "1";

  const [status, setStatus] = useState("checking"); // checking | success | pending | failed
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!tx) {
      setError("Référence de transaction manquante");
      setStatus("failed");
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await api.post(`/payments/cinetpay/check/${tx}`);
        if (cancelled) return;
        setPayment(data);
        if (data.status === "completed") setStatus("success");
        else if (data.status === "failed") setStatus("failed");
        else {
          setStatus("pending");
          setAttempts((a) => a + 1);
          // retry up to 6 times (30s)
          if (attempts < 6) setTimeout(poll, 5000);
        }
      } catch (e) {
        if (cancelled) return;
        setError(formatApiError(e));
        setStatus("failed");
      }
    };
    poll();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [tx]);

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white border border-[#E5E0D8] rounded-3xl p-8 text-center gm-shadow-soft">
        {status === "checking" && (
          <>
            <Clock size={64} weight="duotone" className="text-[#4A5D50] mx-auto gm-pulse" />
            <h1 className="font-heading font-bold text-xl text-[#1A2E22] mt-4">Vérification du paiement…</h1>
            <p className="text-sm text-[#4A5D50] mt-2">Connexion à CinetPay</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={72} weight="fill" className="text-[#2E7D32] mx-auto" />
            <h1 className="font-heading font-bold text-2xl text-[#1A2E22] mt-4">Paiement réussi !</h1>
            <p className="text-sm text-[#4A5D50] mt-2">
              {LABELS[payment?.purpose] || "Service"} activé{isMock && " (mode démo)"}.
            </p>
            {payment && (
              <div className="bg-[#FAF8F5] rounded-xl p-4 mt-4 text-left text-sm space-y-1">
                <div className="flex justify-between"><span className="text-[#4A5D50]">Référence</span><span className="font-mono text-[#1A2E22]">{payment.transaction_ref}</span></div>
                <div className="flex justify-between"><span className="text-[#4A5D50]">Montant</span><span className="font-bold text-[#1A2E22]">{formatPrice(payment.amount, payment.currency)}</span></div>
                {payment.cinetpay_payment_method && <div className="flex justify-between"><span className="text-[#4A5D50]">Méthode</span><span className="text-[#1A2E22]">{payment.cinetpay_payment_method}</span></div>}
                <div className="flex justify-between"><span className="text-[#4A5D50]">Statut</span><span className="text-[#2E7D32] font-bold">COMPLETED</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Link to="/my-ads" className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full py-2.5 font-semibold text-sm transition-colors" data-testid="success-myads-btn">Mes annonces</Link>
              <Link to="/payments" className="bg-white border border-[#E5E0D8] hover:border-[#D84315] text-[#1A2E22] rounded-full py-2.5 font-semibold text-sm transition-colors" data-testid="success-history-btn">Historique</Link>
            </div>
          </>
        )}
        {status === "pending" && (
          <>
            <Clock size={72} weight="duotone" className="text-[#FBC02D] mx-auto" />
            <h1 className="font-heading font-bold text-xl text-[#1A2E22] mt-4">Paiement en cours…</h1>
            <p className="text-sm text-[#4A5D50] mt-2">
              CinetPay traite votre paiement. Cela peut prendre quelques instants.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-full" data-testid="refresh-btn">
              Actualiser
            </Button>
            <Link to="/payments" className="block text-xs text-[#4A5D50] mt-3 underline">Voir l'historique</Link>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle size={72} weight="fill" className="text-[#C62828] mx-auto" />
            <h1 className="font-heading font-bold text-xl text-[#1A2E22] mt-4">Paiement non confirmé</h1>
            <p className="text-sm text-[#4A5D50] mt-2">{error || "Le paiement n'a pas été validé. Aucun montant n'a été débité."}</p>
            <Button onClick={() => nav(-1)} className="mt-4 bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full" data-testid="retry-btn">
              Réessayer <ArrowRight size={16} weight="bold" className="ml-1" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
