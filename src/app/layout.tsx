import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import ServiceWorkerRegistrar from "@/components/layout/ServiceWorkerRegistrar";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "our SESSION",
  description: "音源を聴いて「この人と演奏したい」を、スタジオでのリアルなセッションへ。",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "our SESSION",
  },
  openGraph: {
    title: "our SESSION",
    description: "音源を聴いて、スタジオで会おう。",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#15151a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={outfit.variable}>
      <body>
        <ServiceWorkerRegistrar />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
