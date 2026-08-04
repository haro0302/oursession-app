"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { upsertSchedulePollResponse } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/time";
import type { SchedulePollWithResponses } from "@/app/chat/[answerId]/page";
import type { Database, ScheduleAnswerValue } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CYCLE: ScheduleAnswerValue[] = ["ok", "maybe", "no"];

function formatCandidateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = WEEKDAYS[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day}(${wd}) ${hh}:${mm}〜`;
}

function markStyle(value: ScheduleAnswerValue | undefined): { label: string; color: string; background: string; border: string } {
  if (value === "ok") {
    return { label: "○", color: "var(--red2)", background: "rgba(181,89,60,0.04)", border: "1px solid var(--red-border)" };
  }
  if (value === "maybe") {
    return { label: "△", color: "var(--text2)", background: "var(--card2)", border: "1px solid var(--border)" };
  }
  if (value === "no") {
    return { label: "×", color: "var(--text3)", background: "var(--card2)", border: "1px solid var(--border)" };
  }
  return { label: "－", color: "var(--text3)", background: "transparent", border: "1px dashed var(--border)" };
}

interface Props {
  poll: SchedulePollWithResponses;
  members: ProfileRow[];
  currentUserId: string;
}

export default function SchedulePollCard({ poll, members, currentUserId }: Props) {
  const creator = members.find((m) => m.id === poll.created_by);
  const hasSubmitted = !!poll.responses[currentUserId];
  const [isEditing, setIsEditing] = useState(!hasSubmitted);
  const [draft, setDraft] = useState<Record<string, ScheduleAnswerValue>>(
    poll.responses[currentUserId] ?? {}
  );
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Object.keys(draft).length > 0 && !submitting;

  function cycle(candidateId: string) {
    setDraft((prev) => {
      const current = prev[candidateId];
      const index = current ? CYCLE.indexOf(current) : -1;
      const next = CYCLE[(index + 1) % CYCLE.length];
      return { ...prev, [candidateId]: next };
    });
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await upsertSchedulePollResponse({
        poll_id: poll.id,
        answer_id: poll.answer_id,
        user_id: currentUserId,
        answers: draft,
      });
      showToast("回答しました🎵");
      setIsEditing(false);
    } catch {
      showToast("うまく送れませんでした\n電波の届く場所で、もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        margin: "12px 0 0",
        padding: "14px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* ヘッド */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div
          style={{
            width: "30px", height: "30px", borderRadius: "9px",
            background: "linear-gradient(135deg, var(--red-bg), rgba(181,89,60,0.04))",
            border: "1px solid var(--red-border)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <CalendarClock size={15} color="var(--red2)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>日程投票</div>
          <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "1px" }}>
            {creator?.nickname ?? "だれか"}さんが提案 · {timeAgo(poll.created_at)}
          </div>
        </div>
      </div>

      {/* グリッド */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "fit-content" }}>
          {/* 列ヘッダー: メンバーアバター */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "110px", flexShrink: 0 }} />
            {members.map((m) => (
              <div key={m.id} style={{ width: "34px", flexShrink: 0, display: "flex", justifyContent: "center" }}>
                <Avatar src={m.avatar_url} alt={m.nickname} size="sm" />
              </div>
            ))}
          </div>

          {/* 候補行 */}
          {poll.candidates.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "110px", flexShrink: 0, fontSize: "11.5px", fontWeight: 600,
                color: "var(--text)", lineHeight: 1.4, paddingRight: "6px",
              }}>
                {formatCandidateLabel(c.iso)}
              </div>
              {members.map((m) => {
                const isMe = m.id === currentUserId;
                const value = isMe ? draft[c.id] : poll.responses[m.id]?.[c.id];
                const answered = isMe ? true : !!poll.responses[m.id];
                const style = markStyle(value);

                if (!answered) {
                  return (
                    <div key={m.id} style={{ width: "34px", flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      <div style={{ fontSize: "9px", color: "var(--text3)" }}>…</div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} style={{ width: "34px", flexShrink: 0, display: "flex", justifyContent: "center" }}>
                    <button
                      type="button"
                      disabled={!isMe || !isEditing}
                      onClick={() => cycle(c.id)}
                      style={{
                        width: "30px", height: "30px", borderRadius: "9px",
                        color: style.color, background: style.background, border: style.border,
                        fontSize: "13px", fontWeight: 700,
                        cursor: isMe && isEditing ? "pointer" : "default",
                        fontFamily: "inherit",
                      }}
                    >
                      {style.label}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 未回答メンバーの案内 */}
      {members.some((m) => m.id !== currentUserId && !poll.responses[m.id]) && (
        <div style={{ fontSize: "10.5px", color: "var(--text3)", marginTop: "10px" }}>
          「…」の人はまだ考え中です
        </div>
      )}

      {/* アクション */}
      <div style={{ marginTop: "12px" }}>
        {isEditing ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%", padding: "10px", borderRadius: "12px",
              fontSize: "13px", fontWeight: 600, cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              background: canSubmit ? "var(--red)" : "var(--card2)",
              border: canSubmit ? "1px solid var(--red)" : "1px solid var(--border)",
              color: canSubmit ? "white" : "var(--text3)",
              
            }}
          >
            {submitting ? "送信中…" : hasSubmitted ? "更新する" : "回答する"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              width: "100%", padding: "10px", borderRadius: "12px",
              fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text2)",
            }}
          >
            回答を変える
          </button>
        )}
      </div>
    </div>
  );
}
