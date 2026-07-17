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
  | "error-duration"
  | "error-unreadable"
  | "error-upload"
  | "error-permission";

interface Props {
  userId: string;
  sessionId: string;
  onUploaded: (url: string) => void;
  onRemoved?: () => void;
}

export default function AudioUploader({ userId, sessionId, onUploaded, onRemoved }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [recDuration, setRecDuration] = useState(0);
  const [errorSize, setErrorSize] = useState<number | undefined>();
  const [errorDuration, setErrorDuration] = useState<number | undefined>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
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
    const result = await validateAudioFile(file, "file-pick");
    if (!result.ok) {
      if (result.error === "type") { setStage("error-type"); return; }
      if (result.error === "size") { setErrorSize(result.size); setStage("error-size"); return; }
      if (result.error === "duration") { setErrorDuration(result.duration); setStage("error-duration"); return; }
      setStage("error-unreadable");
      return;
    }
    await upload(file, file.name);
  }

  async function handleSendRecording() {
    const blob = blobRef.current;
    if (!blob) return;
    const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `録音_${date}.${ext}`;
    const file = new File([blob], fileName, { type: blob.type });
    setStage("validating");
    const result = await validateAudioFile(file, "recording");
    if (!result.ok) {
      if (result.error === "size") { setErrorSize(result.size); setStage("error-size"); return; }
      setStage("error-unreadable");
      return;
    }
    await upload(file, fileName);
  }

  async function upload(file: File, fileName: string) {
    lastFileRef.current = file;
    setStage("uploading");
    setProgress(0);
    try {
      const { url } = await uploadAudio(file, userId, sessionId, setProgress);
      setUploadedUrl(url);
      setUploadedFileName(fileName);
      setStage("success");
      onUploaded(url);
    } catch (err) {
      console.error("[AudioUploader] upload failed:", err);
      setStage("error-upload");
    }
  }

  async function retryUpload() {
    if (lastFileRef.current) await upload(lastFileRef.current, lastFileRef.current.name);
  }

  function reset() {
    setPreview("");
    blobRef.current = null;
    lastFileRef.current = null;
    setStage("idle");
    setProgress(0);
    setRecDuration(0);
    setUploadedFileName("");
    setErrorDuration(undefined);
    setWaveform(Array(32).fill(4));
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ─── idle ───
  if (stage === "idle") return (
    <div>
      {/* 録音ボタン: カード背景 + 赤枠 + 横並び */}
      <button type="button" onClick={startCountdown} style={{
        width: "100%", display: "flex", alignItems: "center", gap: "13px",
        padding: "18px 16px",
        background: "var(--card)", backdropFilter: "blur(20px)",
        border: "1px solid var(--red-border)", borderRadius: "18px",
        cursor: "pointer",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "var(--red)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(232,74,95,0.4)",
        }}>
          <MicIcon />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4, marginBottom: "2px" }}>
            その場で録音する
          </div>
          <div style={{ fontSize: "11px", color: "var(--text2)", lineHeight: 1.5 }}>
            スマホのマイクで90秒まで
          </div>
        </div>
      </button>

      {/* セパレータ */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "14px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border2)" }} />
        <span style={{ fontSize: "12px", color: "var(--text3)" }}>または</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border2)" }} />
      </div>

      {/* ファイル選択: 破線囲み・縦並び・中央寄せ */}
      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "28px 18px", background: "var(--card)", backdropFilter: "blur(20px)", border: "1.5px dashed var(--border2)", borderRadius: "16px", cursor: "pointer", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--red-bg)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UploadIcon />
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>ファイルから選ぶ</div>
        <div style={{ fontSize: "11px", color: "var(--text3)" }}>MP3 (90秒・5MBまで)</div>
        <input type="file" accept="audio/mpeg,.mp3" onChange={handleFileSelect} style={{ display: "none" }} />
      </label>
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
        <span style={{ flex: 1, fontSize: "12px", color: "var(--text2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {uploadedFileName}
        </span>
        <button
          type="button"
          onClick={() => { reset(); onRemoved?.(); }}
          aria-label="音源を削除"
          style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", padding: "2px", display: "flex", flexShrink: 0 }}
        >
          <RemoveXIcon />
        </button>
      </div>
      <AudioPlayer src={uploadedUrl} />
    </div>
  );

  // ─── errors ───
  function fmtDuration(sec: number): string {
    const s = Math.ceil(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}分${r}秒` : `${s}秒`;
  }

  const errorMap: Record<string, { title: string; body: string; canRetry?: boolean }> = {
    "error-type": {
      title: "いまはMP3だけ送れます",
      body: "形式を確認してみてください。",
    },
    "error-size": {
      title: `ファイルが少し大きいようです（${errorSize}MB）`,
      body: "5MB以下にしてみてください。",
    },
    "error-duration": {
      title: `音源が少し長いようです（${fmtDuration(errorDuration ?? 0)}）`,
      body: "90秒以下にしてみてください。",
    },
    "error-unreadable": {
      title: "音源を読み込めませんでした",
      body: "別のファイルを試してみてください。",
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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

function RemoveXIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
