"use client";

import { useState, useRef } from "react";
import { Send, User } from "lucide-react";
import AudioUploader from "@/components/audio/AudioUploader";
import { insertAnswer } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { SessionWithAuthor } from "@/lib/db";

interface Props {
  open: boolean;
  onClose: () => void;
  session: SessionWithAuthor;
  currentUserId: string;
  onSuccess?: (sessionId: string) => void;
}

export default function AnswerDrawer({ open, onClose, session, currentUserId, onSuccess }: Props) {
  const answerId = useRef(crypto.randomUUID()).current;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[] | null>(null);
  const [message, setMessage] = useState("");
  const [messageFocused, setMessageFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!audioUrl && message.trim().length > 0 && message.length <= 150 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !audioUrl) return;
    setSubmitting(true);
    try {
      await insertAnswer({
        id: answerId,
        session_id: session.id,
        sender_id: currentUserId,
        audio_url: audioUrl,
        waveform_peaks: waveformPeaks,
        message: message.trim(),
      });
      showToast("あなたの音、届きました🎵\n相手が聴いてくれたら、メッセージでつながれます。");
      onSuccess?.(session.id);
      resetAndClose();
    } catch (e) {
      if (e instanceof Error && e.message === "DUPLICATE_ANSWER") {
        showToast("このカードには、もうアンサーを送っています🎵");
        onSuccess?.(session.id);
        resetAndClose();
        return;
      }
      showToast("うまく送れませんでした。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  function resetAndClose() {
    setAudioUrl(null);
    setWaveformPeaks(null);
    setMessage("");
    setMessageFocused(false);
    setSubmitting(false);
    onClose();
  }

  function handleClose() {
    const isDirty = !!audioUrl || message.length > 0;
    if (isDirty) {
      if (!confirm("入力内容を破棄しますか?")) return;
    }
    resetAndClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          zIndex: 70,
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 85,
          background: "rgba(20,20,26,0.97)",
          backdropFilter: "blur(32px) saturate(1.4)",
          WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          borderTop: "1px solid var(--border2)",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88%",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Handle */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: "8px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--text3)", opacity: 0.4 }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 18px 14px",
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent", border: "none",
              fontSize: "14px", color: "var(--text2)", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", padding: "6px 2px", minWidth: "60px",
            }}
          >
            キャンセル
          </button>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
            アンサーを送る
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? "var(--red)" : "var(--card2)",
              color: canSubmit ? "white" : "var(--text3)",
              border: canSubmit ? "1px solid var(--red)" : "1px solid var(--border)",
              borderRadius: "16px", padding: "7px 16px",
              fontSize: "13px", fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "inherit", transition: "all 0.2s",
              display: "inline-flex", alignItems: "center", gap: "5px",
              boxShadow: canSubmit ? "0 4px 14px rgba(232,74,95,0.4)" : "none",
            }}
          >
            <Send size={13} />
            <span>{submitting ? "送信中…" : "送信"}</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 48px" }}>

          {/* Answer target card */}
          <div style={{ position: "relative", marginLeft: "14px", marginBottom: "20px" }}>
            <div style={{
              position: "absolute", left: "-14px", top: "13px",
              fontSize: "18px", color: "var(--red2)", fontWeight: 300, lineHeight: 1,
            }}>↳</div>
            <div style={{
              background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--red-border)", borderRadius: "16px",
              padding: "13px 14px 13px 16px",
            }}>
              <div style={{
                fontSize: "9px", fontWeight: 700, color: "var(--red2)",
                letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px",
              }}>アンサー先</div>
              <div style={{
                fontSize: "14px", fontWeight: 700, color: "var(--text)",
                lineHeight: 1.3, marginBottom: "3px",
              }}>{session.title}</div>
              <div style={{
                fontSize: "11px", color: "var(--text3)",
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <User size={11} />
                <span>{session.author.nickname} さん</span>
              </div>
            </div>
          </div>

          {/* Audio section */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: "var(--text3)",
              letterSpacing: "0.8px", textTransform: "uppercase",
              margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>あなたの演奏音源</span>
              <span style={{ color: "var(--red2)", fontSize: "9px", letterSpacing: "0.5px" }}>
                必須・90秒/5MBまで
              </span>
            </div>
            <AudioUploader
              userId={currentUserId}
              sessionId={answerId}
              onUploaded={(url, peaks) => { setAudioUrl(url); setWaveformPeaks(peaks ?? null); }}
              onRemoved={() => { setAudioUrl(null); setWaveformPeaks(null); }}
            />
          </div>

          {/* Message section */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{
              fontSize: "10px", fontWeight: 700, color: "var(--text3)",
              letterSpacing: "0.8px", textTransform: "uppercase",
              margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>一言メッセージ</span>
              <span style={{ color: "var(--red2)", fontSize: "9px", letterSpacing: "0.5px" }}>
                必須・150字以内
              </span>
            </div>
            <div style={{
              position: "relative",
              background: "var(--card)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${messageFocused ? "var(--red-border)" : "var(--border)"}`,
              borderRadius: "16px", padding: "13px 16px 26px",
              transition: "border-color 0.18s",
            }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setMessageFocused(true)}
                onBlur={() => setMessageFocused(false)}
                placeholder="どんな思いでこの曲をやりたいか、自分の演奏のアピールなどを書いてみよう。"
                maxLength={150}
                style={{
                  width: "100%", background: "transparent", border: "none", outline: "none",
                  color: "var(--text)", fontFamily: "inherit", fontSize: "14px",
                  lineHeight: 1.6, minHeight: "110px", resize: "none",
                  WebkitAppearance: "none",
                }}
              />
              <div style={{
                position: "absolute", bottom: "6px", right: "12px",
                fontSize: "10px", fontWeight: 500,
                color: message.length > 150 ? "var(--red)" : "var(--text3)",
              }}>
                {message.length} / 150
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
