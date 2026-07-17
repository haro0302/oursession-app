"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toast";

export default function WelcomeToast({ type }: { type: string }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (type === "returning") {
        showToast("ようこそ🎵 おかえりなさい。");
      } else if (type === "deleted") {
        showToast("アカウントを削除しました。ご利用ありがとうございました。");
      }
      router.replace("/timeline");
    }, 100);
    return () => clearTimeout(timer);
  }, [type, router]);
  return null;
}
