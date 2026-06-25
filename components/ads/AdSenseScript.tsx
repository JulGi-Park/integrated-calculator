import { getValidAdSenseClient } from "@/lib/adsense";

type AdSenseScriptProps = {
  client?: string | null;
};

export function AdSenseScript({ client }: AdSenseScriptProps) {
  const adSenseClient = getValidAdSenseClient(client);

  if (!adSenseClient) {
    return null;
  }

  return (
    <script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClient}`}
    />
  );
}
