"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchTracks } from "@/lib/itunes";

export interface SongPickerValue {
  title: string;
  artist: string | null;
  appleTrackId: number | null;
  isOriginal: boolean;
}

interface Props {
  value: SongPickerValue | null;
  onChange: (value: SongPickerValue | null) => void;
}

export default function SongPickerInput({ value, onChange }: Props) {
  const [mode, setMode] = useState<"search" | "original">("search");
  const [inputValue, setInputValue] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; artist: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedValue = useDebounce(inputValue, 400);

  useEffect(() => {
    const term = debouncedValue.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      const results = await searchTracks(term, controller.signal);
      if (controller.signal.aborted) return;
      setSuggestions(results);
      setLoading(false);
    })();
    return () => controller.abort();
  }, [debouncedValue]);

  function selectTrack(track: { name: string; artist: string; id: number }) {
    onChange({ title: track.name, artist: track.artist, appleTrackId: track.id, isOriginal: false });
    setInputValue("");
    setSuggestions([]);
  }

  function confirmOriginal() {
    const title = originalTitle.trim();
    if (!title) return;
    onChange({ title, artist: null, appleTrackId: null, isOriginal: true });
    setOriginalTitle("");
  }

  function handleChangeSong() {
    onChange(null);
    setMode("search");
    setInputValue("");
    setOriginalTitle("");
    setSuggestions([]);
  }

  if (value) {
    return (
      <div
        style={{
          margin: "0 18px",
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "13px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value.title}
          </div>
          <div style={{ marginTop: "3px", fontSize: "12.5px", color: "var(--accent-muted)" }}>
            {value.isOriginal ? "オリジナル曲" : value.artist}
          </div>
        </div>
        <button
          type="button"
          onClick={handleChangeSong}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "1px solid var(--accent-muted)",
            borderRadius: "14px",
            padding: "7px 14px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--accent-muted)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          変更
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: "0 18px" }}>
      {/* 検索 / オリジナル曲 切り替え */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <button
          type="button"
          onClick={() => setMode("search")}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "10px",
            border: `1px solid ${mode === "search" ? "var(--red-border)" : "var(--border)"}`,
            background: mode === "search" ? "var(--red-bg)" : "transparent",
            color: mode === "search" ? "var(--red2)" : "var(--text2)",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          曲を検索
        </button>
        <button
          type="button"
          onClick={() => setMode("original")}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "10px",
            border: `1px solid ${mode === "original" ? "var(--red-border)" : "var(--border)"}`,
            background: mode === "original" ? "var(--red-bg)" : "transparent",
            color: mode === "original" ? "var(--red2)" : "var(--text2)",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          オリジナル曲
        </button>
      </div>

      {mode === "search" ? (
        <div style={{ position: "relative" }}>
          <div
            style={{
              background: "var(--card)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "13px 16px",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="曲名で検索（アーティスト名の一部でもOK）"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "15px",
                WebkitAppearance: "none",
              }}
            />
          </div>
          {(loading || suggestions.length > 0) && (
            <div
              style={{
                marginTop: "6px",
                background: "var(--bg2)",
                border: "1px solid var(--border2)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              {loading && suggestions.length === 0 ? (
                <div style={{ padding: "12px 16px", fontSize: "12.5px", color: "var(--text3)" }}>検索中…</div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectTrack(s)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "11px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)" }}>{s.name}</div>
                    <div style={{ marginTop: "2px", fontSize: "12px", color: "var(--text3)" }}>{s.artist}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "13px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <input
            type="text"
            value={originalTitle}
            onChange={(e) => setOriginalTitle(e.target.value.slice(0, 60))}
            onKeyDown={(e) => e.key === "Enter" && confirmOriginal()}
            placeholder="オリジナル曲のタイトル"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: "15px",
              WebkitAppearance: "none",
            }}
          />
          <button
            type="button"
            onClick={confirmOriginal}
            disabled={!originalTitle.trim()}
            style={{
              flexShrink: 0,
              background: originalTitle.trim() ? "var(--red)" : "var(--card2)",
              border: "none",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12.5px",
              fontWeight: 700,
              color: originalTitle.trim() ? "white" : "var(--text3)",
              cursor: originalTitle.trim() ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            決定
          </button>
        </div>
      )}
    </div>
  );
}
