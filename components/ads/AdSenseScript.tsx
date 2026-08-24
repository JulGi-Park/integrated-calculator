"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getConfiguredAdSenseClient } from "@/lib/adsense";
import { isAdSenseEligiblePath } from "@/lib/site/publicRoutes";

const ADSENSE_SCRIPT_ID = "adsense-page-connection";

type AdSenseScriptProps = {
  client?: string | null;
};

export function AdSenseScript({ client }: AdSenseScriptProps) {
  const pathname = usePathname();
  const adSenseClient = getConfiguredAdSenseClient(client);
  const isEligible = Boolean(adSenseClient && isAdSenseEligiblePath(pathname));

  useEffect(() => {
    if (!isEligible && document.getElementById(ADSENSE_SCRIPT_ID)) {
      // A script loaded on an eligible page can keep Auto Ads alive after an
      // App Router transition. Reload the new blocked URL so it starts from a
      // document that never prepared the AdSense connection.
      window.location.reload();
    }
  }, [isEligible]);

  if (!isEligible) {
    return null;
  }

  return (
    <Script
      id={ADSENSE_SCRIPT_ID}
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
      strategy="afterInteractive"
    />
  );
}
