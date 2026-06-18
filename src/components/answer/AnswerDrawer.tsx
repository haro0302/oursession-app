"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import AudioUploader from "@/components/audio/AudioUploader";
import { insertAnswer } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { SessionWithAuthor } from "@/lib/db";

interface Props {
  open: boolean;
  onClose: () => void;
  session: SessionWithAuthor;
  currentUserId: string;
}

export default function AnswerDrawer({ open, onClose, session, currentUserId }: Props) {
  const answerId = useRef(crypto.randomUUID()).current;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!audioUrl && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !audioUrl) return;
    setSubmitting(true);
    try {
      await insertAnswer({
        id: answerId,
        session_id: session.id,
        sender_id: currentUserId,
        audio_url: audioUrl,
        message: message.trim() || null,
      });
      showToast("あなたの音、届きました🎵\n相手が聴いてくれたら、メッセージでつながれます。");
      handleClose();
    } catch {
      showToast("うまく送れませんでした。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  function handleClose() {
    setAudioUrl(null);
    setMessage("");
    setSubmitting(false);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }}
      />
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
          background: "var(--bg2)", borderRadius: "24px 24px 0 0",
          border: "1px solid var(--border2)", borderBottom: "none",
          maxHeight: "92dvh", display: "flex", flexDirection: "column",
          animation: "drawerIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {/* Handle + header */}
        <div style={{ flexShrink: 0, padding: "12px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border2)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>アンサーを送る</div>
              <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                ↳ {session.title}
              </div>
            </div>
            <button type="button" onClick={handleClose} aria-label="閉じる" style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", padding: "4px", display: "flex", flexShrink: 0, marginLeft: "12px" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 100px" }}>
          <div style={{ marginBottom: "20px" }}>
            <AudioUploader
              userId={currentUserId}
              sessionId={answerId}
              onUploaded={setAudioUrl}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
              ひとこと <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意）</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="よろしくお願いします！など、気軽に書いてみてください。"
              maxLength={200}
              rows={3}
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.6, WebkitAppearance: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ width: "100%", background: canSubmit ? "var(--red)" : "var(--card)", border: canSubmit ? "none" : "1px solid var(--border)", borderRadius: "16px", padding: "15px", fontSize: "15px", fontWeight: 700, color: canSubmit ? "white" : "var(--text3)", cursor: canSubmit ? "pointer" : "not-allowed", transition: "background 0.3s, color 0.3s, box-shadow 0.3s", boxShadow: canSubmit ? "0 4px 16px rgba(232,74,95,0.35)" : "none" }}
          >
            {submitting ? "送信中…" : "アンサーを送る"}
          </button>
        </div>
      </div>
    </>
  );
}
