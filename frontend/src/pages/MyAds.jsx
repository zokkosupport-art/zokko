import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";
import { listingStatusLabel, listingWhatsappShareUrl, listingFacebookPostText, pendingPaymentLabel } from "@/lib/listingLabels";
import { Plus, Star, Eye, WhatsappLogo, ChatCircleText, PencilSimple, Trash, Crown, FacebookLogo, Lightning } from "@phosphor-icons/react";
import SellFasterOffers from "@/components/SellFasterOffers";
import ListingOfferActions from "@/components/ListingOfferActions";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";

const TABS = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Publiées" },
  { key: "rejected", label: "Rejetées" },
  { key: "hidden", label: "Masquées" },
];

export default function MyAds() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/listings?owner_id=${user.id}&status=all&limit=100`);
      const list = data.items || [];
      setItems(list);
      if (user.is_pro) {
        const allStats = {};
        await Promise.all(list.map(async (l) => {
          try {
            const { data: st } = await api.get(`/listings/${l.id}/stats`);
            allStats[l.id] = st;
          } catch (err) {
            logger.error(err);
          }
        }));
        setStats(allStats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id, user?.is_pro]);

  const filtered = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((i) => i.status === tab);
  }, [items, tab]);

  const totals = useMemo(() => {
    if (!user?.is_pro) return null;
    return Object.values(stats).reduce(
      (acc, s) => ({
        views: acc.views + (s.views || 0),
        whatsapp: acc.whatsapp + (s.whatsapp_clicks || 0),
        messages: acc.messages + (s.messages || 0),
      }),
      { views: 0, whatsapp: 0, messages: 0 }
    );
  }, [stats, user?.is_pro]);

  const counts = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    premium: items.filter((i) => i.premium).length,
  };

  const firstApprovedId = items.find((i) => i.status === "approved")?.id;
  const hasApprovedWithoutPromo = items.some(
    (i) => i.status === "approved" && !i.premium && !(i.boosted_until && new Date(i.boosted_until) > new Date())
  );

  const deleteAd = async (id) => {
    if (!window.confirm("Supprimer cette annonce ?")) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success("Annonce supprimée");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const proUntilLabel = user?.pro_until
    ? new Date(user.pro_until).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A2E22]">Ma boutique</h1>
        <Link to="/publish" className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full px-4 py-2.5 font-semibold inline-flex items-center gap-2 text-sm">
          <Plus weight="bold" size={18} /> Nouvelle
        </Link>
      </div>

      {user?.is_pro && (
        <div className="bg-gradient-to-br from-[#1A2E22] to-[#2E4A38] text-white rounded-2xl p-5 mb-4">
          <p className="text-xs uppercase font-bold text-[#FBC02D] flex items-center gap-1"><Crown size={14} weight="fill" /> Abonnement Boutique Pro</p>
          {proUntilLabel && <p className="text-sm mt-1 opacity-90">Actif jusqu&apos;au {proUntilLabel}</p>}
          {totals && (
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-white/10 rounded-xl py-2">
                <p className="font-heading font-bold text-xl">{totals.views}</p>
                <p className="text-[10px] opacity-80">Vues</p>
              </div>
              <div className="bg-white/10 rounded-xl py-2">
                <p className="font-heading font-bold text-xl text-[#25D366]">{totals.whatsapp}</p>
                <p className="text-[10px] opacity-80">WhatsApp</p>
              </div>
              <div className="bg-white/10 rounded-xl py-2">
                <p className="font-heading font-bold text-xl">{totals.messages}</p>
                <p className="text-[10px] opacity-80">Messages</p>
              </div>
            </div>
          )}
          <Link to="/payment?purpose=pro_subscription" className="inline-block mt-3 text-sm font-semibold text-[#FBC02D] hover:underline">Renouveler l&apos;abonnement →</Link>
        </div>
      )}

      {!user?.is_pro && (
        <SellFasterOffers
          listingId={firstApprovedId}
          variant="compact"
          showCompareLink
          title="Vendre plus vite"
          subtitle="Boost, Premium ou Boutique Pro — Orange Money"
          className="mb-5"
        />
      )}

      {!user?.is_pro && hasApprovedWithoutPromo && counts.approved > 0 && (
        <div className="bg-[#FF6600]/10 border border-[#FF6600]/35 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3 text-sm text-[#1A2E22]">
          <Lightning size={22} weight="fill" className="text-[#FF6600] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Peu de contacts ?</strong> Mettez une annonce en avant avec Boost (10 000 GNF) ou Premium (20 000 GNF) — boutons sous chaque annonce publiée.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total" value={counts.total} color="#1A2E22" />
        <StatCard label="En attente" value={counts.pending} color="#FBC02D" />
        <StatCard label="Publiées" value={counts.approved} color="#2E7D32" />
        <StatCard label="Premium" value={counts.premium} color="#D84315" icon={<Star size={18} weight="fill" />} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${
              tab === t.key ? "bg-[#D84315] text-white" : "bg-white border border-[#E5E0D8] text-[#4A5D50]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#4A5D50]">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center">
          <p className="text-[#4A5D50] mb-4">Aucune annonce dans cette catégorie.</p>
          <Link to="/publish" className="bg-[#D84315] text-white rounded-full px-6 py-2.5 font-semibold inline-block">Publier</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <div key={l.id} className="relative space-y-2">
              <div className="relative">
                <ListingCard listing={l} />
                {pendingPaymentLabel(l) && (
                  <span className="absolute top-2 left-2 bg-[#FF6600] text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 max-w-[70%] truncate">
                    {pendingPaymentLabel(l)} — paiement en attente
                  </span>
                )}
                {l.status !== "approved" && (
                  <span className="absolute top-2 right-12 bg-[#FBC02D] text-[#1A2E22] text-[10px] font-bold uppercase px-2 py-1 rounded-full z-10">
                    {listingStatusLabel(l.status)}
                  </span>
                )}
                {user?.is_pro && stats[l.id] && (
                  <div className="absolute bottom-2 left-2 right-2 bg-[#1A2E22]/85 text-white rounded-xl px-3 py-2 flex justify-around text-xs font-semibold z-10">
                    <span className="flex items-center gap-1"><Eye size={12} />{stats[l.id].views}</span>
                    <span className="flex items-center gap-1 text-[#25D366]"><WhatsappLogo size={12} weight="fill" />{stats[l.id].whatsapp_clicks}</span>
                    <span className="flex items-center gap-1"><ChatCircleText size={12} />{stats[l.id].messages}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {l.status === "approved" && (
                  <>
                    <a
                      href={listingWhatsappShareUrl(l)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-full border border-[#25D366]/40 text-[#25D366] flex items-center justify-center gap-1"
                    >
                      <WhatsappLogo size={14} weight="fill" /> WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(listingFacebookPostText(l));
                          toast.success("Texte copié ! Page Facebook → Coller (Ctrl+V) → Publier", { duration: 8000 });
                          window.open("https://www.facebook.com/zokkoguinee", "_blank", "noopener,noreferrer");
                        } catch {
                          toast.error("Impossible de copier le texte");
                        }
                      }}
                      className="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-full border border-[#1877F2]/40 text-[#1877F2] flex items-center justify-center gap-1"
                    >
                      <FacebookLogo size={14} weight="fill" /> Facebook
                    </button>
                  </>
                )}
                <button type="button" onClick={() => nav(`/publish?edit=${l.id}`)} className="flex-1 min-w-[80px] text-xs font-semibold py-2 rounded-full border border-[#E5E0D8] flex items-center justify-center gap-1">
                  <PencilSimple size={14} /> Modifier
                </button>
                <button type="button" onClick={() => deleteAd(l.id)} className="text-xs font-semibold py-2 px-3 rounded-full border border-[#C62828]/30 text-[#C62828]">
                  <Trash size={14} className="inline" />
                </button>
              </div>
              <ListingOfferActions listing={l} />
            </div>
          ))}
        </div>
      )}

      {user?.is_pro && (
        <Link
          to="/vendre-plus-vite"
          className="mt-6 block text-center text-sm font-semibold text-[#D84315] hover:underline"
        >
          Voir toutes les options de visibilité →
        </Link>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4">
      <div className="text-xs uppercase font-semibold text-[#4A5D50] flex items-center gap-1">{icon} {label}</div>
      <div className="font-heading font-bold text-2xl mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
