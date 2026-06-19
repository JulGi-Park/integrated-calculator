export type JsonLdItem = Readonly<
  Record<string, unknown> & {
    "@type": string;
  }
>;

export function serializeJsonLd(data: unknown): string {
  const serialized = JSON.stringify(data, (_key, value: unknown) => {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new TypeError("JSON-LD cannot contain non-finite numbers.");
    }

    if (
      typeof value === "undefined" ||
      typeof value === "function" ||
      typeof value === "symbol"
    ) {
      throw new TypeError("JSON-LD contains an unsupported value.");
    }

    return value;
  });

  if (serialized === undefined) {
    throw new TypeError("JSON-LD must be serializable.");
  }

  return serialized.replace(/</g, "\\u003c");
}

export function JsonLdScripts({
  items,
}: Readonly<{ items: readonly JsonLdItem[] }>) {
  return items.map((item, index) => (
    <script
      key={`${item["@type"]}-${index}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
    />
  ));
}
