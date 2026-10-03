const encoder = new TextEncoder();

export const hmacHash = async (pepper: string, domain: "author" | "client" | "reporter" | "admin", token: string): Promise<string> => {
  const key = await crypto.subtle.importKey("raw", encoder.encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${domain}:${token}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const timingSafeEqual = (first: string, second: string): boolean => {
  const a = encoder.encode(first);
  const b = encoder.encode(second);
  if (a.byteLength !== b.byteLength) return false;
  let mismatch = 0;
  for (let index = 0; index < a.byteLength; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
};
