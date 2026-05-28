import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Phone, ShieldCheck, ArrowLeft, Key, Camera, UserCircle } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { compressImage } from "@/lib/imageCompress";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GUINEA = {
  code: "GN",
  dial: "+224",
  placeholder: "612345678",
  hint: "9 chiffres (ex. 612 51 64 88) — Guinée uniquement",
};

export default function Login() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [city, setCity] = useState("Conakry");
  const [referralCode, setReferralCode] = useState("");
  const [accountType, setAccountType] = useState("particulier");
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const minDigits = 9;

  const continueWithPhone = async () => {
    if (phone.length < minDigits) {
      toast.error("Numéro invalide");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/check-phone", { phone, country: GUINEA.code });
      const register = !data.exists || !data.has_pin;
      setIsNewUser(!data.exists);
      setNeedsPinSetup(register);
      setPin("");
      setPinConfirm("");
      setStep("pin");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const submitPin = async () => {
    if (pin.length !== 6) {
      toast.error("Code à 6 chiffres requis");
      return;
    }
    if (needsPinSetup) {
      if (!isNewUser && pinConfirm.length !== 6) {
        toast.error("Confirmez votre code");
        return;
      }
      if (isNewUser) {
        if (pinConfirm.length !== 6) {
          toast.error("Confirmez votre code");
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
      } else if (pin !== pinConfirm) {
        toast.error("Les codes ne correspondent pas");
        return;
      }
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/phone-pin", {
        phone,
        country: GUINEA.code,
        pin,
        pin_confirm: needsPinSetup ? pinConfirm : undefined,
        name: isNewUser ? name.trim() : undefined,
        username: isNewUser && username.trim() ? username.trim() : undefined,
        city,
        referral_code: isNewUser ? referralCode : undefined,
        account_type: isNewUser ? accountType : undefined,
      });
      let token = data.access_token;
      let user = data.user;
      login(token, user);
      if (isNewUser && avatarFile) {
        const compressed = await compressImage(avatarFile).catch(() => avatarFile);
        const fd = new FormData();
        fd.append("file", compressed);
        const up = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        const { data: me } = await api.patch("/auth/me", { avatar: up.data.path });
        user = me;
        login(token, me);
      }
      toast.success(data.is_new ? `Compte créé — bienvenue ${user.name} !` : `Bienvenue ${user.name} !`);
      nav("/");
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

  const pinTitle = needsPinSetup
    ? isNewUser
      ? "Créer votre compte"
      : "Choisissez votre mot de passe"
    : "Connexion";

  const pinHint = needsPinSetup
    ? isNewUser
      ? "Nom visible sur l'app, téléphone +224, mot de passe à 6 chiffres"
      : "Choisissez un mot de passe à 6 chiffres pour ce numéro"
    : `Mot de passe pour +224 ${phone}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 gm-shadow-soft gm-fade-in">
        {step === "pin" && (
          <button
            onClick={() => setStep("phone")}
            className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]"
            data-testid="back-to-phone"
          >
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D84315]/10 text-[#D84315] flex items-center justify-center mb-3">
            {step === "phone" ? <Phone size={28} weight="duotone" /> : needsPinSetup ? <Key size={28} weight="duotone" /> : <ShieldCheck size={28} weight="duotone" />}
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#1A2E22]">
            {step === "phone" ? "Connexion / Inscription" : pinTitle}
          </h1>
          <p className="text-sm text-[#4A5D50] mt-2">
            {step === "phone" ? "Numéro guinéen (+224) et mot de passe à 6 chiffres" : pinHint}
          </p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Téléphone (Guinée 🇬🇳)</Label>
              <div className="flex gap-2">
                <div className="flex items-center bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 text-sm text-[#1A2E22] font-medium">{GUINEA.dial}</div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder={GUINEA.placeholder}
                  className="flex-1 bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"
                  data-testid="phone-input"
                />
              </div>
              <p className="text-xs text-[#4A5D50] mt-1.5">{GUINEA.hint}</p>
            </div>
            <Button onClick={continueWithPhone} disabled={loading} className="w-full bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full h-12 font-semibold" data-testid="continue-btn">
              {loading ? "Vérification..." : "Continuer"}
            </Button>
            <p className="text-center text-xs text-[#4A5D50]">
              Pas de SMS — vous choisissez votre code une fois, puis vous vous connectez avec.
            </p>
            <p className="text-center text-xs text-[#4A5D50]">
              Administrateur ?{" "}
              <Link to="/admin-login" className="text-[#D84315] font-semibold hover:underline">
                Connexion admin →
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {isNewUser && (
              <>
                <div>
                  <Label className="text-[#1A2E22] font-medium mb-1.5 block">Vous êtes</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType("particulier")}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                        accountType === "particulier"
                          ? "border-[#D84315] bg-[#D84315]/10 text-[#D84315]"
                          : "border-[#E5E0D8] bg-[#FAF8F5] text-[#1A2E22]"
                      }`}
                      data-testid="account-particulier"
                    >
                      Particulier
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("entreprise")}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                        accountType === "entreprise"
                          ? "border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]"
                          : "border-[#E5E0D8] bg-[#FAF8F5] text-[#1A2E22]"
                      }`}
                      data-testid="account-entreprise"
                    >
                      Entreprise / Pro
                    </button>
                  </div>
                  <p className="text-xs text-[#4A5D50] mt-1.5">
                    {accountType === "entreprise"
                      ? "Boutique, stats et visibilité Pro — idéal commerces & prestataires."
                      : "Acheter, vendre ou proposer un service entre particuliers."}
                  </p>
                </div>
                <div>
                  <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                    {accountType === "entreprise" ? "Nom affiché (boutique / entreprise)" : "Nom affiché sur Zokko"}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={accountType === "entreprise" ? "Boutique Kaloum SARL" : "Mamadou Diallo"}
                    className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"
                    data-testid="name-input"
                  />
                </div>
                <div>
                  <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                    Identifiant <span className="text-[#4A5D50] font-normal">(optionnel)</span>
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
                  <p className="text-xs text-[#4A5D50] mt-1">Pour vous retrouver sur l&apos;app (3–24 caractères).</p>
                </div>
                <div>
                  <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                    Photo de profil <span className="text-[#4A5D50] font-normal">(optionnel)</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] overflow-hidden flex items-center justify-center text-[#D84315]">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={40} weight="duotone" />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E5E0D8] text-sm font-medium text-[#D84315] cursor-pointer hover:bg-[#D84315]/5">
                      <Camera size={18} />
                      Choisir une photo
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatarPick} data-testid="avatar-input" />
                    </label>
                  </div>
                </div>
              </>
            )}
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                {needsPinSetup ? "Mot de passe (6 chiffres)" : "Mot de passe"}
              </Label>
              <Input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 text-center font-heading text-2xl tracking-widest"
                data-testid="pin-input"
              />
            </div>
            {needsPinSetup && (
              <div>
                <Label className="text-[#1A2E22] font-medium mb-1.5 block">Confirmez le mot de passe</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 text-center font-heading text-2xl tracking-widest"
                  data-testid="pin-confirm-input"
                />
              </div>
            )}
            {isNewUser && (
              <div>
                <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                  Code parrain (optionnel) <span className="text-xs text-[#2E7D32]">+1 boost gratuit</span>
                </Label>
                <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="ZOK-XXXXX" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 font-mono" data-testid="referral-input" />
              </div>
            )}
            <Button onClick={submitPin} disabled={loading} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full h-12 font-semibold" data-testid="pin-submit-btn">
              {loading ? "Connexion..." : isNewUser ? "Créer mon compte" : "Se connecter"}
            </Button>
            <p className="text-center text-xs text-[#4A5D50] pt-2">
              Administrateur ?{" "}
              <Link to="/admin-login" className="text-[#D84315] font-semibold hover:underline" data-testid="admin-login-link">
                Connexion admin →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
