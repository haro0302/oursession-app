"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Bell, User, Slash, Shield, FileText, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { removeBlock } from "@/lib/db";
import LogoutButton from "@/components/profile/LogoutButton";
import { showToast } from "@/components/ui/Toast";
import { useBlockStore } from "@/store/blockStore";
import AccountInfoOverlay from "./AccountInfoOverlay";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface BlockEntry {
  blocked_id: string;
  profile: Profile;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}

const GROUP: React.CSSProperties = {
  background: "var(--card)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--border)",
  borderRadius: "18px",
  overflow: "hidden",
};

const DIVIDER: React.CSSProperties = {
  height: "1px",
  background: "var(--border)",
  margin: "10px 4px",
};

const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  padding: "14px 16px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--border)",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
};

const ROW_LAST: React.CSSProperties = {
  ...ROW,
  borderBottom: "none",
};

const ROW_TITLE: React.CSSProperties = {
  flex: 1,
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--text)",
};

const ROW_SUB: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text3)",
  marginTop: "1px",
};

function SettingRow({
  icon,
  title,
  sub,
  last = false,
  external = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  last?: boolean;
  external?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" style={last ? ROW_LAST : ROW} onClick={onClick}>
      <div style={{ width: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={ROW_TITLE}>{title}</div>
        {sub && <div style={ROW_SUB}>{sub}</div>}
      </div>
      {external
        ? <ExternalLink size={14} color="var(--text3)" />
        : <ChevronRight size={15} color="var(--text3)" />}
    </button>
  );
}

export default function SettingsOverlay({ open, onClose, currentUserId }: Props) {
  const blockStore = useBlockStore();
  const [blockedEntries, setBlockedEntries] = useState<BlockEntry[]>([]);
  const [blockedExpanded, setBlockedExpanded] = useState(false);
  const [accountInfoOpen, setAccountInfoOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    (async () => {
      const { data: blocksRaw } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", currentUserId);
      const ids = (blocksRaw as { blocked_id: string }[] | null)?.map((b) => b.blocked_id) ?? [];
      if (ids.length === 0) { setBlockedEntries([]); return; }
      const { data: profilesRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      const profiles = (profilesRaw as Profile[] | null) ?? [];
      setBlockedEntries(
        ids
          .map((id) => {
            const p = profiles.find((pr) => pr.id === id);
            if (!p) return null;
            return { blocked_id: id, profile: p };
          })
          .filter((e): e is BlockEntry => e !== null)
      );
    })();
  }, [open, currentUserId]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleUnblock(blockedId: string, nickname: string) {
    await removeBlock(currentUserId, blockedId);
    blockStore.remove(blockedId);
    setBlockedEntries((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    showToast(`${nickname}さんのブロックを解除しました`);
  }

  return (
    <>
      {/* バックドロップ */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 69,
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
          zIndex: 70,
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
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>設定</div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px" }}>

          {/* グループ1: 通知・アカウント・ブロック */}
          <div style={GROUP}>
            <SettingRow icon={<Bell size={15} />} title="通知" sub="アンサー・メッセージの通知" />
            <SettingRow icon={<User size={15} />} title="アカウント情報" sub="メールアドレス・Google連携" onClick={() => setAccountInfoOpen(true)} />
            {/* ブロックしたユーザー（アコーディオン） */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
              <button
                type="button"
                onClick={() => setBlockedExpanded((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              >
                <div style={{ width: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}>
                  <Slash size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={ROW_TITLE}>ブロックしたユーザー</div>
                </div>
                <ChevronRight
                  size={15}
                  color="var(--text3)"
                  style={{
                    transform: blockedExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {blockedExpanded && (
                <div style={{ width: "100%", paddingBottom: "12px" }}>
                  {blockedEntries.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "var(--text3)", padding: "4px 0 8px 40px" }}>
                      ブロック中のユーザーはいません
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {blockedEntries.map((entry) => (
                        <div
                          key={entry.blocked_id}
                          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 16px 8px 40px" }}
                        >
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--card2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0 }}>
                            🎵
                          </div>
                          <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.profile.nickname}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnblock(entry.blocked_id, entry.profile.nickname)}
                            style={{ background: "transparent", border: "1px solid var(--border2)", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 600, color: "var(--text3)", cursor: "pointer", fontFamily: "inherit" }}
                          >
                            解除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={DIVIDER} />

          {/* グループ2: プライバシー・法務 */}
          <div style={GROUP}>
            <SettingRow icon={<Shield size={15} />} title="プライバシーポリシー" external />
            <SettingRow icon={<FileText size={15} />} title="利用規約" last external />
          </div>

          <div style={DIVIDER} />

          {/* グループ3: ヘルプ */}
          <div style={GROUP}>
            <SettingRow
              icon={<HelpCircle size={15} />}
              title="ヘルプ・お問い合わせ"
              last
              external
              onClick={() => { window.location.href = "mailto:support@oursession.com"; }}
            />
          </div>

          <div style={DIVIDER} />

          {/* ログアウト */}
          <LogoutButton />

          {/* フッター */}
          <div style={{ textAlign: "center", padding: "28px 16px 0", color: "var(--text3)", fontSize: "11px", lineHeight: 1.7 }}>
            OurSession v0.1.0<br />
            © 2026 OurSession
          </div>
        </div>
      </div>

      <AccountInfoOverlay
        open={accountInfoOpen}
        onClose={() => setAccountInfoOpen(false)}
        currentUserId={currentUserId}
      />
    </>
  );
}
