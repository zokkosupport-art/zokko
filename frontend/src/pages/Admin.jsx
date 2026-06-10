import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useResetOnNavigate } from "@/lib/useResetOnNavigate";
import {
  Users, Package, CurrencyEur, ShieldWarning, CheckCircle, Flag, Receipt,
  ImageSquare, Eye, Copy, FacebookLogo, Trash, EyeSlash, ArrowSquareOut,
  CaretLeft, CaretRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import api, { formatPrice, fileUrl, withApiRetry, waitForBackendReady } from "@/lib/api";
import AdminPhoto, { AdminPhotoThumb } from "@/components/AdminPhoto";
import { listingStatusLabel, listingShareUrl, listingOgShareUrl, listingFacebookPostText, pendingPaymentLabel } from "@/lib/listingLabels";
import { formatGnPhoneDisplay, waMeUrl } from "@/lib/phone";
import { purposeBadgeClass, purposeLabel } from "@/lib/offerColors";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LISTING_FILTERS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Publiées" },
  { key: "hidden", label: "Masquées" },
  { key: "rejected", label: "Rejetées" },
  { key: "all", label: "Toutes" },
];

const ADMIN_PAGE_SIZE = 24;

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [listingPage, setListingPage] = useState(1);
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [listingFilter, setListingFilter] = useState("pending");
  const [proofImg, setProofImg] = useState(null);
  const [viewListing, setViewListing] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [storageHealth, setStorageHealth] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [backendWarming, setBackendWarming] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const mounted = useRef(true);

  const closeListingDialog = useCallback(() => {
    setListingDialogOpen(false);
    setViewListing(null);
    setViewLoading(false);
  }, []);

  const closeAllOverlays = useCallback(() => {
    setProofImg(null);
    closeListingDialog();
  }, [closeListingDialog]);

  useResetOnNavigate(closeAllOverlays);

  const refreshStats = async () => {
    const { data } = await withApiRetry(() => api.get("/admin/stats"));
    if (mounted.current) setStats(data);
  };

  const refreshPending = async () => {
    const { data } = await withApiRetry(() => api.get("/admin/payments/pending"));
    if (mounted.current) setPendingPayments(data);
  };

  const refreshReports = async () => {
    const { data } = await withApiRetry(() => api.get("/admin/reports"));
    if (mounted.current) setReports(data);
  };

  const loadListings = async (filter = listingFilter, page = listingPage) => {
    setListingsLoading(true);
    try {
      const skip = (page - 1) * ADMIN_PAGE_SIZE;
      const { data } = await withApiRetry(() => api.get("/admin/listings", {
        params: { status: filter, skip, limit: ADMIN_PAGE_SIZE },
      }));
      if (!mounted.current) return;
      setListings(data.items || []);
      setListingsTotal(typeof data.total === "number" ? data.total : (data.items || []).length);
    } catch {
      if (mounted.current) toast.error("Erreur chargement annonces — réessayez dans un instant");
    } finally {
      if (mounted.current) setListingsLoading(false);
    }
  };

  const loadUsers = async (page = usersPage) => {
    setUsersLoading(true);
    try {
      const skip = (page - 1) * ADMIN_PAGE_SIZE;
      const { data } = await withApiRetry(() => api.get("/admin/users", { params: { skip, limit: ADMIN_PAGE_SIZE } }));
      if (!mounted.current) return;
      setUsers(data.items || []);
      setUsersTotal(typeof data.total === "number" ? data.total : (data.items || []).length);
    } catch {
      if (mounted.current) toast.error("Erreur chargement utilisateurs");
    } finally {
      if (mounted.current) setUsersLoading(false);
    }
  };

  const loadPayments = async (page = paymentsPage) => {
    setPaymentsLoading(true);
    try {
      const skip = (page - 1) * ADMIN_PAGE_SIZE;
      const { data } = await withApiRetry(() => api.get("/admin/payments", { params: { skip, limit: ADMIN_PAGE_SIZE } }));
      if (!mounted.current) return;
      setPayments(data.items || []);
      setPaymentsTotal(typeof data.total === "number" ? data.total : (data.items || []).length);
    } catch {
      if (mounted.current) toast.error("Erreur chargement paiements");
    } finally {
      if (mounted.current) setPaymentsLoading(false);
    }
  };

  const loadInitial = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([refreshStats(), refreshPending(), refreshReports()]);
    } catch {
      if (mounted.current) toast.error("Erreur chargement admin — le serveur démarre peut-être, réessayez");
    } finally {
      if (mounted.current) setInitialLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    (async () => {
      setBackendWarming(true);
      try {
        await waitForBackendReady();
      } catch {
        if (mounted.current) toast.error("Serveur lent à démarrer — patientez puis actualisez");
      } finally {
        if (mounted.current) setBackendWarming(false);
      }
      if (!mounted.current) return;
      await loadInitial();
      fetch(`${window.location.origin}/health/storage`)
        .then((r) => r.json())
        .then((data) => { if (mounted.current) setStorageHealth(data); })
        .catch(() => { if (mounted.current) setStorageHealth(null); });
    })();
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (tab === "users" && !backendWarming) loadUsers(usersPage);
  }, [tab, usersPage, backendWarming]);

  useEffect(() => {
    if (tab === "payments" && !backendWarming) loadPayments(paymentsPage);
  }, [tab, paymentsPage, backendWarming]);

  useEffect(() => {
    if (tab === "listings" && !backendWarming) loadListings(listingFilter, listingPage);
  }, [tab, listingFilter, listingPage, backendWarming]);

  const pendingCount = stats?.listings_pending ?? listings.filter((l) => l.status === "pending").length;

  const listingTotalPages = Math.max(1, Math.ceil(listingsTotal / ADMIN_PAGE_SIZE));
  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / ADMIN_PAGE_SIZE));
  const paymentsTotalPages = Math.max(1, Math.ceil(paymentsTotal / ADMIN_PAGE_SIZE));

  const filteredListings = listings;

  const openListing = async (id) => {
    setListingDialogOpen(true);
    setViewLoading(true);
    try {
      const { data } = await api.get(`/listings/${id}`);
      setViewListing(data);
    } catch {
      toast.error("Impossible de charger l'annonce");
      closeListingDialog();
    } finally {
      setViewLoading(false);
    }
  };

  const afterListingChange = async () => {
    await Promise.all([refreshStats(), loadListings(listingFilter, listingPage)]);
  };

  const approve = async (id) => {
    await api.post(`/admin/listings/${id}/approve`);
    toast.success("Annonce approuvée");
    setViewListing((v) => (v?.id === id ? { ...v, status: "approved" } : v));
    afterListingChange();
  };
  const rejectListing = async (id) => {
    await api.post(`/admin/listings/${id}/reject`);
    toast.success("Annonce rejetée");
    setViewListing((v) => (v?.id === id ? { ...v, status: "rejected" } : v));
    afterListingChange();
  };
  const hideListing = async (id) => {
    await api.post(`/admin/listings/${id}/hide`);
    toast.success("Annonce masquée");
    setViewListing((v) => (v?.id === id ? { ...v, status: "hidden" } : v));
    afterListingChange();
  };
  const restoreListing = async (id) => {
    await api.post(`/admin/listings/${id}/restore`);
    toast.success("Annonce réactivée");
    setViewListing((v) => (v?.id === id ? { ...v, status: "approved" } : v));
    afterListingChange();
  };
  const deleteListing = async (id) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    await api.delete(`/admin/listings/${id}`);
    toast.success("Annonce supprimée");
    if (viewListing?.id === id) closeListingDialog();
    afterListingChange();
  };

  const copyShare = (id) => {
    navigator.clipboard.writeText(listingOgShareUrl(id));
    toast.success("Lien copié (Facebook / WhatsApp — avec photo)");
  };

  const shareFacebook = async (listing) => {
    try {
      await navigator.clipboard.writeText(listingFacebookPostText(listing));
      toast.success("Texte copié ! Va sur ta Page → Créer une publication → Ctrl+V → Publier", { duration: 8000 });
      window.open("https://www.facebook.com/zokkoguinee", "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Impossible de copier — sélectionne et copie le texte manuellement");
    }
  };

  const block = async (id, blocked) => {
    if (blocked) { await api.post(`/admin/users/${id}/unblock`); toast.success("Utilisateur débloqué"); }
    else { await api.post(`/admin/users/${id}/block`); toast.success("Utilisateur bloqué"); }
    loadUsers(usersPage);
  };
  const resolveReport = async (id) => { await api.post(`/admin/reports/${id}/resolve`); toast.success("Signalement résolu"); refreshReports(); };
  const validatePayment = async (id) => {
    await api.post(`/admin/payments/${id}/validate`);
    toast.success("Paiement validé");
    await Promise.all([refreshStats(), refreshPending(), loadListings(listingFilter, listingPage)]);
  };
  const rejectPayment = async (id) => {
    await api.post(`/admin/payments/${id}/reject`);
    toast.success("Paiement refusé");
    refreshPending();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-heading font-bold text-3xl text-[#1A2E22] mb-5 flex items-center gap-2">
        <ShieldWarning size={28} className="text-[#D84315]" /> Administration
      </h1>

      {backendWarming && (
        <div className="mb-4 rounded-2xl border border-[#FBC02D]/50 bg-[#FFF8E1] px-4 py-3 text-sm text-[#1A2E22]">
          <p className="font-semibold">Réveil du serveur Zokko…</p>
          <p className="text-[#4A5D50] mt-1">Connexion à la base de données (Railway). Quelques secondes après inactivité, c&apos;est normal.</p>
        </div>
      )}

      {(initialLoading && !stats) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#F0EBE1] rounded-2xl animate-pulse" />)}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white border border-[#E5E0D8] p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="dashboard" className="rounded-lg" data-testid="admin-tab-dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="pending-payments" className="rounded-lg relative" data-testid="admin-tab-pending">
            Paiements en attente
            {pendingPayments.length > 0 && <span className="ml-1.5 bg-[#FF6600] text-white text-[10px] font-bold rounded-full px-2 py-0.5">{pendingPayments.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="listings" className="rounded-lg" data-testid="admin-tab-listings">
            Annonces {pendingCount > 0 && <span className="ml-1.5 bg-[#FBC02D] text-[#1A2E22] text-[10px] font-bold rounded-full px-2 py-0.5">{pendingCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg" data-testid="admin-tab-reports">Signalements ({reports.filter((r) => r.status === "open").length})</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg" data-testid="admin-tab-users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg" data-testid="admin-tab-payments">Tous paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-5">
          {storageHealth && (
            <div
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                storageHealth.ok
                  ? "bg-[#E8F5E9] border-[#2E7D32]/40 text-[#1A2E22]"
                  : "bg-[#FFF8E1] border-[#FBC02D]/50 text-[#1A2E22]"
              }`}
            >
              <p className="font-semibold">
                {storageHealth.ok ? "Stockage photos : OK (Volume actif)" : "Stockage photos : RISQUE — pas de Volume sur le serveur"}
              </p>
              <p className="text-[#4A5D50] mt-1">{storageHealth.hint}</p>
              {!storageHealth.ok && (
                <p className="text-xs mt-2">
                  Fichiers sur disque : {storageHealth.upload_file_count ?? 0} — sans Volume, redeploy = photos perdues.
                </p>
              )}
            </div>
          )}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={<Users size={22} weight="duotone" />} label="Utilisateurs" value={stats.users} color="#2E7D32" />
              <Stat icon={<Package size={22} weight="duotone" />} label="Annonces" value={stats.listings_total} sub={`${stats.listings_pending} en attente`} color="#D84315" />
              <Stat icon={<CheckCircle size={22} weight="duotone" />} label="Approuvées" value={stats.listings_approved} sub={`${stats.listings_hidden || 0} masquées`} color="#FBC02D" />
              <Stat icon={<CurrencyEur size={22} weight="duotone" />} label="Revenus" value={`${(stats.revenue || 0).toLocaleString("fr-FR")} GNF`} sub={`${stats.payments_completed} paiements`} color="#FF6600" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending-payments" className="mt-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {pendingPayments.map((p) => (
              <div key={p.id} className="p-4" data-testid={`pending-payment-${p.id}`}>
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">OM</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-heading font-bold text-[#1A2E22]">{p.user_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${purposeBadgeClass(p.purpose)}`}>
                        {purposeLabel(p.purpose)}
                      </span>
                    </div>
                    {p.listing && <p className="text-sm text-[#4A5D50] truncate">📌 {p.listing.title}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2">
                      <Field label="Émetteur" value={`+224 ${p.om_sender_phone}`} />
                      <Field label="Code TX" value={p.om_transaction_code} mono />
                      <Field label="Reçu sur" value={p.om_receiver} />
                      <Field label="Soumis" value={new Date(p.created_at).toLocaleString("fr-FR")} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-2xl text-[#1A2E22] whitespace-nowrap">{formatPrice(p.amount, p.currency)}</p>
                    <p className="text-xs text-[#4A5D50] font-mono">{p.transaction_ref}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 justify-end">
                  {p.om_proof_image_path ? (
                    <Button size="sm" variant="outline" onClick={() => setProofImg(p.om_proof_image_path)} className="border-[#E5E0D8] rounded-full">
                      <ImageSquare size={16} className="mr-1" /> Voir preuve
                    </Button>
                  ) : (
                    <span className="text-xs text-[#C62828] font-semibold self-center">Preuve manquante</span>
                  )}
                  <Button size="sm" onClick={() => rejectPayment(p.id)} variant="outline" className="border-[#C62828] text-[#C62828] rounded-full">Refuser</Button>
                  <Button
                    size="sm"
                    onClick={() => validatePayment(p.id)}
                    disabled={!p.om_proof_image_path}
                    className="bg-[#2E7D32] text-white rounded-full font-bold disabled:opacity-40"
                  >
                    Valider
                  </Button>
                </div>
              </div>
            ))}
            {pendingPayments.length === 0 && <p className="p-10 text-center text-[#4A5D50]">Aucun paiement en attente</p>}
          </div>
        </TabsContent>

        <TabsContent value="listings" className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {LISTING_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => { setListingFilter(f.key); setListingPage(1); }}
                className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                  listingFilter === f.key ? "bg-[#D84315] text-white" : "bg-white border border-[#E5E0D8] text-[#4A5D50]"
                }`}
              >
                {f.label}
                {f.key === "pending" && pendingCount > 0 && ` (${pendingCount})`}
              </button>
            ))}
          </div>
          <p className="text-sm text-[#4A5D50]">
            {listingsTotal} annonce{listingsTotal > 1 ? "s" : ""}
            {listingTotalPages > 1 && ` · page ${listingPage} / ${listingTotalPages}`}
          </p>
          <div className={`bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8] ${listingsLoading ? "opacity-60" : ""}`}>
            {filteredListings.map((l) => (
              <div key={l.id} className="p-4 flex flex-wrap items-center gap-3" data-testid={`admin-listing-${l.id}`}>
                {l.photos?.[0] ? (
                  <AdminPhotoThumb path={l.photos[0]} title={l.title} />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#F0EBE1] flex items-center justify-center text-[10px] text-[#4A5D50] flex-shrink-0">—</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22] truncate">{l.title}</p>
                  <p className="text-xs text-[#4A5D50]">{l.owner_name} · {l.city} · {formatPrice(l.price, l.currency)}</p>
                  {pendingPaymentLabel(l) && (
                    <p className="text-[10px] font-bold text-[#FF6600] mt-0.5">{pendingPaymentLabel(l)} — paiement en attente</p>
                  )}
                </div>
                <StatusBadge status={l.status} />
                <Button size="sm" variant="outline" onClick={() => openListing(l.id)} className="rounded-full border-[#E5E0D8]" data-testid={`view-${l.id}`}>
                  <Eye size={16} className="mr-1" /> Voir
                </Button>
              </div>
            ))}
            {filteredListings.length === 0 && !listingsLoading && (
              <p className="p-6 text-center text-[#4A5D50]">Aucune annonce dans cette catégorie</p>
            )}
          </div>
          {listingTotalPages > 1 && (
            <AdminPager page={listingPage} totalPages={listingTotalPages} loading={listingsLoading} onPageChange={setListingPage} />
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {reports.map((r) => (
              <div key={r.id} className="p-4 flex flex-wrap items-center gap-3" data-testid={`admin-report-${r.id}`}>
                <Flag size={24} className="text-[#C62828]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22]"><strong>{r.reason}</strong> — par {r.reporter_name}</p>
                  {r.description && <p className="text-xs text-[#4A5D50]">{r.description}</p>}
                </div>
                {r.listing_id && (
                  <Button size="sm" variant="outline" onClick={() => openListing(r.listing_id)} className="rounded-full">
                    Voir annonce
                  </Button>
                )}
                {r.status === "open" && (
                  <Button size="sm" onClick={() => resolveReport(r.id)} className="bg-[#2E7D32] text-white rounded-full">Résoudre</Button>
                )}
              </div>
            ))}
            {reports.length === 0 && <p className="p-6 text-center text-[#4A5D50]">Aucun signalement</p>}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5 space-y-3">
          <p className="text-sm text-[#4A5D50]">
            {usersTotal} utilisateur{usersTotal > 1 ? "s" : ""}
            {usersTotalPages > 1 && ` · page ${usersPage} / ${usersTotalPages}`}
          </p>
          <div className={`bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8] ${usersLoading ? "opacity-60" : ""}`}>
            {users.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22] truncate">{u.name}</p>
                  <p className="text-xs text-[#4A5D50]">
                    +224 {u.phone} · {u.city}
                    {u.account_type === "entreprise" && " · Boutique"}
                    {u.is_pro && " · Pro payant"}
                  </p>
                </div>
                {u.role !== "admin" && (
                  <Button size="sm" onClick={() => block(u.id, u.blocked)} variant="outline" className="rounded-full">
                    {u.blocked ? "Débloquer" : "Bloquer"}
                  </Button>
                )}
              </div>
            ))}
            {users.length === 0 && !usersLoading && (
              <p className="p-6 text-center text-[#4A5D50]">Aucun utilisateur</p>
            )}
          </div>
          <AdminPager page={usersPage} totalPages={usersTotalPages} loading={usersLoading} onPageChange={setUsersPage} />
        </TabsContent>

        <TabsContent value="payments" className="mt-5 space-y-3">
          <p className="text-sm text-[#4A5D50]">
            {paymentsTotal} paiement{paymentsTotal > 1 ? "s" : ""}
            {paymentsTotalPages > 1 && ` · page ${paymentsPage} / ${paymentsTotalPages}`}
          </p>
          <div className={`bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8] ${paymentsLoading ? "opacity-60" : ""}`}>
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22] text-sm">{p.user_name} · {p.purpose}</p>
                </div>
                <p className="font-bold">{formatPrice(p.amount, p.currency)}</p>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {payments.length === 0 && !paymentsLoading && (
              <p className="p-6 text-center text-[#4A5D50]">Aucun paiement</p>
            )}
          </div>
          <AdminPager page={paymentsPage} totalPages={paymentsTotalPages} loading={paymentsLoading} onPageChange={setPaymentsPage} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!proofImg} onOpenChange={(o) => !o && setProofImg(null)}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader><DialogTitle className="font-heading">Preuve de paiement</DialogTitle></DialogHeader>
          {proofImg && <img src={fileUrl(proofImg)} alt="Preuve" className="w-full max-h-[70vh] object-contain rounded-xl" />}
        </DialogContent>
      </Dialog>

      <Dialog open={listingDialogOpen} onOpenChange={(o) => { if (!o) closeListingDialog(); else setListingDialogOpen(true); }}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading pr-8">{viewListing?.title || "Chargement…"}</DialogTitle>
          </DialogHeader>
          {viewLoading && <p className="text-[#4A5D50]">Chargement…</p>}
          {viewListing && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={viewListing.status} />
                {viewListing.premium && <span className="text-xs font-bold bg-[#7B1FA2] text-white px-2 py-1 rounded-full">Premium</span>}
              </div>
              {pendingPaymentLabel(viewListing) && (
                <p className="text-sm text-[#E65100] bg-[#FFF3E0] border border-[#FF6600]/40 rounded-xl px-3 py-2">
                  <strong>{pendingPaymentLabel(viewListing)}</strong> — paiement Orange Money en attente de validation.
                  Validez d&apos;abord le paiement dans l&apos;onglet <strong>Paiements en attente</strong> avant d&apos;activer ce service.
                </p>
              )}
              {viewListing.status === "pending" && (
                <p className="text-sm text-[#F57F17] bg-[#FFF8E1] border border-[#FBC02D]/40 rounded-xl px-3 py-2">
                  Si les photos sont jaunes « absente du serveur », le fichier a été effacé par la mise à jour Railway — contactez le vendeur pour qu’il republie via <strong>Mes annonces → Modifier</strong> avant d’approuver.
                </p>
              )}
              {viewListing.photos?.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {viewListing.photos.map((p) => (
                    <AdminPhoto key={p} path={p} title={viewListing.title} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#4A5D50] bg-[#F0EBE1] rounded-xl px-3 py-2">Aucune photo jointe à cette annonce.</p>
              )}
              <p className="text-2xl font-heading font-bold text-[#D84315]">{formatPrice(viewListing.price, viewListing.currency)}</p>
              <p className="text-sm text-[#4A5D50] whitespace-pre-wrap">{viewListing.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Field label="Ville" value={viewListing.city} />
                <Field label="Catégorie" value={viewListing.category} />
                <Field label="Vendeur" value={viewListing.owner?.name || viewListing.owner_name} />
                <Field label="Téléphone" value={formatGnPhoneDisplay(viewListing.owner?.phone)} />
              </div>
              {viewListing.owner?.phone && (() => {
                const waHref = waMeUrl(
                  viewListing.owner.phone,
                  `Bonjour, c'est l'équipe Zokko. Pour valider votre annonce « ${viewListing.title} », merci de rouvrir www.zokko.net → Ma boutique → Modifier et remettre vos photos. Merci !`
                );
                if (!waHref) return null;
                return (
                  <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex">
                    <Button size="sm" type="button" className="rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white">
                      WhatsApp vendeur
                    </Button>
                  </a>
                );
              })()}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyShare(viewListing.id)}>
                  <Copy size={16} className="mr-1" /> Copier lien
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-[#1877F2] text-[#1877F2]" onClick={() => shareFacebook(viewListing)}>
                  <FacebookLogo size={16} weight="fill" className="mr-1" /> Facebook
                </Button>
                <a href={listingShareUrl(viewListing.id)} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="rounded-full">
                    <ArrowSquareOut size={16} className="mr-1" /> Site
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E0D8]">
                {viewListing.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => approve(viewListing.id)} className="bg-[#2E7D32] text-white rounded-full">Approuver</Button>
                    <Button size="sm" onClick={() => rejectListing(viewListing.id)} variant="outline" className="border-[#C62828] text-[#C62828] rounded-full">Rejeter</Button>
                  </>
                )}
                {viewListing.status === "approved" && (
                  <Button size="sm" onClick={() => hideListing(viewListing.id)} variant="outline" className="rounded-full">
                    <EyeSlash size={16} className="mr-1" /> Masquer
                  </Button>
                )}
                {viewListing.status === "hidden" && (
                  <Button size="sm" onClick={() => restoreListing(viewListing.id)} className="bg-[#2E7D32] text-white rounded-full">Réactiver</Button>
                )}
                <Button size="sm" onClick={() => deleteListing(viewListing.id)} variant="outline" className="border-[#C62828] text-[#C62828] rounded-full ml-auto">
                  <Trash size={16} className="mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminPager({ page, totalPages, loading, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2 flex-wrap" aria-label="Pagination admin">
      <Button type="button" variant="outline" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} className="rounded-full border-[#E5E0D8] gap-1">
        <CaretLeft size={18} /> Précédent
      </Button>
      <span className="text-sm text-[#4A5D50] px-2">{page} / {totalPages}</span>
      <Button type="button" variant="outline" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} className="rounded-full border-[#E5E0D8] gap-1">
        Suivant <CaretRight size={18} />
      </Button>
    </nav>
  );
}

function Stat({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ backgroundColor: color }}>{icon}</div>
      <p className="text-xs uppercase font-bold tracking-wide text-[#4A5D50]">{label}</p>
      <p className="font-heading font-bold text-3xl text-[#1A2E22]">{value}</p>
      {sub && <p className="text-xs text-[#4A5D50] mt-1">{sub}</p>}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#4A5D50] font-semibold">{label}</p>
      <p className={`text-sm text-[#1A2E22] font-semibold break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: "#FBC02D", pending_admin: "#FBC02D",
    approved: "#2E7D32", completed: "#2E7D32", resolved: "#2E7D32",
    rejected: "#C62828", failed: "#C62828", open: "#C62828", hidden: "#4A5D50",
  };
  return (
    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: `${colors[status] || "#4A5D50"}20`, color: colors[status] || "#4A5D50" }}>
      {listingStatusLabel(status)}
    </span>
  );
}
