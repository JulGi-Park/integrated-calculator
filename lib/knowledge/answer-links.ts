const verifiedRoots = [
  "law.go.kr", "moel.go.kr", "nts.go.kr", "work24.go.kr", "ei.go.kr",
  "seoul.go.kr", "fsc.go.kr", "molit.go.kr", "incheon.go.kr", "work.go.kr",
  "easylaw.go.kr", "nps.or.kr", "nhis.or.kr", "kinfa.or.kr", "energy.or.kr",
  "opinet.co.kr", "gyesanbox.kr", "kbstar.com", "kbcard.com", "kbthink.com",
  "kebhana.com", "help.sell.smartstore.naver.com",
];

export function splitKnowledgeAnswerLinks(text: string): Array<string | { label: string; href: string }> {
  const parts: Array<string | { label: string; href: string }> = [];
  let cursor = 0;
  for (const match of text.matchAll(/https:\/\/[^\s<>"'\\()]+/giu)) {
    const label = match[0].replace(/[,.;!?。]+$/u, "");
    let url: URL;
    try {
      url = new URL(label);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.username || url.password || url.port) continue;
    if (!verifiedRoots.some((root) => url.hostname === root || url.hostname.endsWith(`.${root}`))) continue;

    parts.push(text.slice(cursor, match.index), { label, href: url.href });
    cursor = match.index + label.length;
  }
  parts.push(text.slice(cursor));
  return parts;
}
