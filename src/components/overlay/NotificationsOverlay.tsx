"use client";

import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBlockStore } from "@/store/blockStore";
import { useNotificationStore } from "@/store/notificationStore";
import { getUnreadCount, type DerivedNotif } from "@/lib/notifications";
import Avatar from "@/components/ui/Avatar";

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  if (hr < 48) return "昨日";
  return `${Math.floor(hr / 24)}日前`;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isYesterday(iso: string): boolean {
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
}

// ---- アイコン SVG ----
function MailBadgeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 6 12 13 2 6" /><path d="M2 6v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MessageBadgeIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MusicContextIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function BellOffIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.56 2.9A7 7 0 0 1 19 9v4l2 2H7" /><path d="M17 17H3l2-2V9a7 7 0 0 1 .78-3.22" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function NotifRow({ item, isUnread, onClick }: { item: DerivedNotif; isUnread: boolean; onClick: () => void }) {
  const badgeColor = item.type === "approved" ? "#3a9b6b" : item.type === "message" ? "#3a7ebc" : "var(--red)";

  const text = item.type === "answer"
    ? <><b style={{ color: "var(--red2)", fontWeight: 700 }}>{item.fromNickname}</b>さんから音が届きました 🎵</>
    : item.type === "approved"
    ? <><b style={{ color: "var(--red2)", fontWeight: 700 }}>{item.fromNickname}</b>さんと、会えそうですね 🎵</>
    : <><b style={{ color: "var(--red2)", fontWeight: 700 }}>{item.fromNickname}</b>: {item.contextTitle.slice(0, 30)}</>;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        background: isUnread ? "rgba(181,89,60,0.06)" : "var(--card)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${isUnread ? "var(--red-border)" : "var(--border)"}`,
        borderRadius: "16px",
        padding: "12px 14px",
        marginBottom: "6px",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.18s",
      }}
    >
      {isUnread && (
        <div style={{
          position: "absolute",
          left: "-2px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "4px",
          height: "60%",
          borderRadius: "2px",
          background: "var(--red)",
        }} />
      )}

      {/* アイコン + バッジ */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar src={item.fromAvatarUrl} alt={item.fromNickname} size="sm" />
        <div style={{
          position: "absolute",
          bottom: "-2px",
          right: "-2px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: badgeColor,
          border: "2px solid var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {item.type === "answer" && <MailBadgeIcon />}
          {item.type === "approved" && <CheckBadgeIcon />}
          {item.type === "message" && <MessageBadgeIcon />}
        </div>
      </div>

      {/* テキスト */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5, fontWeight: 500 }}>
          {text}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "3px", fontWeight: 500 }}>
          {timeAgo(item.createdAt)}
        </div>
        {item.type !== "message" && (
          <div style={{
            marginTop: "8px",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "7px 10px",
            fontSize: "11px",
            color: "var(--text2)",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}>
            <div style={{
              width: "18px",
              height: "18px",
              borderRadius: "5px",
              background: "linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <MusicContextIcon />
            </div>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.contextTitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsOverlay({ open, onClose, currentUserId }: Props) {
  const { blockedIds } = useBlockStore();
  const { notifs, readAt, loaded, fetch, markAllRead } = useNotificationStore();
  const router = useRouter();

  useEffect(() => {
    if (!open || !currentUserId) return;
    fetch(currentUserId);
  }, [open, currentUserId, fetch]);

  const loading = open && !loaded;

  function handleNotifClick(item: DerivedNotif) {
    onClose();
    setTimeout(() => {
      if (item.type === "answer" || item.type === "message") {
        router.push(`/chat/${item.contextId}`);
      } else {
        router.push("/messages");
      }
    }, 280);
  }

  const visibleNotifs = notifs.filter((n) => !blockedIds.has(n.fromUserId));
  const isUnread = (item: DerivedNotif) => !readAt || new Date(item.createdAt) > readAt;
  const unreadCount = getUnreadCount(notifs, readAt, blockedIds);

  const grouped = {
    today:     visibleNotifs.filter((n) => isToday(n.createdAt)),
    yesterday: visibleNotifs.filter((n) => isYesterday(n.createdAt)),
    older:     visibleNotifs.filter((n) => !isToday(n.createdAt) && !isYesterday(n.createdAt)),
  };
  const hasAny = visibleNotifs.length > 0;

  return (
    <>
      {/* 背景レイヤー */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
          zIndex: 60,
        }}
      />

      {/* 通知パネル */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          background: "rgba(20,20,26,0.96)",
          backdropFilter: "blur(32px) saturate(1.4)",
          WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="戻る"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "var(--card)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", flex: 1 }}>
            通知
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "11px",
                color: "var(--text2)",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "6px 8px",
              }}
            >
              すべて既読
            </button>
          )}
        </div>

        {/* リスト */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px 24px",
          }}
        >
          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text3)", fontSize: "13px" }}>
              読み込み中…
            </div>
          )}

          {!loading && !hasAny && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "80px 30px", gap: "14px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BellOffIcon />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                  通知はまだありません
                </div>
                <div style={{ fontSize: "12px", color: "var(--text3)", lineHeight: 1.6, maxWidth: "240px" }}>
                  あなたの音源に反応があったら、ここでお知らせします。
                </div>
              </div>
            </div>
          )}

          {!loading && grouped.today.length > 0 && (
            <>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.8px", textTransform: "uppercase", padding: "14px 8px 8px" }}>今日</div>
              {grouped.today.map((item) => (
                <NotifRow key={item.id} item={item} isUnread={isUnread(item)} onClick={() => handleNotifClick(item)} />
              ))}
            </>
          )}

          {!loading && grouped.yesterday.length > 0 && (
            <>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.8px", textTransform: "uppercase", padding: "14px 8px 8px" }}>昨日</div>
              {grouped.yesterday.map((item) => (
                <NotifRow key={item.id} item={item} isUnread={isUnread(item)} onClick={() => handleNotifClick(item)} />
              ))}
            </>
          )}

          {!loading && grouped.older.length > 0 && (
            <>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text3)", letterSpacing: "0.8px", textTransform: "uppercase", padding: "14px 8px 8px" }}>もっと前</div>
              {grouped.older.map((item) => (
                <NotifRow key={item.id} item={item} isUnread={isUnread(item)} onClick={() => handleNotifClick(item)} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
