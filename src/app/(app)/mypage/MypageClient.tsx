"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Settings, ExternalLink } from "lucide-react";
import { normalizeUsername, soundcloudHref } from "@/lib/sns";
import Avatar from "@/components/ui/Avatar";
import PracticeBadge from "@/components/ui/PracticeBadge";
import SimilarUsersSlider from "@/components/mypage/SimilarUsersSlider";
import ProfileEditDrawer from "@/components/profile/ProfileEditDrawer";
import SessionCard from "@/components/session/SessionCard";
import SettingsOverlay from "@/components/overlay/SettingsOverlay";
import SavedOverlay from "@/components/overlay/SavedOverlay";
import type { SessionWithAuthor } from "@/lib/db";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  profile: Profile | null;
  ownSessions: SessionWithAuthor[];
  similarUsers: Profile[];
  userId: string;
}

const INFO_LBL: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--text3)",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  marginBottom: "9px",
};

const SECTION_LBL: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text3)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 4px 12px",
};

const HERO_BTN: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  background: "var(--card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "6px 12px",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text2)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function MypageClient({
  profile,
  ownSessions,
  similarUsers,
  userId,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [sessions, setSessions] = useState(ownSessions);

  const instruments = profile?.instruments ?? [];
  const genres = profile?.genres ?? [];
  const favoriteArtists = profile?.favorite_artists ?? [];
  const favoriteTracks = profile?.favorite_tracks ?? [];
  const sns = (profile?.sns_links ?? {}) as Record<string, string>;
  const hasSns = Object.values(sns).some((v) => !!v);
  const hasInfoCard =
    instruments.length > 0 ||
    genres.length > 0 ||
    favoriteArtists.length > 0 ||
    favoriteTracks.length > 0 ||
    !!profile?.bio ||
    hasSns;

  function handleDelete(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }

  return (
    <main style={{ padding: "0 20px 100px" }}>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "74px 0 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 左上: 保存ボタン */}
        <button
          type="button"
          onClick={() => setSavedOpen(true)}
          style={{ ...HERO_BTN, position: "absolute", top: "14px", left: "4px" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-5-7 5V3a1 1 0 0 1 1-1z" />
          </svg>
          <span>保存</span>
        </button>

        {/* 右上: 編集 + ⚙ */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {profile && <ProfileEditDrawer profile={profile} />}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="設定"
            style={{
              ...HERO_BTN,
              padding: "6px 10px",
            }}
          >
            <Settings size={13} />
          </button>
        </div>

        {/* アバター */}
        <div style={{ marginBottom: "14px" }}>
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.nickname ?? "アバター"}
            size="xl"
            ring
            isPractice={false}
          />
        </div>

        {/* ニックネーム */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.3px",
            marginBottom: "4px",
          }}
        >
          {profile?.nickname ?? "ゲスト"}
        </div>

        {/* エリア + 練習中バッジ */}
        <div
          style={{
            fontSize: "12px",
            color: "var(--text2)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {profile?.area && (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {profile.area}
            </>
          )}
          {profile?.is_practice && <PracticeBadge />}
        </div>
      </section>

      {/* INFO CARD */}
      {hasInfoCard && (
        <div
          style={{
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "0 18px",
            marginBottom: "22px",
          }}
        >
          {instruments.length > 0 && (
            <div
              style={{
                padding: "14px 0",
                borderBottom:
                  genres.length > 0 || favoriteArtists.length > 0 || favoriteTracks.length > 0 || !!profile?.bio || hasSns
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div style={INFO_LBL}>パート・楽器</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {instruments.map((inst) => (
                  <span
                    key={inst}
                    style={{
                      background: "var(--red-bg)",
                      border: "1px solid var(--red-border)",
                      borderRadius: "12px",
                      padding: "5px 11px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--red2)",
                    }}
                  >
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          )}
          {genres.length > 0 && (
            <div
              style={{
                padding: "14px 0",
                borderBottom:
                  favoriteArtists.length > 0 || favoriteTracks.length > 0 || !!profile?.bio || hasSns
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div style={INFO_LBL}>ジャンル</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {genres.map((g) => (
                  <span
                    key={g}
                    style={{
                      background: "var(--card2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "5px 11px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: "var(--text2)",
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
          {favoriteArtists.length > 0 && (
            <div
              style={{
                padding: "14px 0",
                borderBottom: favoriteTracks.length > 0 || !!profile?.bio || hasSns ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={INFO_LBL}>好きなアーティスト</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {favoriteArtists.map((a) => (
                  <span
                    key={a}
                    style={{
                      background: "var(--card2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "5px 11px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: "var(--text2)",
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {favoriteTracks.length > 0 && (
            <div
              style={{
                padding: "14px 0",
                borderBottom: !!profile?.bio || hasSns ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={INFO_LBL}>好きな曲</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {favoriteTracks.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: "var(--card2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "5px 11px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: "var(--text2)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile?.bio && (
            <div style={{ padding: "14px 0", borderBottom: hasSns ? "1px solid var(--border)" : "none" }}>
              <div style={INFO_LBL}>自己紹介</div>
              <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {profile.bio}
              </div>
            </div>
          )}
          {hasSns && (
            <div style={{ padding: "14px 0" }}>
              <div style={INFO_LBL}>SNS</div>
              <div className="sns-list">
                {sns.x && (
                  <a
                    href={`https://x.com/${normalizeUsername(sns.x)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sns-link"
                    aria-label={`Xの@${normalizeUsername(sns.x)}を新しいタブで開く`}
                  >
                    <div className="sns-icon">𝕏</div>
                    <span className="sns-username">@{normalizeUsername(sns.x)}</span>
                    <ExternalLink size={11} className="sns-external" />
                  </a>
                )}
                {sns.instagram && (
                  <a
                    href={`https://instagram.com/${normalizeUsername(sns.instagram)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sns-link"
                    aria-label={`Instagramの@${normalizeUsername(sns.instagram)}を新しいタブで開く`}
                  >
                    <div className="sns-icon">📷</div>
                    <span className="sns-username">@{normalizeUsername(sns.instagram)}</span>
                    <ExternalLink size={11} className="sns-external" />
                  </a>
                )}
                {sns.soundcloud && (
                  <a
                    href={soundcloudHref(sns.soundcloud)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sns-link"
                    aria-label={`${profile?.nickname ?? ""}のSoundCloudを新しいタブで開く`}
                  >
                    <div className="sns-icon">☁️</div>
                    <span className="sns-username">{profile?.nickname ?? ""}のSoundCloudへ</span>
                    <ExternalLink size={11} className="sns-external" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 似ている人スライダー */}
      <section style={{ marginBottom: "24px" }}>
        <div style={SECTION_LBL}>
          {profile?.nickname
            ? `${profile.nickname}さんのプロフィールと似ている人`
            : "似ている人"}
        </div>
        <SimilarUsersSlider users={similarUsers} />
      </section>

      {/* 自分のセッションカード */}
      <section style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 4px 12px" }}>
          <span style={SECTION_LBL as CSSProperties}>セッションカード</span>
          <span style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500 }}>
            {sessions.length}
          </span>
        </div>
        {sessions.length === 0 ? (
          <div
            style={{
              background: "var(--card)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px dashed var(--border2)",
              borderRadius: "16px",
              padding: "30px 20px",
              textAlign: "center",
              color: "var(--text3)",
              fontSize: "13px",
            }}
          >
            まだセッションカードがありません
          </div>
        ) : (
          <div>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isOwn
                variant="mypage"
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* オーバーレイ */}
      <SavedOverlay
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        currentUserId={userId}
      />
      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentUserId={userId}
      />
    </main>
  );
}
