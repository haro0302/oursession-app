"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  duration?: number;
  showListening?: number;
  peaks?: number[] | null;
}

export default function AudioPlayer({ src, duration, showListening, peaks }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const bars = peaks && peaks.length > 0 ? peaks.length : 52;

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setTotalDuration(audio.duration));
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
  const playedBars = Math.floor(progress * bars);

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  const heights = useMemo(() => {
    if (peaks && peaks.length > 0) {
      return peaks.map((p) => 4 + Math.max(0, Math.min(1, p)) * 22);
    }
    const seed = 2.1;
    return Array.from({ length: bars }, (_, i) => (
      4 +
      Math.abs(
        Math.sin(seed * i * 0.4 + i * 0.3) * Math.cos(i * 0.18)
      ) * 22
    ));
  }, [peaks, bars]);

  return (
    <div>
      <div
        style={{
          background: "var(--card2)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button
          onClick={togglePlay}
          aria-label={playing ? "一時停止" : "再生"}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: playing ? "var(--red2)" : "var(--red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
            border: "none",
            boxShadow: "0 4px 12px rgba(232,74,95,0.4)",
            transition: "transform 0.15s",
          }}
        >
          {playing ? (
            <div style={{ display: "flex", gap: "3px" }}>
              <div style={{ width: "3px", height: "12px", background: "white", borderRadius: "1px" }} />
              <div style={{ width: "3px", height: "12px", background: "white", borderRadius: "1px" }} />
            </div>
          ) : (
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderLeft: "10px solid white",
                marginLeft: "2px",
              }}
            />
          )}
        </button>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: "1.5px",
            height: "32px",
            overflow: "hidden",
          }}
        >
          {heights.map((h, i) => (
            <div
              key={i}
              style={{
                background: i < playedBars ? "var(--red)" : "#3a3a44",
                borderRadius: "1px",
                flex: "1 1 0",
                minWidth: 0,
                maxWidth: "3px",
                height: `${Math.round(h)}px`,
                transition: "background 0.08s",
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: "10px",
            color: "var(--text3)",
            whiteSpace: "nowrap",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {fmt(currentTime)} / {fmt(totalDuration)}
        </div>
      </div>

      {showListening != null && showListening > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "7px",
            padding: "0 4px",
            fontSize: "10.5px",
            color: "var(--text3)",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#7ec88a",
              flexShrink: 0,
              animation: "listeningPulse 2.2s ease-in-out infinite",
            }}
          />
          <span>
            いま<span style={{ color: "var(--text2)", fontWeight: 600 }}>{showListening}人</span>が聴いています
          </span>
        </div>
      )}
    </div>
  );
}
