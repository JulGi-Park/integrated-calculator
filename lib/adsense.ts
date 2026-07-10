const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{16}$/;

export function getValidAdSenseClient(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return ADSENSE_CLIENT_PATTERN.test(value) ? value : null;
}

export function getConfiguredAdSenseClient(
  value: string | null | undefined = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT,
): string | null {
  return getValidAdSenseClient(value);
}

export function hasValidAdSenseClient(value: string | null | undefined): boolean {
  return getValidAdSenseClient(value) !== null;
}
