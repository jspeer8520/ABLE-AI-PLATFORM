const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

/**
 * Parses a duration string into seconds. Accepts a bare number of seconds
 * ("3600") or a `<number><unit>` form where unit is s, m, h, or d ("15m",
 * "7d"). Throws on an unrecognized format so misconfiguration fails loudly.
 */
export function parseDurationSeconds(input: string): number {
  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = /^(\d+)([smhd])$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid duration: "${input}"`);
  }

  const value = Number(match[1]);
  const unit = match[2] as keyof typeof UNIT_SECONDS;
  return value * UNIT_SECONDS[unit]!;
}
