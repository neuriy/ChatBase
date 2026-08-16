/**
 * Neuriy chain store — ChatScan-style public metadata + private vault.
 *
 * Public records never include message content (content: "PRIVATE").
 * Private envelopes live only under data/neuriy-chain/vault/ (server-side).
 */

import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type PublicRecord = {
  ref: string;
  hash: string;
  id: number;
  ciphertextHash: string;
  size: number;
  protocol: string;
  channelHash: string | null;
  nonce: string;
  commitment: string;
  status: "confirmed" | "pending" | "rejected";
  content: "PRIVATE";
  appVersion: string;
  userIdHash: string;
  centraldbHashId: string | null;
  centraldbDataId: string | null;
  anchor: {
    txid: string;
    confirmations: number;
    blockHeight: number;
    finality: "confirmed" | "mempool";
    chain: "cdci-local" | "cdci" | "chatscan";
  };
  createdAt: string;
  traceId?: string;
};

export type VaultEntry = {
  ref: string;
  userId: string;
  keyHex: string;
  envelopeHex: string;
  createdAt: string;
};

const ROOT = join(process.cwd(), "data", "neuriy-chain");
const RECORDS_PATH = join(ROOT, "records.jsonl");
const META_PATH = join(ROOT, "meta.json");
const VAULT_PATH = join(ROOT, "vault", "envelopes.jsonl");

function ensureDirs() {
  mkdirSync(join(ROOT, "vault"), { recursive: true });
  if (!existsSync(META_PATH)) {
    writeFileSync(
      META_PATH,
      JSON.stringify({ nextId: 1, height: 0, chainId: "neuriy-cdci-local" }, null, 2)
    );
  }
}

function readMeta(): { nextId: number; height: number; chainId: string } {
  ensureDirs();
  return JSON.parse(readFileSync(META_PATH, "utf8"));
}

function writeMeta(meta: { nextId: number; height: number; chainId: string }) {
  writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

export function userIdHash(userId: string): string {
  return createHash("sha256").update(`neuriy:uid:${userId}`).digest("hex");
}

export function listPublicRecords(limit = 50): PublicRecord[] {
  ensureDirs();
  if (!existsSync(RECORDS_PATH)) return [];
  const lines = readFileSync(RECORDS_PATH, "utf8")
    .split("\n")
    .filter(Boolean);
  const records = lines
    .map((line) => JSON.parse(line) as PublicRecord)
    .reverse();
  return records.slice(0, limit).map(publicView);
}

export function getPublicRecord(ref: string): PublicRecord | null {
  ensureDirs();
  if (!existsSync(RECORDS_PATH)) return null;
  const lines = readFileSync(RECORDS_PATH, "utf8")
    .split("\n")
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const rec = JSON.parse(lines[i]) as PublicRecord;
    if (rec.ref === ref) return publicView(rec);
  }
  return null;
}

/** Strip any accidental content fields before returning. */
export function publicView(rec: PublicRecord): PublicRecord {
  return {
    ...rec,
    content: "PRIVATE",
  };
}

export function appendVaultEntry(entry: VaultEntry): void {
  ensureDirs();
  appendFileSync(VAULT_PATH, `${JSON.stringify(entry)}\n`);
}

export function listVaultForUser(userId: string, limit = 50): VaultEntry[] {
  ensureDirs();
  if (!existsSync(VAULT_PATH)) return [];
  const lines = readFileSync(VAULT_PATH, "utf8")
    .split("\n")
    .filter(Boolean);
  const out: VaultEntry[] = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i -= 1) {
    const entry = JSON.parse(lines[i]) as VaultEntry;
    if (entry.userId === userId) out.push(entry);
  }
  return out;
}

export type CommitInput = {
  ciphertextHash: string;
  size: number;
  protocol: string;
  channelHash: string | null;
  nonce: string;
  commitment: string;
  userId: string;
  appVersion: string;
  traceId?: string;
  centraldbHashId?: string | null;
  centraldbDataId?: string | null;
  remoteAnchorTxid?: string | null;
  remoteChain?: PublicRecord["anchor"]["chain"];
};

export function commitPublicRecord(input: CommitInput): PublicRecord {
  ensureDirs();
  const meta = readMeta();
  const id = meta.nextId;
  meta.nextId += 1;
  meta.height += 1;
  writeMeta(meta);

  const hash = input.ciphertextHash;
  const ref = `${hash}/${id}`;
  const txid =
    input.remoteAnchorTxid ||
    createHash("sha256")
      .update(`cdci-local:${input.commitment}:${id}:${Date.now()}`)
      .digest("hex");

  const record: PublicRecord = {
    ref,
    hash,
    id,
    ciphertextHash: input.ciphertextHash,
    size: input.size,
    protocol: input.protocol,
    channelHash: input.channelHash,
    nonce: input.nonce,
    commitment: input.commitment,
    status: "confirmed",
    content: "PRIVATE",
    appVersion: input.appVersion,
    userIdHash: userIdHash(input.userId),
    centraldbHashId: input.centraldbHashId ?? null,
    centraldbDataId: input.centraldbDataId ?? null,
    anchor: {
      txid,
      confirmations: 1,
      blockHeight: meta.height,
      finality: "confirmed",
      chain: input.remoteChain ?? "cdci-local",
    },
    createdAt: new Date().toISOString(),
    traceId: input.traceId,
  };

  appendFileSync(RECORDS_PATH, `${JSON.stringify(record)}\n`);
  return publicView(record);
}

export function chainStatus() {
  const meta = readMeta();
  const records = listPublicRecords(1);
  return {
    ok: true,
    product: "Neuriy",
    backend: "cdci-local",
    chainId: meta.chainId,
    height: meta.height,
    records: meta.nextId - 1,
    latestRef: records[0]?.ref ?? null,
    principle:
      "IDENTITY + HASH + BLOCKCHAIN PROOF — content is PRIVATE (ChatScan / Central DB pattern)",
    privacy: {
      stores: [
        "ciphertextHash",
        "size",
        "protocol",
        "channelHash",
        "nonce",
        "commitment",
        "anchor",
      ],
      refuses: ["plaintext", "ciphertext", "message keys", "envelopes"],
      content: "PRIVATE",
    },
  };
}

export function randomHex(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}
