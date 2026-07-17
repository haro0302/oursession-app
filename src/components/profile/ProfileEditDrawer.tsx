"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Edit2, Camera, Plus, X } from "lucide-react";
import { updateProfile } from "@/lib/db";
import { uploadAvatar } from "@/lib/avatar-upload";
import { useProfileStore } from "@/store/profileStore";
import { showToast } from "@/components/ui/Toast";
import { PREFECTURES } from "@/lib/constants/prefectures";
import FilterSheet from "@/components/session/FilterSheet";
import type { Profile } from "@/types/database";

interface Props {
  profile: Profile;
}

const MAX_TAGS = 10;
const MAX_BIO = 150;

export default function ProfileEditDrawer({ profile }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  // フィールド
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isPractice, setIsPractice] = useState(true);
  const [bio, setBio] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [area, setArea] = useState("");
  const [snsX, setSnsX] = useState("");
  const [snsIg, setSnsIg] = useState("");
  const [snsCloud, setSnsCloud] = useState("");

  // FilterSheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filterSheetKey, setFilterSheetKey] = useState<"instrument" | "genre">("instrument");

  // タグ入力
  const [artistInputOpen, setArtistInputOpen] = useState(false);
  const [artistInput, setArtistInput] = useState("");
  const artistInputRef = useRef<HTMLInputElement>(null);
  const [trackInputOpen, setTrackInputOpen] = useState(false);
  const [trackInput, setTrackInput] = useState("");
  const trackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (artistInputOpen) artistInputRef.current?.focus();
  }, [artistInputOpen]);

  useEffect(() => {
    if (trackInputOpen) trackInputRef.current?.focus();
  }, [trackInputOpen]);

  function handleOpen() {
    const sns = (profile.sns_links ?? {}) as Record<string, string>;
    setNickname(profile.nickname ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
    setIsPractice(profile.is_practice ?? true);
    setBio(profile.bio ?? "");
    setInstruments(profile.instruments ?? []);
    setGenres(profile.genres ?? []);
    setArtists(profile.favorite_artists ?? []);
    setTracks((profile.favorite_tracks as string[] | null) ?? []);
    setArea(profile.area ?? "");
    setSnsX(sns.x ?? "");
    setSnsIg(sns.instagram ?? "");
    setSnsCloud(sns.soundcloud ?? "");
    setArtistInputOpen(false);
    setArtistInput("");
    setTrackInputOpen(false);
    setTrackInput("");
    setFilterSheetOpen(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setFilterSheetOpen(false);
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarUploading(true);
    const result = await uploadAvatar(file, profile.id, avatarUrl);
    setAvatarUploading(false);
    if ("error" in result) { showToast(result.error); return; }
    setAvatarUrl(result.url);
  }

  async function handleSave() {
    if (!nickname.trim()) { showToast("ニックネームを入力してください"); return; }
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        nickname: nickname.trim(),
        is_practice: isPractice,
        bio: bio.trim() || null,
        instruments,
        genres,
        favorite_artists: artists,
        favorite_tracks: tracks,
        area: area || null,
        sns_links: { x: snsX.trim(), instagram: snsIg.trim(), soundcloud: snsCloud.trim() },
        avatar_url: avatarUrl,
      });
      // ストアを即時更新（router.refresh() 完了を待たずに反映）
      useProfileStore.getState().refetch(profile.id);
      showToast("プロフィールを更新しました");
      setOpen(false);
      router.refresh();
    } catch {
      showToast("うまく保存できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  function openFilterSheet(key: "instrument" | "genre") {
    setFilterSheetKey(key);
    setFilterSheetOpen(true);
  }

  function addArtist(val: string) {
    const v = val.trim();
    if (!v || artists.includes(v) || v.length > 30) return;
    setArtists((prev) => [...prev, v]);
  }

  function addTrack(val: string) {
    const v = val.trim();
    if (!v || tracks.includes(v) || v.length > 30) return;
    setTracks((prev) => [...prev, v]);
  }

  function commitArtistInput() {
    addArtist(artistInput);
    setArtistInput("");
    setArtistInputOpen(false);
  }

  function commitTrackInput() {
    addTrack(trackInput);
    setTrackInput("");
    setTrackInputOpen(false);
  }

  return (
    <>
      {/* トリガーボタン */}
      <button type="button" onClick={handleOpen} aria-label="プロフィールを編集" className="pe-edit-btn">
        <Edit2 size={13} />
        編集
      </button>

      {/* 非表示ファイル input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarSelect}
        aria-label="写真を選択"
        className="pe-file-input"
      />

      {/* 背景 */}
      <div className={`pe-backdrop${open ? " open" : ""}`} onClick={handleClose} />

      {/* ドロワー本体 (always-in-DOM) */}
      <div className={`pe-drawer${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="プロフィール編集">
        <div className="pe-handle" />

        {/* ヘッダー */}
        <div className="pe-header">
          <button type="button" className="pe-header-btn" onClick={handleClose}>
            キャンセル
          </button>
          <span className="pe-title">プロフィール編集</span>
          <button
            type="button"
            className="pe-header-btn save"
            onClick={handleSave}
            disabled={saving || !nickname.trim()}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>

        {/* ボディ */}
        <div className="pe-body">

          {/* アバター + ニックネーム */}
          <div className="pe-section">
            <div className="pe-avatar-block">
              <div className="pe-avatar-wrap">
                <div
                  className="pe-avatar"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  aria-label="写真を変更"
                >
                  {avatarUploading ? (
                    <span className="pe-avatar-uploading">送信中…</span>
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="アバター" />
                  ) : (
                    <span className="pe-avatar-placeholder">🎵</span>
                  )}
                </div>
                <div
                  className="pe-avatar-edit"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  aria-label="写真を変更"
                >
                  <Camera size={12} color="white" />
                </div>
              </div>
              <div className="pe-name-wrap">
                <input
                  type="text"
                  className="pe-name-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={30}
                  placeholder="ニックネーム"
                />
              </div>
            </div>
          </div>

          {/* 練習中トグル */}
          <button
            type="button"
            className="pe-toggle-row"
            onClick={() => setIsPractice((p) => !p)}
            aria-pressed={isPractice ? "true" : "false"}
          >
            <div className="pe-toggle-info">
              <div className="pe-toggle-title">
                🔰 練習中（セッション歓迎）
                {isPractice && <span className="pe-beginner-badge">ON</span>}
              </div>
              <div className="pe-toggle-sub">初心者・練習中でもOKと伝えられます</div>
            </div>
            <div className={`pe-switch${isPractice ? " on" : ""}`} />
          </button>

          {/* 自己紹介 */}
          <div className="pe-section">
            <div className="pe-section-label">
              自己紹介
              <span className="pe-section-hint">任意・{MAX_BIO}字以内</span>
            </div>
            <div className="pe-textarea-wrap">
              <textarea
                className="pe-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                placeholder="楽器歴・好きな音楽・セッションでやりたいことなど"
                rows={3}
              />
              <span className={`pe-counter${bio.length > MAX_BIO ? " over" : ""}`}>
                {bio.length} / {MAX_BIO}
              </span>
            </div>
          </div>

          {/* 楽器 */}
          <div className="pe-section">
            <div className="pe-section-label">楽器</div>
            <div className="pe-tag-grid">
              {instruments.map((inst) => (
                <span key={inst} className="pe-tag">
                  {inst}
                  <span className="pe-tag-x" onClick={() => setInstruments((p) => p.filter((v) => v !== inst))}>
                    <X size={10} color="var(--red2)" />
                  </span>
                </span>
              ))}
              <button
                type="button"
                className="pe-tag-add"
                onClick={() => openFilterSheet("instrument")}
              >
                <Plus size={11} />
                追加
              </button>
            </div>
          </div>

          {/* ジャンル */}
          <div className="pe-section">
            <div className="pe-section-label">好きなジャンル</div>
            <div className="pe-tag-grid">
              {genres.map((g) => (
                <span key={g} className="pe-tag">
                  {g}
                  <span className="pe-tag-x" onClick={() => setGenres((p) => p.filter((v) => v !== g))}>
                    <X size={10} color="var(--red2)" />
                  </span>
                </span>
              ))}
              <button
                type="button"
                className="pe-tag-add"
                onClick={() => openFilterSheet("genre")}
              >
                <Plus size={11} />
                追加
              </button>
            </div>
          </div>

          {/* 好きなアーティスト */}
          <div className="pe-section">
            <div className="pe-section-label">
              好きなアーティスト
              <span className="pe-section-hint">任意・最大{MAX_TAGS}件</span>
            </div>
            <div className="pe-tag-grid">
              {artists.map((a) => (
                <span key={a} className="pe-tag">
                  {a}
                  <span className="pe-tag-x" onClick={() => setArtists((p) => p.filter((v) => v !== a))}>
                    <X size={10} color="var(--red2)" />
                  </span>
                </span>
              ))}
              {!artistInputOpen && (
                <button
                  type="button"
                  className="pe-tag-add"
                  onClick={() => setArtistInputOpen(true)}
                  disabled={artists.length >= MAX_TAGS}
                >
                  <Plus size={11} />
                  追加
                </button>
              )}
            </div>
            {artistInputOpen && (
              <div className="pe-suggest-wrap">
                <div className="pe-suggest-input-wrap">
                  <input
                    ref={artistInputRef}
                    type="text"
                    className="pe-suggest-input"
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitArtistInput(); } if (e.key === "Escape") { setArtistInputOpen(false); setArtistInput(""); } }}
                    onBlur={commitArtistInput}
                    placeholder="アーティスト名を入力して Enter"
                    maxLength={30}
                  />
                  <div className="pe-suggest-close" onClick={() => { setArtistInputOpen(false); setArtistInput(""); }}>
                    <X size={12} color="var(--text3)" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 好きな曲 */}
          <div className="pe-section">
            <div className="pe-section-label">
              好きな曲
              <span className="pe-section-hint">任意・最大{MAX_TAGS}件</span>
            </div>
            <div className="pe-tag-grid">
              {tracks.map((t) => (
                <span key={t} className="pe-tag">
                  {t}
                  <span className="pe-tag-x" onClick={() => setTracks((p) => p.filter((v) => v !== t))}>
                    <X size={10} color="var(--red2)" />
                  </span>
                </span>
              ))}
              {!trackInputOpen && (
                <button
                  type="button"
                  className="pe-tag-add"
                  onClick={() => setTrackInputOpen(true)}
                  disabled={tracks.length >= MAX_TAGS}
                >
                  <Plus size={11} />
                  追加
                </button>
              )}
            </div>
            {trackInputOpen && (
              <div className="pe-suggest-wrap">
                <div className="pe-suggest-input-wrap">
                  <input
                    ref={trackInputRef}
                    type="text"
                    className="pe-suggest-input"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitTrackInput(); } if (e.key === "Escape") { setTrackInputOpen(false); setTrackInput(""); } }}
                    onBlur={commitTrackInput}
                    placeholder="曲名を入力して Enter"
                    maxLength={30}
                  />
                  <div className="pe-suggest-close" onClick={() => { setTrackInputOpen(false); setTrackInput(""); }}>
                    <X size={12} color="var(--text3)" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* エリア */}
          <div className="pe-section">
            <div className="pe-section-label">エリア</div>
            <div className="pe-select-wrap">
              <select
                className="pe-select"
                aria-label="エリアを選択"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
                <option value="その他">その他</option>
              </select>
              <div className="pe-select-chevron" />
            </div>
          </div>

          {/* SNS */}
          <div className="pe-section">
            <div className="pe-section-label">
              SNS連携
              <span className="pe-section-hint">任意</span>
            </div>
            <div className="pe-sns-block">
              <div className="pe-sns-row">
                <div className="pe-sns-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.257 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="pe-sns-input"
                  value={snsX}
                  onChange={(e) => setSnsX(e.target.value)}
                  placeholder="X (Twitter) ユーザー名"
                />
              </div>
              <div className="pe-sns-row">
                <div className="pe-sns-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="pe-sns-input"
                  value={snsIg}
                  onChange={(e) => setSnsIg(e.target.value)}
                  placeholder="Instagram ユーザー名"
                />
              </div>
              <div className="pe-sns-row">
                <div className="pe-sns-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="pe-sns-input"
                  value={snsCloud}
                  onChange={(e) => setSnsCloud(e.target.value)}
                  placeholder="SoundCloud ユーザー名"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FilterSheet を portal でdocument.bodyに逃がす (pe-drawerのbackdrop-filterがposition:fixedを閉じ込めるため) */}
      {mounted && createPortal(
        <FilterSheet
          open={filterSheetOpen}
          filterKey={filterSheetKey}
          selected={filterSheetKey === "instrument" ? instruments : genres}
          onToggle={(opt) => {
            if (filterSheetKey === "instrument") {
              setInstruments((prev) => prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]);
            } else {
              setGenres((prev) => prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]);
            }
          }}
          onClear={() => {
            if (filterSheetKey === "instrument") setInstruments([]);
            else setGenres([]);
          }}
          onClose={() => setFilterSheetOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
