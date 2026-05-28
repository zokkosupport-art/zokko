import { useEffect, useState } from "react";
import { Users, Package, CurrencyEur, ShieldWarning, CheckCircle, Prohibit, Flag, Receipt, ImageSquare } from "@phosphor-icons/react";
import { toast } from "sonner";
import api, { formatPrice, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [proofImg, setProofImg] = useState(null);

  const load = async () => {
    const [s, u, l, p, pp, r] = await Promise.all([
      api.get("/admin/stats"), api.get("/admin/users"), api.get("/admin/listings"),
      api.get("/admin/payments"), api.get("/admin/payments/pending"), api.get("/admin/reports"),
    ]);
    setStats(s.data); setUsers(u.data); setListings(l.data); setPayments(p.data);
    setPendingPayments(pp.data); setReports(r.data);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => { await api.post(`/admin/listings/${id}/approve`); toast.success("Annonce approuvée"); load(); };
  const rejectListing = async (id) => { await api.post(`/admin/listings/${id}/reject`); toast.success("Annonce rejetée"); load(); };
  const block = async (id, blocked) => {
    if (blocked) { await api.post(`/admin/users/${id}/unblock`); toast.success("Utilisateur débloqué"); }
    else { await api.post(`/admin/users/${id}/block`); toast.success("Utilisateur bloqué"); }
    load();
  };
  const resolveReport = async (id) => { await api.post(`/admin/reports/${id}/resolve`); toast.success("Signalement résolu"); load(); };
  const validatePayment = async (id) => { await api.post(`/admin/payments/${id}/validate`); toast.success("✅ Paiement validé, service activé"); load(); };
  const rejectPayment = async (id) => { await api.post(`/admin/payments/${id}/reject`); toast.success("Paiement refusé"); load(); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-heading font-bold text-3xl text-[#1A2E22] mb-5 flex items-center gap-2">
        <ShieldWarning size={28} className="text-[#D84315]" /> Administration
      </h1>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white border border-[#E5E0D8] p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="dashboard" className="rounded-lg" data-testid="admin-tab-dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="pending-payments" className="rounded-lg relative" data-testid="admin-tab-pending">
            Paiements en attente
            {pendingPayments.length > 0 && <span className="ml-1.5 bg-[#FF6600] text-white text-[10px] font-bold rounded-full px-2 py-0.5">{pendingPayments.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="listings" className="rounded-lg" data-testid="admin-tab-listings">Annonces ({listings.filter(l => l.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg" data-testid="admin-tab-reports">Signalements ({reports.filter(r => r.status === "open").length})</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg" data-testid="admin-tab-users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg" data-testid="admin-tab-payments">Tous paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-5">
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={<Users size={22} weight="duotone" />} label="Utilisateurs" value={stats.users} color="#2E7D32" />
              <Stat icon={<Package size={22} weight="duotone" />} label="Annonces" value={stats.listings_total} sub={`${stats.listings_pending} en attente`} color="#D84315" />
              <Stat icon={<CheckCircle size={22} weight="duotone" />} label="Approuvées" value={stats.listings_approved} color="#FBC02D" />
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
                      <span className="text-xs bg-[#FBC02D]/20 text-[#1A2E22] px-2 py-0.5 rounded-full font-semibold">{p.purpose}</span>
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
                  {p.om_proof_image_path && (
                    <Button size="sm" variant="outline" onClick={() => setProofImg(p.om_proof_image_path)} className="border-[#E5E0D8] rounded-full" data-testid={`view-proof-${p.id}`}>
                      <ImageSquare size={16} className="mr-1" /> Voir preuve
                    </Button>
                  )}
                  <Button size="sm" onClick={() => rejectPayment(p.id)} variant="outline" className="border-[#C62828] text-[#C62828] hover:bg-[#C62828]/5 rounded-full" data-testid={`reject-payment-${p.id}`}>
                    ❌ Refuser
                  </Button>
                  <Button size="sm" onClick={() => validatePayment(p.id)} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full font-bold" data-testid={`validate-payment-${p.id}`}>
                    ✅ Valider et activer
                  </Button>
                </div>
              </div>
            ))}
            {pendingPayments.length === 0 && (
              <div className="p-10 text-center">
                <Receipt size={48} className="text-[#4A5D50]/40 mx-auto mb-2" />
                <p className="text-[#4A5D50]">Aucun paiement en attente</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="listings" className="mt-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {listings.map((l) => (
              <div key={l.id} className="p-4 flex flex-wrap items-center gap-3" data-testid={`admin-listing-${l.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22] truncate">{l.title}</p>
                  <p className="text-xs text-[#4A5D50]">{l.owner_name} · {l.city} · {formatPrice(l.price, l.currency)}</p>
                </div>
                <StatusBadge status={l.status} />
                {l.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => approve(l.id)} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full" data-testid={`approve-${l.id}`}>Approuver</Button>
                    <Button size="sm" onClick={() => rejectListing(l.id)} variant="outline" className="border-[#C62828] text-[#C62828] rounded-full" data-testid={`reject-${l.id}`}>Rejeter</Button>
                  </>
                )}
              </div>
            ))}
            {listings.length === 0 && <p className="p-6 text-center text-[#4A5D50]">Aucune annonce</p>}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {reports.map((r) => (
              <div key={r.id} className="p-4 flex flex-wrap items-center gap-3" data-testid={`admin-report-${r.id}`}>
                <Flag size={24} className="text-[#C62828]" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22]"><strong>{r.reason}</strong> — par {r.reporter_name}</p>
                  {r.description && <p className="text-xs text-[#4A5D50] truncate">{r.description}</p>}
                  <p className="text-xs text-[#4A5D50]">Annonce: {r.listing_id?.slice(0,8) || "—"} · {new Date(r.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <StatusBadge status={r.status} />
                {r.status === "open" && (
                  <Button size="sm" onClick={() => resolveReport(r.id)} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full" data-testid={`resolve-${r.id}`}>Résoudre</Button>
                )}
              </div>
            ))}
            {reports.length === 0 && <p className="p-6 text-center text-[#4A5D50]">Aucun signalement</p>}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap items-center gap-3" data-testid={`admin-user-${u.id}`}>
                <div className="w-10 h-10 rounded-full bg-[#D84315]/10 text-[#D84315] font-heading font-bold flex items-center justify-center">{(u.name || "U").charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22] truncate">{u.name} {u.role === "admin" && <span className="text-xs text-[#D84315]">(admin)</span>}</p>
                  <p className="text-xs text-[#4A5D50]">+224 {u.phone} · {u.city}{u.is_pro && " · Pro"}{u.verified && " · Vérifié"}</p>
                </div>
                {u.blocked && <span className="text-xs bg-[#C62828]/10 text-[#C62828] px-2 py-1 rounded-full font-semibold">Bloqué</span>}
                {u.role !== "admin" && (
                  <Button size="sm" onClick={() => block(u.id, u.blocked)} variant="outline" className={u.blocked ? "border-[#2E7D32] text-[#2E7D32] rounded-full" : "border-[#C62828] text-[#C62828] rounded-full"} data-testid={`block-${u.id}`}>
                    <Prohibit size={14} className="mr-1" /> {u.blocked ? "Débloquer" : "Bloquer"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center gap-3" data-testid={`admin-payment-${p.id}`}>
                <div className="w-10 h-10 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-bold text-xs">
                  {p.provider === "cinetpay" ? "CP" : "OM"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2E22] text-sm truncate">{p.user_name} · {p.purpose}{p.mock && <span className="ml-1 text-[#FBC02D]">(démo)</span>}</p>
                  <p className="text-xs text-[#4A5D50] truncate">{p.transaction_ref} · {new Date(p.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <p className="font-heading font-bold text-[#1A2E22] whitespace-nowrap">{formatPrice(p.amount, p.currency)}</p>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {payments.length === 0 && <p className="p-6 text-center text-[#4A5D50]">Aucun paiement</p>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!proofImg} onOpenChange={(o) => !o && setProofImg(null)}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Preuve de paiement</DialogTitle>
          </DialogHeader>
          {proofImg && <img src={fileUrl(proofImg)} alt="Preuve" className="w-full max-h-[70vh] object-contain rounded-xl" />}
        </DialogContent>
      </Dialog>
    </div>
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
    rejected: "#C62828", failed: "#C62828", open: "#C62828",
  };
  const labels = { pending_admin: "à valider" };
  return (
    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: `${colors[status] || "#4A5D50"}20`, color: colors[status] || "#4A5D50" }}>
      {labels[status] || status}
    </span>
  );
}
