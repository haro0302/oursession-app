"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";

function SearchIconSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

type FilterKey = "instrument" | "genre" | "area";

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: "instrument", label: "楽器" },
  { key: "genre", label: "ジャンル" },
  { key: "area", label: "エリア" },
];

interface Props {
  currentUserId?: string | null;
  filterState?: Record<FilterKey, string[]>;
  onOpenFilter?: (key: FilterKey) => void;
}

export default function TimelineHeader({ currentUserId: _currentUserId, filterState, onOpenFilter }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { openNotifications } = useNotifications();

  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => inputRef.current?.focus(), 360);
      return () => clearTimeout(id);
    }
  }, [searchOpen]);

  const iconBtnStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "var(--card2)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text2)",
    flexShrink: 0,
    transition: "color 0.15s, border-color 0.15s",
    padding: 0,
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(21,21,26,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* タイトル行 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 20px",
          gap: "10px",
        }}
      >
        <h1
          style={{
            flex: 1,
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.3px",
            margin: 0,
          }}
        >
          タイムライン
        </h1>
        <button
          type="button"
          onClick={openNotifications}
          aria-label="通知"
          style={{ ...iconBtnStyle, position: "relative" }}
        >
          <Bell size={17} />
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen((s) => !s)}
          aria-label={searchOpen ? "検索を閉じる" : "検索"}
          style={{
            ...iconBtnStyle,
            background: searchOpen ? "var(--red)" : "var(--card2)",
            borderColor: searchOpen ? "var(--red)" : "var(--border)",
            color: searchOpen ? "white" : "var(--text2)",
            boxShadow: searchOpen ? "0 4px 12px rgba(232,74,95,0.4)" : "none",
          }}
        >
          <Search size={17} />
        </button>
      </div>

      {/* 検索パネル — 常にDOMに存在。max-height でスライドアニメ */}
      <div
        style={{
          maxHeight: searchOpen ? "240px" : "0",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.35s ease",
          marginBottom: searchOpen ? "6px" : "0",
          padding: "0 20px",
        }}
      >
        {/* 検索ピル */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "28px",
            padding: "11px 16px",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        >
          <SearchIconSmall />
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

        {/* フィルターチップ */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "14px",
            scrollbarWidth: "none",
          }}
        >
          {FILTER_CHIPS.map(({ key, label }) => {
            const count = filterState?.[key]?.length ?? 0;
            const hasValue = count > 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOpenFilter?.(key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: hasValue ? "var(--red-bg)" : "var(--card)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${hasValue ? "var(--red-border)" : "var(--border)"}`,
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "11px",
                  color: hasValue ? "var(--red2)" : "var(--text2)",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontWeight: hasValue ? 600 : 500,
                  fontFamily: "inherit",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {hasValue ? `${label} · ${count}` : label}
                <ChevronDown />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
