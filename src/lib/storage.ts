import { createClient } from "./supabase";

const BUCKET = "audio";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DURATION_SEC = 90;

// ファイル選択: MP3のみ許可
const ALLOWED_TYPES_FILE = ["audio/mpeg"];
// 録音: ブラウザが出力する形式をすべて許可 (変換しない方針: CLAUDE.md §7)
const ALLOWED_TYPES_RECORDING = ["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg"];

export type AudioSource = "file-pick" | "recording";

export type AudioValidationResult =
  | { ok: true }
  | { ok: false; error: "type" }
  | { ok: false; error: "size"; size: number }
  | { ok: false; error: "duration"; duration: number }
  | { ok: false; error: "unreadable" };

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(audio.duration); };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load failed")); };
    audio.src = url;
  });
}

export async function validateAudioFile(
  file: File,
  source: AudioSource = "file-pick"
): Promise<AudioValidationResult> {
  const allowedTypes = source === "recording" ? ALLOWED_TYPES_RECORDING : ALLOWED_TYPES_FILE;
  // 録音時は type が空になることもある(Blob→File 変換時の一部ブラウザ)
  const typeOk = allowedTypes.includes(file.type) || (source === "recording" && !file.type);
  if (!typeOk) {
    return { ok: false, error: "type" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = Math.round((file.size / 1024 / 1024) * 10) / 10;
    return { ok: false, error: "size", size: sizeMB };
  }
  try {
    const duration = await getAudioDuration(file);
    if (duration > MAX_DURATION_SEC) {
      return { ok: false, error: "duration", duration };
    }
  } catch {
    return { ok: false, error: "unreadable" };
  }
  return { ok: true };
}

export async function uploadAudio(
  file: File,
  userId: string,
  sessionId: string,
  onProgress?: (pct: number) => void
): Promise<{ url: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "mp3";
  const path = `${userId}/${sessionId}/${crypto.randomUUID()}.${ext}`;

  onProgress?.(10);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  onProgress?.(90);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  onProgress?.(100);
  return { url: data.publicUrl };
}

export async function deleteAudio(url: string): Promise<void> {
  const supabase = createClient();
  const path = extractPathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = `/object/public/${BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return u.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}
