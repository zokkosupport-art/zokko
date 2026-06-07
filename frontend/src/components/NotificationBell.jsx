import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "@phosphor-icons/react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnread(data.count || 0);
    } catch {
      /* ignore */
    }
  }, [user]);

  const loadItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => clearInterval(t);
  }, [loadCount]);

  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  if (!user) return null;

  const openNotification = async (n) => {
    try {
      if (!n.read) {
        await api.post(`/notifications/${n.id}/read`);
        setUnread((c) => Math.max(0, c - 1));
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 rounded-full text-[#1A2E22] hover:bg-[#FAF8F5]"
          aria-label="Notifications"
          data-testid="notifications-bell"
        >
          <Bell size={22} weight={unread > 0 ? "fill" : "regular"} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D84315] text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-white border-[#E5E0D8]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8]">
          <p className="font-heading font-semibold text-[#1A2E22]">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs font-semibold text-[#D84315]">
              Tout lire
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-[#4A5D50]">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-[#4A5D50]">Aucune notification.</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={`w-full text-left px-4 py-3 border-b border-[#E5E0D8]/60 hover:bg-[#FAF8F5] ${n.read ? "opacity-70" : "bg-[#D84315]/5"}`}
              >
                <p className="text-sm font-semibold text-[#1A2E22]">{n.title}</p>
                <p className="text-xs text-[#4A5D50] mt-0.5">{n.body}</p>
              </button>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="p-2 border-t border-[#E5E0D8]">
            <Button variant="ghost" size="sm" className="w-full rounded-full" onClick={() => { setOpen(false); navigate("/my-ads"); }}>
              Mes annonces
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
