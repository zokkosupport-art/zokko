import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PaperPlaneRight, ArrowLeft } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChatRoom() {
  const { userId } = useParams();
  const [params] = useSearchParams();
  const listingId = params.get("listing");
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [other, setOther] = useState(null);
  const [listing, setListing] = useState(null);
  const bottomRef = useRef(null);

  const load = async () => {
    const url = `/conversations/${userId}/messages${listingId ? `?listing_id=${listingId}` : ""}`;
    const { data } = await api.get(url);
    setMsgs(data);
  };

  useEffect(() => {
    load();
    if (listingId) api.get(`/listings/${listingId}`).then(({ data }) => { setListing(data); setOther(data.owner); });
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [userId, listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post("/messages", { to_user_id: userId, listing_id: listingId, content: text.trim() });
      setText("");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col" style={{ minHeight: "calc(100vh - 130px)" }}>
      <Link to="/messages" className="text-[#4A5D50] flex items-center gap-1 text-sm mb-4 hover:text-[#D84315]" data-testid="back-conv">
        <ArrowLeft size={16} /> Conversations
      </Link>

      {listing && (
        <Link to={`/listings/${listing.id}`} className="bg-white border border-[#E5E0D8] rounded-2xl p-3 mb-3 flex items-center gap-3 hover:border-[#D84315]" data-testid="chat-listing-context">
          <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] flex items-center justify-center font-heading font-bold text-[#D84315]">{listing.title.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{listing.title}</p>
            <p className="text-xs text-[#D84315] font-heading font-bold">{listing.price.toLocaleString("fr-FR")} GNF</p>
          </div>
        </Link>
      )}

      <div className="flex-1 bg-white border border-[#E5E0D8] rounded-2xl p-4 overflow-y-auto space-y-2" data-testid="chat-messages">
        {msgs.length === 0 ? (
          <p className="text-center text-[#4A5D50] py-8 text-sm">Commencez la conversation</p>
        ) : (
          msgs.map((m) => {
            const mine = m.from_user_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${mine ? "bg-[#D84315] text-white" : "bg-[#FAF8F5] text-[#1A2E22] border border-[#E5E0D8]"}`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-[#4A5D50]"}`}>{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2" data-testid="chat-input-form">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Écrire un message…" className="flex-1 bg-white border-[#E5E0D8] rounded-full h-12 px-5" data-testid="chat-input" />
        <Button type="submit" className="bg-[#D84315] hover:bg-[#BF360C] text-white rounded-full h-12 w-12 p-0" data-testid="chat-send">
          <PaperPlaneRight size={20} weight="fill" />
        </Button>
      </form>
    </div>
  );
}
