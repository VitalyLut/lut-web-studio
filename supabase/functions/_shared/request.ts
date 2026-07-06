/** Thrown for transport-level problems (method/media-type/size/malformed
 * JSON) that map to a specific, non-400 HTTP status. */
export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// The largest realistic legitimate payload is the 7-step brief: name
// (120) + contact (190) + comment (2000) + answers (~500 bytes of short
// enum strings/array) + pageUrl (2048) + 5 UTM fields (150 each = 750) +
// idempotencyKey (36) + honeypot (small) is well under 6KB even with
// generous JSON structural overhead. 16KB leaves more than 2x headroom
// for that, while still being small enough to make any deliberately
// oversized payload trivially cheap to reject before it's ever parsed.
const MAX_BODY_BYTES = 16 * 1024;

/**
 * Reads, size-caps, and JSON-parses a request body. Enforces the cap
 * twice: first cheaply via Content-Length (if present and honest), then
 * for real while streaming the body (in case Content-Length is absent or
 * understates the truth) — so a hostile client can't bypass the limit by
 * lying about or omitting the header.
 */
export async function readJsonBody(
  req: Request,
): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json",
    );
  }

  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const declared = Number(contentLengthHeader);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new HttpError(
        413,
        "PAYLOAD_TOO_LARGE",
        "Request body is too large",
      );
    }
  }

  if (!req.body) {
    throw new HttpError(400, "VALIDATION_ERROR", "Request body is required");
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      throw new HttpError(
        413,
        "PAYLOAD_TOO_LARGE",
        "Request body is too large",
      );
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder().decode(bytes);

  if (text.trim().length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Request body is empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Request body is not valid JSON",
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new HttpError(
      400,
      "VALIDATION_ERROR",
      "Request body must be a JSON object",
    );
  }

  return parsed as Record<string, unknown>;
}
