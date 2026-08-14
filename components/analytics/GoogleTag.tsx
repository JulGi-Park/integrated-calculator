import Script from "next/script";

export const GOOGLE_TAG_ID = "G-YMJFLPRFMV";

export function GoogleTag() {
  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-bootstrap" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_TAG_ID}', { send_page_view: false });
window.dispatchEvent(new Event('ga4-ready'));
        `.trim()}
      </Script>
    </>
  );
}
