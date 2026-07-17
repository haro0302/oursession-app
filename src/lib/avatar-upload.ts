import { createClient } from "@/lib/supabase";

const BUCKET = "avatars";

export async function uploadAvatar(
  file: File,
  userId: string,
  oldAvatarUrl?: string | null
): Promise<{ url: string } | { error: string }> {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { error: "JPG、PNG、WebP の画像が使えます。" };
  }

  let resized: Blob;
  try {
    resized = await resizeImage(file, 512);
  } catch {
    return { error: "画像を読み込めませんでした。別の画像を試してみてください。" };
  }

  if (resized.size > 5 * 1024 * 1024) {
    return { error: "画像が大きいようです。もう少し小さいものを試してみてください。" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, resized, { contentType: "image/jpeg" });

  if (uploadError) {
    return { error: "うまく送れませんでした。電波の届く場所でもう一度お試しください。" };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (oldAvatarUrl) {
    const oldPath = extractPath(oldAvatarUrl);
    if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  return { url: data.publicUrl };
}

function resizeImage(file: File, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas not supported"));
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.9
      );
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("load failed")); };
    img.src = URL.createObjectURL(file);
  });
}

function extractPath(url: string): string | null {
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
