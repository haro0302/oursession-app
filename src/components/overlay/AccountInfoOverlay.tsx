"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Mail, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import DeleteAccountFlow from "./DeleteAccountFlow";

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

const CARD: React.CSSProperties = {
  background: "var(--card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border)",
  borderRadius: "18px",
  overflow: "hidden",
};

export default function AccountInfoOverlay({ open, onClose, currentUserId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const providers: string[] = (user?.app_metadata?.providers as string[] | undefined) ?? [];
  const isGoogleLinked = providers.includes("google");
  const email = user?.email ?? "—";

  return (
    <>
      {/* バックドロップ */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          zIndex: 72,
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
          zIndex: 73,
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
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>アカウント情報</div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 32px" }}>

          {/* メールアドレス */}
          <div style={{ ...CARD, padding: "16px 18px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              メールアドレス
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={14} color="var(--text2)" />
              <span style={{ fontSize: "15px", color: "var(--text)", wordBreak: "break-all" }}>{email}</span>
            </div>
          </div>

          {/* ログイン方法 */}
          <div style={{ ...CARD, marginBottom: "28px" }}>
            <div style={{ padding: "12px 18px 10px", fontSize: "11px", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ログイン方法
            </div>

            {/* Google */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>Google</div>
                {isGoogleLinked && (
                  <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>{email}</div>
                )}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: isGoogleLinked ? "#22c55e" : "var(--text3)" }}>
                {isGoogleLinked ? "連携中" : "未連携"}
              </div>
            </div>

            {/* Apple */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
              <svg width="16" height="18" viewBox="0 0 814 1000" fill="var(--text2)" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-154.4-80.7c-47.5-43-88.1-116.8-88.1-186.3 0-168.2 121.1-256.5 239.7-256.5 64.3 0 117.5 42.8 157.4 42.8 38.1 0 98.4-45.1 172.6-45.1l.4.1zM389.4 237.1c-19.1-23.2-49.6-40.6-79.2-40.6-1.6 0-3.3.1-5 .2.2 29.1 11 59.6 29.8 82.1 20.3 24.3 52.5 42.1 81.8 42.1.6 0 1.2 0 1.8-.1-.4-31.3-10-62.3-29.2-83.7z"/>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>Apple</div>
                <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>将来対応予定</div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text3)" }}>未連携</div>
            </div>
          </div>

          {/* アカウント削除 */}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 18px",
              background: "rgba(232,74,95,0.06)",
              border: "1px solid var(--red-border)",
              borderRadius: "14px",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <Trash2 size={15} color="var(--red2)" />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--red2)" }}>
              アカウントを削除する
            </span>
          </button>
        </div>
      </div>

      <DeleteAccountFlow
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        currentUserId={currentUserId}
      />
    </>
  );
}
