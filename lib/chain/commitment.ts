/**
 * ChatScan / CDCI OP_RETURN commitment helpers.
 * Matches https://github.com/crypterchat/chatscan sdk/src/commitment.js
 */

export const ANCHOR_MARKER = "CS1";
const DOMAIN = "chatscan/1:";

export type AnchorSubject = {
  chainId: string;
  ciphertextHash: string;
  size: number;
  protocol?: string;
  channelHash?: string | null;
  nonce?: string;
};

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto is unavailable.");
  }
  return subtle;
}

export async function sha256d(input: Uint8Array | string): Promise<Uint8Array> {
  const subtle = getSubtle();
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const first = await subtle.digest("SHA-256", bytes);
  const second = await subtle.digest("SHA-256", first);
  return new Uint8Array(second);
}

export function anchorPreimage(subject: AnchorSubject): string {
  const parts = [
    subject.chainId,
    subject.ciphertextHash,
    String(subject.size),
    subject.protocol ?? "C7",
    subject.channelHash ?? "",
    subject.nonce ?? "",
  ];
  return `${DOMAIN}${parts.join("|")}`;
}

export async function anchorCommitment(subject: AnchorSubject): Promise<string> {
  return toHex(await sha256d(anchorPreimage(subject)));
}

export function anchorPayloadHex(commitment: string): string {
  assertHex(commitment, 64, "commitment");
  return toHex(new TextEncoder().encode(ANCHOR_MARKER)) + commitment.toLowerCase();
}

export async function anchorInstructions(subject: AnchorSubject) {
  const commitment = await anchorCommitment(subject);
  return {
    commitment,
    marker: ANCHOR_MARKER,
    preimage: anchorPreimage(subject),
    opReturnPayload: anchorPayloadHex(commitment),
  };
}

export function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function assertHex(value: string, length: number, field: string): void {
  if (
    typeof value !== "string" ||
    !new RegExp(`^[0-9a-fA-F]{${length}}$`).test(value)
  ) {
    throw new TypeError(`"${field}" must be ${length} hex characters.`);
  }
}
