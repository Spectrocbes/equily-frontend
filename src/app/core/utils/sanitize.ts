export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().trim();
}

/**
 * Trims leading/trailing whitespace AND collapses
 * multiple internal spaces to a single space.
 * "   Mon       PEA    " → "Mon PEA"
 */
export function normalizeText(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

export function normalizeTextOrUndefined(
  value: string | null | undefined
): string | undefined {
  const result = normalizeText(value);
  return result ?? undefined;
}
