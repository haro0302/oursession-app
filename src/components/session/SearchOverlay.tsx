"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { SearchIcon } from "@/components/icons/CustomIcons";
import TimelineList from "./TimelineList";
import type { SessionWithAuthor } from "@/lib/db";

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: SessionWithAuthor[];
  savedIds: string[];
  answeredIds: string[];
  currentUserId: string | null;
}

export default function SearchOverlay({ open, onClose, sessions, savedIds, answeredIds, currentUserId }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 360);
      return () => clearTimeout(id);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? sessions.filter((s) => {
        const artists = s.author.favorite_artists ?? [];
        const tracks = s.author.favorite_tracks ?? [];
        return [...artists, ...tracks].some((v) => v.toLowerCase().includes(trimmed));
      })
    : [];

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
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--card2)",
              border: "1px solid var(--border)",
              borderRadius: "24px",
              padding: "9px 14px",
              minWidth: 0,
            }}
          >
            <span style={{ color: "var(--text3)", display: "flex" }}><SearchIcon size={15} /></span>
            <input
              ref={inputRef}
              type="text"
              placeholder="アーティスト名・曲名で検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "16px",
                minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!trimmed ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "240px",
                gap: "12px",
                color: "var(--text3)",
                textAlign: "center",
                padding: "0 20px",
              }}
            >
              <SearchIcon size={28} />
              <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
                好きなアーティスト・曲名で
                <br />
                気になる音源を探せます
              </div>
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "240px",
                gap: "12px",
                color: "var(--text3)",
                textAlign: "center",
                padding: "0 20px",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600 }}>見つかりませんでした</div>
              <div style={{ fontSize: "12px", lineHeight: 1.6 }}>
                別のアーティスト名・曲名で試してみてください
              </div>
            </div>
          ) : (
            <div style={{ padding: "14px 20px 80px" }}>
              <TimelineList
                sessions={results}
                savedIds={savedIds}
                answeredIds={answeredIds}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
