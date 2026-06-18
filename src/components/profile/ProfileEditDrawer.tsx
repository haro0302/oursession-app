"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Edit2 } from "lucide-react";
import { updateProfile } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const INSTRUMENTS = ["ギター", "ベース", "ドラム", "キーボード", "ボーカル", "管楽器", "弦楽器", "その他"];
const GENRES = ["ロック", "ジャズ", "ポップ", "R&B", "ブルース", "クラシック", "フォーク", "メタル", "ソウル", "その他"];

interface Props {
  profile: Profile;
}

export default function ProfileEditDrawer({ profile }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [isPractice, setIsPractice] = useState(profile.is_practice ?? true);
  const [instruments, setInstruments] = useState<string[]>(profile.instruments ?? []);
  const [genres, setGenres] = useState<string[]>(profile.genres ?? []);
  const [artistsInput, setArtistsInput] = useState((profile.favorite_artists ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalRef.current = document.body;
    setMounted(true);
  }, []);

  function toggleChip(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function handleOpen() {
    setNickname(profile.nickname ?? "");
    setBio(profile.bio ?? "");
    setIsPractice(profile.is_practice ?? true);
    setInstruments(profile.instruments ?? []);
    setGenres(profile.genres ?? []);
    setArtistsInput((profile.favorite_artists ?? []).join(", "));
    setOpen(true);
  }

  async function handleSave() {
    if (!nickname.trim() || saving) return;
    setSaving(true);
    try {
      const favoriteArtists = artistsInput
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter(Boolean);
      await updateProfile(profile.id, {
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        is_practice: isPractice,
        instruments,
        genres,
        favorite_artists: favoriteArtists,
      });
      showToast("プロフィールを更新しました");
      setOpen(false);
      router.refresh();
    } catch {
      showToast("うまく保存できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  const chipStyle = (selected: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: selected ? 600 : 400,
    cursor: "pointer",
    border: `1px solid ${selected ? "var(--red-border)" : "var(--border)"}`,
    background: selected ? "var(--red-bg)" : "transparent",
    color: selected ? "var(--red2)" : "var(--text3)",
    transition: "all 0.15s",
    userSelect: "none" as const,
  });

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="プロフィールを編集"
        style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, color: "var(--text2)", cursor: "pointer" }}
      >
        <Edit2 size={13} />
        編集
      </button>

      {open && mounted && portalRef.current && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101, background: "var(--bg2)", borderRadius: "24px 24px 0 0", border: "1px solid var(--border2)", borderBottom: "none", maxHeight: "92dvh", display: "flex", flexDirection: "column", animation: "drawerIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
            {/* ハンドル + ヘッダー */}
            <div style={{ flexShrink: 0, padding: "12px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border2)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>プロフィールを編集</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="閉じる" style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", padding: "4px", display: "flex" }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ボディ */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 100px" }}>
              {/* ニックネーム */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
                  ニックネーム <span style={{ color: "var(--red2)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={30}
                  style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "15px", color: "var(--text)", outline: "none", WebkitAppearance: "none" }}
                />
              </div>

              {/* 自己紹介 */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
                  自己紹介 <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意）</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="好きな音楽や、どんなセッションがしたいかなど。"
                  maxLength={300}
                  rows={3}
                  style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.6, fontFamily: "inherit", WebkitAppearance: "none" }}
                />
              </div>

              {/* 楽器 */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>楽器</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {INSTRUMENTS.map((inst) => (
                    <span key={inst} style={chipStyle(instruments.includes(inst))} onClick={() => toggleChip(instruments, setInstruments, inst)}>
                      {inst}
                    </span>
                  ))}
                </div>
              </div>

              {/* ジャンル */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "8px" }}>好きなジャンル <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意）</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {GENRES.map((genre) => (
                    <span key={genre} style={chipStyle(genres.includes(genre))} onClick={() => toggleChip(genres, setGenres, genre)}>
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* 好きなアーティスト */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
                  好きなアーティスト <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意・カンマ区切り）</span>
                </label>
                <input
                  type="text"
                  value={artistsInput}
                  onChange={(e) => setArtistsInput(e.target.value)}
                  placeholder="例: Miles Davis, YOASOBI, くるり"
                  style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "var(--text)", outline: "none", WebkitAppearance: "none" }}
                />
              </div>

              {/* 練習中トグル */}
              <button
                type="button"
                onClick={() => setIsPractice((p) => !p)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: isPractice ? "linear-gradient(135deg, rgba(255,180,60,0.12) 0%, rgba(220,100,60,0.12) 100%)" : "var(--card)", border: `1px solid ${isPractice ? "rgba(220,130,60,0.35)" : "var(--border)"}`, borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.25s", marginBottom: "20px" }}
              >
                <span style={{ fontSize: "18px" }}>🔰</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: isPractice ? "#d4884a" : "var(--text2)" }}>練習中（セッション歓迎）</div>
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "1px" }}>初心者・練習中でもOKと伝えられます</div>
                </div>
                <div style={{ width: "40px", height: "22px", borderRadius: "11px", background: isPractice ? "linear-gradient(90deg, #f0a060, #d4704a)" : "var(--bg3)", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: "3px", left: isPractice ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
                </div>
              </button>

              {/* 保存ボタン */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!nickname.trim() || saving}
                style={{ width: "100%", background: nickname.trim() && !saving ? "var(--red)" : "var(--card)", border: nickname.trim() && !saving ? "none" : "1px solid var(--border)", borderRadius: "16px", padding: "15px", fontSize: "15px", fontWeight: 700, color: nickname.trim() && !saving ? "white" : "var(--text3)", cursor: nickname.trim() && !saving ? "pointer" : "not-allowed", transition: "background 0.3s, color 0.3s, box-shadow 0.3s", boxShadow: nickname.trim() && !saving ? "0 4px 16px rgba(232,74,95,0.35)" : "none" }}
              >
                {saving ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </>,
        portalRef.current
      )}
    </>
  );
}
