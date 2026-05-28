import { fileUrl } from "@/lib/api";

export default function UserAvatar({ user, size = 48, className = "" }) {
  const url = user?.avatar ? fileUrl(user.avatar) : null;
  const letter = (user?.name || "U").charAt(0).toUpperCase();
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-[#D84315]/10 text-[#D84315] font-heading font-bold flex items-center justify-center flex-shrink-0 ${className}`}
      style={dim}
    >
      {letter}
    </div>
  );
}
