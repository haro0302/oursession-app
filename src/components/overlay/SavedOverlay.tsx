"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { addSave, removeSave } from "@/lib/db";
import SessionCard from "@/components/session/SessionCard";
import { useBlockStore } from "@/store/blockStore";
import type { SessionWithAuthor } from "@/lib/db";
import type { Database } from "@/types/database";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function SavedOverlay({ open, onClose, currentUserId }: Props) {
  const { blockedIds } = useBlockStore();
  const [sessions, setSessions] = useState<SessionWithAuthor[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    (async () => {
      const [savesResult, answersResult] = await Promise.all([
        supabase.from("saves").select("session_id").eq("user_id", currentUserId),
        supabase.from("answers").select("session_id").eq("sender_id", currentUserId),
      ]);
      const savesRaw = savesResult.data;
      const ids = (savesRaw as { session_id: string }[] | null)?.map((s) => s.session_id) ?? [];
      setSavedIds(ids);
      setAnsweredIds(
        new Set(
          (answersResult.data as { session_id: string }[] | null)?.map((a) => a.session_id) ?? []
        )
      );
      if (ids.length === 0) { setSessions([]); setLoading(false); return; }

      const { data: sessionsRaw } = await supabase
        .from("sessions")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });
      const rawSessions = (sessionsRaw as SessionRow[] | null) ?? [];

      const authorIds = [...new Set(rawSessions.map((s) => s.author_id))];
      const { data: profilesRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", authorIds);
      const profileMap = new Map(
        ((profilesRaw as Profile[] | null) ?? []).map((p) => [p.id, p])
      );

      const withAuthor = rawSessions
        .map((s) => {
          const author = profileMap.get(s.author_id);
          if (!author) return null;
          return { ...s, author };
        })
        .filter((s): s is SessionWithAuthor => s !== null);

      setSessions(withAuthor);
      setLoading(false);
    })();
  }, [open, currentUserId]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handleSave(sessionId: string) {
    const isSaved = savedIds.includes(sessionId);
    if (isSaved) {
      removeSave(currentUserId, sessionId);
      setSavedIds((prev) => prev.filter((id) => id !== sessionId));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } else {
      addSave(currentUserId, sessionId);
      setSavedIds((prev) => [...prev, sessionId]);
    }
  }

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
          zIndex: 69,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* スライドパネル */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#15151a",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
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
              background: "var(--card)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} color="var(--text)" />
          </button>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", flex: 1 }}>
            保存したカード
          </div>
          {!loading && sessions.length > 0 && (
            <div style={{ fontSize: "13px", color: "var(--text3)", fontWeight: 500 }}>
              {sessions.length}件
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 80px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "160px",
                    background: "var(--card)",
                    borderRadius: "18px",
                    border: "1px solid var(--border)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
            </div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "240px",
                gap: "12px",
                color: "var(--text3)",
                textAlign: "center",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-5-7 5V3a1 1 0 0 1 1-1z" />
              </svg>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>保存したカードはありません</div>
              <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                タイムラインでブックマークした音源がここに表示されます
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {sessions.filter((s) => !blockedIds.has(s.author_id)).map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isSaved={savedIds.includes(session.id)}
                  hasAnswered={answeredIds.has(session.id)}
                  onSave={handleSave}
                  isOwn={session.author_id === currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
