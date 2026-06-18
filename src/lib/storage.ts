import { createClient } from "./supabase";

const BUCKET = "audio";
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg"];

export type AudioValidationResult =
  | { ok: true }
  | { ok: false; error: "type" | "size"; size?: number };

export function validateAudioFile(file: File): AudioValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "type" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = Math.round((file.size / 1024 / 1024) * 10) / 10;
    return { ok: false, error: "size", size: sizeMB };
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
