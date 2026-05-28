import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { House, MagnifyingGlass, Plus, ChatCircleText, User, ShieldWarning, WhatsappLogo, ShieldCheck } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const TRUST_TIPS = [
  "Rencontrez le vendeur en personne dans un lieu public",
  "Ne payez jamais d'acompte sans avoir vu le produit",
  "Méfiez-vous des prix anormalement bas — signalez les arnaques",
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/", icon: House, label: "Accueil", testid: "nav-home" },
    { to: "/listings", icon: MagnifyingGlass, label: "Rechercher", testid: "nav-search" },
    { to: "/publish", icon: Plus, label: "Publier", testid: "nav-publish", center: true },
    { to: "/messages", icon: ChatCircleText, label: "Messages", testid: "nav-messages" },
    { to: user ? "/profile" : "/login", icon: User, label: user ? "Profil" : "Connexion", testid: "nav-profile" },
  ];

  const isActive = (to) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Top bar - desktop */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <img src="/branding/icon-guinea.svg" alt="Zokko" className="w-9 h-9 rounded-xl object-contain" />
            <span className="font-heading font-bold text-xl text-[#1A2E22]">Zo<span className="text-[#D84315]">kko</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={`px-3 py-2 rounded-full text-sm font-medium ${isActive("/") && location.pathname === "/" ? "text-[#D84315]" : "text-[#1A2E22] hover:text-[#D84315]"}`} data-testid="top-nav-home">Accueil</Link>
            <Link to="/listings" className={`px-3 py-2 rounded-full text-sm font-medium ${isActive("/listings") ? "text-[#D84315]" : "text-[#1A2E22] hover:text-[#D84315]"}`} data-testid="top-nav-listings">Annonces</Link>
            {user && <Link to="/my-ads" className={`px-3 py-2 rounded-full text-sm font-medium ${isActive("/my-ads") ? "text-[#D84315]" : "text-[#1A2E22] hover:text-[#D84315]"}`} data-testid="top-nav-myads">Mes annonces</Link>}
            {user?.role === "admin" && <Link to="/admin" className={`px-3 py-2 rounded-full text-sm font-medium ${isActive("/admin") ? "text-[#D84315]" : "text-[#1A2E22] hover:text-[#D84315]"}`} data-testid="top-nav-admin">Admin</Link>}
          </nav>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`md:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  isActive("/admin") ? "bg-[#D84315] text-white" : "bg-[#D84315]/10 text-[#D84315]"
                }`}
                data-testid="mobile-admin-link"
              >
                <ShieldWarning size={16} weight="fill" /> Admin
              </Link>
            )}
            <Button
              onClick={() => navigate("/publish")}
              className="hidden sm:inline-flex bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full px-5"
              data-testid="header-publish-btn"
            >
              <Plus weight="bold" className="mr-1" /> Publier
            </Button>
            {user ? (
              <Button variant="ghost" onClick={() => { logout(); navigate("/"); }} className="hidden md:inline-flex text-[#4A5D50]" data-testid="logout-btn">
                Déconnexion
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate("/login")} className="text-[#1A2E22]" data-testid="header-login-btn">
                Connexion
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Trust band */}
      <aside className="hidden md:block bg-[#2E7D32]/5 border-t border-[#2E7D32]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-[#4A5D50]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#2E7D32]">
            <ShieldCheck size={16} weight="fill" /> Achetez en toute prudence
          </span>
          {TRUST_TIPS.map((tip) => (
            <span key={tip}>• {tip}</span>
          ))}
        </div>
      </aside>

      {/* Site footer */}
      <footer className="bg-[#1A2E22] text-white/70 py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/branding/icon-guinea.svg" alt="Zokko" className="w-9 h-9 rounded-xl object-contain bg-white" />
              <span className="font-heading font-bold text-xl text-white">Zo<span className="text-[#FBC02D]">kko</span></span>
            </div>
            <p className="text-sm">La marketplace simple et rapide de la Guinée 🇬🇳</p>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3">Marketplace</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/listings" className="hover:text-white">Annonces</Link></li>
              <li><Link to="/publish" className="hover:text-white">Publier</Link></li>
              <li><Link to="/listings?category=immobilier" className="hover:text-white">Immobilier</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3">Compte</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white">Connexion</Link></li>
              <li><Link to="/profile" className="hover:text-white">Mon profil</Link></li>
              <li><Link to="/payments" className="hover:text-white">Mes paiements</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3">Légal &amp; contact</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/legal" className="hover:text-white">Conditions d&apos;utilisation</Link></li>
              <li className="flex items-center gap-2"><WhatsappLogo size={16} weight="fill" className="text-[#25D366]" /> +224 612 51 64 88</li>
              <li><a href="mailto:support@zokko.net" className="hover:text-white">support@zokko.net</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/50">
          © 2026 Zokko · Tous droits réservés
        </div>
      </footer>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E0D8]" data-testid="bottom-nav">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex flex-col items-center justify-center gap-1 ${active ? "text-[#D84315]" : "text-[#4A5D50]"}`}
                data-testid={it.testid}
              >
                {it.center ? (
                  <div className="w-11 h-11 rounded-full bg-[#D84315] text-white flex items-center justify-center -mt-6 shadow-lg">
                    <Icon size={24} weight="bold" />
                  </div>
                ) : (
                  <>
                    <Icon size={22} weight={active ? "fill" : "regular"} />
                    <span className="text-[10px] font-medium">{it.label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
