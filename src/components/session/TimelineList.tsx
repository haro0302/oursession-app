"use client";

import { useState, useRef } from "react";
import SessionCard from "./SessionCard";
import AnswerDrawer from "@/components/answer/AnswerDrawer";
import ReportDrawer from "@/components/report/ReportDrawer";
import BlockConfirmDrawer from "@/components/report/BlockConfirmDrawer";
import { openAuthGate } from "@/lib/auth-gate";
import { addSave, removeSave } from "@/lib/db";
import { useBlockStore } from "@/store/blockStore";
import type { SessionWithAuthor } from "@/lib/db";
import type { Session } from "@/types/database";

interface Props {
  sessions: SessionWithAuthor[];
  savedIds: string[];
  answeredIds: string[];
  currentUserId: string | null;
}

type ReportTarget = { userId: string; nickname: string; sessionId: string };
type BlockTarget = { userId: string; nickname: string };

export default function TimelineList({ sessions, savedIds, answeredIds, currentUserId }: Props) {
  const { blockedIds } = useBlockStore();
  const [saves, setSaves] = useState<Set<string>>(new Set(savedIds));
  const [answered, setAnswered] = useState<Set<string>>(new Set(answeredIds));
  const [answerTarget, setAnswerTarget] = useState<SessionWithAuthor | null>(null);
  const lastAnswerSession = useRef<SessionWithAuthor | null>(null);
  if (answerTarget) lastAnswerSession.current = answerTarget;
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const visibleSessions = sessions.filter(
    (s) => !blockedIds.has(s.author_id) && !deletedIds.has(s.id)
  );

  async function handleSave(sessionId: string) {
    if (!currentUserId) { openAuthGate(); return; }
    const wasSaved = saves.has(sessionId);
    setSaves((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
    if (wasSaved) await removeSave(currentUserId, sessionId);
    else await addSave(currentUserId, sessionId);
  }

  function handleAnswer(session: Session) {
    if (!currentUserId) { openAuthGate(); return; }
    if (answered.has(session.id)) return;
    const full = sessions.find((s) => s.id === session.id);
    if (full) setAnswerTarget(full);
  }

  function handleAnswered(sessionId: string) {
    setAnswered((prev) => new Set(prev).add(sessionId));
  }

  function handleReport(userId: string, nickname: string, sessionId: string) {
    if (!currentUserId) { openAuthGate(); return; }
    setReportTarget({ userId, nickname, sessionId });
  }

  function handleBlock(userId: string, nickname: string) {
    if (!currentUserId) { openAuthGate(); return; }
    setBlockTarget({ userId, nickname });
  }

  function handleDelete(sessionId: string) {
    setDeletedIds((prev) => new Set(prev).add(sessionId));
  }

  if (visibleSessions.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "12px", color: "var(--text3)", fontSize: "13px", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
          🎵
        </div>
        <div>
          <div style={{ color: "var(--text2)", fontWeight: 600, marginBottom: "4px" }}>もうすぐ音源が届きます</div>
          <div>気になる人の音源を聴いて、セッション仲間を探しましょう。</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {visibleSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onAnswer={handleAnswer}
            onSave={handleSave}
            onReport={handleReport}
            onBlock={handleBlock}
            onDelete={session.author_id === currentUserId ? handleDelete : undefined}
            isSaved={saves.has(session.id)}
            hasAnswered={answered.has(session.id)}
            isOwn={session.author_id === currentUserId}
          />
        ))}
      </div>

      {currentUserId && lastAnswerSession.current && (
        <AnswerDrawer
          open={!!answerTarget}
          session={lastAnswerSession.current}
          currentUserId={currentUserId}
          onClose={() => setAnswerTarget(null)}
          onSuccess={handleAnswered}
        />
      )}

      {currentUserId && reportTarget && (
        <ReportDrawer
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reporterId={currentUserId}
          targetUserId={reportTarget.userId}
          targetSessionId={reportTarget.sessionId}
        />
      )}

      {currentUserId && blockTarget && (
        <BlockConfirmDrawer
          open={!!blockTarget}
          onClose={() => setBlockTarget(null)}
          currentUserId={currentUserId}
          targetUserId={blockTarget.userId}
          targetNickname={blockTarget.nickname}
          onBlocked={() => setBlockTarget(null)}
        />
      )}
    </>
  );
}
