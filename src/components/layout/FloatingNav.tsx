"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PlusIcon, MessageIcon, UserIcon } from "@/components/icons/CustomIcons";
import { useNotificationStore } from "@/store/notificationStore";
import { useBlockStore } from "@/store/blockStore";
import { getUnreadCount } from "@/lib/notifications";

interface FloatingNavProps {
  onPostClick?: () => void;
}

const ITEM_SIZE = 46;
const ITEM_GAP = 16;
const STEP = ITEM_SIZE + ITEM_GAP; // 60px per item

function getIndicatorX(pathname: string): number {
  if (pathname.startsWith("/post")) return STEP * 1;
  if (pathname.startsWith("/messages")) return STEP * 2;
  if (pathname.startsWith("/mypage")) return STEP * 3;
  return 0; // /timeline default
}

export default function FloatingNav({ onPostClick }: FloatingNavProps) {
  const pathname = usePathname();
  const [bouncing, setBouncing] = useState<string | null>(null);
  const { notifs, readAt } = useNotificationStore();
  const { blockedIds } = useBlockStore();

  const indicatorX = getIndicatorX(pathname);
  const unreadCount = getUnreadCount(notifs, readAt, blockedIds);
  const unreadLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  function isActive(key: string) {
    if (key === "timeline") return pathname === "/" || pathname.startsWith("/timeline");
    if (key === "post") return pathname.startsWith("/post");
    if (key === "messages") return pathname.startsWith("/messages");
    if (key === "mypage") return pathname.startsWith("/mypage");
    return false;
  }

  function bounce(key: string) {
    if (bouncing === key) return;
    setBouncing(key);
    setTimeout(() => setBouncing(null), 500);
  }

  const itemStyle = (key: string): React.CSSProperties => ({
    position: "relative",
    zIndex: key === "post" ? 3 : 2,
    width: `${ITEM_SIZE}px`,
    height: `${ITEM_SIZE}px`,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    textDecoration: "none",
    cursor: "pointer",
    color: isActive(key) ? "var(--accent-light)" : key === "post" ? "var(--red)" : "var(--accent-muted)",
    transition: "color 0.3s ease",
    animation: bouncing === key ? "fnBounce 0.5s cubic-bezier(0.4,1.3,0.55,1)" : "none",
    flexShrink: 0,
  });

  return (
    <nav
      className="floating-nav"
      style={{
        position: "fixed",
        bottom: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: `${ITEM_GAP}px`,
        background: "var(--bg)",
        border: "1px solid var(--card-solid)",
        borderRadius: "31px",
        padding: "7px 10px",
      }}
      aria-label="メインナビゲーション"
    >
      {/* スライドインジケーター(赤い円・アクティブアイコンの下に来る) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "7px",
          left: "10px",
          width: `${ITEM_SIZE}px`,
          height: `${ITEM_SIZE}px`,
          borderRadius: "50%",
          background: "var(--red)",
          
          transform: `translateX(${indicatorX}px)`,
          transition: "transform 0.5s cubic-bezier(0.4, 1.3, 0.55, 1)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ホーム */}
      <Link
        href="/timeline"
        aria-label="ホーム"
        onClick={() => bounce("timeline")}
        style={itemStyle("timeline")}
      >
        <HomeIcon size={26} />
      </Link>

      {/* 投稿: 常時透明背景、アイコン色だけ赤 */}
      <button
        type="button"
        aria-label="投稿する"
        onClick={() => { bounce("post"); onPostClick?.(); }}
        style={itemStyle("post")}
      >
        <PlusIcon size={28} />
      </button>

      {/* メッセージ */}
      <Link
        href="/messages"
        aria-label={unreadCount > 0 ? `メッセージ(未読${unreadLabel}件)` : "メッセージ"}
        onClick={() => bounce("messages")}
        style={itemStyle("messages")}
      >
        <MessageIcon size={22} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "3px",
              right: "3px",
              minWidth: "21px",
              height: "21px",
              padding: "0 3px",
              borderRadius: "13px",
              background: "var(--red)",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 4,
            }}
          >
            {unreadLabel}
          </span>
        )}
      </Link>

      {/* マイページ */}
      <Link
        href="/mypage"
        aria-label="マイページ"
        onClick={() => bounce("mypage")}
        style={itemStyle("mypage")}
      >
        <UserIcon size={21} />
      </Link>
    </nav>
  );
}
