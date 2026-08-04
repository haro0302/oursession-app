import { notFound } from "next/navigation";
import FloatingNav from "@/components/layout/FloatingNav";

/**
 * 認証必須ページをFigmaのhtml.to.designプラグインで読み込むための、
 * ログイン不要・ダミーデータのプレビュー専用ルート。
 * 本番ビルドでは常に404にし、実際の認証・DB処理には一切触れない。
 */
export default function DesignPreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: "100dvh",
          paddingBottom: "90px",
        }}
      >
        {children}
      </div>
      <FloatingNav />
    </div>
  );
}
