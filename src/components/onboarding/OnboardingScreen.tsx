"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { updateProfile } from "@/lib/db";
import { PREFECTURES } from "@/lib/constants/prefectures";
import { INSTRUMENTS } from "@/lib/constants/instruments";
import { useProfileStore } from "@/store/profileStore";

interface Props {
  userId: string;
}

export default function OnboardingScreen({ userId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [isPractice, setIsPractice] = useState(true);
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleInstrument(inst: string) {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  }

  const canNext =
    (step === 1 && nickname.trim().length > 0) ||
    (step === 2 && selectedInstruments.length > 0) ||
    (step === 3 && area !== "") ||
    step === 4;

  function dotClass(dotIndex: number): string {
    if (step === 4 || dotIndex < step) return "ob-progress-dot completed";
    if (dotIndex === step) return "ob-progress-dot active";
    return "ob-progress-dot";
  }

  async function handleFinish() {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile(userId, {
        nickname: nickname.trim(),
        instruments: selectedInstruments,
        is_practice: isPractice,
        area,
        onboarded_at: new Date().toISOString(),
      });
      await useProfileStore.getState().refetch(userId);
      showToast(
        `はじめまして、${nickname.trim()}さん🎵\nまずは気になる人の音源を聴いてみよう`
      );
      router.push("/timeline");
    } catch {
      showToast("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ob-screen">
      {/* aurora background */}
      <div className="aurora">
        <span className="blob1" />
        <span className="blob2" />
      </div>

      {/* 戻るボタン: Step 1・4 では非表示 */}
      <button
        className="ob-back"
        type="button"
        disabled={step === 1 || step === 4}
        onClick={() => setStep((s) => s - 1)}
        aria-label="戻る"
      >
        <ChevronLeft size={18} color="var(--text)" />
      </button>

      {/* 進行バー */}
      <div className="ob-progress">
        <div className={dotClass(1)} />
        <div className={dotClass(2)} />
        <div className={dotClass(3)} />
      </div>

      {/* Step 1: ニックネーム */}
      {step === 1 && (
        <div className="ob-step">
          <div className="ob-step-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 13s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <div className="ob-step-title">
            あなたを<br />何て呼べばいい？
          </div>
          <div className="ob-step-sub">
            本名でなくて大丈夫。<br />後からいつでも変えられます。
          </div>
          <div className="ob-input-wrap">
            <input
              type="text"
              className="ob-input"
              placeholder="ニックネーム"
              maxLength={20}
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nickname.trim().length > 0) {
                  setStep(2);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Step 2: 楽器 + 練習中 */}
      {step === 2 && (
        <div className="ob-step">
          <div className="ob-step-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="ob-step-title">
            どんな楽器を<br />やってる？
          </div>
          <div className="ob-step-sub">
            複数選んでOK。<br />後から追加・変更もできます。
          </div>
          <div className="ob-chip-grid">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                className={`ob-chip${selectedInstruments.includes(inst) ? " active" : ""}`}
                onClick={() => toggleInstrument(inst)}
              >
                {inst}
              </button>
            ))}
          </div>
          <div
            className="ob-toggle-row"
            role="button"
            tabIndex={0}
            onClick={() => setIsPractice((p) => !p)}
            onKeyDown={(e) => e.key === "Enter" && setIsPractice((p) => !p)}
          >
            <div className="ob-toggle-body">
              <div className="ob-toggle-title">
                <span>練習中</span>
                <span className="pe-beginner-badge">🔰 練習中</span>
              </div>
              <div className="ob-toggle-sub">
                マイペースに楽しみたい方向け。<br />「下手でいい、好きでつながる」を歓迎する印です。
              </div>
            </div>
            <div className={`pe-switch${isPractice ? " on" : ""}`} />
          </div>
        </div>
      )}

      {/* Step 3: エリア */}
      {step === 3 && (
        <div className="ob-step">
          <div className="ob-step-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="ob-step-title">
            どのエリアで<br />セッションする？
          </div>
          <div className="ob-step-sub">
            近くの仲間が見つかりやすくなります。<br />後から変えられます。
          </div>
          <div className="ob-area-grid">
            {PREFECTURES.map((pref) => (
              <button
                key={pref}
                type="button"
                className={`ob-area-chip${area === pref ? " active" : ""}`}
                onClick={() => setArea(pref)}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Welcome */}
      {step === 4 && (
        <div className="ob-step">
          <div className="ob-welcome">
            <div className="ob-welcome-icon">🎵</div>
            <div className="ob-welcome-title">
              ようこそ、<br />{nickname}さん
            </div>
            <div className="ob-welcome-sub">
              まずは気になる人の音源を聴いてみよう。<br />
              「この人と演奏したい」と思ったら、アンサーを送ってみてください。
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="ob-footer">
        <button
          type="button"
          className={`ob-next${canNext ? " ready" : ""}`}
          disabled={!canNext || saving}
          onClick={step === 4 ? handleFinish : () => setStep((s) => s + 1)}
        >
          <span>
            {step === 4 ? (saving ? "準備中…" : "はじめる") : "次へ"}
          </span>
          {!saving && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
