"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import { useBlockStore } from "@/store/blockStore";

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

type Step = "warn" | "confirm";

function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const marker = `/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return u.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}

export default function DeleteAccountFlow({ open, onClose, currentUserId }: Props) {
  const router = useRouter();
  const blockStore = useBlockStore();
  const [step, setStep] = useState<Step>("warn");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  function handleClose() {
    if (deleting) return;
    setStep("warn");
    setConfirmText("");
    onClose();
  }

  async function executeDelete() {
    if (deleting) return;
    setDeleting(true);

    try {
      const supabase = createClient();

      // 1. アバターを Storage から削除
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", currentUserId)
        .maybeSingle();
      const avatarUrl = (profileData as { avatar_url: string | null } | null)?.avatar_url;
      if (avatarUrl) {
        const avatarPath = extractStoragePath(avatarUrl, "avatars");
        if (avatarPath) {
          await supabase.storage.from("avatars").remove([avatarPath]);
        }
      }

      // 2. セッション音源を Storage から削除
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("audio_url")
        .eq("author_id", currentUserId);
      const sessionPaths = ((sessionsData as { audio_url: string }[] | null) ?? [])
        .map((s) => extractStoragePath(s.audio_url, "audio"))
        .filter((p): p is string => p !== null);
      if (sessionPaths.length > 0) {
        await supabase.storage.from("audio").remove(sessionPaths);
      }

      // 3. アンサー音源を Storage から削除
      const { data: answersData } = await supabase
        .from("answers")
        .select("audio_url")
        .eq("sender_id", currentUserId);
      const answerPaths = ((answersData as { audio_url: string }[] | null) ?? [])
        .map((a) => extractStoragePath(a.audio_url, "audio"))
        .filter((p): p is string => p !== null);
      if (answerPaths.length > 0) {
        await supabase.storage.from("audio").remove(answerPaths);
      }

      // 4. Edge Function で auth.users から削除 (CASCADE で DB データ連動削除)
      const { error: fnError } = await supabase.functions.invoke("delete-account", {
        body: { userId: currentUserId },
      });
      if (fnError) throw fnError;

      // 5. クライアント側セッションをクリア
      await supabase.auth.signOut();
      blockStore.clear();

      // 6. タイムラインへ遷移 (deleted フラグ付き)
      router.push("/timeline?deleted=true");

    } catch (err) {
      console.error("Delete account error:", err);
      showToast("削除に失敗しました。もう一度お試しください。");
      setDeleting(false);
    }
  }

  if (!open) return null;

  const btnBase: React.CSSProperties = {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    border: "1px solid var(--border)",
    transition: "background 0.18s, color 0.18s, border-color 0.18s",
  };

  const canDelete = confirmText === "削除" && !deleting;

  return (
    <>
      {/* バックドロップ */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 82,
        }}
      />

      {/* ダイアログ */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(360px, calc(100vw - 40px))",
          background: "#1e1e26",
          border: "1px solid var(--border)",
          borderRadius: "22px",
          zIndex: 83,
          padding: "24px 22px",
        }}
      >
        {step === "warn" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                本当に削除しますか?
              </div>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "10px", lineHeight: 1.6 }}>
              アカウントを削除すると、以下のデータがすべて消えます:
            </div>
            <ul style={{ margin: "0 0 14px 18px", padding: 0, fontSize: "13px", color: "var(--text2)", lineHeight: 2, listStyleType: "disc" }}>
              <li>プロフィール情報</li>
              <li>投稿したセッションカード</li>
              <li>送受信したアンサー</li>
              <li>メッセージ履歴</li>
              <li>保存・ブロック設定</li>
              <li>アバター画像・音源ファイル</li>
            </ul>
            <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "20px", lineHeight: 1.6 }}>
              他のユーザーからも、あなたとのやり取りは見えなくなります。
              <br />
              <span style={{ color: "var(--red2)", fontWeight: 600 }}>この操作は取り消せません。</span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleClose}
                style={{ ...btnBase, background: "var(--card)", color: "var(--text2)" }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                style={{ ...btnBase, background: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red2)" }}
              >
                次へ
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "12px" }}>
              最後の確認です
            </div>
            <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "16px", lineHeight: 1.6 }}>
              入力欄に「削除」とタイプして、削除ボタンを押してください。
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="削除"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--card)",
                border: `1px solid ${confirmText === "削除" ? "var(--red-border)" : "var(--border)"}`,
                borderRadius: "12px",
                color: "var(--text)",
                fontSize: "15px",
                fontFamily: "inherit",
                outline: "none",
                marginBottom: "16px",
                boxSizing: "border-box",
                transition: "border-color 0.18s",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => { setStep("warn"); setConfirmText(""); }}
                disabled={deleting}
                style={{ ...btnBase, background: "var(--card)", color: "var(--text2)" }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={!canDelete}
                style={{
                  ...btnBase,
                  background: canDelete ? "var(--red)" : "var(--card)",
                  border: `1px solid ${canDelete ? "var(--red)" : "var(--border)"}`,
                  color: canDelete ? "#fff" : "var(--text3)",
                  cursor: canDelete ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? "削除中…" : "削除する"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
