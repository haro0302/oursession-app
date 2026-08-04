"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, MoreHorizontal, ExternalLink } from "lucide-react";
import { normalizeUsername, soundcloudHref } from "@/lib/sns";
import { createClient } from "@/lib/supabase";
import PracticeBadge from "@/components/ui/PracticeBadge";
import AudioPlayer from "@/components/ui/AudioPlayer";
import ReportDrawer from "@/components/report/ReportDrawer";
import BlockConfirmDrawer from "@/components/report/BlockConfirmDrawer";
import AnswerDrawer from "@/components/answer/AnswerDrawer";
import SessionCard from "@/components/session/SessionCard";
import { addSave, removeSave, removeBlock } from "@/lib/db";
import { openAuthGate } from "@/lib/auth-gate";
import { useBlockStore } from "@/store/blockStore";
import type { SessionWithAuthor } from "@/lib/db";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Session = Database["public"]["Tables"]["sessions"]["Row"];

interface Props {
  userId: string | null;
  onClose: () => void;
  currentUserId: string | null;
}

const INFO_LBL: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--text3)",
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  marginBottom: "9px",
};

export default function ProfileOverlay({ userId, onClose, currentUserId }: Props) {
  const blockStore = useBlockStore();
  const isBlocked = !!userId && blockStore.blockedIds.has(userId);
  const [unblocking, setUnblocking] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const [saves, setSaves] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [answerTarget, setAnswerTarget] = useState<SessionWithAuthor | null>(null);
  const lastAnswerSession = useRef<SessionWithAuthor | null>(null);
  if (answerTarget) lastAnswerSession.current = answerTarget;
  type CardReport = { userId: string; nickname: string; sessionId: string };
  type CardBlock = { userId: string; nickname: string };
  const [cardReport, setCardReport] = useState<CardReport | null>(null);
  const [cardBlock, setCardBlock] = useState<CardBlock | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setSessions([]);
      setSaves(new Set());
      setAnswered(new Set());
      return;
    }
    setLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("sessions").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
      currentUserId
        ? supabase.from("saves").select("session_id").eq("user_id", currentUserId)
        : Promise.resolve({ data: [] }),
      currentUserId
        ? supabase.from("answers").select("session_id").eq("sender_id", currentUserId)
        : Promise.resolve({ data: [] }),
    ]).then(([profileRes, sessionsRes, savesRes, answersRes]) => {
      setProfile((profileRes.data as Profile | null) ?? null);
      setSessions((sessionsRes.data as Session[] | null) ?? []);
      const savedIds = ((savesRes.data as { session_id: string }[] | null) ?? []).map((s) => s.session_id);
      setSaves(new Set(savedIds));
      const answeredIds = ((answersRes.data as { session_id: string }[] | null) ?? []).map((a) => a.session_id);
      setAnswered(new Set(answeredIds));
      setLoading(false);
    });
  }, [userId]);

  // ESCキーで閉じる
  useEffect(() => {
    if (!userId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [userId, onClose]);

  const isOpen = !!userId;
  const isOwnProfile = !!currentUserId && currentUserId === userId;

  async function handleSave(sessionId: string) {
    if (!currentUserId) { openAuthGate(); return; }
    const wasSaved = saves.has(sessionId);
    setSaves((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(sessionId); else next.add(sessionId);
      return next;
    });
    if (wasSaved) await removeSave(currentUserId, sessionId);
    else await addSave(currentUserId, sessionId);
  }

  function handleAnswer(session: Session) {
    if (!currentUserId) { openAuthGate(); return; }
    if (answered.has(session.id)) return;
    const full = sessions.find((s) => s.id === session.id);
    if (full && profile) setAnswerTarget({ ...full, author: profile });
  }

  function handleAnswered(sessionId: string) {
    setAnswered((prev) => new Set(prev).add(sessionId));
  }

  function handleCardReport(uId: string, nickname: string, sessionId: string) {
    if (!currentUserId) { openAuthGate(); return; }
    setCardReport({ userId: uId, nickname, sessionId });
  }

  function handleCardBlock(uId: string, nickname: string) {
    if (!currentUserId) { openAuthGate(); return; }
    setCardBlock({ userId: uId, nickname });
  }

  async function handleUnblock() {
    if (!currentUserId || !userId || !profile) return;
    setUnblocking(true);
    try {
      await removeBlock(currentUserId, userId);
      blockStore.remove(userId);
    } finally {
      setUnblocking(false);
    }
  }

  const instruments = profile?.instruments ?? [];
  const genres = profile?.genres ?? [];
  const favoriteArtists = profile?.favorite_artists ?? [];
  const favoriteTracks = profile?.favorite_tracks ?? [];
  const sns = (profile?.sns_links ?? {}) as Record<string, string>;
  const hasSns = Object.values(sns).some((v) => !!v);
  const hasInfoCard = instruments.length > 0 || genres.length > 0 || favoriteArtists.length > 0 || favoriteTracks.length > 0 || !!profile?.bio || hasSns;

  return (
    <>
      {/* バックドロップ */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 60,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* スライドパネル */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#15151a",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 8px",
            position: "relative",
            zIndex: 2,
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
              background: "rgba(20,20,24,0.6)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} color="var(--text)" />
          </button>

          {currentUserId && currentUserId !== userId && (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="メニュー"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "rgba(20,20,24,0.6)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <MoreHorizontal size={18} color="var(--text2)" />
              </button>

              {menuOpen && (
                <>
                  <div
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                    style={{ position: "fixed", inset: 0, zIndex: 1 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      zIndex: 2,
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      minWidth: "148px",
                      
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setReportOpen(true); }}
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
                      通報する
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setBlockOpen(true); }}
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
                      ブロックする
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ブロック中バナー */}
        {isBlocked && currentUserId && userId && profile && (
          <div
            style={{
              margin: "0 18px 4px",
              padding: "12px 14px",
              background: "var(--red-bg)",
              border: "1px solid var(--red-border)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexShrink: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--red2)" }}>
                このユーザーをブロック中
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnblock}
              disabled={unblocking}
              style={{
                background: "transparent",
                border: "1px solid var(--red-border)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: unblocking ? "var(--text3)" : "var(--red2)",
                cursor: unblocking ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              {unblocking ? "解除中…" : "解除する"}
            </button>
          </div>
        )}

        {/* スクロールbody */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            position: "relative",
            zIndex: 1,
            paddingBottom: "80px",
          }}
        >
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* ヒーロー */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "6px 18px 24px",
                }}
              >
                {/* アバターリング */}
                <div
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "50%",
                    padding: "3px",
                    background: "linear-gradient(135deg, rgba(232,140,90,0.3), rgba(181,89,60,0.2))",
                    marginBottom: "14px",
                    flexShrink: 0,
                  }}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.nickname}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b3b46 0%, #1f1f28 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 名前 + 練習中バッジ */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>
                    {profile?.nickname ?? ""}
                  </div>
                  {profile?.is_practice && <PracticeBadge />}
                </div>

                {/* エリア */}
                {profile?.area && (
                  <div style={{ fontSize: "12px", color: "var(--text2)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {profile.area}
                  </div>
                )}
              </div>

              {/* 情報カード */}
              {hasInfoCard && (
                <div
                  style={{
                    margin: "0 18px",
                    background: "var(--card)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid var(--border)",
                    borderRadius: "20px",
                    padding: "0 18px",
                  }}
                >
                  {instruments.length > 0 && (
                    <div style={{ padding: "14px 0", borderBottom: (genres.length > 0 || favoriteArtists.length > 0 || favoriteTracks.length > 0 || !!profile?.bio || hasSns) ? "1px solid var(--border)" : "none" }}>
                      <div style={INFO_LBL}>パート・楽器</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {instruments.map((v) => (
                          <span key={v} style={{ background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: "12px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 600, color: "var(--red2)" }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {genres.length > 0 && (
                    <div style={{ padding: "14px 0", borderBottom: (favoriteArtists.length > 0 || favoriteTracks.length > 0 || !!profile?.bio || hasSns) ? "1px solid var(--border)" : "none" }}>
                      <div style={INFO_LBL}>ジャンル</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {genres.map((v) => (
                          <span key={v} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 500, color: "var(--text2)" }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {favoriteArtists.length > 0 && (
                    <div style={{ padding: "14px 0", borderBottom: (favoriteTracks.length > 0 || !!profile?.bio || hasSns) ? "1px solid var(--border)" : "none" }}>
                      <div style={INFO_LBL}>好きなアーティスト</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {favoriteArtists.map((v) => (
                          <span key={v} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 500, color: "var(--text2)" }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {favoriteTracks.length > 0 && (
                    <div style={{ padding: "14px 0", borderBottom: (!!profile?.bio || hasSns) ? "1px solid var(--border)" : "none" }}>
                      <div style={INFO_LBL}>好きな曲</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {favoriteTracks.map((v) => (
                          <span key={v} style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 500, color: "var(--text2)" }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile?.bio && (
                    <div style={{ padding: "14px 0", borderBottom: hasSns ? "1px solid var(--border)" : "none" }}>
                      <div style={INFO_LBL}>自己紹介</div>
                      <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{profile.bio}</div>
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

              {/* セッションカードセクション */}
              {!isBlocked && <div style={{ padding: "0 18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    margin: "24px 4px 12px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", letterSpacing: "0.5px", textTransform: "uppercase" as const }}>
                    セッションカード
                  </span>
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
                      fontSize: "12px",
                    }}
                  >
                    まだセッションカードがありません
                  </div>
                ) : (
                  <div>
                    {sessions.map((session) => {
                      if (!profile) return null;
                      const sessionWithAuthor: SessionWithAuthor = { ...session, author: profile };
                      return (
                        <SessionCard
                          key={session.id}
                          session={sessionWithAuthor}
                          variant={isOwnProfile ? "mypage" : "profile"}
                          isOwn={isOwnProfile}
                          isSaved={saves.has(session.id)}
                          hasAnswered={answered.has(session.id)}
                          onSave={!isOwnProfile ? handleSave : undefined}
                          onAnswer={!isOwnProfile ? handleAnswer : undefined}
                          onReport={!isOwnProfile ? handleCardReport : undefined}
                          onBlock={!isOwnProfile ? handleCardBlock : undefined}
                        />
                      );
                    })}
                  </div>
                )}
              </div>}
            </>
          )}
        </div>
      </div>

      {/* 通報ドロワー */}
      {currentUserId && userId && profile && (
        <ReportDrawer
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reporterId={currentUserId}
          targetUserId={userId}
          targetSessionId={undefined}
        />
      )}

      {/* ブロック確認ドロワー */}
      {currentUserId && userId && profile && (
        <BlockConfirmDrawer
          open={blockOpen}
          onClose={() => setBlockOpen(false)}
          currentUserId={currentUserId}
          targetUserId={userId}
          targetNickname={profile.nickname}
          onBlocked={() => {
            onClose();
          }}
        />
      )}

      {/* アンサードロワー（カードレベル） */}
      {currentUserId && lastAnswerSession.current && (
        <AnswerDrawer
          open={!!answerTarget}
          session={lastAnswerSession.current}
          currentUserId={currentUserId}
          onClose={() => setAnswerTarget(null)}
          onSuccess={handleAnswered}
        />
      )}

      {/* 通報ドロワー（カードレベル） */}
      {currentUserId && cardReport && (
        <ReportDrawer
          open={!!cardReport}
          onClose={() => setCardReport(null)}
          reporterId={currentUserId}
          targetUserId={cardReport.userId}
          targetSessionId={cardReport.sessionId}
        />
      )}

      {/* ブロック確認ドロワー（カードレベル） */}
      {currentUserId && cardBlock && (
        <BlockConfirmDrawer
          open={!!cardBlock}
          onClose={() => setCardBlock(null)}
          currentUserId={currentUserId}
          targetUserId={cardBlock.userId}
          targetNickname={cardBlock.nickname}
          onBlocked={() => {
            setCardBlock(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: "6px 18px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "var(--card2)", marginBottom: "14px", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ width: "120px", height: "24px", borderRadius: "8px", background: "var(--card2)", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ width: "80px", height: "16px", borderRadius: "6px", background: "var(--card2)", animation: "pulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </div>
  );
}
