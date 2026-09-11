export interface MaskedEmail {
  prefix: string;
  domain: string;
  maskedCharacterCount: number;
}

export function maskEmailForDisplay(
  email: string,
): MaskedEmail | null {
  const normalized = email.trim();
  const atIndex = normalized.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex);

  const visibleCount = Math.min(3, localPart.length);

  return {
    prefix: localPart.slice(0, visibleCount),
    domain,
    maskedCharacterCount: Math.max(localPart.length - visibleCount, 1),
  };
}