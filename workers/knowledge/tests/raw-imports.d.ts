declare module "*.sql?raw" {
  const source: string;
  export default source;
}

declare module "cloudflare:test" {
  interface ProvidedEnv {
    KNOWLEDGE_DB: D1Database;
  }
}
