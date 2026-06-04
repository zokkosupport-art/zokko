import { Link } from "react-router-dom";
import { WhatsappLogo, ShieldCheck } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import SellFasterOffers from "@/components/SellFasterOffers";
import { ZOKKO_OFFERS } from "@/lib/offers";

const CHOIX = [
  {
    q: "Je veux vendre une annonce vite",
    a: "Boost 7 jours",
    purpose: "boost",
    color: ZOKKO_OFFERS.boost.color,
  },
  {
    q: "J'ai une annonce importante (voiture, maison…)",
    a: "Premium",
    purpose: "premium",
    color: ZOKKO_OFFERS.premium.color,
  },
  {
    q: "Je vends souvent / j'ai une boutique",
    a: "Boutique Pro",
    purpose: "pro_subscription",
    color: ZOKKO_OFFERS.pro_subscription.color,
  },
];

export default function SellFaster() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22]">Vendre plus vite</h1>
        <p className="text-[#4A5D50] mt-3 text-sm sm:text-base leading-relaxed">
          Publier sur Zokko reste <strong>gratuit</strong>. Payez seulement si vous voulez plus de visibilité —
          paiement <strong>Orange Money</strong> et capture obligatoire.
        </p>
      </div>

      <SellFasterOffers
        listingId={undefined}
        variant="default"
        title="Nos 3 options"
        subtitle="Choisissez selon votre besoin"
        className="mb-10"
      />

      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 mb-8">
        <h2 className="font-heading font-bold text-lg text-[#1A2E22] mb-4">Lequel choisir ?</h2>
        <div className="space-y-3">
          {CHOIX.map((row) => (
            <div
              key={row.purpose}
              className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl px-4 py-3 border border-[#E5E0D8]"
            >
              <span className="text-sm text-[#4A5D50]">{row.q}</span>
              <span
                className="text-sm font-bold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: row.color }}
              >
                → {row.a}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-2xl p-4 flex gap-3">
          <WhatsappLogo size={28} weight="fill" className="text-[#FF6600] flex-shrink-0" />
          <div className="text-sm text-[#1A2E22]">
            <p className="font-semibold">Paiement Orange Money</p>
            <p className="text-[#4A5D50] mt-1">Envoyez le montant exact, ajoutez le code reçu par SMS et une capture d&apos;écran.</p>
          </div>
        </div>
        <div className="bg-[#2E7D32]/10 border border-[#2E7D32]/30 rounded-2xl p-4 flex gap-3">
          <ShieldCheck size={28} weight="fill" className="text-[#2E7D32] flex-shrink-0" />
          <div className="text-sm text-[#1A2E22]">
            <p className="font-semibold">Validation par l&apos;équipe Zokko</p>
            <p className="text-[#4A5D50] mt-1">Votre service est activé après vérification (en général sous 24h).</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {user ? (
          <>
            <Link
              to="/my-ads"
              className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full px-6 py-3 font-bold"
            >
              Retour à ma boutique
            </Link>
            <Link
              to="/payments"
              className="border-2 border-[#E5E0D8] text-[#1A2E22] hover:border-[#D84315] rounded-full px-6 py-3 font-semibold"
            >
              Mes paiements
            </Link>
          </>
        ) : (
          <Link to="/register" className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full px-6 py-3 font-bold">
            Créer un compte gratuit
          </Link>
        )}
      </div>
    </div>
  );
}
