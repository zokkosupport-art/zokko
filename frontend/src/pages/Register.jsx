import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Phone, Key, Camera, UserCircle, ArrowLeft } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { compressImage } from "@/lib/imageCompress";
import { useAuth } from "@/lib/auth";
import { GUINEA, AUTH_REDIRECT } from "@/lib/authGuinea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthModeSwitch from "@/components/AuthModeSwitch";

export default function Register() {
  const [params] = useSearchParams();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState(params.get("phone")?.replace(/\D/g, "") || "");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [city, setCity] = useState("Conakry");
  const [referralCode, setReferralCode] = useState("");
  const [accountType, setAccountType] = useState("particulier");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (phone.length >= GUINEA.minDigits) setStep("form");
  }, []);

  const continueWithPhone = async () => {
    if (phone.length < GUINEA.minDigits) {
      toast.error("Numéro invalide");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/check-phone", { phone, country: GUINEA.code });
      if (data.exists && data.has_pin) {
        toast.info("Ce numéro a déjà un compte — connectez-vous");
        nav(`/login?phone=${encodeURIComponent(phone)}`);
        return;
      }
      setStep("form");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    if (pin.length !== 6 || pinConfirm.length !== 6) {
      toast.error("Code à 6 chiffres requis");
      return;
    }
    if (pin !== pinConfirm) {
      toast.error("Les codes ne correspondent pas");
      return;
    }
    if (!name.trim()) {
      toast.error("Entrez votre nom");
      return;
    }
    const un = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (un.length < 3) {
      toast.error("Identifiant @ obligatoire (3 à 24 caractères)");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/phone-pin", {
        phone,
        country: GUINEA.code,
        pin,
        pin_confirm: pinConfirm,
        name: name.trim(),
        username: un,
        city,
        referral_code: referralCode || undefined,
        account_type: accountType,
      });
      let token = data.access_token;
      let user = data.user;
      login(token, user);
      if (avatarFile) {
        const compressed = await compressImage(avatarFile).catch(() => avatarFile);
        const fd = new FormData();
        fd.append("file", compressed);
        const up = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        const { data: me } = await api.patch("/auth/me", { avatar: up.data.path });
        user = me;
        login(token, me);
      }
      toast.success(`Compte créé — bienvenue ${user.name} !`);
      nav(AUTH_REDIRECT);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const onAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 gm-shadow-soft gm-fade-in">
        {step === "form" && (
          <button type="button" onClick={() => setStep("phone")} className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]">
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <AuthModeSwitch active="register" className="mb-6" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center mb-3">
            {step === "phone" ? <Phone size={28} weight="duotone" /> : <Key size={28} weight="duotone" />}
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#1A2E22]">Créer un compte</h1>
          <p className="text-sm text-[#4A5D50] mt-2">Gratuit · numéro +224 · code à 6 chiffres</p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Téléphone (Guinée 🇬🇳)</Label>
              <div className="flex gap-2">
                <div className="flex items-center bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 text-sm font-medium">{GUINEA.dial}</div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder={GUINEA.placeholder}
                  className="flex-1 bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"
                  data-testid="register-phone-input"
                />
              </div>
            </div>
            <Button onClick={continueWithPhone} disabled={loading} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full h-14 text-base font-bold">
              {loading ? "Vérification..." : "Continuer — inscription"}
            </Button>
            <p className="text-center text-xs text-[#4A5D50] bg-[#FAF8F5] rounded-xl px-3 py-2">
              Vous avez déjà un compte ? Cliquez <strong>J&apos;ai un compte</strong> en haut.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#4A5D50] bg-[#FAF8F5] rounded-xl px-3 py-2">+224 {phone}</p>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Vous êtes</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("particulier")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${accountType === "particulier" ? "border-[#D84315] bg-[#D84315]/10 text-[#D84315]" : "border-[#E5E0D8] bg-[#FAF8F5]"}`}
                >
                  Particulier
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("entreprise")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${accountType === "entreprise" ? "border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]" : "border-[#E5E0D8] bg-[#FAF8F5]"}`}
                >
                  Boutique
                </button>
              </div>
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                {accountType === "entreprise" ? "Nom de la boutique" : "Nom affiché"}
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="name-input" />
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                Identifiant <span className="text-[#D84315]">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[#4A5D50] text-sm">@</span>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                  placeholder="mamadou_shop"
                  className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 flex-1"
                  data-testid="username-input"
                />
              </div>
              <p className="text-xs text-[#4A5D50] mt-1">Obligatoire — 3 à 24 caractères</p>
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Photo de profil <span className="text-[#4A5D50] font-normal">(optionnel)</span></Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] overflow-hidden flex items-center justify-center text-[#D84315]">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <UserCircle size={40} weight="duotone" />}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E0D8] text-sm font-medium text-[#D84315] cursor-pointer">
                  <Camera size={18} /> Choisir
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
                </label>
              </div>
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Mot de passe (6 chiffres)</Label>
              <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 text-center font-heading text-2xl tracking-widest" />
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Confirmez le mot de passe</Label>
              <Input type="password" inputMode="numeric" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 text-center font-heading text-2xl tracking-widest" />
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Code parrain (optionnel)</Label>
              <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="ZOK-XXXXX" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 font-mono" />
            </div>
            <Button onClick={submitRegister} disabled={loading} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full h-14 text-base font-bold" data-testid="register-submit-btn">
              {loading ? "Création..." : "Créer mon compte — gratuit"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
