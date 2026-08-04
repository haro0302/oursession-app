"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { insertReport } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

const CATEGORIES = [
  "スパム・宣伝",
  "不適切な内容",
  "誹謗中傷・嫌がらせ",
  "著作権侵害",
  "なりすまし",
  "その他",
];

interface Props {
  open: boolean;
  onClose: () => void;
  reporterId: string;
  targetUserId: string;
  targetSessionId?: string;
}

export default function ReportDrawer({ open, onClose, reporterId, targetUserId, targetSessionId }: Props) {
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalRef.current = document.body;
    setMounted(true);
  }, []);

  function handleClose() {
    setCategory("");
    setComment("");
    setSubmitting(false);
    onClose();
  }

  async function handleSubmit() {
    if (!category || submitting) return;
    setSubmitting(true);
    try {
      await insertReport({
        reporter_id: reporterId,
        reported_user_id: targetUserId,
        reported_session_id: targetSessionId ?? null,
        category,
        comment: comment.trim() || null,
      });
      showToast("通報を受け付けました\n運営が確認のうえ、適切に対応します。");
      handleClose();
    } catch {
      showToast("うまく送れませんでした。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  const canSubmit = !!category && !submitting;

  if (!open || !mounted || !portalRef.current) return null;

  return createPortal(
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
        {/* ハンドル + ヘッダー */}
        <div style={{ flexShrink: 0, padding: "12px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border2)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>通報する</span>
            <button type="button" onClick={handleClose} aria-label="閉じる" style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", padding: "4px", display: "flex" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ボディ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 100px" }}>
          {/* プライバシーノーティス */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "rgba(232,150,80,0.10)", border: "1px solid rgba(232,150,80,0.30)", borderRadius: "12px", padding: "12px 14px", marginBottom: "20px" }}>
            <AlertTriangle size={16} style={{ color: "var(--amber, #e88c5a)", flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.6, margin: 0 }}>
              あなたが通報したことは相手には伝わりません
            </p>
          </div>

          {/* カテゴリ */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "10px" }}>
              通報の理由 <span style={{ color: "var(--red2)" }}>*</span>
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 14px",
                      borderRadius: "12px",
                      border: `1px solid ${selected ? "var(--red-border, rgba(181,89,60,0.32))" : "var(--border)"}`,
                      background: selected ? "var(--red-bg, rgba(181,89,60,0.10))" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${selected ? "var(--red2)" : "var(--border2)"}`,
                      background: selected ? "var(--red2)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {selected && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "white" }} />}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: selected ? 600 : 400, color: selected ? "var(--red2)" : "var(--text2)" }}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* コメント */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>
              補足 <span style={{ color: "var(--text3)", fontWeight: 400 }}>（任意）</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="補足があれば"
              maxLength={300}
              rows={3}
              style={{ width: "100%", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.6, fontFamily: "inherit", WebkitAppearance: "none" }}
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ width: "100%", background: canSubmit ? "var(--red)" : "var(--card)", border: canSubmit ? "none" : "1px solid var(--border)", borderRadius: "16px", padding: "15px", fontSize: "15px", fontWeight: 700, color: canSubmit ? "white" : "var(--text3)", cursor: canSubmit ? "pointer" : "not-allowed", transition: "background 0.3s, color 0.3s" }}
          >
            {submitting ? "送信中…" : "通報する"}
          </button>
        </div>
      </div>
    </>,
    portalRef.current
  );
}
