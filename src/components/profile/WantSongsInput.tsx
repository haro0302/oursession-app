"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchTracks } from "@/lib/itunes";
import { findOrCreateSong } from "@/lib/db";

export interface WantSong {
  songId: string;
  title: string;
  artist: string | null;
}

interface Props {
  value: WantSong[];
  onChange: (next: WantSong[]) => void;
  maxTags?: number;
}

const DEFAULT_MAX_TAGS = 10;

export default function WantSongsInput({ value, onChange, maxTags = DEFAULT_MAX_TAGS }: Props) {
  const [inputOpen, setInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; artist: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedValue = useDebounce(inputValue, 400);

  useEffect(() => {
    if (inputOpen) inputRef.current?.focus();
  }, [inputOpen]);

  useEffect(() => {
    if (!inputOpen) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
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
  }, [debouncedValue, inputOpen]);

  function resetAndClose() {
    setInputValue("");
    setInputOpen(false);
    setSuggestions([]);
  }

  async function selectTrack(track: { id: number; name: string; artist: string }) {
    if (value.length >= maxTags || value.some((v) => v.title === track.name && v.artist === track.artist)) {
      resetAndClose();
      return;
    }
    setResolving(true);
    try {
      const songId = await findOrCreateSong({
        title: track.name,
        artist: track.artist,
        appleTrackId: track.id,
        isOriginal: false,
      });
      onChange([...value, { songId, title: track.name, artist: track.artist }]);
    } finally {
      setResolving(false);
      resetAndClose();
    }
  }

  return (
    <div className="pe-section">
      <div className="pe-section-label">
        やりたい曲
        <span className="pe-section-hint">任意・最大{maxTags}件</span>
      </div>
      <div className="pe-tag-grid">
        {value.map((v) => (
          <span
            key={v.songId}
            className="pe-tag"
            style={{ borderColor: "var(--red-border)", background: "var(--red-bg)", fontWeight: 600 }}
          >
            {v.title}
            <span className="pe-tag-x" onClick={() => onChange(value.filter((x) => x.songId !== v.songId))}>
              <X size={10} color="var(--red2)" />
            </span>
          </span>
        ))}
        {!inputOpen && (
          <button
            type="button"
            className="pe-tag-add"
            onClick={() => setInputOpen(true)}
            disabled={value.length >= maxTags}
          >
            <Plus size={11} />
            追加
          </button>
        )}
      </div>
      {inputOpen && (
        <div className="pe-suggest-wrap">
          <div className="pe-suggest-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="pe-suggest-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && resetAndClose()}
              placeholder="曲名を入力"
            />
            <div className="pe-suggest-close" onClick={resetAndClose}>
              <X size={12} color="var(--text3)" />
            </div>
          </div>
          {(loading || resolving || suggestions.length > 0) && (
            <div className="pe-suggest-dropdown">
              {resolving ? (
                <div className="pe-suggest-loading">追加中…</div>
              ) : loading && suggestions.length === 0 ? (
                <div className="pe-suggest-loading">検索中…</div>
              ) : (
                suggestions.map((s) => (
                  <div key={s.id} className="pe-suggest-item" onMouseDown={(e) => e.preventDefault()} onClick={() => selectTrack(s)}>
                    {s.name}
                    <span className="pe-suggest-item-sub">{s.artist}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
