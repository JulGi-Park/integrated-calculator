import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { GoogleTag } from "@/components/analytics/GoogleTag";
import { SiteFooter } from "@/components/common/SiteFooter";
import { SiteHeader } from "@/components/common/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gyesanbox.kr"),
  title: "계산박스",
  description: "대한민국 사용자를 위한 생활·사업 계산기 서비스 계산박스",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "계산박스 기본 공유 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.png"],
  },
  other: {
    "naver-site-verification": "76f6c949e0161b082d322460a1b7a9883fa21c73",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <GoogleTag />
        <AdSenseScript />
      </head>
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
