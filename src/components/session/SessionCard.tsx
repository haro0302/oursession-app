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
            <MoreIcon size={16} />
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

      {/* 他人のカード: 上部ヘッダー（日付行 → アバター・名前・練習中バッジ・保存・⋯行）— timeline variant のみ */}
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
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 50 }}
              />
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
          </div>

          {/* タイトル */}
          <div
            style={{
              marginTop: "11px",
              fontSize: "15.4px",
              fontWeight: 700,
              color: "var(--accent-light)",
              lineHeight: "22px",
            }}
          >
            {session.title}
          </div>

          {/* 本文 */}
          {session.body && (
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
          )}

          {/* 希望アンサー ラベル + タグ */}
          {session.tags.length > 0 && (
            <>
              <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--red)", fontSize: "13px", fontWeight: 700 }}>
                <NoteIcon size={14} />
                希望アンサー
              </div>
              <div style={{ marginTop: "10.5px", display: "flex", gap: "5.5px", flexWrap: "wrap" }}>
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
          )}

          {/* 音声プレイヤー */}
          <div style={{ marginTop: "24px" }}>
            <AudioPlayer
              src={session.audio_url}
              showListening={listeningCount}
              peaks={session.waveform_peaks}
              bare
            />
          </div>

          {/* アンサー送信ボタン — 右端フラッシュ */}
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
        </div>
      )}

      {/* 他のvariant: 日付・タイトル・本文・音声プレイヤー */}
      {!isDefaultVariant && (
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
      )}

      {!isDefaultVariant && session.tags.length > 0 && (
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
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--red)", fontWeight: 600, letterSpacing: "0.3px", marginBottom: "7px" }}>
              <NoteIcon size={11} />
              希望アンサー
            </div>
          )}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {session.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  background: "var(--tag-solid)",
                  border: "1px solid var(--border-solid)",
                  borderRadius: "6px",
                  padding: "3px 9px",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--accent-light)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
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
            <MoreIcon size={16} />
          </button>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div style={{
                position: "absolute", top: "36px", right: "12px", zIndex: 51,
                background: "var(--bg2)", border: "1px solid var(--border2)",
                borderRadius: "14px", overflow: "hidden", minWidth: "148px",
                
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
              <BookmarkIcon size={15} filled={saved} />
            </button>
            <button
              type="button"
              onClick={() => !hasAnswered && onAnswer?.(session)}
              disabled={hasAnswered}
              aria-label={hasAnswered ? "アンサー済み" : "アンサー"}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: hasAnswered ? "var(--card2)" : "var(--red)",
                border: hasAnswered ? "1px solid var(--border)" : "none",
                borderRadius: "14px",
                padding: "7px 14px", fontSize: "12px", fontWeight: 700,
                color: hasAnswered ? "var(--text3)" : "var(--on-accent)",
                cursor: hasAnswered ? "not-allowed" : "pointer",
                
                transition: "transform 0.15s", flexShrink: 0,
              }}
            >
              {hasAnswered ? <Check size={13} strokeWidth={2.4} /> : <SendIcon size={13} />}
              <span>{hasAnswered ? "アンサー済み" : "アンサー"}</span>
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
            <MoreIcon size={16} />
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
