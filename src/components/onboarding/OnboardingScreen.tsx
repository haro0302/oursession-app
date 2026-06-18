"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { updateProfile } from "@/lib/db";

const INSTRUMENTS = [
  "ギター",
  "ベース",
  "ドラム",
  "キーボード",
  "ボーカル",
  "管楽器",
  "弦楽器",
  "その他",
];

const PREFS = [
  "北海道", "青森", "岩手", "宮城", "秋田",
  "山形", "福島", "茨城", "栃木", "群馬",
  "埼玉", "千葉", "東京", "神奈川", "新潟",
  "富山", "石川", "福井", "山梨", "長野",
  "岐阜", "静岡", "愛知", "三重", "滋賀",
  "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知", "福岡",
  "佐賀", "長崎", "熊本", "大分", "宮崎",
  "鹿児島", "沖縄",
];

interface Props {
  userId: string;
}

export default function OnboardingScreen({ userId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [isPractice, setIsPractice] = useState(true);
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleInstrument(inst: string) {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  }

  const canNext =
    (step === 1 && nickname.trim().length > 0) ||
    (step === 2 && instruments.length > 0) ||
    (step === 3 && area !== "");

  async function handleFinish() {
    if (saving) return;
    setSaving(true);
    await updateProfile(userId, {
      nickname: nickname.trim(),
      instruments,
      is_practice: isPractice,
      area,
    });
    showToast("ようこそ🎵");
    router.push("/timeline");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        padding: "0 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "56px 0 0",
          gap: "8px",
        }}
      >
        {step >= 2 && step <= 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text2)",
              cursor: "pointer",
              padding: "4px 8px 4px 0",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} />
            戻る
          </button>
        ) : (
          <div style={{ width: "52px" }} />
        )}

        {step <= 3 && (
          <div style={{ flex: 1, display: "flex", gap: "6px" }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  flex: 1,
                  height: "3px",
                  borderRadius: "2px",
                  background: n <= step ? "var(--red)" : "var(--border2)",
                  transition: "background 0.35s",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ width: "52px" }} />
      </div>

      {/* Step content */}
      <div style={{ flex: 1, paddingTop: "40px" }}>
        {step === 1 && (
          <StepNickname value={nickname} onChange={setNickname} />
        )}
        {step === 2 && (
          <StepInstruments
            selected={instruments}
            isPractice={isPractice}
            onToggle={toggleInstrument}
            onTogglePractice={() => setIsPractice((p) => !p)}
          />
        )}
        {step === 3 && (
          <StepArea selected={area} onSelect={setArea} />
        )}
        {step === 4 && (
          <StepWelcome
            nickname={nickname}
            onFinish={handleFinish}
            saving={saving}
          />
        )}
      </div>

      {/* Next button */}
      {step <= 3 && (
        <div style={{ padding: "20px 0 48px" }}>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            style={{
              width: "100%",
              background: canNext ? "var(--red)" : "var(--card)",
              border: canNext ? "none" : "1px solid var(--border)",
              borderRadius: "16px",
              padding: "15px",
              fontSize: "15px",
              fontWeight: 700,
              color: canNext ? "white" : "var(--text3)",
              cursor: canNext ? "pointer" : "not-allowed",
              transition:
                "background 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s, box-shadow 0.3s",
              boxShadow: canNext
                ? "0 4px 16px rgba(232,74,95,0.35)"
                : "none",
            }}
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}

function StepNickname({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "8px",
          lineHeight: 1.3,
        }}
      >
        あなたを何て呼べばいい？
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text2)",
          lineHeight: 1.6,
          marginBottom: "32px",
        }}
      >
        本名でなくて大丈夫。後からいつでも変えられます。
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例: りんご, guitar_taro"
        maxLength={30}
        autoFocus
        style={{
          width: "100%",
          background: "var(--card)",
          border: "1px solid var(--border2)",
          borderRadius: "14px",
          padding: "14px 16px",
          fontSize: "17px",
          color: "var(--text)",
          outline: "none",
          WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

function StepInstruments({
  selected,
  isPractice,
  onToggle,
  onTogglePractice,
}: {
  selected: string[];
  isPractice: boolean;
  onToggle: (v: string) => void;
  onTogglePractice: () => void;
}) {
  return (
    <div>
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "8px",
        }}
      >
        どんな楽器をやってる？
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text2)",
          marginBottom: "24px",
        }}
      >
        複数選べます。
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        {INSTRUMENTS.map((inst) => {
          const active = selected.includes(inst);
          return (
            <button
              key={inst}
              type="button"
              onClick={() => onToggle(inst)}
              style={{
                background: active
                  ? "rgba(232,74,95,0.04)"
                  : "var(--card)",
                border: `1px solid ${active ? "var(--red-border)" : "var(--border)"}`,
                borderRadius: "20px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--red2)" : "var(--text2)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {inst}
            </button>
          );
        })}
      </div>

      {/* Practice toggle */}
      <button
        type="button"
        onClick={onTogglePractice}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          background: isPractice
            ? "linear-gradient(135deg, rgba(255,180,60,0.12) 0%, rgba(220,100,60,0.12) 100%)"
            : "var(--card)",
          border: `1px solid ${
            isPractice ? "rgba(220,130,60,0.35)" : "var(--border)"
          }`,
          borderRadius: "14px",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.25s",
        }}
      >
        <span style={{ fontSize: "20px" }}>🔰</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: isPractice ? "#d4884a" : "var(--text2)",
            }}
          >
            練習中（セッション歓迎）
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text3)",
              marginTop: "2px",
            }}
          >
            初心者・練習中でもOKと伝えられます
          </div>
        </div>

        {/* Toggle thumb */}
        <div
          style={{
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            background: isPractice
              ? "linear-gradient(90deg, #f0a060, #d4704a)"
              : "var(--bg3)",
            position: "relative",
            transition: "background 0.25s",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "3px",
              left: isPractice ? "21px" : "3px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "white",
              transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </div>
      </button>
    </div>
  );
}

function StepArea({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "8px",
        }}
      >
        どのエリアでセッションしますか？
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text2)",
          marginBottom: "20px",
        }}
      >
        後から変えられます。
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "5px",
        }}
      >
        {PREFS.map((pref) => {
          const active = selected === pref;
          return (
            <button
              key={pref}
              type="button"
              onClick={() => onSelect(pref)}
              style={{
                background: active
                  ? "rgba(232,74,95,0.04)"
                  : "var(--card)",
                border: `1px solid ${
                  active ? "var(--red-border)" : "var(--border)"
                }`,
                borderRadius: "8px",
                padding: "7px 2px",
                fontSize: "11px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--red2)" : "var(--text2)",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "center",
              }}
            >
              {pref}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepWelcome({
  nickname,
  onFinish,
  saving,
}: {
  nickname: string;
  onFinish: () => void;
  saving: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "55dvh",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "52px", marginBottom: "24px" }}>🎵</div>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: "10px",
        }}
      >
        ようこそ、{nickname}さん
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text2)",
          lineHeight: 1.7,
          marginBottom: "52px",
        }}
      >
        まずは気になる人の音源を聴いてみよう。
      </p>
      <button
        type="button"
        onClick={onFinish}
        disabled={saving}
        style={{
          background: "var(--red)",
          border: "none",
          borderRadius: "16px",
          padding: "15px 52px",
          fontSize: "16px",
          fontWeight: 700,
          color: "white",
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
          boxShadow: "0 4px 20px rgba(232,74,95,0.4)",
        }}
      >
        {saving ? "準備中…" : "はじめる"}
      </button>
    </div>
  );
}
