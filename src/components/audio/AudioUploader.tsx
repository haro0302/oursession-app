"use client";

import { useState, useRef, useEffect } from "react";
import AudioPlayer from "@/components/ui/AudioPlayer";
import { validateAudioFile, uploadAudio } from "@/lib/storage";

type Stage =
  | "idle"
  | "countdown"
  | "recording"
  | "preview"
  | "validating"
  | "uploading"
  | "success"
  | "error-type"
  | "error-size"
  | "error-upload"
  | "error-permission";

interface Props {
  userId: string;
  sessionId: string;
  onUploaded: (url: string) => void;
}

export default function AudioUploader({ userId, sessionId, onUploaded }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [recDuration, setRecDuration] = useState(0);
  const [errorSize, setErrorSize] = useState<number | undefined>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [waveform, setWaveform] = useState<number[]>(Array(32).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | undefined>(undefined);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previewUrlRef = useRef("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
      if (durationTimerRef.current != null) clearInterval(durationTimerRef.current);
      if (countdownTimerRef.current != null) clearTimeout(countdownTimerRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function setPreview(url: string) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  function updateWaveform() {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / 32));
    setWaveform(Array.from({ length: 32 }, (_, i) => 4 + (data[i * step] / 255) * 28));
    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }

  async function startCountdown() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;

      setStage("countdown");
      setCountdown(3);
      let c = 3;

      const tick = () => {
        c--;
        if (c > 0) {
          setCountdown(c);
          countdownTimerRef.current = setTimeout(tick, 1000);
        } else {
          setCountdown(0);
          countdownTimerRef.current = setTimeout(() => beginRecording(stream), 600);
        }
      };
      countdownTimerRef.current = setTimeout(tick, 1000);
    } catch {
      setStage("error-permission");
    }
  }

  function beginRecording(stream: MediaStream) {
    chunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      blobRef.current = blob;
      setPreview(URL.createObjectURL(blob));
      setStage("preview");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
      if (durationTimerRef.current != null) clearInterval(durationTimerRef.current);
    };

    mr.start();
    setStage("recording");
    setRecDuration(0);
    updateWaveform();

    let elapsed = 0;
    durationTimerRef.current = setInterval(() => {
      elapsed++;
      setRecDuration(elapsed);
      if (elapsed >= 90) mr.stop();
    }, 1000);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setStage("validating");
    const result = validateAudioFile(file);
    if (!result.ok) {
      if (result.error === "type") { setStage("error-type"); return; }
      setErrorSize(result.size);
      setStage("error-size");
      return;
    }
    await upload(file);
  }

  async function handleSendRecording() {
    const blob = blobRef.current;
    if (!blob) return;
    const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
    await upload(new File([blob], `recording.${ext}`, { type: blob.type }));
  }

  async function upload(file: File) {
    lastFileRef.current = file;
    setStage("uploading");
    setProgress(0);
    try {
      const { url } = await uploadAudio(file, userId, sessionId, setProgress);
      setUploadedUrl(url);
      setStage("success");
      onUploaded(url);
    } catch (err) {
      console.error("[AudioUploader] upload failed:", err);
      setStage("error-upload");
    }
  }

  async function retryUpload() {
    if (lastFileRef.current) await upload(lastFileRef.current);
  }

  function reset() {
    setPreview("");
    blobRef.current = null;
    lastFileRef.current = null;
    setStage("idle");
    setProgress(0);
    setRecDuration(0);
    setWaveform(Array(32).fill(4));
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ─── idle ───
  if (stage === "idle") return (
    <div>
      <button type="button" onClick={startCountdown} style={{
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", gap: "10px", padding: "28px 16px",
        background: "var(--red)", border: "none", borderRadius: "16px",
        cursor: "pointer", boxShadow: "0 6px 24px rgba(232,74,95,0.45)",
      }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MicIcon />
        </div>
        <span style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>録音する</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "14px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border2)" }} />
        <span style={{ fontSize: "12px", color: "var(--text3)" }}>または</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border2)" }} />
      </div>

      <label style={{ display: "block", cursor: "pointer" }}>
        <div style={{ padding: "14px", background: "var(--card)", border: "1px solid var(--border2)", borderRadius: "14px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: "var(--text2)" }}>
          ファイルから選ぶ
        </div>
        <input type="file" accept="audio/mpeg,.mp3" onChange={handleFileSelect} style={{ display: "none" }} />
      </label>
      <div style={{ fontSize: "11px", color: "var(--text3)", textAlign: "center", marginTop: "6px" }}>
        MP3 · 5MB以下 · 90秒以内
      </div>
    </div>
  );

  // ─── countdown ───
  if (stage === "countdown") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
      <div style={{
        fontSize: countdown === 0 ? "36px" : "72px",
        fontWeight: 800,
        color: countdown === 0 ? "#7ec88a" : "var(--text)",
        letterSpacing: countdown === 0 ? "normal" : "-2px",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {countdown === 0 ? "スタート" : countdown}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text3)", marginTop: "16px" }}>
        準備してください…
      </div>
    </div>
  );

  // ─── recording ───
  if (stage === "recording") return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "48px", marginBottom: "14px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--red)", flexShrink: 0, marginRight: "8px", animation: "recPulse 1.2s ease-in-out infinite" }} />
        {waveform.map((h, i) => (
          <div key={i} style={{ flex: 1, maxWidth: "5px", height: `${h}px`, background: "var(--red)", borderRadius: "1px", transition: "height 0.08s" }} />
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "20px", letterSpacing: "2px" }}>
        {fmt(recDuration)}
        <span style={{ fontSize: "13px", color: "var(--text3)", fontWeight: 400, letterSpacing: "normal" }}> / 1:30</span>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={reset} style={{ flex: 1, padding: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px", color: "var(--text2)", fontSize: "14px", cursor: "pointer" }}>
          やめる
        </button>
        <button type="button" onClick={() => mediaRecorderRef.current?.stop()} style={{ flex: 1, padding: "12px", background: "var(--red)", border: "none", borderRadius: "14px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px rgba(232,74,95,0.4)" }}>
          停止
        </button>
      </div>
    </div>
  );

  // ─── preview ───
  if (stage === "preview") return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        <AudioPlayer src={previewUrl} />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={reset} style={{ flex: 1, padding: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px", color: "var(--text2)", fontSize: "14px", cursor: "pointer" }}>
          もう一度
        </button>
        <button type="button" onClick={handleSendRecording} style={{ flex: 1, padding: "12px", background: "var(--red)", border: "none", borderRadius: "14px", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px rgba(232,74,95,0.4)" }}>
          これで送る
        </button>
      </div>
    </div>
  );

  // ─── validating / uploading ───
  if (stage === "validating" || stage === "uploading") return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "10px", textAlign: "center" }}>
        {stage === "validating" ? "確認中…" : "アップロード中…"}
      </div>
      <div style={{ height: "6px", background: "var(--card2)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${stage === "validating" ? 10 : progress}%`, background: "var(--red)", borderRadius: "3px", transition: "width 0.3s" }} />
      </div>
      {stage === "uploading" && (
        <div style={{ fontSize: "11px", color: "var(--text3)", textAlign: "right", marginTop: "4px" }}>
          {progress}%
        </div>
      )}
    </div>
  );

  // ─── success ───
  if (stage === "success") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(126,200,138,0.15)", border: "1px solid rgba(126,200,138,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CheckIcon />
        </div>
        <span style={{ fontSize: "12px", color: "#7ec88a", fontWeight: 600 }}>音源を受け付けました</span>
      </div>
      <AudioPlayer src={uploadedUrl} />
    </div>
  );

  // ─── errors ───
  const errorMap: Record<string, { title: string; body: string; canRetry?: boolean }> = {
    "error-type": {
      title: "いまはMP3だけ送れます",
      body: "形式を確認してみてください。",
    },
    "error-size": {
      title: `ファイルが少し大きいようです（${errorSize}MB）`,
      body: "5MB以下にしてみてください。",
    },
    "error-upload": {
      title: "うまく送れませんでした",
      body: "電波の届く場所で、もう一度お試しください。",
      canRetry: true,
    },
    "error-permission": {
      title: "マイクの許可が必要です",
      body: "設定でマイクのアクセスを許可してください。",
    },
  };

  const err = errorMap[stage];
  if (!err) return null;

  return (
    <div style={{ padding: "16px", background: "rgba(212,136,74,0.08)", border: "1px solid rgba(212,136,74,0.25)", borderRadius: "14px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
        <span style={{ fontSize: "18px" }}>⚠️</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4884a", marginBottom: "2px" }}>{err.title}</div>
          <div style={{ fontSize: "12px", color: "var(--text3)" }}>{err.body}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={reset} style={{ flex: 1, padding: "11px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text2)", fontSize: "13px", cursor: "pointer" }}>
          別のファイル
        </button>
        {err.canRetry && (
          <button type="button" onClick={retryUpload} style={{ flex: 1, padding: "11px", background: "rgba(212,136,74,0.15)", border: "1px solid rgba(212,136,74,0.3)", borderRadius: "12px", color: "#d4884a", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            もう一度試す
          </button>
        )}
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#7ec88a" strokeWidth="2.2" strokeLinecap="round">
      <polyline points="1.5,6 4.5,9 10.5,3" />
    </svg>
  );
}
