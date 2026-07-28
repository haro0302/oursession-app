"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchArtists, searchTracks } from "@/lib/itunes";

interface Suggestion {
  id: number;
  name: string;
  sub?: string;
}

interface Props {
  label: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  searchType: "artist" | "song";
  placeholder: string;
  maxTags?: number;
  maxLength?: number;
}

const DEFAULT_MAX_TAGS = 10;
const DEFAULT_MAX_LENGTH = 30;

export default function TagAutocompleteInput({
  label,
  hint,
  value,
  onChange,
  searchType,
  placeholder,
  maxTags = DEFAULT_MAX_TAGS,
  maxLength = DEFAULT_MAX_LENGTH,
}: Props) {
  const [inputOpen, setInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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
      const results =
        searchType === "artist"
          ? (await searchArtists(term, controller.signal)).map((r) => ({ id: r.id, name: r.name }))
          : (await searchTracks(term, controller.signal)).map((r) => ({ id: r.id, name: r.name, sub: r.artist }));
      if (controller.signal.aborted) return;
      setSuggestions(results);
      setActiveIndex(null);
      setLoading(false);
    })();
    return () => controller.abort();
  }, [debouncedValue, inputOpen, searchType]);

  function addTag(val: string) {
    const v = val.trim();
    if (!v || value.includes(v) || v.length > maxLength || value.length >= maxTags) return;
    onChange([...value, v]);
  }

  function resetAndClose() {
    setInputValue("");
    setInputOpen(false);
    setSuggestions([]);
    setActiveIndex(null);
  }

  function commitRaw() {
    addTag(inputValue);
    resetAndClose();
  }

  function selectSuggestion(s: Suggestion) {
    addTag(s.name);
    resetAndClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex !== null && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        commitRaw();
      }
    } else if (e.key === "Escape") {
      resetAndClose();
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i === null ? 0 : Math.min(i + 1, suggestions.length - 1)));
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
    }
  }

  return (
    <div className="pe-section">
      <div className="pe-section-label">
        {label}
        <span className="pe-section-hint">{hint ?? `任意・最大${maxTags}件`}</span>
      </div>
      <div className="pe-tag-grid">
        {value.map((v) => (
          <span key={v} className="pe-tag">
            {v}
            <span className="pe-tag-x" onClick={() => onChange(value.filter((x) => x !== v))}>
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
              onKeyDown={handleKeyDown}
              onBlur={commitRaw}
              placeholder={placeholder}
              maxLength={maxLength}
            />
            <div className="pe-suggest-close" onClick={resetAndClose}>
              <X size={12} color="var(--text3)" />
            </div>
          </div>
          {(loading || suggestions.length > 0) && (
            <div className="pe-suggest-dropdown">
              {loading && suggestions.length === 0 ? (
                <div className="pe-suggest-loading">検索中…</div>
              ) : (
                suggestions.map((s, i) => (
                  <div
                    key={s.id}
                    className={`pe-suggest-item${i === activeIndex ? " active" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(s)}
                  >
                    {s.name}
                    {s.sub && <span className="pe-suggest-item-sub">{s.sub}</span>}
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
