"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { insertBlock } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  targetUserId: string;
  targetNickname: string;
  onBlocked: (userId: string) => void;
}

const BLOCK_NOTES = [
  "お互いの投稿やアンサーが見えなくなります",
  "メッセージのやり取りもできなくなります",
  "ブロックしたことは相手に通知されません",
  "設定からいつでも解除できます",
];

export default function BlockConfirmDrawer({ open, onClose, currentUserId, targetUserId, targetNickname, onBlocked }: Props) {
  const [blocking, setBlocking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalRef.current = document.body;
    setMounted(true);
  }, []);

  function handleClose() {
    setBlocking(false);
    onClose();
  }

  async function handleBlock() {
    if (blocking) return;
    setBlocking(true);
    try {
      await insertBlock(currentUserId, targetUserId);
      showToast(`${targetNickname}さんをブロックしました\n視界から消えます。設定から解除できます。`);
      onBlocked(targetUserId);
      handleClose();
    } catch {
      showToast("うまく処理できませんでした。もう一度お試しください。");
      setBlocking(false);
    }
  }

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
          display: "flex", flexDirection: "column",
          animation: "drawerIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {/* ハンドル + ヘッダー */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border2)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              {targetNickname}さんをブロックしますか？
            </span>
            <button type="button" onClick={handleClose} aria-label="閉じる" style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", padding: "4px", display: "flex" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ボディ */}
        <div style={{ padding: "20px 20px 32px" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {BLOCK_NOTES.map((note) => (
              <li key={note} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "var(--text2)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--text3)", flexShrink: 0, marginTop: "1px" }}>•</span>
                {note}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleClose}
              style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "13px", fontSize: "14px", fontWeight: 600, color: "var(--text2)", cursor: "pointer" }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleBlock}
              disabled={blocking}
              style={{ flex: 1, background: blocking ? "var(--card)" : "var(--red)", border: "none", borderRadius: "14px", padding: "13px", fontSize: "14px", fontWeight: 700, color: blocking ? "var(--text3)" : "white", cursor: blocking ? "not-allowed" : "pointer", boxShadow: blocking ? "none" : "0 3px 12px rgba(232,74,95,0.35)", transition: "all 0.2s" }}
            >
              {blocking ? "処理中…" : "ブロックする"}
            </button>
          </div>
        </div>
      </div>
    </>,
    portalRef.current
  );
}
