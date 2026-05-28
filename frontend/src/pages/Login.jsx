import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Phone, ShieldCheck, ArrowLeft, Key } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COUNTRIES = [
  { code: "GN", dial: "+224", label: "Guinée", placeholder: "612345678", hint: "9 chiffres sans le 224" },
  { code: "FR", dial: "+33", label: "France", placeholder: "659497111", hint: "9 chiffres sans le 0 initial" },
];

export default function Login() {
  const [step, setStep] = useState("phone");
  const [country, setCountry] = useState("GN");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Conakry");
  const [referralCode, setReferralCode] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const selected = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  const minDigits = 9;

  const continueWithPhone = async () => {
    if (phone.length < minDigits) {
      toast.error("Numéro invalide");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/check-phone", { phone, country });
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
        country,
        pin,
        pin_confirm: needsPinSetup ? pinConfirm : undefined,
        name: isNewUser ? name.trim() : undefined,
        city,
        referral_code: isNewUser ? referralCode : undefined,
      });
      login(data.access_token, data.user);
      toast.success(data.is_new ? `Compte créé — bienvenue ${data.user.name} !` : `Bienvenue ${data.user.name} !`);
      nav("/");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const pinTitle = needsPinSetup
    ? isNewUser
      ? "Créer votre code secret"
      : "Choisissez votre code"
    : "Entrez votre code";

  const pinHint = needsPinSetup
    ? "Choisissez un code à 6 chiffres — vous le réutiliserez à chaque connexion"
    : `Code secret pour ${selected.dial} ${phone}`;

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
            {step === "phone" ? "Votre numéro + un code à 6 chiffres que vous choisissez" : pinHint}
          </p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Pays</Label>
              <div className="grid grid-cols-2 gap-2">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c.code)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                      country === c.code
                        ? "border-[#D84315] bg-[#D84315]/10 text-[#D84315]"
                        : "border-[#E5E0D8] bg-[#FAF8F5] text-[#1A2E22] hover:border-[#D84315]/50"
                    }`}
                    data-testid={`country-${c.code}`}
                  >
                    {c.label} {c.dial}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Téléphone</Label>
              <div className="flex gap-2">
                <div className="flex items-center bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 text-sm text-[#1A2E22] font-medium">{selected.dial}</div>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder={selected.placeholder}
                  className="flex-1 bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"
                  data-testid="phone-input"
                />
              </div>
              <p className="text-xs text-[#4A5D50] mt-1.5">{selected.hint}</p>
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
              <div>
                <Label className="text-[#1A2E22] font-medium mb-1.5 block">Votre nom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mamadou Diallo" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="name-input" />
              </div>
            )}
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">
                {needsPinSetup ? "Choisissez un code (6 chiffres)" : "Votre code secret"}
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
                <Label className="text-[#1A2E22] font-medium mb-1.5 block">Confirmez le code</Label>
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
