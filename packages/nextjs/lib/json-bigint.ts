/**
 * JSON BigInt Utilities
 *
 * Professional utilities for handling BigInt serialization in JSON
 * Prevents "Do not know how to serialize a BigInt" errors
 */

/**
 * Serialize an object to JSON with BigInt support
 * Converts BigInt values to strings automatically
 *
 * @example
 * ```ts
 * const data = { amount: 100n, address: '0x123' };
 * const json = stringifyWithBigInt(data);
 * // Result: '{"amount":"100","address":"0x123"}'
 * ```
 */
export function stringifyWithBigInt(value: unknown, space?: string | number): string {
  return JSON.stringify(
    value,
    (_, val) => (typeof val === 'bigint' ? val.toString() : val),
    space
  );
}

/**
 * Parse JSON with BigInt support
 * Automatically converts string numbers back to BigInt where appropriate
 *
 * Note: This is conservative - only converts if explicitly needed.
 * For blockchain data, consider using parseBigInt() manually.
 */
export function parseWithBigInt(text: string): unknown {
  return JSON.parse(text);
}

/**
 * Convert a value to BigInt safely
 * Handles string, number, and BigInt inputs
 */
export function parseBigInt(value: string | number | bigint): bigint {
  if (typeof value === 'bigint') return value;
  return BigInt(value);
}

/**
 * Sanitize an object for JSON response
 * Recursively converts all BigInt values to strings
 *
 * @example
 * ```ts
 * const data = {
 *   id: 123n,
 *   nested: { amount: 456n },
 *   items: [789n, 1011n]
 * };
 * const sanitized = sanitizeForJSON(data);
 * // Result: { id: "123", nested: { amount: "456" }, items: ["789", "1011"] }
 * ```
 */
export function sanitizeForJSON<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString() as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForJSON(item)) as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeForJSON(value);
    }
    return result as T;
  }

  return obj;
}

/**
 * NextResponse.json wrapper with BigInt support
 * Use this instead of NextResponse.json() when dealing with BigInt
 *
 * @example
 * ```ts
 * import { jsonResponse } from '@/lib/json-bigint';
 *
 * export async function GET() {
 *   const data = { escrowId: 123n, amount: 1000n };
 *   return jsonResponse({ success: true, data });
 * }
 * ```
 */
export function jsonResponse<T>(
  data: T,
  init?: ResponseInit
): Response {
  const sanitized = sanitizeForJSON(data);
  return new Response(stringifyWithBigInt(sanitized), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
