"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AudioPlayer from "@/components/ui/AudioPlayer";
import Avatar from "@/components/ui/Avatar";
import PracticeBadge from "@/components/ui/PracticeBadge";
import { updateAnswerStatus, insertMessage } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { AnswerWithContext } from "@/components/notifications/NotificationsView";

interface Props {
  answers: AnswerWithContext[];
  currentUserId: string;
}

export default function IncomingAnswerList({ answers: initial, currentUserId }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initial);

  async function handleApprove(answer: AnswerWithContext) {
    await updateAnswerStatus(answer.id, "approved");
    await insertMessage({
      answer_id: answer.id,
      sender_id: currentUserId,
      body: `${answer.sender.nickname}さんと、会えそうですね🎵`,
    });
    setAnswers((prev) => prev.filter((a) => a.id !== answer.id));
    showToast(`${answer.sender.nickname}さんと、会えそうですね🎵`);
    router.push(`/chat/${answer.id}`);
  }

  async function handleDecline(answerId: string) {
    await updateAnswerStatus(answerId, "declined");
    setAnswers((prev) => prev.filter((a) => a.id !== answerId));
  }

  if (answers.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {answers.map((answer) => (
        <article
          key={answer.id}
          style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", overflow: "hidden", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div style={{ padding: "14px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Avatar
                src={answer.sender.avatar_url}
                alt={answer.sender.nickname}
                size="sm"
                isPractice={answer.sender.is_practice ?? false}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                    {answer.sender.nickname}
                  </span>
                  {answer.sender.is_practice && <PracticeBadge mini />}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "1px" }}>
                  ↳ {answer.session.title}
                </div>
              </div>
            </div>

            <AudioPlayer src={answer.audio_url} peaks={answer.waveform_peaks} />

            {answer.message && (
              <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--text2)", lineHeight: 1.6, padding: "10px 12px", background: "var(--card2)", borderRadius: "10px" }}>
                {answer.message}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", padding: "10px 14px 14px", borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => handleDecline(answer.id)}
              style={{ flex: 1, padding: "10px", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "13px", fontWeight: 600, color: "var(--text3)", cursor: "pointer" }}
            >
              断る
            </button>
            <button
              type="button"
              onClick={() => handleApprove(answer)}
              style={{ flex: 2, padding: "10px", background: "var(--red)", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer", }}
            >
              承認する
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
