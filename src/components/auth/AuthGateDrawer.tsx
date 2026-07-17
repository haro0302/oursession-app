"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { registerAuthGateOpener } from "@/lib/auth-gate";
import { showToast } from "@/components/ui/Toast";

type ViewState = "options" | "email" | "sent";

interface AuthGateDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthGateDrawer({ open, onClose }: AuthGateDrawerProps) {
  const [view, setView] = useState<ViewState>("options");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const resendTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      clearTimeout(resendTimer.current);
      const t = setTimeout(() => {
        setView("options");
        setEmail("");
        setSending(false);
        setHasError(false);
        setCanResend(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      showToast("Google ログインに失敗しました。もう一度お試しください。");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);
    setHasError(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setHasError(true);
      setSending(false);
    } else {
      setSending(false);
      setCanResend(false);
      setView("sent");
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

  return (
    <>
      <div
        className={`auth-backdrop${open ? " open" : ""}`}
        onClick={onClose}
      />
      <div className={`auth-drawer${open ? " open" : ""}`}>
        <div className="auth-handle" />

        <div className="auth-hero">
          <div className="auth-hero-icon">
            <UserPlus size={24} color="var(--red2)" />
          </div>
          <div className="auth-hero-title">ログインしてはじめよう</div>
          <div className="auth-hero-sub">
            音源を聴いて、気になる人にアンサーを送ろう。<br />
            仲間とスタジオに集まる第一歩はここから。
          </div>
        </div>

        {view === "options" && (
          <div className="auth-options">
            <button type="button" className="auth-btn" onClick={handleGoogle}>
              <span className="auth-btn-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                </svg>
              </span>
              <span>Googleで続ける</span>
            </button>

            <div className="auth-divider">
              <span className="auth-divider-text">または</span>
            </div>

            <button
              type="button"
              className="auth-btn"
              onClick={() => setView("email")}
            >
              <span className="auth-btn-icon">
                <Mail size={17} color="var(--text)" />
              </span>
              <span>メールで続ける</span>
            </button>
          </div>
        )}

        {view === "email" && (
          <form className="auth-email-form" onSubmit={handleEmailSubmit}>
            <input
              type="email"
              className="auth-input"
              placeholder="メールアドレスを入力"
              autoComplete="email"
              inputMode="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {hasError && (
              <div className="auth-email-error">
                うまく送れませんでした。もう一度お試しください。
              </div>
            )}
            <button
              type="submit"
              className={`auth-btn${email && !sending ? " primary" : ""}`}
              disabled={!email || sending}
            >
              {sending ? "送信中…" : "メールで続ける"}
            </button>
            <button
              type="button"
              className="auth-email-back"
              onClick={() => { setView("options"); setHasError(false); }}
            >
              ← 戻る
            </button>
          </form>
        )}

        {view === "sent" && (
          <div className="auth-sent">
            <div className="auth-sent-emoji">📧</div>
            <div className="auth-sent-title">メールをご確認ください</div>
            <div className="auth-sent-body">
              <span className="auth-sent-email">{email}</span><br />
              にリンクを送りました。<br />
              届いたメールのリンクをタップしてください。
            </div>
            <button
              type="button"
              className={`auth-sent-resend${canResend ? " active" : ""}`}
              onClick={handleResend}
              disabled={!canResend}
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
