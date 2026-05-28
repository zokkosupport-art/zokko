import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldWarning, User, Lock, ArrowLeft } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Identifiant et mot de passe requis");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin-login", { username: username.trim(), password });
      login(data.access_token, data.user);
      toast.success(`Bienvenue ${data.user.name}`);
      nav("/admin");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 gm-shadow-soft gm-fade-in">
        <Link to="/login" className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]" data-testid="back-to-login">
          <ArrowLeft size={16} /> Retour connexion utilisateurs
        </Link>
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1A2E22]/10 text-[#1A2E22] flex items-center justify-center mb-3">
            <ShieldWarning size={28} weight="duotone" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#1A2E22]">Administration Zokko</h1>
          <p className="text-sm text-[#4A5D50] mt-2">Connexion sécurisée par identifiant et mot de passe</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-[#1A2E22] font-medium mb-1.5 block">Identifiant</Label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D50]" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                className="pl-10 bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"
                data-testid="admin-username-input"
              />
            </div>
          </div>
          <div>
            <Label className="text-[#1A2E22] font-medium mb-1.5 block">Mot de passe</Label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D50]" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pl-10 bg-[#FAF8F5] border-[#E5E0D8] rounded-xl h-12"
                data-testid="admin-password-input"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A2E22] hover:bg-[#2E4034] text-white rounded-full h-12 font-semibold"
            data-testid="admin-login-btn"
          >
            {loading ? "Connexion..." : "Accéder au panel admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
