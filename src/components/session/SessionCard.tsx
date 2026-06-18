"use client";

import { useState } from "react";
import { Bookmark, Send, MoreHorizontal, Flag, Ban } from "lucide-react";
import AudioPlayer from "@/components/ui/AudioPlayer";
import PracticeBadge from "@/components/ui/PracticeBadge";
import type { Session, Profile } from "@/types/database";

interface SessionCardProps {
  session: Session & { author: Profile };
  onAnswer?: (session: Session) => void;
  onSave?: (sessionId: string) => void;
  onReport?: (userId: string, nickname: string, sessionId: string) => void;
  onBlock?: (userId: string, nickname: string) => void;
  isSaved?: boolean;
  listeningCount?: number;
  isOwn?: boolean;
}

export default function SessionCard({
  session,
  onAnswer,
  onSave,
  onReport,
  onBlock,
  isSaved = false,
  listeningCount,
  isOwn = false,
}: SessionCardProps) {
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [menuOpen, setMenuOpen] = useState(false);

  const author = session.author;

  function handleSave() {
    setSaved((s) => !s);
    onSave?.(session.id);
  }

  const dateStr = new Date(session.created_at).toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <article
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        overflow: "hidden",
        marginBottom: "10px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ fontSize: "10px", color: "var(--text3)", fontWeight: 500, marginBottom: "4px" }}>
          {dateStr}
        </div>

        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "4px",
            lineHeight: 1.3,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {session.title}
        </div>

        {session.body && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setBodyExpanded((b) => !b)}
            onKeyDown={(e) => e.key === "Enter" && setBodyExpanded((b) => !b)}
            style={{
              fontSize: "12px",
              color: "var(--text2)",
              lineHeight: 1.6,
              marginBottom: "11px",
              cursor: "pointer",
              ...(bodyExpanded
                ? {}
                : {
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }),
            }}
          >
            {session.body}
          </div>
        )}

        <AudioPlayer
          src={session.audio_url}
          showListening={listeningCount}
        />
      </div>

      {session.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            padding: "10px 16px 14px",
            background: "var(--bg2)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {session.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "var(--card2)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "3px 9px",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--text2)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px 12px",
          borderTop: "1px solid var(--border)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {author.nickname}
          </span>
          {author.is_practice && <PracticeBadge mini />}
        </div>

        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? "保存済み" : "保存する"}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            color: saved ? "var(--red2)" : "var(--text3)",
            transition: "color 0.18s",
          }}
        >
          <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
        </button>

        {!isOwn && (
          <>
            {/* ⋯ メニューボタン */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="メニュー"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
                color: "var(--text3)",
                flexShrink: 0,
              }}
            >
              <MoreHorizontal size={16} />
            </button>

            {/* ポップアップメニュー */}
            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 50 }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 4px)",
                    right: "14px",
                    zIndex: 51,
                    background: "var(--bg2)",
                    border: "1px solid var(--border2)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    minWidth: "148px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport?.(author.id, author.nickname, session.id);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      width: "100%",
                      padding: "12px 14px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "var(--text2)",
                      textAlign: "left",
                    }}
                  >
                    <Flag size={13} />
                    通報する
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onBlock?.(author.id, author.nickname);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      width: "100%",
                      padding: "12px 14px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "var(--red2)",
                      textAlign: "left",
                    }}
                  >
                    <Ban size={13} />
                    ブロックする
                  </button>
                </div>
              </>
            )}

            {/* アンサーボタン */}
            <button
              type="button"
              onClick={() => onAnswer?.(session)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "var(--red)",
                border: "none",
                borderRadius: "14px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(232,74,95,0.35)",
                transition: "transform 0.15s",
                flexShrink: 0,
              }}
            >
              <Send size={13} strokeWidth={2.4} />
              <span>アンサー</span>
            </button>
          </>
        )}
      </div>
    </article>
  );
}
