import { Link } from "react-router-dom";
import { Key, UserCircle } from "@phosphor-icons/react";

/**
 * Deux choix égaux : connexion vs inscription (public Guinée, peu habitué aux apps).
 * @param {"login"|"register"} active
 */
export default function AuthModeSwitch({ active, className = "" }) {
  const btn =
    "flex-1 flex items-center justify-center gap-2 rounded-xl min-h-[52px] text-sm sm:text-base font-bold transition-colors px-2 text-center leading-tight";

  return (
    <div
      className={`grid grid-cols-2 gap-2 p-1.5 bg-[#FAF8F5] rounded-2xl border-2 border-[#E5E0D8] ${className}`}
      role="tablist"
      aria-label="Connexion ou création de compte"
    >
      <Link
        to="/login"
        role="tab"
        aria-selected={active === "login"}
        className={`${btn} ${
          active === "login"
            ? "bg-[#D84315] text-white shadow-md"
            : "bg-white text-[#1A2E22] border border-[#E5E0D8] hover:border-[#D84315]/50"
        }`}
        data-testid="auth-switch-login"
      >
        <Key size={22} weight={active === "login" ? "bold" : "regular"} aria-hidden />
        <span>J&apos;ai un compte</span>
      </Link>
      <Link
        to="/register"
        role="tab"
        aria-selected={active === "register"}
        className={`${btn} ${
          active === "register"
            ? "bg-[#2E7D32] text-white shadow-md"
            : "bg-white text-[#1A2E22] border border-[#E5E0D8] hover:border-[#2E7D32]/50"
        }`}
        data-testid="auth-switch-register"
      >
        <UserCircle size={22} weight={active === "register" ? "bold" : "regular"} aria-hidden />
        <span>Créer un compte</span>
      </Link>
    </div>
  );
}
