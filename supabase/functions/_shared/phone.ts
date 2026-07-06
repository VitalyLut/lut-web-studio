// Server-side Russian phone normalization.
//
// This is deliberately STRICTER than the client-side live-typing formatter
// (normalizePhoneDigits() in js/project-modal.js). The client version
// always forces a leading "7" and truncates to 11 digits — correct for
// reformatting text *as someone types*, where a partial/incomplete number
// is expected and the UI just needs to keep the cursor sane. It is NOT
// safe as a server-side source of truth: silently truncating a too-long
// digit string (e.g. a botched paste, or 15 random digits) could make
// garbage input coincidentally land on an 11-digit, leading-7 shape and
// pass a naive "is it 11 digits starting with 7" check.
//
// This function instead only recognizes two legitimate input shapes and
// rejects everything else outright — no padding a too-short number, no
// truncating a too-long one to fit:
//   - 11 digits starting with 7 or 8 (already has a country code)
//   - 10 digits not starting with 0 (bare local number, country code
//     implicit)
export function normalizeRussianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  let core: string;
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    core = "7" + digits.slice(1);
  } else if (digits.length === 10 && digits[0] !== "0") {
    core = "7" + digits;
  } else {
    return null;
  }

  return /^7\d{10}$/.test(core) ? "+" + core : null;
}

/**
 * True if a trimmed string is composed entirely of digits — used to tell
 * apart a genuine free-text messenger handle from what's almost certainly
 * a mistyped/incomplete phone number that failed normalizeRussianPhone().
 * A handle in this product is always either @username-shaped or otherwise
 * contains a non-digit character; a pure digit string that isn't a valid
 * phone shape is not a plausible handle, it's a bad phone number.
 */
export function looksLikeBotchedPhone(trimmed: string): boolean {
  return /^\d+$/.test(trimmed);
}
