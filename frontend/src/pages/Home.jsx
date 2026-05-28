import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { logger } from "@/lib/logger";
import ListingCard from "@/components/ListingCard";
import { useAuth } from "@/lib/auth";
import {
  House, Car, DeviceMobile, TShirt, Wrench, Briefcase, ForkKnife,
  ArrowRight, Sparkle, Lightning, ShieldCheck, WhatsappLogo, Storefront,
  ChatCircleText, CurrencyCircleDollar, Camera, SealCheck, Star, Quotes,
  CaretDown,
} from "@phosphor-icons/react";

const ICONS = { House, Car, DeviceMobile, TShirt, Wrench, Briefcase, ForkKnife };

const STEPS = [
  { icon: Camera, title: "1. Publiez", desc: "Photos, prix, ville — en moins d'1 minute depuis votre téléphone", color: "#D84315" },
  { icon: WhatsappLogo, title: "2. Discutez", desc: "Les acheteurs vous contactent directement par WhatsApp ou message interne", color: "#25D366" },
  { icon: CurrencyCircleDollar, title: "3. Vendez", desc: "Concluez la vente, recevez votre paiement, et continuez à vendre", color: "#2E7D32" },
];

const BENEFITS = [
  { icon: Lightning, title: "Ultra rapide", desc: "Conçu pour les téléphones bas de gamme et la connexion 2G/3G en Guinée", color: "#D84315" },
  { icon: ShieldCheck, title: "Confiance", desc: "Profils vérifiés par OTP, avis 5 étoiles, signalement instantané anti-arnaque", color: "#2E7D32" },
  { icon: WhatsappLogo, title: "WhatsApp natif", desc: "Bouton WhatsApp direct sur chaque annonce, partage en 1 clic", color: "#25D366" },
  { icon: Storefront, title: "100% Guinée", desc: "7 catégories locales, 10 villes, paiement Orange Money +224", color: "#FF6600" },
];

const TESTIMONIALS = [
  { name: "Lancement 2026", city: "Conakry", role: "Plateforme en croissance", text: "Zokko vient d'ouvrir ses portes en Guinée. Publiez vos annonces, testez la plateforme et aidez-nous à construire la marketplace locale.", color: "#D84315" },
];

const FAQ = [
  { q: "Est-ce que Zokko est gratuit ?", a: "Oui, l'inscription et la publication d'annonces sont 100% gratuites. Vous payez uniquement si vous souhaitez booster votre annonce (10 000 GNF), la passer Premium (20 000 GNF) ou activer l'abonnement Pro (50 000 GNF/mois)." },
  { q: "Comment payer en Orange Money ?", a: "Envoyez le montant exact au +224 612 51 64 88, puis remplissez le formulaire dans l'app avec votre code de transaction et une capture d'écran. Notre équipe valide en moins de 24h et active automatiquement votre service." },
  { q: "Comment éviter les arnaques ?", a: "Vérifiez le badge ✓ vert (profil OTP vérifié), regardez les avis ⭐ du vendeur, contactez-le par WhatsApp, et signalez toute annonce suspecte avec le bouton 🚩. Notre équipe modère 7j/7." },
  { q: "Sur quel téléphone ça marche ?", a: "Zokko fonctionne sur tous les téléphones : iPhone, Android, et même les téléphones d'entrée de gamme. L'app est légère et économe en data. Vous pouvez l'installer sur votre écran d'accueil comme une vraie app." },
  { q: "Combien je gagne en parrainant un ami ?", a: "Votre code parrain ZOK-XXXXX donne +1 boost gratuit (7 jours) à vous ET à votre filleul. Plus vous invitez, plus vous boostez gratuitement vos annonces." },
];

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ users: 0, listings: 0 });
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [cats, listings, statsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/listings?limit=12&status=approved"),
          api.get("/public/stats").catch(() => ({ data: { users: 0, listings: 0 } })),
        ]);
        setCategories(cats.data);
        const items = listings.data.items || [];
        setFeatured(items.filter((i) => i.premium || (i.boosted_until && new Date(i.boosted_until) > new Date())).slice(0, 4));
        setRecent(items.slice(0, 8));
        setStats({
          users: statsRes.data.users ?? 0,
          listings: statsRes.data.listings ?? listings.data.total ?? 0,
        });
      } catch (e) {
        logger.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-[#FAF8F5]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gm-noise opacity-60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 md:pt-20 md:pb-24 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="gm-fade-in space-y-5">
              <span className="inline-flex items-center gap-2 bg-[#2E7D32]/10 text-[#2E7D32] px-3 py-1.5 rounded-full text-xs font-semibold">
                <Sparkle size={14} weight="fill" /> Zokko · 100% Guinée 🇬🇳
              </span>
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-[#1A2E22] leading-[1.05] tracking-tight">
                Achetez, vendez,<br />
                <span className="text-[#D84315]">près de chez vous.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#4A5D50] max-w-md">
                La marketplace simple et rapide de la Guinée. Profil vérifié, paiement Orange Money, partage WhatsApp.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to={user ? "/listings" : "/login"} className="inline-flex items-center gap-2 bg-[#D84315] hover:bg-[#BF360C] text-white px-6 py-3 rounded-full font-semibold transition-colors" data-testid="hero-cta-primary">
                  {user ? "Explorer les annonces" : "Commencer gratuitement"} <ArrowRight size={18} weight="bold" />
                </Link>
                <Link to="/publish" className="inline-flex items-center gap-2 bg-white border-2 border-[#E5E0D8] hover:border-[#D84315] hover:text-[#D84315] text-[#1A2E22] px-6 py-3 rounded-full font-semibold transition-colors" data-testid="hero-cta-secondary">
                  Publier une annonce
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-[#4A5D50]">
                <div><span className="font-heading font-bold text-2xl text-[#1A2E22] block">{stats.users}+</span>utilisateurs</div>
                <div><span className="font-heading font-bold text-2xl text-[#1A2E22] block">{stats.listings}+</span>annonces</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6600] text-white flex items-center justify-center font-bold text-xs">OM</div>
                  <span>Orange Money</span>
                </div>
              </div>
            </div>
            <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-[#D84315] to-[#2E7D32] gm-fade-in flex items-center justify-center">
              <Storefront size={120} weight="duotone" className="text-white/90" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-12 md:py-20 border-y border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest font-bold text-[#D84315]">Simple comme bonjour</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22] mt-2">Comment ça marche ?</h2>
            <p className="text-[#4A5D50] mt-3 max-w-xl mx-auto">Inscription en 30 secondes par téléphone. Pas de carte bancaire requise.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative bg-[#FAF8F5] rounded-2xl p-6 gm-card-hover" data-testid={`step-${i}`}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4" style={{ backgroundColor: s.color }}>
                    <Icon size={28} weight="duotone" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-[#1A2E22]">{s.title}</h3>
                  <p className="text-[#4A5D50] mt-2 text-sm leading-relaxed">{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight size={28} weight="bold" className="hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 text-[#E5E0D8]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-[#D84315]">7 catégories</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22] mt-1">Trouvez tout ce dont vous avez besoin</h2>
          </div>
          <Link to="/listings" className="text-sm font-medium text-[#D84315] hover:underline whitespace-nowrap" data-testid="categories-see-all">Tout voir →</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] || House;
            return (
              <Link
                key={c.slug}
                to={`/listings?category=${c.slug}`}
                className="bg-white rounded-2xl border border-[#E5E0D8] p-4 flex flex-col items-center justify-center gap-2 text-center hover:border-[#D84315] transition-colors gm-card-hover"
                data-testid={`category-${c.slug}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#D84315]">
                  <Icon size={26} weight="duotone" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#1A2E22]">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-end justify-between mb-5">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A2E22] flex items-center gap-2">
              <Lightning size={26} weight="fill" className="text-[#FBC02D]" /> Annonces boostées
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* RECENT LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#1A2E22]">Annonces récentes</h2>
          <Link to="/listings" className="text-sm font-medium text-[#D84315] hover:underline whitespace-nowrap" data-testid="recent-see-all">Tout voir →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-[#F0EBE1] rounded-2xl gm-img-placeholder" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* WHY ZOKKO */}
      <section className="bg-[#1A2E22] text-white py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest font-bold text-[#FBC02D]">Pourquoi nous choisir</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mt-2">Conçu pour la Guinée 🇬🇳</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors" data-testid={`benefit-${i}`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: b.color }}>
                    <Icon size={26} weight="duotone" className="text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-lg">{b.title}</h3>
                  <p className="text-sm text-white/70 mt-2 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest font-bold text-[#D84315]">Témoignages</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22] mt-2">Rejoignez les premiers utilisateurs</h2>
        </div>
        <div className="grid md:grid-cols-1 gap-5 max-w-lg mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 relative gm-card-hover" data-testid={`testimonial-${i}`}>
              <Quotes size={32} weight="fill" className="text-[#FBC02D] mb-3" />
              <p className="text-[#1A2E22] leading-relaxed">« {t.text} »</p>
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[#E5E0D8]">
                <div className="w-12 h-12 rounded-full text-white font-heading font-bold flex items-center justify-center text-lg" style={{ backgroundColor: t.color }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-[#1A2E22] flex items-center gap-1">{t.name} <SealCheck size={14} weight="fill" className="text-[#2E7D32]" /></p>
                  <p className="text-xs text-[#4A5D50]">{t.role} · {t.city}</p>
                </div>
                <div className="ml-auto flex">{[1,2,3,4,5].map(s => <Star key={s} size={14} weight="fill" className="text-[#FBC02D]" />)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ORANGE MONEY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 md:pb-20">
        <div className="bg-gradient-to-br from-[#FF6600] to-[#E65C00] text-white rounded-3xl p-6 sm:p-10 grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase">
              Paiement local
            </div>
            <h3 className="font-heading font-bold text-2xl sm:text-3xl">Boostez vos annonces avec Orange Money</h3>
            <p className="opacity-90">Annonces Premium 20 000 GNF · Boost 7 jours 10 000 GNF · Abonnement Pro 50 000 GNF/mois. Paiement direct au +224 612 51 64 88, activation rapide après validation.</p>
            <Link to="/publish" className="inline-flex items-center gap-2 bg-white text-[#FF6600] hover:bg-[#FAF8F5] px-6 py-3 rounded-xl font-bold transition-colors" data-testid="om-banner-cta">
              Publier maintenant <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
          <div className="aspect-square max-w-xs mx-auto bg-white/10 rounded-2xl overflow-hidden backdrop-blur-sm flex items-center justify-center">
            <CurrencyCircleDollar size={96} weight="duotone" className="text-white/80" aria-hidden />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-14 md:pb-20">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest font-bold text-[#D84315]">Questions fréquentes</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-[#1A2E22] mt-2">On vous explique tout</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden" data-testid={`faq-${i}`}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="w-full text-left p-5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                data-testid={`faq-toggle-${i}`}
              >
                <span className="font-heading font-semibold text-[#1A2E22]">{f.q}</span>
                <CaretDown size={20} weight="bold" className={`text-[#D84315] transition-transform flex-shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-[#4A5D50] leading-relaxed gm-fade-in">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-br from-[#D84315] via-[#BF360C] to-[#1A2E22] text-white py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="font-heading font-bold text-3xl sm:text-5xl leading-tight">Prêt à vendre en Guinée ?</h2>
          <p className="text-white/80 max-w-xl mx-auto">Inscrivez-vous gratuitement, publiez votre première annonce et faites partie des premiers vendeurs sur Zokko.</p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to={user ? "/publish" : "/login"} className="inline-flex items-center gap-2 bg-white text-[#D84315] hover:bg-[#FBC02D] hover:text-[#1A2E22] px-7 py-3.5 rounded-full font-bold transition-colors text-lg" data-testid="final-cta">
              {user ? "Publier ma première annonce" : "Créer mon compte gratuit"} <ArrowRight size={20} weight="bold" />
            </Link>
            <Link to="/listings" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white px-7 py-3.5 rounded-full font-bold transition-colors text-lg">
              Voir les annonces
            </Link>
          </div>
          <p className="text-xs text-white/60 pt-3">Pas de carte bancaire · 100% Guinée · Orange Money</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A2E22] text-white/70 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/branding/icon-192.png" alt="Zokko" className="w-9 h-9 rounded-xl object-contain bg-white" />
              <span className="font-heading font-bold text-xl text-white">Zo<span className="text-[#FBC02D]">kko</span></span>
            </div>
            <p className="text-sm">La marketplace simple et rapide de la Guinée 🇬🇳</p>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3">Marketplace</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/listings" className="hover:text-white">Toutes les annonces</Link></li>
              <li><Link to="/publish" className="hover:text-white">Publier une annonce</Link></li>
              <li><Link to="/listings?category=services" className="hover:text-white">Services</Link></li>
              <li><Link to="/listings?category=immobilier" className="hover:text-white">Immobilier</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3">Compte</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white">Se connecter</Link></li>
              <li><Link to="/profile" className="hover:text-white">Mon profil</Link></li>
              <li><Link to="/my-ads" className="hover:text-white">Mes annonces</Link></li>
              <li><Link to="/payments" className="hover:text-white">Mes paiements</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3">Contact</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><WhatsappLogo size={16} weight="fill" className="text-[#25D366]" /> +224 612 51 64 88</li>
              <li className="flex items-center gap-2"><ChatCircleText size={16} /> support@zokko.gn</li>
              <li>Conakry, Guinée</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/50">
          © 2026 Zokko · La marketplace de la Guinée · Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
