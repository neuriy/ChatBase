/**
 * ChatScan-compatible message sealing (AES-256-GCM).
 * Plaintext + keys never go to the explorer / public chain APIs.
 */

import { assertHex, fromHex, toHex } from "./commitment";

const IV_BYTES = 12;
const TAG_BYTES = 16;

function subtle(): SubtleCrypto {
  const value = globalThis.crypto?.subtle;
  if (!value) {
    throw new Error("WebCrypto is unavailable: globalThis.crypto.subtle is required.");
  }
  return value;
}

export function generateMessageKey(): string {
  const key = new Uint8Array(32);
  globalThis.crypto.getRandomValues(key);
  return toHex(key);
}

export function generateNonce(): string {
  const nonce = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonce);
  return toHex(nonce);
}

export async function sealMessage(
  plaintext: string,
  options: { key?: string } = {}
): Promise<{
  key: string;
  envelope: Uint8Array;
  ciphertextHash: string;
  size: number;
}> {
  const key = options.key ?? generateMessageKey();
  assertHex(key, 64, "key");
  const iv = new Uint8Array(IV_BYTES);
  globalThis.crypto.getRandomValues(iv);

  const cryptoKey = await subtle().importKey(
    "raw",
    fromHex(key),
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const sealed = new Uint8Array(
    await subtle().encrypt(
      { name: "AES-GCM", iv, tagLength: TAG_BYTES * 8 },
      cryptoKey,
      new TextEncoder().encode(plaintext)
    )
  );

  const ciphertext = sealed.subarray(0, sealed.length - TAG_BYTES);
  const tag = sealed.subarray(sealed.length - TAG_BYTES);
  const envelope = new Uint8Array(iv.length + tag.length + ciphertext.length);
  envelope.set(iv, 0);
  envelope.set(tag, iv.length);
  envelope.set(ciphertext, iv.length + tag.length);

  return {
    key,
    envelope,
    ciphertextHash: toHex(
      new Uint8Array(await subtle().digest("SHA-256", envelope))
    ),
    size: envelope.length,
  };
}

export async function openMessage(
  envelope: Uint8Array,
  key: string
): Promise<string> {
  assertHex(key, 64, "key");
  if (!(envelope instanceof Uint8Array) || envelope.length <= IV_BYTES + TAG_BYTES) {
    throw new TypeError('"envelope" must be a Uint8Array of iv || tag || ciphertext.');
  }

  const iv = envelope.subarray(0, IV_BYTES);
  const tag = envelope.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = envelope.subarray(IV_BYTES + TAG_BYTES);

  const sealed = new Uint8Array(ciphertext.length + tag.length);
  sealed.set(ciphertext, 0);
  sealed.set(tag, ciphertext.length);

  const cryptoKey = await subtle().importKey(
    "raw",
    fromHex(key),
    "AES-GCM",
    false,
    ["decrypt"]
  );
  const plaintext = await subtle().decrypt(
    { name: "AES-GCM", iv, tagLength: TAG_BYTES * 8 },
    cryptoKey,
    sealed
  );
  return new TextDecoder().decode(plaintext);
}

export async function channelHash(conversation: string): Promise<string> {
  const digest = await subtle().digest(
    "SHA-256",
    new TextEncoder().encode(`chatscan:channel:${conversation}`)
  );
  return toHex(new Uint8Array(digest));
}
