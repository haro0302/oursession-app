"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useBlockStore } from "@/store/blockStore";
import { useNotificationStore } from "@/store/notificationStore";
import { fetchOtherPartyMessages } from "@/lib/chatActivity";
import { getChatReadAt } from "@/lib/chatReads";
import Avatar from "@/components/ui/Avatar";
import type { MsgRow } from "./page";

interface Props {
  rows: MsgRow[];
  currentUserId: string;
}

interface SessionStats {
  latestAt: string;
  unreadCount: number;
}

const MESSAGE_POLL_INTERVAL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨日";
  return `${day}日前`;
}

function RoleMark({ role }: { role: MsgRow["role"] }) {
  const cls =
    role === "host"
      ? "msg-role msg-role-host"
      : role === "pending"
      ? "msg-role msg-role-pending"
      : "msg-role msg-role-guest";

  if (role === "host") {
    return (
      <div className={cls}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
    );
  }
  if (role === "pending") {
    return (
      <div className={cls}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
    );
  }
  return (
    <div className={cls}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  );
}

export default function MessagesClient({ rows, currentUserId }: Props) {
  const router = useRouter();
  const { openProfile } = useProfile();
  const { blockedIds } = useBlockStore();
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [messageStats, setMessageStats] = useState<Map<string, SessionStats>>(new Map());
  const visibleRows = rows.filter((r) => !blockedIds.has(r.partnerUserId));

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  useEffect(() => {
    const roomIds = rows.map((r) => r.roomId).filter((id): id is string => id !== null);
    let cancelled = false;

    async function load() {
      const events = await fetchOtherPartyMessages(currentUserId, roomIds);
      if (cancelled) return;
      const stats = new Map<string, SessionStats>();
      for (const e of events) {
        const entry = stats.get(e.roomId) ?? { latestAt: e.createdAt, unreadCount: 0 };
        if (e.createdAt > entry.latestAt) entry.latestAt = e.createdAt;
        const readAt = getChatReadAt(e.roomId);
        if (!readAt || new Date(e.createdAt) > readAt) entry.unreadCount++;
        stats.set(e.roomId, entry);
      }
      setMessageStats(stats);
    }

    load();
    const id = setInterval(load, MESSAGE_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [rows, currentUserId]);

  const previewClass = (state: MsgRow["previewState"]) => {
    if (state === "alert") return "msg-preview msg-preview-alert";
    if (state === "pending") return "msg-preview msg-preview-pending";
    if (state === "empty") return "msg-preview msg-preview-empty";
    return "msg-preview";
  };

  const sortedRows = visibleRows
    .map((row) => {
      const stats = row.roomId ? messageStats.get(row.roomId) : undefined;
      const unreadCount = stats?.unreadCount ?? 0;
      const effectiveTime = stats && stats.latestAt > row.rawTime ? stats.latestAt : row.rawTime;
      const badge = row.badge + unreadCount;
      let previewText = row.previewText;
      let previewState = row.previewState;
      if (unreadCount > 0 && row.badge === 0) {
        previewText = `新着メッセージ · ${unreadCount}件`;
        previewState = "alert";
      }
      return { ...row, effectiveTime, badge, previewText, previewState };
    })
    .sort((a, b) => (a.effectiveTime > b.effectiveTime ? -1 : 1));

  return (
    <div className="msg-page">
      <div className="msg-header">
        <div className="msg-header-title">メッセージ</div>
        {visibleRows.length > 0 && (
          <div className="msg-header-count">{visibleRows.length}件</div>
        )}
      </div>

      {visibleRows.length === 0 && (
        <div className="msg-empty">
          <div className="msg-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <div className="msg-empty-title">メッセージはまだありません</div>
            <div>アンサーを送ったり、受け取ったりするとここに表示されます</div>
          </div>
        </div>
      )}

      <div className="msg-list">
        {sortedRows.map((row) => (
          <div
            key={`${row.role}-${row.roomId ?? row.sessionId}`}
            role="button"
            tabIndex={0}
            className="msg-row"
            onClick={() => row.roomId && router.push(`/chat/${row.roomId}`)}
            onKeyDown={(e) => e.key === "Enter" && row.roomId && router.push(`/chat/${row.roomId}`)}
          >
            <div
              role="button"
              tabIndex={0}
              className="msg-thumb"
              aria-label={`${row.partnerNickname}のプロフィール`}
              onClick={(e) => {
                e.stopPropagation();
                openProfile(row.partnerUserId);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  openProfile(row.partnerUserId);
                }
              }}
            >
              <Avatar
                src={row.partnerAvatarUrl}
                alt={row.partnerNickname}
                size="lg"
                isPractice={false}
              />
              <RoleMark role={row.role} />
            </div>

            <div className="msg-body">
              <div className="msg-row-top">
                <div className="msg-row-title">{row.sessionTitle}</div>
                <div className="msg-row-time">{timeAgo(row.effectiveTime)}</div>
              </div>
              <div className="msg-row-bottom">
                <div className={previewClass(row.previewState)}>{row.previewText}</div>
                {row.badge > 0 && (
                  <div className="msg-badge">{row.badge > 99 ? "99+" : row.badge}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
