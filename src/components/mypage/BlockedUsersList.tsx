"use client";

import { useState } from "react";
import { removeBlock } from "@/lib/db";
import { showToast } from "@/components/ui/Toast";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface BlockEntry {
  blocked_id: string;
  profile: Profile;
}

interface Props {
  blocks: BlockEntry[];
  currentUserId: string;
}

export default function BlockedUsersList({ blocks, currentUserId }: Props) {
  const [items, setItems] = useState<BlockEntry[]>(blocks);

  if (items.length === 0) {
    return (
      <div style={{ fontSize: "13px", color: "var(--text3)", padding: "12px 0" }}>
        ブロック中のユーザーはいません
      </div>
    );
  }

  async function handleUnblock(blockedId: string, nickname: string) {
    await removeBlock(currentUserId, blockedId);
    setItems((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    showToast(`${nickname}さんのブロックを解除しました`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {items.map((entry) => (
        <div
          key={entry.blocked_id}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--card2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
            🎵
          </div>
          <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.profile.nickname}
          </span>
          <button
            type="button"
            onClick={() => handleUnblock(entry.blocked_id, entry.profile.nickname)}
            style={{ background: "transparent", border: "1px solid var(--border2)", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 600, color: "var(--text3)", cursor: "pointer" }}
          >
            解除
          </button>
        </div>
      ))}
    </div>
  );
}
