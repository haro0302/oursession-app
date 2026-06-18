"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { registerAuthGateOpener } from "@/lib/auth-gate";

type DrawerState = "idle" | "sending" | "sent" | "error";

interface AuthGateDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthGateDrawer({ open, onClose }: AuthGateDrawerProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<DrawerState>("idle");
  const [canResend, setCanResend] = useState(false);
  const resendTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || state === "sending") return;
    setState("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[AuthGate] signInWithOtp error:", error.status, error.message);
      setState("error");
    } else {
      setState("sent");
      setCanResend(false);
      resendTimer.current = setTimeout(() => setCanResend(true), 10000);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setCanResend(false);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    resendTimer.current = setTimeout(() => setCanResend(true), 10000);
  }

  function handleClose() {
    setState("idle");
    setEmail("");
    clearTimeout(resendTimer.current);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 100,
        }}
      />

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
          padding: "0 24px 48px",
          animation: "drawerIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--border2)",
            }}
          />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="閉じる"
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            background: "transparent",
            border: "none",
            color: "var(--text3)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} />
        </button>

        {state !== "sent" ? (
          <>
            <div style={{ marginTop: "12px", marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "6px",
                  lineHeight: 1.3,
                }}
              >
                続けるには、メールで確認するだけ
              </div>
              <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.6 }}>
                パスワード不要。メールアドレスだけで始められます。
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレスを入力"
                autoComplete="email"
                inputMode="email"
                style={{
                  width: "100%",
                  background: "var(--bg3)",
                  border: "1px solid var(--border2)",
                  borderRadius: "12px",
                  padding: "13px 16px",
                  fontSize: "16px",
                  color: "var(--text)",
                  outline: "none",
                  marginBottom: state === "error" ? "10px" : "12px",
                  WebkitAppearance: "none",
                }}
              />

              {state === "error" && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#d4884a",
                    marginBottom: "12px",
                    lineHeight: 1.4,
                  }}
                >
                  うまく送れませんでした。もう一度お試しください。
                </div>
              )}

              <button
                type="submit"
                disabled={!email || state === "sending"}
                style={{
                  width: "100%",
                  background:
                    email && state !== "sending" ? "var(--red)" : "var(--card2)",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color:
                    email && state !== "sending" ? "white" : "var(--text3)",
                  cursor:
                    email && state !== "sending" ? "pointer" : "not-allowed",
                  transition: "background 0.25s, color 0.25s, box-shadow 0.25s",
                  boxShadow:
                    email && state !== "sending"
                      ? "0 4px 16px rgba(232,74,95,0.35)"
                      : "none",
                }}
              >
                {state === "sending" ? "送信中…" : "メールで続ける"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📧</div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              メールをご確認ください
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text2)",
                lineHeight: 1.7,
                marginBottom: "28px",
              }}
            >
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {email}
              </span>
              <br />
              にリンクを送りました。
              <br />
              届いたメールのリンクをタップしてください。
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "13px",
                color: canResend ? "var(--red2)" : "var(--text3)",
                cursor: canResend ? "pointer" : "default",
                textDecoration: canResend ? "underline" : "none",
                padding: "4px",
              }}
            >
              {canResend ? "もう一度送る" : "しばらくお待ちください…"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function AuthGateRegistrar({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    registerAuthGateOpener(onOpen);
  }, [onOpen]);
  return null;
}
