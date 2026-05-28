import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import api, { fileUrl, formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Publish() {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "", city: "Conakry", quartier: "", type: "product", whatsapp: "",
  });
  const nav = useNavigate();

  useEffect(() => {
    api.get("/categories").then(({ data }) => setCategories(data));
    api.get("/cities").then(({ data }) => setCities(data));
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file) => {
    const compressed = await compressImage(file).catch(() => file);
    const fd = new FormData();
    fd.append("file", compressed);
    setUploading(true);
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPhotos((p) => [...p, data.path]);
      const savedKb = Math.max(0, Math.round((file.size - compressed.size) / 1024));
      toast.success(savedKb > 0 ? `Photo ajoutée (${savedKb} Ko économisés)` : "Photo ajoutée");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setUploading(false);
    }
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 5 - photos.length).forEach(uploadFile);
    e.target.value = "";
  };

  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.price || !form.category) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/listings", {
        ...form,
        price: parseFloat(form.price),
        photos,
      });
      toast.success("Annonce publiée ! En attente de validation.");
      nav(`/listings/${data.id}`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-heading font-bold text-3xl text-[#1A2E22] mb-2">Publier une annonce</h1>
      <p className="text-[#4A5D50] mb-6">Vendez vos produits ou proposez vos services. Validation rapide.</p>

      <form onSubmit={submit} className="space-y-5 bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-7" data-testid="publish-form">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setField("type", "product")} className={`p-4 rounded-xl border-2 font-semibold transition-colors ${form.type === "product" ? "border-[#D84315] bg-[#D84315]/5 text-[#D84315]" : "border-[#E5E0D8] text-[#4A5D50]"}`} data-testid="type-product-btn">
            Produit
          </button>
          <button type="button" onClick={() => setField("type", "service")} className={`p-4 rounded-xl border-2 font-semibold transition-colors ${form.type === "service" ? "border-[#2E7D32] bg-[#2E7D32]/5 text-[#2E7D32]" : "border-[#E5E0D8] text-[#4A5D50]"}`} data-testid="type-service-btn">
            Service
          </button>
        </div>

        <div>
          <Label className="text-[#1A2E22] font-medium mb-1.5 block">Titre <span className="text-[#D84315]">*</span></Label>
          <Input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Ex: iPhone 13 - 128Go" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="title-input" />
        </div>

        <div>
          <Label className="text-[#1A2E22] font-medium mb-1.5 block">Description <span className="text-[#D84315]">*</span></Label>
          <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Détaillez votre annonce…" rows={5} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl resize-none" data-testid="description-input" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#1A2E22] font-medium mb-1.5 block">Prix (GNF) <span className="text-[#D84315]">*</span></Label>
            <Input type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="500000" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="price-input" />
          </div>
          <div>
            <Label className="text-[#1A2E22] font-medium mb-1.5 block">Catégorie <span className="text-[#D84315]">*</span></Label>
            <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl h-12 px-3 text-sm" data-testid="category-select">
              <option value="">Choisir…</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[#1A2E22] font-medium mb-1.5 block">Ville</Label>
            <select value={form.city} onChange={(e) => setField("city", e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl h-12 px-3 text-sm" data-testid="city-select">
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-[#1A2E22] font-medium mb-1.5 block">Quartier</Label>
            <Input value={form.quartier} onChange={(e) => setField("quartier", e.target.value)} placeholder="Ex: Ratoma" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="quartier-input" />
          </div>
        </div>

        <div>
          <Label className="text-[#1A2E22] font-medium mb-1.5 block">WhatsApp (optionnel)</Label>
          <Input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} placeholder="620000000" className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12" data-testid="whatsapp-input" />
        </div>

        <div>
          <Label className="text-[#1A2E22] font-medium mb-1.5 block">Photos (max 5)</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {photos.map((p, i) => (
              <div key={p} className="relative aspect-square rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8]">
                <img src={fileUrl(p)} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center" data-testid={`remove-photo-${i}`}>
                  <X size={14} weight="bold" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-[#E5E0D8] hover:border-[#D84315] flex flex-col items-center justify-center cursor-pointer text-[#4A5D50] hover:text-[#D84315] transition-colors" data-testid="upload-photo-btn">
                {uploading ? <UploadSimple size={24} className="gm-pulse" /> : <Camera size={24} />}
                <span className="text-xs mt-1">{uploading ? "Upload…" : "Ajouter"}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full h-12 font-semibold" data-testid="submit-listing-btn">
          {submitting ? "Publication..." : "Publier l'annonce"}
        </Button>
      </form>
    </div>
  );
}
