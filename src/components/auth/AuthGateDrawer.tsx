"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { registerAuthGateOpener } from "@/lib/auth-gate";
import { showToast } from "@/components/ui/Toast";
import { insertProfilePrivate } from "@/lib/db";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type ViewState = "age" | "options" | "email" | "code";

const MIN_AGE = 18;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 101 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calcAge(birthDateStr: string): number {
  const today = new Date();
  const birth = new Date(birthDateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface AuthGateDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthGateDrawer({ open, onClose }: AuthGateDrawerProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("age");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [consent, setConsent] = useState(false);
  const [ageError, setAgeError] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const resendTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const birthDate = birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : "";
  const maxDay = birthYear && birthMonth ? daysInMonth(Number(birthYear), Number(birthMonth)) : 31;
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  useEffect(() => {
    if (!open) {
      clearTimeout(resendTimer.current);
      const t = setTimeout(() => {
        setView("age");
        setBirthYear("");
        setBirthMonth("");
        setBirthDay("");
        setConsent(false);
        setAgeError(false);
        setEmail("");
        setSending(false);
        setHasError(false);
        setCanResend(false);
        setCode("");
        setVerifying(false);
        setCodeError(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleAgeContinue() {
    if (!birthDate || !consent) return;
    if (calcAge(birthDate) < MIN_AGE) {
      setAgeError(true);
      return;
    }
    setAgeError(false);
    setView("options");
  }

  async function handleGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?birth_date=${encodeURIComponent(birthDate)}`,
      },
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
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setHasError(true);
      setSending(false);
    } else {
      setSending(false);
      setCanResend(false);
      setCode("");
      setCodeError(false);
      setView("code");
      resendTimer.current = setTimeout(() => setCanResend(true), 10000);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setCanResend(false);
    setCodeError(false);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({ email });
    resendTimer.current = setTimeout(() => setCanResend(true), 10000);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setCodeError(false);

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.user) {
      setCodeError(true);
      setVerifying(false);
      return;
    }

    await insertProfilePrivate({ user_id: data.user.id, birth_date: birthDate });

    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", data.user.id)
      .maybeSingle();
    const profile = profileRaw as Pick<ProfileRow, "onboarded_at"> | null;

    onClose();
    if (!profile?.onboarded_at) {
      router.push("/onboarding");
    } else {
      router.push("/timeline?welcome=returning");
    }
    router.refresh();
  }

  return (
    <>
      <div
        className={`auth-backdrop${open ? " open" : ""}`}
        onClick={onClose}
      />
      <div className={`auth-drawer${open ? " open" : ""}`}>
        <div className="auth-handle" />

        {view === "age" ? (
          <div className="auth-hero">
            <div className="auth-hero-icon">
              <ShieldCheck size={24} color="var(--red2)" />
            </div>
            <div className="auth-hero-title">はじめる前に</div>
            <div className="auth-hero-sub">
              本サービスは対面でのセッションにつながるサービスです。ご利用には年齢確認と規約への同意をお願いしています。
            </div>
          </div>
        ) : (
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
        )}

        {view === "age" && (
          <div className="auth-email-form">
            <div>
              <div style={{ fontSize: "12px", color: "var(--text3)", fontWeight: 600, marginBottom: "6px" }}>
                生年月日
              </div>
              <div className="age-date-row">
                <div className="age-date-wrap">
                  <select
                    className="age-date-select"
                    value={birthYear}
                    onChange={(e) => {
                      const y = e.target.value;
                      setBirthYear(y);
                      setAgeError(false);
                      if (y && birthMonth && birthDay) {
                        const max = daysInMonth(Number(y), Number(birthMonth));
                        if (Number(birthDay) > max) setBirthDay("");
                      }
                    }}
                  >
                    <option value="" disabled>年</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                  <span className="age-date-chevron" />
                </div>
                <div className="age-date-wrap">
                  <select
                    className="age-date-select"
                    value={birthMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setBirthMonth(m);
                      setAgeError(false);
                      if (birthYear && m && birthDay) {
                        const max = daysInMonth(Number(birthYear), Number(m));
                        if (Number(birthDay) > max) setBirthDay("");
                      }
                    }}
                  >
                    <option value="" disabled>月</option>
                    {MONTH_OPTIONS.map((m) => {
                      const v = String(m).padStart(2, "0");
                      return <option key={v} value={v}>{m}</option>;
                    })}
                  </select>
                  <span className="age-date-chevron" />
                </div>
                <div className="age-date-wrap">
                  <select
                    className="age-date-select"
                    value={birthDay}
                    onChange={(e) => { setBirthDay(e.target.value); setAgeError(false); }}
                  >
                    <option value="" disabled>日</option>
                    {dayOptions.map((d) => {
                      const v = String(d).padStart(2, "0");
                      return <option key={v} value={v}>{d}</option>;
                    })}
                  </select>
                  <span className="age-date-chevron" />
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text3)", lineHeight: 1.6, marginTop: "6px" }}>
                生年月日は年齢確認にのみ使用し、プロフィールには表示されません。
              </div>
            </div>

            <label className="age-consent-row">
              <input
                type="checkbox"
                className="age-consent-checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="age-consent-text">
                <Link href="/terms" target="_blank" rel="noopener noreferrer">利用規約</Link>
                および
                <Link href="/privacy" target="_blank" rel="noopener noreferrer">プライバシーポリシー</Link>
                に同意します
              </span>
            </label>

            {ageError && (
              <div className="auth-email-error">
                本サービスは対面でのセッションを前提とするため、18歳以上の方のみご利用いただけます。
              </div>
            )}

            <button
              type="button"
              className={`auth-btn${birthYear && birthMonth && birthDay && consent ? " primary" : ""}`}
              disabled={!birthYear || !birthMonth || !birthDay || !consent}
              onClick={handleAgeContinue}
            >
              次へ
            </button>
          </div>
        )}

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

        {view === "code" && (
          <div className="auth-sent">
            <div className="auth-sent-emoji">📧</div>
            <div className="auth-sent-title">コードを確認してください</div>
            <div className="auth-sent-body">
              <span className="auth-sent-email">{email}</span><br />
              に6桁のコードを送りました。<br />
              届いたコードを入力してください。
            </div>
            <form className="auth-email-form" onSubmit={handleCodeSubmit}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="auth-input auth-code-input"
                placeholder="6桁のコード"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setCodeError(false);
                }}
              />
              {codeError && (
                <div className="auth-email-error">
                  コードが違うか、期限切れのようです。もう一度お試しください。
                </div>
              )}
              <button
                type="submit"
                className={`auth-btn${code.length === 6 && !verifying ? " primary" : ""}`}
                disabled={code.length !== 6 || verifying}
              >
                {verifying ? "確認中…" : "確認する"}
              </button>
            </form>
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
