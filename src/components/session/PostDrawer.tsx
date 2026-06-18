"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import AudioUploader from "@/components/audio/AudioUploader";
import { insertSession } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  isPracticeDefault: boolean;
}

export default function PostDrawer({ open, onClose, userId, isPracticeDefault }: Props) {
  const router = useRouter();
  const sessionId = useRef(crypto.randomUUID()).current;

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPractice, setIsPractice] = useState(isPracticeDefault);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!audioUrl && title.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !audioUrl) return;
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(/[,、]/)
        .map((t) => t.trim())
        .filter(Boolean);

      await insertSession({
        id: sessionId,
        author_id: userId,
        title: title.trim(),
        body: body.trim() || null,
        audio_url: audioUrl,
        is_practice: isPractice,
        tags,
      });

      showToast("あなたの音、届きました🎵\n仲間が見つかったらお知らせします。");
      handleClose();
      router.refresh();
    } catch {
      showToast("うまく送れませんでした。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  function handleClose() {
    setAudioUrl(null);
    setTitle("");
    setBody("");
    setTagsInput("");
    setIsPractice(isPracticeDefault);
    setSubmitting(false);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          background: "var(--bg2)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid var(--border2)",
          borderBottom: "none",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          animation: "drawerIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {/* Handle + header */}
        <div style={{ flexShrink: 0, padding: "12px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border2)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>音源を投稿する</span>
            <button type="button" onClick={handleClose} aria-label="閉じる" style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", padding: "4px", display: "flex" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 100px" }}>
          {/* 公開範囲の明示（CLAUDE.md §4 必須） */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(126,200,138,0.06)", border: "1px solid rgba(126,200,138,0.2)", borderRadius: "10px", padding: "8px 12px", marginBottom: "16px", fontSize: "11px", color: "#7ec88a", fontWeight: 500 }}>
            <span>🔒</span>
            <span>公開範囲: 全員 ／ 足あとは残りません</span>
          </div>

          {/* Audio uploader */}
          <div style={{ marginBottom: "20px" }}>
            <AudioUploader
              userId={userId}
              sessionId={sessionId}
              onUploaded={setAudioUrl}
            />
          </div>

          {/* Title */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
              タイトル <span style={{ color: "var(--red2)" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ジャズセッション相手を探しています"
              maxLength={60}
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "15px", color: "var(--text)", outline: "none", WebkitAppearance: "none" }}
            />
          </div>

          {/* Body */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
              ひとこと <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意）</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="どんなセッションがしたいか、気軽に書いてみてください。"
              maxLength={300}
              rows={3}
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.6, WebkitAppearance: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
              タグ <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意・カンマ区切り）</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ジャズ, ギター, 初心者歓迎"
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "var(--text)", outline: "none", WebkitAppearance: "none" }}
            />
          </div>

          {/* 練習中トグル */}
          <button
            type="button"
            onClick={() => setIsPractice((p) => !p)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: isPractice ? "linear-gradient(135deg, rgba(255,180,60,0.12) 0%, rgba(220,100,60,0.12) 100%)" : "var(--card)", border: `1px solid ${isPractice ? "rgba(220,130,60,0.35)" : "var(--border)"}`, borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: "all 0.25s", marginBottom: "20px" }}
          >
            <span style={{ fontSize: "18px" }}>🔰</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: isPractice ? "#d4884a" : "var(--text2)" }}>練習中（セッション歓迎）</div>
              <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "1px" }}>初心者・練習中でもOKと伝えられます</div>
            </div>
            <div style={{ width: "40px", height: "22px", borderRadius: "11px", background: isPractice ? "linear-gradient(90deg, #f0a060, #d4704a)" : "var(--bg3)", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: "3px", left: isPractice ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
            </div>
          </button>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ width: "100%", background: canSubmit ? "var(--red)" : "var(--card)", border: canSubmit ? "none" : "1px solid var(--border)", borderRadius: "16px", padding: "15px", fontSize: "15px", fontWeight: 700, color: canSubmit ? "white" : "var(--text3)", cursor: canSubmit ? "pointer" : "not-allowed", transition: "background 0.3s, color 0.3s, box-shadow 0.3s", boxShadow: canSubmit ? "0 4px 16px rgba(232,74,95,0.35)" : "none" }}
          >
            {submitting ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </div>
    </>
  );
}
