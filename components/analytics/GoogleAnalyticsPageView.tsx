"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GOOGLE_TAG_ID } from "./GoogleTag";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    const sendPageView = () => {
      window.gtag?.("event", "page_view", {
        send_to: GOOGLE_TAG_ID,
        page_location: window.location.href,
        page_path: pathname,
        page_title: document.title,
      });
    };

    if (window.gtag) {
      sendPageView();
      return;
    }

    window.addEventListener("ga4-ready", sendPageView, { once: true });
    return () => window.removeEventListener("ga4-ready", sendPageView);
  }, [pathname]);

  return null;
}
