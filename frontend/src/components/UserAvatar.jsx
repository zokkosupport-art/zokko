import { useEffect, useState } from "react";
import { fileUrl } from "@/lib/api";

export default function UserAvatar({ user, size = 48, className = "" }) {
  const primary = user?.avatar ? fileUrl(user.avatar) : null;
  const [src, setSrc] = useState(primary);
  const [failed, setFailed] = useState(!primary);
  const letter = (user?.name || "U").charAt(0).toUpperCase();
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  useEffect(() => {
    setSrc(primary);
    setFailed(!primary);
  }, [primary, user?.id, user?.avatar]);

  if (failed || !src) {
    return (
      <div
        className={`rounded-full bg-[#D84315]/10 text-[#D84315] font-heading font-bold flex items-center justify-center flex-shrink-0 ${className}`}
        style={dim}
        title={user?.name || ""}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={`rounded-full object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
