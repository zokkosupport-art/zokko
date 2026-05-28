import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Eye, ChatCircleText, WhatsappLogo, ArrowLeft, Star, Lightning, Phone, ShareNetwork, Flag, SealCheck } from "@phosphor-icons/react";
import api, { BACKEND_URL, fileUrl, formatPrice, formatApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Arnaque");
  const [reportDesc, setReportDesc] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/listings/${id}`).then(async ({ data }) => {
      setListing(data);
      if (data.owner_id) {
        const r = await api.get(`/users/${data.owner_id}/reviews`);
        setReviews(r.data);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-5xl mx-auto p-8 text-[#4A5D50]">Chargement…</div>;
  if (!listing) return <div className="max-w-5xl mx-auto p-8">Annonce introuvable.</div>;

  const photos = listing.photos || [];
  const photoUrl = photos[activePhoto] ? fileUrl(photos[activePhoto]) : null;
  const isOwner = user?.id === listing.owner_id;
  const whatsappNumber = (listing.whatsapp || listing.owner?.phone || "").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/224${whatsappNumber}?text=${encodeURIComponent(`Bonjour, je suis intéressé par : ${listing.title}`)}`;
  // Use backend OG-share URL for rich WhatsApp/social previews
  const shareUrl = `${BACKEND_URL}/api/s/${listing.id}`;
  const shareText = `${listing.title} - ${formatPrice(listing.price, listing.currency)} - ${listing.city}\n\n${shareUrl}\n\nVu sur Zokko 🇬🇳`;
  const shareLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const trackWhatsApp = () => {
    api.post(`/listings/${listing.id}/click-whatsapp`).catch((err) => logger.error("WhatsApp click tracking failed", err));
  };

  const openChat = () => {
    if (!user) { nav("/login"); return; }
    if (isOwner) { toast.info("C'est votre annonce"); return; }
    nav(`/messages/${listing.owner_id}?listing=${listing.id}`);
  };

  const submitReport = async () => {
    if (!user) { nav("/login"); return; }
    try {
      await api.post("/reports", {
        listing_id: listing.id,
        reported_user_id: listing.owner_id,
        reason: reportReason,
        description: reportDesc,
      });
      toast.success("Signalement envoyé. Merci !");
      setReportOpen(false);
      setReportDesc("");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const submitReview = async () => {
    if (!user) { nav("/login"); return; }
    try {
      await api.post("/reviews", {
        target_user_id: listing.owner_id,
        listing_id: listing.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Avis publié !");
      setReviewOpen(false);
      setReviewComment("");
      const r = await api.get(`/users/${listing.owner_id}/reviews`);
      setReviews(r.data);
      const d = await api.get(`/listings/${id}`);
      setListing(d.data);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const ratingAvg = listing.owner?.rating_avg || 0;
  const ratingCount = listing.owner?.rating_count || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/listings" className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]" data-testid="back-link">
        <ArrowLeft size={16} /> Retour
      </Link>

      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <div className="aspect-[4/3] bg-[#F0EBE1] rounded-2xl overflow-hidden relative">
            {photoUrl ? (
              <img src={photoUrl} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-heading text-6xl font-bold text-[#D84315]/20">{listing.title.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {listing.premium && <span className="bg-[#FBC02D] text-[#1A2E22] text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1"><Star size={12} weight="fill" /> Premium</span>}
              {listing.boosted_until && new Date(listing.boosted_until) > new Date() && (
                <span className="bg-[#D84315] text-white text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1"><Lightning size={12} weight="fill" /> Boosté</span>
              )}
            </div>
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto gm-scroll-x">
              {photos.map((p, i) => (
                <button key={p} onClick={() => setActivePhoto(i)} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${i === activePhoto ? "border-[#D84315]" : "border-[#E5E0D8]"}`}>
                  <img src={fileUrl(p)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 bg-white border border-[#E5E0D8] rounded-2xl p-5">
            <h2 className="font-heading font-bold text-lg text-[#1A2E22] mb-2">Description</h2>
            <p className="text-[#4A5D50] whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          </div>

          {/* Reviews */}
          <div className="mt-4 bg-white border border-[#E5E0D8] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-lg text-[#1A2E22]">Avis sur le vendeur</h2>
              {!isOwner && user && (
                <Button size="sm" onClick={() => setReviewOpen(true)} variant="outline" className="border-[#E5E0D8] rounded-full text-xs" data-testid="leave-review-btn">
                  <Star size={14} weight="fill" className="mr-1 text-[#FBC02D]" /> Donner un avis
                </Button>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-[#4A5D50]">Aucun avis pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="border-b border-[#E5E0D8] pb-3 last:border-0" data-testid={`review-${r.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-[#1A2E22]">{r.from_name}</p>
                      <div className="flex">{[1,2,3,4,5].map((s) => <Star key={s} size={14} weight="fill" className={s <= r.rating ? "text-[#FBC02D]" : "text-[#E5E0D8]"} />)}</div>
                    </div>
                    {r.comment && <p className="text-sm text-[#4A5D50]">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-3">
            <div className="text-xs uppercase font-bold tracking-wide text-[#2E7D32]">{listing.type === "service" ? "Service" : "Produit"} · {listing.category}</div>
            <h1 className="font-heading font-bold text-2xl text-[#1A2E22] leading-tight">{listing.title}</h1>
            <div className="font-heading font-bold text-3xl text-[#D84315]">{formatPrice(listing.price, listing.currency)}</div>
            <div className="flex items-center gap-4 text-sm text-[#4A5D50] pt-2 border-t border-[#E5E0D8]">
              <span className="flex items-center gap-1"><MapPin size={16} />{listing.city}{listing.quartier && `, ${listing.quartier}`}</span>
              <span className="flex items-center gap-1"><Eye size={16} />{listing.views || 0} vues</span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-3">
            <h3 className="font-heading font-semibold text-[#1A2E22]">Vendeur</h3>
            <div className="flex items-center gap-3">
              <UserAvatar user={listing.owner} size={48} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A2E22] flex items-center gap-1">
                  {listing.owner?.name || "Utilisateur"}
                  {listing.owner?.verified && <SealCheck size={16} weight="fill" className="text-[#2E7D32]" title="Profil vérifié" />}
                </p>
                {listing.owner?.username && (
                  <p className="text-xs text-[#D84315] font-medium">@{listing.owner.username}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-[#4A5D50]">
                  <span>{listing.owner?.city}</span>
                  {ratingCount > 0 && (
                    <span className="flex items-center gap-0.5 font-semibold text-[#FBC02D]">
                      <Star size={12} weight="fill" /> {ratingAvg.toFixed(1)} <span className="text-[#4A5D50]">({ratingCount})</span>
                    </span>
                  )}
                  {listing.owner?.is_pro && <span className="text-[#D84315] font-semibold">Pro</span>}
                </div>
              </div>
            </div>

            {!isOwner && (
              <div className="space-y-2 pt-2">
                {whatsappNumber && (
                  <a href={whatsappLink} target="_blank" rel="noreferrer" onClick={trackWhatsApp} className="block">
                    <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full h-12 font-semibold" data-testid="whatsapp-btn">
                      <WhatsappLogo size={20} weight="fill" className="mr-2" /> Contacter sur WhatsApp
                    </Button>
                  </a>
                )}
                <Button onClick={openChat} variant="outline" className="w-full border-2 border-[#E5E0D8] hover:border-[#D84315] hover:text-[#D84315] rounded-full" data-testid="chat-btn">
                  <ChatCircleText size={18} className="mr-2" /> Message interne
                </Button>
                <a href={`tel:+224${whatsappNumber}`} className="block">
                  <Button variant="outline" className="w-full border-2 border-[#E5E0D8] hover:border-[#D84315] hover:text-[#D84315] rounded-full" data-testid="call-btn">
                    <Phone size={18} className="mr-2" /> Appeler
                  </Button>
                </a>
              </div>
            )}

            {isOwner && (
              <div className="space-y-2 pt-2">
                <Button onClick={() => nav(`/payment?purpose=premium&listing=${listing.id}`)} className="w-full bg-[#FBC02D] hover:bg-[#F9A825] text-[#1A2E22] rounded-xl font-bold" data-testid="premium-btn">
                  <Star size={18} weight="fill" className="mr-2" /> Passer Premium (20 000 GNF)
                </Button>
                <Button onClick={() => nav(`/payment?purpose=boost&listing=${listing.id}`)} className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl font-bold" data-testid="boost-btn">
                  <Lightning size={18} weight="fill" className="mr-2" /> Booster 7 jours (10 000 GNF)
                </Button>
                {user?.boost_credits > 0 && (
                  <Button onClick={async () => { await api.post(`/listings/${listing.id}/use-boost`); toast.success("Boost gratuit activé !"); }} className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl font-bold" data-testid="free-boost-btn">
                    🎁 Utiliser un boost gratuit ({user.boost_credits} dispo)
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Share & Report */}
          <div className="grid grid-cols-2 gap-2">
            <a href={shareLink} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 rounded-full" data-testid="share-whatsapp-btn">
                <ShareNetwork size={16} className="mr-1" /> Partager
              </Button>
            </a>
            {!isOwner && (
              <Button variant="outline" onClick={() => setReportOpen(true)} className="border-2 border-[#E5E0D8] text-[#C62828] hover:bg-[#C62828]/5 hover:border-[#C62828] rounded-full" data-testid="report-btn">
                <Flag size={16} className="mr-1" /> Signaler
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading">Signaler cette annonce</DialogTitle>
            <DialogDescription>Aidez-nous à maintenir Zokko sûr.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="font-medium mb-1.5 block">Raison</Label>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl h-11 px-3" data-testid="report-reason-select">
                <option>Arnaque</option>
                <option>Faux produit / contrefaçon</option>
                <option>Prix anormal</option>
                <option>Contenu inapproprié</option>
                <option>Annonce en double</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <Label className="font-medium mb-1.5 block">Description (optionnel)</Label>
              <Textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Détails du problème…" rows={3} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl resize-none" data-testid="report-desc-input" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setReportOpen(false)} variant="outline" className="rounded-full">Annuler</Button>
            <Button onClick={submitReport} className="bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-full" data-testid="submit-report-btn">Envoyer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading">Donner un avis sur {listing.owner?.name}</DialogTitle>
            <DialogDescription>Votre retour aide la communauté.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2 justify-center">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)} data-testid={`star-${s}`}>
                  <Star size={36} weight="fill" className={s <= reviewRating ? "text-[#FBC02D]" : "text-[#E5E0D8]"} />
                </button>
              ))}
            </div>
            <div>
              <Label className="font-medium mb-1.5 block">Commentaire (optionnel)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Votre expérience…" rows={3} className="bg-[#FAF8F5] border-[#E5E0D8] rounded-xl resize-none" data-testid="review-comment-input" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setReviewOpen(false)} variant="outline" className="rounded-full">Annuler</Button>
            <Button onClick={submitReview} className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full" data-testid="submit-review-btn">Publier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
