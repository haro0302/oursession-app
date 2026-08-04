"use client";

import { PREFECTURES } from "@/lib/constants/prefectures";

type FilterKey = "instrument" | "genre" | "area";

interface Props {
  open: boolean;
  filterKey: FilterKey | null;
  selected: string[];
  onToggle: (opt: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const FILTER_OPTIONS: Record<FilterKey, { title: string; options: string[] }> = {
  instrument: {
    title: "希望アンサー",
    options: ["ボーカル", "ギター", "ベース", "ドラム", "ピアノ", "キーボード", "ウクレレ", "サックス", "トランペット", "バイオリン", "和楽器", "DTM", "その他"],
  },
  genre: {
    title: "ジャンル",
    options: ["ロック", "ポップ", "ボカロ", "フォーク", "ジャズ", "ファンク", "R&B", "ブルース", "カントリー", "メタル", "アニソン", "ラップ"],
  },
  area: {
    title: "エリア",
    options: [...PREFECTURES],
  },
};

export default function FilterSheet({ open, filterKey, selected, onToggle, onClear, onClose }: Props) {
  const data = filterKey ? FILTER_OPTIONS[filterKey] : null;

  return (
    <>
      {/* 背景 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
          zIndex: 90,
        }}
      />

      {/* シート本体 */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(20,20,26,0.92)",
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          borderTop: "1px solid var(--border2)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 0 24px",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 91,
          maxHeight: "60%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ハンドル */}
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--text3)",
            margin: "8px auto 14px",
            opacity: 0.4,
            flexShrink: 0,
          }}
        />

        {/* タイトル */}
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text)",
            padding: "0 24px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {data?.title ?? ""}
        </div>

        {/* オプション */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            scrollbarWidth: "none",
          }}
        >
          {data?.options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                style={{
                  background: isSelected ? "var(--red-bg)" : "var(--card2)",
                  border: `1px solid ${isSelected ? "var(--red-border)" : "var(--border)"}`,
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  color: isSelected ? "var(--red2)" : "var(--text2)",
                  fontWeight: isSelected ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* アクション */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "14px 20px 0",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClear}
            style={{
              flex: 1,
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "12px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              background: "var(--card2)",
              color: "var(--text2)",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            クリア
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              border: "none",
              borderRadius: "14px",
              padding: "12px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              background: "var(--red)",
              color: "white",
              
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            決定
          </button>
        </div>
      </div>
    </>
  );
}
