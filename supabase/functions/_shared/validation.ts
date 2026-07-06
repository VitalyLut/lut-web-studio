/** Thrown for any client-input problem; caught at the top of each function
 * and turned into a uniform 400 VALIDATION_ERROR response. Never carries
 * SQL/internal detail — messages here are already client-safe. */
export class ValidationError extends Error {}

/**
 * The generated RPC arg types (see _shared/database.types.ts) mark every
 * optional Postgres parameter as `T | undefined` (omittable), not `T |
 * null` — reflecting how `supabase gen types` models a column DEFAULT.
 * PostgREST treats an omitted key and an explicit JSON null identically
 * for a nullable parameter (both become SQL NULL), so this is a type-only
 * mismatch, not a behavioral one. Converting null -> undefined here keeps
 * the RPC call arguments type-checked against the real generated schema
 * instead of casting/loosening it away.
 */
export function orUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }
  return value;
}

export function trimmedRequired(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string {
  const s = requireString(value, field).trim();
  if (s.length < min || s.length > max) {
    throw new ValidationError(
      `${field} must be between ${min} and ${max} characters`,
    );
  }
  return s;
}

/** Absent/null/empty-after-trim all collapse to null (never an empty string). */
export function trimmedOptional(
  value: unknown,
  field: string,
  max: number,
): string | null {
  if (value === null || value === undefined) return null;
  const s = requireString(value, field).trim();
  if (s.length === 0) return null;
  if (s.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`);
  }
  return s;
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  const s = requireString(value, field);
  if (!(allowed as readonly string[]).includes(s)) {
    throw new ValidationError(`${field} has an unrecognized value`);
  }
  return s as T;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuid(value: unknown, field: string): string {
  const s = requireString(value, field);
  if (!UUID_RE.test(s)) {
    throw new ValidationError(`${field} must be a valid UUID`);
  }
  return s.toLowerCase();
}

/** Accepts only absolute http(s) URLs — rejects javascript:, data:, file:,
 * and any other scheme, plus anything unparsable or over length. */
export function requireSafeUrl(
  value: unknown,
  field: string,
  maxLen: number,
): string {
  const s = requireString(value, field);
  if (s.length === 0 || s.length > maxLen) {
    throw new ValidationError(
      `${field} must be between 1 and ${maxLen} characters`,
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(s);
  } catch {
    throw new ValidationError(`${field} must be a valid URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ValidationError(`${field} must use http or https`);
  }
  return s;
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface UtmFields {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

/** utm is optional at the top level; each individual field is optional too.
 * Empty strings normalize to null (matches the DB columns' semantics). */
export function parseUtm(value: unknown): UtmFields {
  if (value === null || value === undefined) {
    return {
      source: null,
      medium: null,
      campaign: null,
      term: null,
      content: null,
    };
  }
  if (!isPlainObject(value)) {
    throw new ValidationError("utm must be an object");
  }
  return {
    source: trimmedOptional(value.source, "utm.source", 150),
    medium: trimmedOptional(value.medium, "utm.medium", 150),
    campaign: trimmedOptional(value.campaign, "utm.campaign", 150),
    term: trimmedOptional(value.term, "utm.term", 150),
    content: trimmedOptional(value.content, "utm.content", 150),
  };
}
