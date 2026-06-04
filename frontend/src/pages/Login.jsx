import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthModeSwitch from "@/components/AuthModeSwitch";
import { toast } from "sonner";
import { Phone, ShieldCheck, ArrowLeft, Key } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { GUINEA, AUTH_REDIRECT } from "@/lib/authGuinea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [params] = useSearchParams();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    const p = params.get("phone")?.replace(/\D/g, "");
    if (p && p.length >= GUINEA.minDigits) setPhone(p);
  }, [params]);

  const continueWithPhone = async () => {
    if (phone.length < GUINEA.minDigits) {
      toast.error("Numéro invalide");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/check-phone", { phone, country: GUINEA.code });
      if (!data.exists) {
        nav(`/register?phone=${encodeURIComponent(phone)}`);
        return;
      }
      setNeedsPinSetup(!data.has_pin);
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
      if (pinConfirm.length !== 6) {
        toast.error("Confirmez votre code");
        return;
      }
      if (pin !== pinConfirm) {
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
      });
      login(data.access_token, data.user);
      toast.success(`Bienvenue ${data.user.name} !`);
      nav(AUTH_REDIRECT);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 gm-shadow-soft gm-fade-in">
        {step === "pin" && (
          <button type="button" onClick={() => setStep("phone")} className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]" data-testid="back-to-phone">
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <AuthModeSwitch active="login" className="mb-6" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D84315]/10 text-[#D84315] flex items-center justify-center mb-3">
            {step === "phone" ? <Phone size={28} weight="duotone" /> : needsPinSetup ? <Key size={28} weight="duotone" /> : <ShieldCheck size={28} weight="duotone" />}
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#1A2E22]">
            {step === "phone" ? "Connexion" : needsPinSetup ? "Définir votre mot de passe" : "Connexion"}
          </h1>
          <p className="text-sm text-[#4A5D50] mt-2">
            {step === "phone"
              ? "Entrez votre numéro +224, puis votre code à 6 chiffres"
              : needsPinSetup
                ? "Choisissez un code à 6 chiffres pour ce numéro"
                : `Code secret pour +224 ${phone}`}
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
            <Button onClick={continueWithPhone} disabled={loading} className="w-full bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full h-14 text-base font-bold" data-testid="continue-btn">
              {loading ? "Vérification..." : "Continuer — connexion"}
            </Button>
            <p className="text-center text-xs text-[#4A5D50] bg-[#FAF8F5] rounded-xl px-3 py-2">
              Première fois sur Zokko ? Cliquez <strong>Créer un compte</strong> en haut.
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
            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Mot de passe (6 chiffres)</Label>
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
            <Button onClick={submitPin} disabled={loading} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full h-12 font-semibold" data-testid="pin-submit-btn">
              {loading ? "Connexion..." : needsPinSetup ? "Enregistrer et continuer" : "Se connecter"}
            </Button>
            <p className="text-center text-xs text-[#4A5D50] pt-2">
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
