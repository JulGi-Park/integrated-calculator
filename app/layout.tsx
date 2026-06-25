import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/common/SiteFooter";
import { SiteHeader } from "@/components/common/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "계산박스",
  description: "대한민국 사용자를 위한 생활·사업 계산기 서비스 계산박스",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
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
