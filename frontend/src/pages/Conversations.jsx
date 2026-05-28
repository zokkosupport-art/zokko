import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChatCircleDots } from "@phosphor-icons/react";
import api from "@/lib/api";

export default function Conversations() {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/conversations").then(({ data }) => setConvs(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-heading font-bold text-3xl text-[#1A2E22] mb-5">Messages</h1>
      {loading ? <p className="text-[#4A5D50]">Chargement…</p> : convs.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 text-center">
          <ChatCircleDots size={48} className="text-[#4A5D50]/40 mx-auto mb-3" />
          <p className="text-[#4A5D50]">Aucune conversation pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-[#E5E0D8]">
          {convs.map((c) => (
            <Link
              key={c.conversation_key}
              to={`/messages/${c.other_user?.id}${c.listing ? `?listing=${c.listing.id}` : ""}`}
              className="flex gap-3 p-4 hover:bg-[#FAF8F5] transition-colors"
              data-testid={`conv-${c.other_user?.id}`}
            >
              <div className="w-12 h-12 rounded-full bg-[#D84315]/10 text-[#D84315] font-heading font-bold flex items-center justify-center">
                {(c.other_user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#1A2E22] truncate">{c.other_user?.name || "Utilisateur"}</p>
                  <span className="text-xs text-[#4A5D50] flex-shrink-0">{new Date(c.last_at).toLocaleDateString("fr-FR")}</span>
                </div>
                {c.listing && <p className="text-xs text-[#D84315] truncate">📌 {c.listing.title}</p>}
                <p className="text-sm text-[#4A5D50] truncate">{c.last_message}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
