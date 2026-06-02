import { useState } from "react";
import { Image as ImageIcon, WarningCircle } from "@phosphor-icons/react";
import { fileUrl } from "@/lib/api";

/** Admin preview — shows clear message when server file is missing (404). */
export default function AdminPhoto({ path, title, className = "w-full aspect-[4/3] object-cover rounded-xl" }) {
  const src = fileUrl(path);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full aspect-[4/3] rounded-xl bg-[#FFF8E1] border border-[#FBC02D]/50 flex flex-col items-center justify-center text-center px-3">
        <WarningCircle size={28} className="text-[#F57F17] mb-1" weight="duotone" aria-hidden />
        <span className="text-xs font-semibold text-[#1A2E22]">Photo absente du serveur</span>
        <span className="text-[10px] text-[#4A5D50] mt-1 leading-snug">
          Fichier effacé après mise à jour — demandez au vendeur de republier les images
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title || "Photo annonce"}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function AdminPhotoThumb({ path, title }) {
  const src = fileUrl(path);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-14 h-14 rounded-xl bg-[#FFF8E1] border border-[#FBC02D]/40 flex items-center justify-center flex-shrink-0">
        <ImageIcon size={22} className="text-[#F57F17]/70" weight="duotone" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-[#E5E0D8]"
      onError={() => setFailed(true)}
    />
  );
}
