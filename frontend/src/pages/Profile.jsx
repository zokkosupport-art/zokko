import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrownSimple, SignOut, Wallet, SealCheck, Copy, Gift, Star } from "@phosphor-icons/react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "", city: user?.city || "", quartier: user?.quartier || "", whatsapp: user?.whatsapp || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", form);
      setUser(data);
      toast.success("Profil mis à jour");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(user?.referral_code || "");
    toast.success("Code copié !");
  };

  const shareRef = () => {
    const text = `Inscris-toi sur Zokko avec mon code parrain ${user?.referral_code} et reçois 1 boost gratuit ! 🇬🇳\n\n${window.location.origin}/login`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-[#D84315]/10 text-[#D84315] font-heading font-bold flex items-center justify-center text-2xl">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#1A2E22] flex items-center gap-1">
            {user?.name}
            {user?.verified && <SealCheck size={20} weight="fill" className="text-[#2E7D32]" />}
          </h1>
          <p className="text-sm text-[#4A5D50]">+224 {user?.phone}</p>
          <div className="flex items-center gap-2 mt-1">
            {user?.is_pro && <span className="inline-flex items-center gap-1 text-xs bg-[#FBC02D]/20 text-[#1A2E22] px-2 py-0.5 rounded-full font-semibold"><CrownSimple size={12} weight="fill" /> Pro</span>}
            {user?.rating_count > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#FBC02D]">
                <Star size={12} weight="fill" /> {user.rating_avg.toFixed(1)} <span className="text-[#4A5D50]">({user.rating_count})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] text-white rounded-2xl p-5 mb-4">
        <p className="text-xs uppercase font-bold tracking-wide opacity-80 flex items-center gap-1"><Gift size={14} weight="fill" /> Programme parrainage</p>
        <p className="font-heading font-bold text-3xl mt-1 tracking-wider" data-testid="referral-code">{user?.referral_code}</p>
        <p className="text-sm opacity-90 mt-2">Invitez un ami : vous gagnez tous les 2 un boost gratuit 7 jours 🎁</p>
        {user?.boost_credits > 0 && (
          <p className="text-sm bg-white/20 inline-block px-3 py-1 rounded-full mt-2 font-semibold">⚡ {user.boost_credits} boost{user.boost_credits > 1 ? "s" : ""} gratuit{user.boost_credits > 1 ? "s" : ""}</p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={copyRef} className="bg-white/20 hover:bg-white/30 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-1 transition-colors" data-testid="copy-ref-btn">
            <Copy size={16} /> Copier
          </button>
          <button onClick={shareRef} className="bg-white text-[#2E7D32] hover:bg-[#FAF8F5] rounded-full py-2.5 text-sm font-bold flex items-center justify-center gap-1 transition-colors" data-testid="share-ref-btn">
            Partager WhatsApp
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 mb-4 space-y-4">
        <h2 className="font-heading font-semibold text-lg text-[#1A2E22]">Mes informations</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="font-medium mb-1.5 block">Nom</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-11" data-testid="profile-name" />
          </div>
          <div>
            <Label className="font-medium mb-1.5 block">Ville</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-11" data-testid="profile-city" />
          </div>
          <div>
            <Label className="font-medium mb-1.5 block">Quartier</Label>
            <Input value={form.quartier} onChange={(e) => set("quartier", e.target.value)} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-11" data-testid="profile-quartier" />
          </div>
          <div>
            <Label className="font-medium mb-1.5 block">WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-11" data-testid="profile-whatsapp" />
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full px-6" data-testid="profile-save">
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 mb-4 space-y-3">
        <h2 className="font-heading font-semibold text-lg text-[#1A2E22]">Compte Pro</h2>
        <p className="text-sm text-[#4A5D50]">Annonces illimitées, statistiques détaillées. 50 000 GNF / mois.</p>
        <Button onClick={() => nav("/payment?purpose=pro_subscription")} className="bg-[#FBC02D] hover:bg-[#F9A825] text-[#1A2E22] rounded-xl font-bold" data-testid="profile-pro-btn">
          <CrownSimple size={18} weight="fill" className="mr-2" /> Devenir Pro
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button onClick={() => nav("/payments")} className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-left hover:border-[#D84315] transition-colors" data-testid="profile-payments-btn">
          <Wallet size={24} className="text-[#D84315] mb-2" />
          <p className="font-semibold text-[#1A2E22]">Mes paiements</p>
          <p className="text-xs text-[#4A5D50]">Historique Orange Money</p>
        </button>
        <button onClick={() => { logout(); nav("/"); }} className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-left hover:border-[#C62828] transition-colors" data-testid="profile-logout-btn">
          <SignOut size={24} className="text-[#C62828] mb-2" />
          <p className="font-semibold text-[#1A2E22]">Déconnexion</p>
          <p className="text-xs text-[#4A5D50]">Quitter votre session</p>
        </button>
      </div>
    </div>
  );
}
