"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Ban, Trash2, Pencil } from "lucide-react";
import AudioPlayer from "@/components/ui/AudioPlayer";
import Avatar from "@/components/ui/Avatar";
import PracticeBadge from "@/components/ui/PracticeBadge";
import { SendIcon, NoteIcon, BookmarkIcon, MoreIcon } from "@/components/icons/CustomIcons";
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
  hasAnswered?: boolean;
  listeningCount?: number;
  isOwn?: boolean;
  variant?: "timeline" | "mypage" | "profile";
}

const menuItemStyle: React.CSSProperties = {
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
};

const menuItemDangerStyle: React.CSSProperties = {
  ...menuItemStyle,
  borderBottom: "none",
  color: "var(--red2)",
};

function MenuDropdown({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          right: "14px",
          zIndex: 51,
          background: "var(--bg2)",
          border: "1px solid var(--border2)",
          borderRadius: "14px",
          overflow: "hidden",
          minWidth: "148px",
        }}
      >
        {children}
      </div>
    </>
  );
}

export default function SessionCard({
  session,
  onAnswer,
  onSave,
  onReport,
  onBlock,
  onDelete,
  isSaved = false,
  hasAnswered = false,
  listeningCount,
  isOwn = false,
  variant = "timeline",
}: SessionCardProps) {
  const router = useRouter();
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const [bodyOverflowing, setBodyOverflowing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(isSaved);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { openProfile } = useProfile();

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setBodyOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [session.body, bodyExpanded]);

  function handleEdit() {
    setMenuOpen(false);
    router.push(`/post?edit=${session.id}`);
  }

  const author = session.author;
  const isDefaultVariant = !isOwn && variant !== "profile";

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

  function renderBody() {
    if (!session.body) return null;
    return (
      <div style={{ marginTop: "4px", position: "relative" }}>
        <div
          ref={bodyRef}
          role={bodyOverflowing ? "button" : undefined}
          tabIndex={bodyOverflowing ? 0 : undefined}
          onClick={() => bodyOverflowing && setBodyExpanded((b) => !b)}
          onKeyDown={(e) => bodyOverflowing && e.key === "Enter" && setBodyExpanded((b) => !b)}
          style={{
            fontSize: "13.4px",
            color: "var(--accent-muted)",
            lineHeight: "20px",
            cursor: bodyOverflowing ? "pointer" : "default",
            ...(bodyExpanded
              ? {}
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }),
          }}
        >
          {session.body}
        </div>
        {!bodyExpanded && bodyOverflowing && (
          <button
            type="button"
            onClick={() => setBodyExpanded(true)}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              background: "linear-gradient(to right, transparent, var(--card-solid) 20px)",
              paddingLeft: "24px",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: "20px",
              color: "var(--red)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            続きを読む
          </button>
        )}
        {bodyExpanded && bodyOverflowing && (
          <button
            type="button"
            onClick={() => setBodyExpanded(false)}
            style={{
              display: "block",
              background: "transparent",
              border: "none",
              padding: 0,
              marginTop: "2px",
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--red)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            閉じる
          </button>
        )}
      </div>
    );
  }

  function renderTags(showLabel: boolean) {
    if (session.tags.length === 0) return null;
    return (
      <>
        {showLabel && (
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--red)", fontSize: "13px", fontWeight: 700 }}>
            <NoteIcon size={14} />
            希望アンサー
          </div>
        )}
        <div style={{ marginTop: showLabel ? "10.5px" : "20px", display: "flex", gap: "5.5px", flexWrap: "wrap" }}>
          {session.tags.map((tag) => (
            <span
              key={tag}
              style={{
                height: "25px",
                padding: "0 7px",
                display: "inline-flex",
                alignItems: "center",
                background: "var(--tag-solid)",
                border: "1px solid var(--border-solid)",
                borderRadius: "6px",
                fontSize: "12px",
                color: "var(--accent-light)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </>
    );
  }

  function renderTitle() {
    return (
      <div style={{ marginTop: "11px", fontSize: "15.4px", fontWeight: 700, color: "var(--accent-light)", lineHeight: "22px" }}>
        {session.title}
      </div>
    );
  }

  function renderAnswerCta() {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "25px -18px 0 0" }}>
        <button
          type="button"
          onClick={() => !hasAnswered && onAnswer?.(session)}
          disabled={hasAnswered}
          aria-label={hasAnswered ? "アンサー済み" : "セッションアンサーを送る"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "38px",
            padding: "0 15px 0 8px",
            background: hasAnswered ? "var(--card2)" : "var(--red)",
            border: hasAnswered ? "1px solid var(--border)" : "none",
            borderRadius: "12px 0 12px 0",
            fontSize: "11px",
            fontWeight: 700,
            color: hasAnswered ? "var(--text3)" : "var(--on-accent)",
            cursor: hasAnswered ? "not-allowed" : "pointer",
            transition: "transform 0.12s",
            fontFamily: "inherit",
          }}
        >
          {hasAnswered ? <Check size={16} strokeWidth={2.4} /> : <SendIcon size={16} />}
          <span>{hasAnswered ? "アンサー済み" : "セッションアンサーを送る"}</span>
        </button>
      </div>
    );
  }

  return (
    <article
      style={{
        background: "var(--card-solid)",
        border: "1px solid var(--border-solid)",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        opacity: deleting ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* 他人のカード: 日付行 → アバター・名前・練習中バッジ・保存・⋯行 — timeline default variant */}
      {isDefaultVariant && (
        <div style={{ padding: "6px 18px 0" }}>
          <div style={{ textAlign: "right", fontSize: "13px", lineHeight: 1, color: "var(--accent-muted)" }}>
            {dateStr}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: "2px", gap: "8.5px", position: "relative" }}>
            <button
              type="button"
              onClick={() => openProfile(author.id)}
              aria-label={`${author.nickname}のプロフィールを見る`}
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
            >
              <Avatar src={author.avatar_url} alt={author.nickname} size="md" isPractice={false} />
            </button>

            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "var(--accent-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {author.nickname}
            </span>
            {author.is_practice && <PracticeBadge mini />}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "9px" }}>
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
                  padding: "3px",
                  color: saved ? "var(--red)" : "var(--accent-light)",
                  transition: "color 0.18s",
                  flexShrink: 0,
                }}
              >
                <BookmarkIcon size={20} filled={saved} />
              </button>

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
                  padding: "1px",
                  color: "var(--accent-light)",
                  flexShrink: 0,
                }}
              >
                <MoreIcon size={18} />
              </button>
            </div>

            {menuOpen && (
              <MenuDropdown onClose={() => setMenuOpen(false)}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport?.(author.id, author.nickname, session.id);
                  }}
                  style={menuItemStyle}
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
                  style={menuItemDangerStyle}
                >
                  <Ban size={13} />
                  ブロックする
                </button>
              </MenuDropdown>
            )}
          </div>

          {renderTitle()}
          {renderBody()}
          {renderTags(true)}

          <div style={{ marginTop: "24px" }}>
            <AudioPlayer
              src={session.audio_url}
              showListening={listeningCount}
              peaks={session.waveform_peaks}
              bare
            />
          </div>

          {renderAnswerCta()}
        </div>
      )}

      {/* 自分のカード: 日付行 → アバター・名前・練習中バッジ・⋯行 — timeline variant */}
      {isOwn && variant !== "mypage" && (
        <div style={{ padding: "6px 18px 20px" }}>
          <div style={{ textAlign: "right", fontSize: "13px", lineHeight: 1, color: "var(--accent-muted)" }}>
            {dateStr}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: "2px", gap: "8.5px", position: "relative" }}>
            <button
              type="button"
              onClick={() => router.push("/mypage")}
              aria-label="マイページを見る"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
            >
              <Avatar src={author.avatar_url} alt={author.nickname} size="md" isPractice={false} />
            </button>

            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "var(--accent-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {author.nickname}
            </span>
            {author.is_practice && <PracticeBadge mini />}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="メニュー"
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1px",
                color: "var(--accent-light)",
                flexShrink: 0,
              }}
            >
              <MoreIcon size={18} />
            </button>

            {menuOpen && (
              <MenuDropdown onClose={() => setMenuOpen(false)}>
                <button type="button" onClick={handleEdit} style={menuItemStyle}>
                  <Pencil size={13} />
                  編集する
                </button>
                <button type="button" onClick={handleDelete} style={menuItemDangerStyle}>
                  <Trash2 size={13} />
                  削除する
                </button>
              </MenuDropdown>
            )}
          </div>

          {renderTitle()}
          {renderBody()}
          {renderTags(true)}

          <div style={{ marginTop: "24px" }}>
            <AudioPlayer
              src={session.audio_url}
              showListening={listeningCount}
              peaks={session.waveform_peaks}
              bare
            />
          </div>
        </div>
      )}

      {/* 自分のカード: マイページ表示（アバター行は省略、日付+⋯のみ） */}
      {isOwn && variant === "mypage" && (
        <div style={{ padding: "6px 18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", position: "relative" }}>
            <span style={{ flex: 1, fontSize: "13px", lineHeight: 1, color: "var(--accent-muted)" }}>
              {dateStr}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="カードメニュー"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1px",
                color: "var(--accent-light)",
                flexShrink: 0,
              }}
            >
              <MoreIcon size={18} />
            </button>

            {menuOpen && (
              <MenuDropdown onClose={() => setMenuOpen(false)}>
                <button type="button" onClick={handleEdit} style={menuItemStyle}>
                  <Pencil size={13} />
                  編集する
                </button>
                <button type="button" onClick={handleDelete} style={menuItemDangerStyle}>
                  <Trash2 size={13} />
                  削除する
                </button>
              </MenuDropdown>
            )}
          </div>

          {renderTitle()}
          {renderBody()}
          {renderTags(false)}

          <div style={{ marginTop: "24px" }}>
            <AudioPlayer
              src={session.audio_url}
              showListening={listeningCount}
              peaks={session.waveform_peaks}
              bare
            />
          </div>
        </div>
      )}

      {/* 他人のカード: プロフィール画面表示（アバター行は省略、日付+保存+⋯） */}
      {!isOwn && variant === "profile" && (
        <div style={{ padding: "6px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", position: "relative" }}>
            <span style={{ flex: 1, fontSize: "13px", lineHeight: 1, color: "var(--accent-muted)" }}>
              {dateStr}
            </span>
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
                padding: "3px",
                color: saved ? "var(--red)" : "var(--accent-light)",
                transition: "color 0.18s",
                flexShrink: 0,
              }}
            >
              <BookmarkIcon size={20} filled={saved} />
            </button>
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
                padding: "1px",
                color: "var(--accent-light)",
                flexShrink: 0,
              }}
            >
              <MoreIcon size={18} />
            </button>

            {menuOpen && (
              <MenuDropdown onClose={() => setMenuOpen(false)}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport?.(author.id, author.nickname, session.id);
                  }}
                  style={menuItemStyle}
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
                  style={menuItemDangerStyle}
                >
                  <Ban size={13} />
                  ブロックする
                </button>
              </MenuDropdown>
            )}
          </div>

          {renderTitle()}
          {renderBody()}
          {renderTags(true)}

          <div style={{ marginTop: "24px" }}>
            <AudioPlayer
              src={session.audio_url}
              showListening={listeningCount}
              peaks={session.waveform_peaks}
              bare
            />
          </div>

          {renderAnswerCta()}
        </div>
      )}
    </article>
  );
}
