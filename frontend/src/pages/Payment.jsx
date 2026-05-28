import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, Lightning, CrownSimple, ArrowLeft, Copy, Camera, X, UploadSimple, ShieldCheck, CheckCircle, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import api, { fileUrl, formatApiError, formatPrice } from "@/lib/api";
import { compressImage } from "@/lib/imageCompress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const META = {
  premium: { label: "Annonce Premium", desc: "Mise en avant permanente + badge doré", icon: Star, color: "#FBC02D" },
  boost: { label: "Boost 7 jours", desc: "Annonce en tête des résultats pendant 7 jours", icon: Lightning, color: "#D84315" },
  pro_subscription: { label: "Abonnement Pro (1 mois)", desc: "Annonces illimitées + statistiques détaillées", icon: CrownSimple, color: "#2E7D32" },
};

export default function Payment() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const purpose = params.get("purpose") || "premium";
  const listingId = params.get("listing");
  const meta = META[purpose] || META.premium;
  const Icon = meta.icon;

  const [info, setInfo] = useState(null);
  const [step, setStep] = useState("instructions");
  const [senderPhone, setSenderPhone] = useState("");
  const [txCode, setTxCode] = useState("");
  const [proofPath, setProofPath] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentRef, setPaymentRef] = useState(null);

  useEffect(() => {
    api.get("/payments/orange-money/info").then(({ data }) => setInfo(data)).catch(() => {});
  }, []);

  const amount = info?.prices_gnf?.[purpose] || 0;

  const copyNumber = () => {
    navigator.clipboard.writeText(info?.number || "");
    toast.success("Numéro copié !");
  };

  const uploadProof = async (file) => {
    const compressed = await compressImage(file).catch(() => file);
    const fd = new FormData();
    fd.append("file", compressed);
    setUploading(true);
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProofPath(data.path);
      toast.success("Capture ajoutée");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setUploading(false);
    }
  };

  const submitManual = async () => {
    if (!senderPhone || senderPhone.length < 8) {
      toast.error("Numéro émetteur invalide");
      return;
    }
    if (!txCode.trim()) {
      toast.error("Code de transaction requis");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/payments/orange-money/submit", {
        purpose,
        listing_id: listingId,
        sender_phone: senderPhone,
        transaction_code: txCode,
        proof_image_path: proofPath,
      });
      setPaymentRef(data.transaction_ref);
      setStep("submitted");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-6">
      <button onClick={() => nav(-1)} className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]" data-testid="back-btn">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="bg-white border border-[#E5E0D8] rounded-3xl overflow-hidden gm-shadow-soft gm-fade-in">
        <div className="p-6 text-center border-b border-[#E5E0D8]" style={{ backgroundColor: `${meta.color}10` }}>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 text-white" style={{ backgroundColor: meta.color }}>
            <Icon size={32} weight="fill" />
          </div>
          <h1 className="font-heading font-bold text-xl text-[#1A2E22]">{meta.label}</h1>
          <p className="text-sm text-[#4A5D50] mt-1">{meta.desc}</p>
          <div className="mt-3 font-heading font-bold text-4xl text-[#1A2E22]">{amount ? formatPrice(amount, "GNF") : "…"}</div>
          <p className="text-xs text-[#FF6600] font-semibold mt-2">Paiement Orange Money + preuve de transaction</p>
        </div>

        {step === "instructions" && info && (
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-br from-[#FF6600] to-[#E65C00] text-white rounded-2xl p-5">
              <p className="text-xs uppercase font-bold opacity-80 tracking-wide">Envoyer le paiement à</p>
              <p className="font-heading font-bold text-3xl mt-1 tracking-wider" data-testid="om-number">{info.number}</p>
              <p className="text-sm opacity-90 mt-1">{info.holder}</p>
              <button onClick={copyNumber} className="bg-white/20 hover:bg-white/30 text-white rounded-full py-2 px-4 text-sm font-semibold mt-3 flex items-center gap-1.5 transition-colors" data-testid="copy-om-number">
                <Copy size={16} /> Copier le numéro
              </button>
            </div>

            <div className="bg-[#FAF8F5] rounded-xl p-4 space-y-2">
              <p className="font-heading font-semibold text-[#1A2E22] text-sm mb-2">Comment payer ?</p>
              <ol className="text-sm text-[#4A5D50] space-y-1.5 list-decimal list-inside leading-relaxed">
                {info.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
              </ol>
            </div>

            <div className="bg-[#FBC02D]/10 border border-[#FBC02D]/40 rounded-xl p-3 text-xs text-[#1A2E22]">
              Important : envoyez exactement <strong>{formatPrice(amount, "GNF")}</strong> au numéro Orange Money ci-dessus, puis envoyez votre preuve (code + capture) pour validation admin.
            </div>

            <Button onClick={() => setStep("form")} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl h-12 font-bold" data-testid="proceed-form-btn">
              J&apos;ai payé, envoyer ma preuve
            </Button>
          </div>
        )}

        {step === "form" && (
          <div className="p-6 space-y-4">
            <button onClick={() => setStep("instructions")} className="text-xs text-[#4A5D50] flex items-center gap-1 hover:text-[#D84315]" data-testid="back-instructions">
              <ArrowLeft size={14} /> Revoir les instructions Orange Money
            </button>

            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Votre numéro Orange Money (émetteur)</Label>
              <div className="flex gap-2">
                <div className="flex items-center bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 text-sm font-medium text-[#1A2E22]">+224</div>
                <Input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, ""))} placeholder="612345678" className="flex-1 bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="sender-phone-input" />
              </div>
            </div>

            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Code de transaction Orange Money</Label>
              <Input value={txCode} onChange={(e) => setTxCode(e.target.value.toUpperCase())} placeholder="Ex: CI250119.1234.A12345" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12 font-mono" data-testid="tx-code-input" />
              <p className="text-xs text-[#4A5D50] mt-1">Reçu par SMS après votre transfert</p>
            </div>

            <div>
              <Label className="text-[#1A2E22] font-medium mb-1.5 block">Capture d&apos;écran du paiement <span className="text-xs text-[#4A5D50]">(recommandé)</span></Label>
              {proofPath ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8]">
                  <img src={fileUrl(proofPath)} alt="Preuve" className="w-full h-full object-contain" />
                  <button onClick={() => setProofPath(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center" data-testid="remove-proof-btn">
                    <X size={16} weight="bold" />
                  </button>
                </div>
              ) : (
                <label className="block aspect-video rounded-xl border-2 border-dashed border-[#E5E0D8] hover:border-[#FF6600] flex flex-col items-center justify-center cursor-pointer text-[#4A5D50] hover:text-[#FF6600] transition-colors" data-testid="upload-proof-btn">
                  {uploading ? <UploadSimple size={28} className="gm-pulse" /> : <Camera size={28} />}
                  <span className="text-sm mt-2 font-medium">{uploading ? "Upload..." : "Téléverser la capture"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProof(f); e.target.value = ""; }} disabled={uploading} />
                </label>
              )}
            </div>

            <Button onClick={submitManual} disabled={submitting} className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl h-12 font-bold" data-testid="submit-proof-btn">
              {submitting ? "Envoi..." : "Envoyer ma preuve"}
            </Button>
            <p className="text-[10px] text-center text-[#4A5D50] flex items-center justify-center gap-1">
              <ShieldCheck size={12} weight="fill" className="text-[#2E7D32]" /> Vérification admin en moins de 24h
            </p>
          </div>
        )}

        {step === "submitted" && (
          <div className="p-6 text-center space-y-4">
            <CheckCircle size={72} weight="fill" className="text-[#2E7D32] mx-auto" />
            <h2 className="font-heading font-bold text-2xl text-[#1A2E22]">Preuve envoyée !</h2>
            <div className="bg-[#FAF8F5] rounded-xl p-4 text-left text-sm space-y-1">
              <div className="flex justify-between"><span className="text-[#4A5D50]">Référence</span><span className="font-mono font-bold">{paymentRef}</span></div>
              <div className="flex justify-between"><span className="text-[#4A5D50]">Montant</span><span className="font-bold">{formatPrice(amount, "GNF")}</span></div>
              <div className="flex justify-between"><span className="text-[#4A5D50]">Statut</span><span className="text-[#FBC02D] font-bold flex items-center gap-1"><Clock size={12} weight="fill" /> EN ATTENTE</span></div>
            </div>
            <p className="text-sm text-[#4A5D50]">
              Notre équipe va vérifier votre paiement Orange Money et activer votre service. Vous recevrez une notification dès la validation (en général en moins de 24h).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => nav("/payments")} variant="outline" className="rounded-full border-2 border-[#E5E0D8]" data-testid="view-history-btn">Mes paiements</Button>
              <Button onClick={() => nav("/my-ads")} className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full font-semibold" data-testid="back-myads-btn">Mes annonces</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
