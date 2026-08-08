"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { Settings, ExternalLink } from "lucide-react";
import { normalizeUsername, soundcloudHref } from "@/lib/sns";
import { BookmarkIcon, PinIcon } from "@/components/icons/CustomIcons";
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
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--red)",
  marginBottom: "9px",
};

const SECTION_LBL: CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--red)",
  margin: "0 4px 12px",
};

const TAG_STYLE: CSSProperties = {
  height: "37px",
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid var(--border-solid)",
  borderRadius: "10px",
  background: "var(--tag-solid)",
  color: "var(--accent-light)",
  fontSize: "13px",
};

const HERO_BTN: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  height: "32px",
  background: "transparent",
  border: "1px solid var(--accent-muted)",
  borderRadius: "16px",
  padding: "0 8.5px",
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--accent-muted)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function MypageClient({
  profile,
  ownSessions,
  similarUsers,
  userId,
}: Props) {
  const router = useRouter();
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
          style={{ ...HERO_BTN, position: "absolute", top: "14px", left: "4px", padding: "0 12.5px" }}
        >
          <BookmarkIcon size={14} />
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
              padding: "0 9px",
            }}
          >
            <Settings size={15} />
          </button>
        </div>

        {/* アバター + 練習中バッジ */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.nickname ?? "アバター"}
            size="xl"
            isPractice={false}
          />
          {profile?.is_practice && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "-12.5px",
                transform: "translateX(-50%)",
              }}
            >
              <PracticeBadge />
            </div>
          )}
        </div>

        {/* ニックネーム */}
        <div
          style={{
            fontSize: "23px",
            fontWeight: 700,
            color: "var(--red)",
            letterSpacing: "-0.3px",
            marginBottom: "4px",
          }}
        >
          {profile?.nickname ?? "ゲスト"}
        </div>

        {/* エリア */}
        {profile?.area && (
          <div
            style={{
              fontSize: "13px",
              color: "var(--accent-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4.5px",
            }}
          >
            <PinIcon size={16} />
            {profile.area}
          </div>
        )}
      </section>

      {/* INFO CARD */}
      {hasInfoCard && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "19px",
            background: "var(--card-solid)",
            border: "1px solid var(--border-solid)",
            borderRadius: "12px",
            padding: "22px 18px",
            marginBottom: "22px",
          }}
        >
          {instruments.length > 0 && (
            <div>
              <div style={INFO_LBL}>パート・楽器</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {instruments.map((inst) => (
                  <span key={inst} style={TAG_STYLE}>
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          )}
          {genres.length > 0 && (
            <div>
              <div style={INFO_LBL}>ジャンル</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {genres.map((g) => (
                  <span key={g} style={TAG_STYLE}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
          {favoriteArtists.length > 0 && (
            <div>
              <div style={INFO_LBL}>好きなアーティスト</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {favoriteArtists.map((a) => (
                  <span key={a} style={TAG_STYLE}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {favoriteTracks.length > 0 && (
            <div>
              <div style={INFO_LBL}>好きな曲</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {favoriteTracks.map((t) => (
                  <span key={t} style={TAG_STYLE}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile?.bio && (
            <div>
              <div style={INFO_LBL}>自己紹介</div>
              <div style={{ fontSize: "13px", color: "var(--accent-light)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {profile.bio}
              </div>
            </div>
          )}
          {hasSns && (
            <div>
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
          <span style={{ fontSize: "13px", color: "var(--accent-muted)", fontWeight: 700 }}>
            {sessions.length}
          </span>
        </div>
        {sessions.length === 0 ? (
          <button
            type="button"
            onClick={() => router.push("/post")}
            style={{
              width: "100%",
              background: "var(--card)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px dashed var(--border2)",
              borderRadius: "16px",
              padding: "30px 20px",
              textAlign: "center",
              color: "var(--text3)",
              fontSize: "13px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            まだセッションカードがありません
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
