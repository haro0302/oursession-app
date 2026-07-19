"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Send, MoreHorizontal, Flag, Ban, Trash2, Pencil } from "lucide-react";
import AudioPlayer from "@/components/ui/AudioPlayer";
import Avatar from "@/components/ui/Avatar";
import PracticeBadge from "@/components/ui/PracticeBadge";
import { useProfile } from "@/contexts/ProfileContext";
import { createClient } from "@/lib/supabase";
import { deleteAudio } from "@/lib/storage";
import type { Session, Profile } from "@/types/database";

interface SessionCardProps {
  session: Session & { author: Profile };
  onAnswer?: (session: Session) => void;
  onSave?: (sessionId: string) => void;
  onReport?: (userId: string, nickname: string, sessionId: string) => void;
  onBlock?: (userId: string, nickname: string) => void;
  onDelete?: (sessionId: string) => void;
  isSaved?: boolean;
  listeningCount?: number;
  isOwn?: boolean;
  variant?: "timeline" | "mypage" | "profile";
}

export default function SessionCard({
  session,
  onAnswer,
  onSave,
  onReport,
  onBlock,
  onDelete,
  isSaved = false,
  listeningCount,
  isOwn = false,
  variant = "timeline",
}: SessionCardProps) {
  const router = useRouter();
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { openProfile } = useProfile();

  function handleEdit() {
    setMenuOpen(false);
    router.push(`/post?edit=${session.id}`);
  }

  const author = session.author;

  function handleSave() {
    setSaved((s) => !s);
    onSave?.(session.id);
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!window.confirm("この投稿を削除しますか？\n\n削除すると元に戻せません。")) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      await supabase.from("sessions").delete().eq("id", session.id);
      if (session.audio_url) {
        await deleteAudio(session.audio_url);
      }
      onDelete?.(session.id);
    } catch {
      setDeleting(false);
    }
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
        position: "relative",
        opacity: deleting ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* マイページ variant: 右上 ⋯（削除のみ） */}
      {isOwn && variant === "mypage" && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="カードメニュー"
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px",
              color: "var(--text3)",
              zIndex: 2,
            }}
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 50 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  right: "12px",
                  zIndex: 51,
                  background: "var(--bg2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  minWidth: "130px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <button
                  type="button"
                  onClick={handleEdit}
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
                    fontFamily: "inherit",
                  }}
                >
                  <Pencil size={13} />
                  編集する
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
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
                    fontFamily: "inherit",
                  }}
                >
                  <Trash2 size={13} />
                  削除する
                </button>
              </div>
            </>
          )}
        </>
      )}

      <div style={{ padding: "14px 16px 12px", paddingRight: (isOwn && variant === "mypage") || (!isOwn && variant === "profile") ? "40px" : "16px" }}>
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
          peaks={session.waveform_peaks}
        />
      </div>

      {session.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 16px 14px",
            background: "var(--bg2)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {variant !== "mypage" && (
            <div style={{ fontSize: "10px", color: "var(--text3)", fontWeight: 600, letterSpacing: "0.3px", marginBottom: "7px" }}>
              セッションアンサー希望
            </div>
          )}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
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
        </div>
      )}

      {/* 他人のカード: フッター（アバター・名前・保存・⋯・アンサー）— timeline/default variant */}
      {!isOwn && variant !== "profile" && (
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
          <button
            type="button"
            onClick={() => openProfile(author.id)}
            aria-label={`${author.nickname}のプロフィールを見る`}
            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
          >
            <Avatar src={author.avatar_url} alt={author.nickname} size="sm" isPractice={false} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "80px",
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

          {/* ⋯ メニューボタン（他人のカード: 通報/ブロック） */}
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
                    fontFamily: "inherit",
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
                    fontFamily: "inherit",
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
        </div>
      )}

      {/* 他人のカード: 右上⋯ + フッター（保存・アンサー）— profile variant */}
      {!isOwn && variant === "profile" && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="メニュー"
            style={{
              position: "absolute", top: "12px", right: "12px",
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "4px", color: "var(--text3)", zIndex: 2,
            }}
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{
                position: "absolute", top: "36px", right: "12px", zIndex: 51,
                background: "var(--bg2)", border: "1px solid var(--border2)",
                borderRadius: "14px", overflow: "hidden", minWidth: "148px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onReport?.(author.id, author.nickname, session.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "9px", width: "100%",
                    padding: "12px 14px", background: "transparent", border: "none",
                    borderBottom: "1px solid var(--border)", cursor: "pointer",
                    fontSize: "13px", color: "var(--text2)", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <Flag size={13} />
                  通報する
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onBlock?.(author.id, author.nickname); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "9px", width: "100%",
                    padding: "12px 14px", background: "transparent", border: "none",
                    cursor: "pointer", fontSize: "13px", color: "var(--red2)", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <Ban size={13} />
                  ブロックする
                </button>
              </div>
            </>
          )}

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px 12px", borderTop: "1px solid var(--border)",
          }}>
            <button
              type="button"
              onClick={handleSave}
              aria-label={saved ? "保存済み" : "保存する"}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "4px", color: saved ? "var(--red2)" : "var(--text3)",
                transition: "color 0.18s",
              }}
            >
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => onAnswer?.(session)}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: "var(--red)", border: "none", borderRadius: "14px",
                padding: "7px 14px", fontSize: "12px", fontWeight: 700, color: "white",
                cursor: "pointer", boxShadow: "0 3px 10px rgba(232,74,95,0.35)",
                transition: "transform 0.15s", flexShrink: 0,
              }}
            >
              <Send size={13} strokeWidth={2.4} />
              <span>アンサー</span>
            </button>
          </div>
        </>
      )}

      {/* 自分のカード: フッター（アバター + 名前 + 練習中バッジ + ⋯メニュー）— timeline variant のみ */}
      {isOwn && variant !== "mypage" && (
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
          <button
            type="button"
            onClick={() => router.push("/mypage")}
            aria-label="マイページを見る"
            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
          >
            <Avatar src={author.avatar_url} alt={author.nickname} size="sm" isPractice={false} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "80px",
              }}
            >
              {author.nickname}
            </span>
            {author.is_practice && <PracticeBadge mini />}
          </div>

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
                  minWidth: "130px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <button
                  type="button"
                  onClick={handleEdit}
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
                    fontFamily: "inherit",
                  }}
                >
                  <Pencil size={13} />
                  編集する
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
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
                    fontFamily: "inherit",
                  }}
                >
                  <Trash2 size={13} />
                  削除する
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
