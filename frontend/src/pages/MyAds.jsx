import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/auth";
import ListingCard from "@/components/ListingCard";
import { Plus, Star, Eye, WhatsappLogo, ChatCircleText } from "@phosphor-icons/react";

export default function MyAds() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get(`/listings?owner_id=${user.id}&status=all&limit=100`).then(async ({ data }) => {
      const list = data.items || [];
      setItems(list);
      // Load stats per listing for Pro users
      if (user.is_pro) {
        const allStats = {};
        await Promise.all(list.map(async (l) => {
          try {
            const { data } = await api.get(`/listings/${l.id}/stats`);
            allStats[l.id] = data;
          } catch (err) {
            logger.error(`Failed to load stats for listing ${l.id}`, err);
          }
        }));
        setStats(allStats);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const counts = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    premium: items.filter((i) => i.premium).length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-bold text-3xl text-[#1A2E22]">Mes annonces</h1>
        <Link to="/publish" className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full px-5 py-2.5 font-semibold inline-flex items-center gap-2 transition-colors" data-testid="my-ads-publish-btn">
          <Plus weight="bold" size={18} /> Nouvelle
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={counts.total} color="#1A2E22" />
        <StatCard label="En attente" value={counts.pending} color="#FBC02D" />
        <StatCard label="Publiées" value={counts.approved} color="#2E7D32" />
        <StatCard label="Premium" value={counts.premium} color="#D84315" icon={<Star size={18} weight="fill" />} />
      </div>

      {loading ? (
        <p className="text-[#4A5D50]">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center">
          <p className="text-[#4A5D50] mb-4">Vous n'avez pas encore publié d'annonce.</p>
          <Link to="/publish" className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full px-6 py-2.5 font-semibold inline-block">Publier maintenant</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((l) => (
            <div key={l.id} className="relative">
              <ListingCard listing={l} />
              {l.status !== "approved" && (
                <span className="absolute top-2 right-2 bg-[#FBC02D] text-[#1A2E22] text-[10px] font-bold uppercase px-2 py-1 rounded-full" data-testid={`status-${l.id}`}>
                  {l.status === "pending" ? "En attente" : l.status}
                </span>
              )}
              {user?.is_pro && stats[l.id] && (
                <div className="absolute bottom-2 left-2 right-2 bg-[#1A2E22]/85 backdrop-blur-sm text-white rounded-xl px-3 py-2 flex items-center justify-around text-xs font-semibold" data-testid={`pro-stats-${l.id}`}>
                  <span className="flex items-center gap-1"><Eye size={12} />{stats[l.id].views}</span>
                  <span className="flex items-center gap-1 text-[#25D366]"><WhatsappLogo size={12} weight="fill" />{stats[l.id].whatsapp_clicks}</span>
                  <span className="flex items-center gap-1"><ChatCircleText size={12} />{stats[l.id].messages}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!user?.is_pro && items.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-[#FBC02D]/20 to-[#FBC02D]/5 border border-[#FBC02D]/40 rounded-2xl p-5 text-center">
          <p className="font-heading font-semibold text-[#1A2E22] mb-2">💎 Débloquez les statistiques Pro</p>
          <p className="text-sm text-[#4A5D50] mb-3">Voyez les vues, clics WhatsApp et messages reçus pour chaque annonce.</p>
          <Link to="/payment?purpose=pro_subscription" className="bg-[#FBC02D] hover:bg-[#F9A825] text-[#1A2E22] rounded-full px-6 py-2.5 font-bold inline-block transition-colors" data-testid="upgrade-pro-cta">
            Passer Pro (50 000 GNF/mois)
          </Link>
        </div>
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
