import type { PuzzleInput } from './types';

/** Hash only gameplay content, with a fixed property order on both build and client. */
export function serializePuzzleContent({ rows, seed }: PuzzleInput): string {
  return JSON.stringify({ rows, seed });
}

export function isPuzzleHash(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export async function hashPuzzleContent(input: PuzzleInput): Promise<string> {
  const bytes = new TextEncoder().encode(serializePuzzleContent(input));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
