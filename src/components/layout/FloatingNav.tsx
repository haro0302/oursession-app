"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, User } from "lucide-react";

interface FloatingNavProps {
  onPostClick?: () => void;
  notificationCount?: number;
}

export default function FloatingNav({
  onPostClick,
  notificationCount = 0,
}: FloatingNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <nav
      className="floating-nav"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "rgba(20,20,26,0.92)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "28px",
        padding: "6px 8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
      aria-label="メインナビゲーション"
    >
      <NavItem href="/timeline" label="ホーム" active={isActive("/timeline")}>
        <Home size={20} strokeWidth={isActive("/timeline") ? 2.5 : 1.8} />
      </NavItem>

      <PostButton onClick={onPostClick} />

      <NavItem
        href="/notifications"
        label="通知"
        active={isActive("/notifications")}
        badge={notificationCount}
      >
        <Bell size={20} strokeWidth={isActive("/notifications") ? 2.5 : 1.8} />
      </NavItem>

      <NavItem href="/mypage" label="マイページ" active={isActive("/mypage")}>
        <User size={20} strokeWidth={isActive("/mypage") ? 2.5 : 1.8} />
      </NavItem>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
  badge,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="nav-item-link"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "44px",
        borderRadius: "22px",
        background: active ? "var(--red-bg)" : "transparent",
        color: active ? "var(--red2)" : "var(--text3)",
        textDecoration: "none",
      }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: "4px",
            right: "6px",
            minWidth: "16px",
            height: "16px",
            borderRadius: "8px",
            background: "var(--red)",
            color: "white",
            fontSize: "9px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "1.5px solid rgba(20,20,26,0.92)",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function PostButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="投稿する"
      className="nav-post-btn"
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        background: "var(--red)",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(232,74,95,0.45)",
        margin: "0 4px",
        flexShrink: 0,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
