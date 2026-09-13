export type SiblingEntry = { name: string; status: string; occupation: string };

/**
 * Parse the SiblingsDetails column.
 * New profiles store a JSON array of {name,status,occupation}; older profiles
 * stored free text. Returns the structured list when possible, otherwise the
 * original string (legacy), or null when empty.
 */
export function parseSiblings(
  raw: string | null | undefined,
): SiblingEntry[] | string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("[")) {
    try {
      const arr: unknown = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        const list = arr
          .map((s) => {
            const o = (s ?? {}) as Record<string, unknown>;
            return {
              name: String(o.name ?? "").trim(),
              status: String(o.status ?? "").trim(),
              occupation: String(o.occupation ?? "").trim(),
            };
          })
          .filter((s) => s.name || s.occupation);
        return list.length ? list : null;
      }
    } catch {
      // fall through to legacy free text
    }
  }
  return trimmed;
}
