import type { CSSProperties } from "react";
import { initialsFromName } from "@/lib/initials";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
  imageClassName?: string;
  title?: string;
  style?: CSSProperties;
};

const SIZE = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-[13px]",
} as const;

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = "sm",
  className = "",
  imageClassName = "",
  title,
  style,
}: UserAvatarProps) {
  const label = name?.trim() || email?.trim() || "User";
  const initials = initialsFromName(name || email);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${SIZE[size]} ${className}`}
      title={title ?? label}
      style={style}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={`h-full w-full object-cover ${imageClassName}`} />
      ) : (
        initials
      )}
    </span>
  );
}
