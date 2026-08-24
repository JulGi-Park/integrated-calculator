"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { getConfiguredAdSenseClient } from "@/lib/adsense";
import { isAdSenseEligiblePath } from "@/lib/site/publicRoutes";

type AdSenseScriptProps = {
  client?: string | null;
};

export function AdSenseScript({ client }: AdSenseScriptProps) {
  const pathname = usePathname();
  const adSenseClient = getConfiguredAdSenseClient(client);

  if (!adSenseClient || !isAdSenseEligiblePath(pathname)) {
    return null;
  }

  return (
    <Script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
      strategy="afterInteractive"
    />
  );
}
