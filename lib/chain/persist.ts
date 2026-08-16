/**
 * Persist a Neuriy chat turn using ChatScan + Central DB / CDCI patterns.
 *
 * Flow (same as ChatScan SDK):
 *   seal locally → commit → anchor (CDCI local or remote) → public metadata only
 *
 * Optional remotes:
 *   CHATSCAN_URL  → submit metadata to ChatScan explorer
 *   CENTRALDB_URL → register content hash with Central DB (chub) — digest only
 */

import { env } from "@/lib/config/env";
import { logEvent } from "@/lib/observability/trace";
import { anchorInstructions, toHex } from "./commitment";
import { channelHash, generateNonce, sealMessage, openMessage } from "./crypto";
import {
  appendVaultEntry,
  chainStatus,
  commitPublicRecord,
  getPublicRecord,
  listPublicRecords,
  listVaultForUser,
  type PublicRecord,
} from "./store";

export { openMessage, chainStatus, getPublicRecord, listPublicRecords, listVaultForUser };
export type { PublicRecord };

async function registerCentralDb(contentHash: string, userId: string) {
  const base = env.centraldbUrl;
  if (!base) {
    return {
      hashId: `local_${contentHash.slice(0, 24)}`,
      dataId: `cdb_local_${contentHash.slice(0, 16)}`,
      mode: "local" as const,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (env.centraldbApiKey) headers["X-API-Key"] = env.centraldbApiKey;

    const res = await fetch(`${base}/api/v1/hash/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contentHash,
        dataType: "Neuriy Chat Turn",
        userId,
        modelId: "ellofive",
        sharing: "PUBLIC_METADATA",
      }),
      signal: AbortSignal.timeout(env.chainTimeoutMs),
    });
    const body = (await res.json().catch(() => ({}))) as {
      record?: { hashId?: string; dataId?: string; publicDataId?: string };
      error?: string;
    };
    if (!res.ok) {
      throw new Error(body.error || `centraldb_${res.status}`);
    }
    return {
      hashId: body.record?.hashId || `cdb_${contentHash.slice(0, 24)}`,
      dataId:
        body.record?.dataId ||
        body.record?.publicDataId ||
        `cdb_${contentHash.slice(0, 16)}`,
      mode: "remote" as const,
    };
  } catch (err) {
    logEvent("warn", "chain.centraldb_fallback", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return {
      hashId: `local_${contentHash.slice(0, 24)}`,
      dataId: `cdb_local_${contentHash.slice(0, 16)}`,
      mode: "local-fallback" as const,
    };
  }
}

async function submitChatScan(submission: {
  ciphertextHash: string;
  size: number;
  protocol: string;
  channelHash: string | null;
  nonce: string;
  appVersion: string;
}): Promise<{ txid: string | null; ref: string | null; mode: string }> {
  const base = env.chatscanUrl;
  if (!base) {
    return { txid: null, ref: null, mode: "local" };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (env.chatscanIngestKey) {
      headers.Authorization = `Bearer ${env.chatscanIngestKey}`;
    }
    const res = await fetch(`${base}/api/v1/records`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ciphertextHash: submission.ciphertextHash,
        size: submission.size,
        protocol: submission.protocol,
        channelHash: submission.channelHash ?? undefined,
        nonce: submission.nonce,
        appVersion: submission.appVersion,
      }),
      signal: AbortSignal.timeout(env.chainTimeoutMs),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ref?: string;
      anchor?: { txid?: string };
      anchorTxid?: string;
      error?: string;
    };
    if (!res.ok && res.status !== 202) {
      throw new Error(body.error || `chatscan_${res.status}`);
    }
    return {
      txid: body.anchor?.txid || body.anchorTxid || null,
      ref: body.ref || null,
      mode: "remote",
    };
  } catch (err) {
    logEvent("warn", "chain.chatscan_fallback", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return { txid: null, ref: null, mode: "local-fallback" };
  }
}

export type PersistChatTurnInput = {
  userId: string;
  userText: string;
  assistantText: string;
  conversationId?: string;
  traceId?: string;
  model?: string;
  provider?: string;
};

export type PersistChatTurnResult = {
  ok: true;
  content: "PRIVATE";
  record: PublicRecord;
  explorerPath: string;
  centraldb: { hashId: string; dataId: string; mode: string };
  chatscanMode: string;
};

/**
 * Persist one user↔assistant turn. Never returns plaintext in public fields.
 */
export async function persistChatTurn(
  input: PersistChatTurnInput
): Promise<PersistChatTurnResult | { ok: false; error: string }> {
  if (!env.flags.chainPersist) {
    return { ok: false, error: "chain_persist_disabled" };
  }

  try {
    const conversation =
      input.conversationId || `neuriy:${input.userId}:default`;
    const payload = JSON.stringify({
      v: 1,
      product: "Neuriy",
      model: input.model || "ellofive",
      provider: input.provider || "ellofive",
      user: input.userText,
      assistant: input.assistantText,
      at: new Date().toISOString(),
      traceId: input.traceId,
    });

    const sealed = await sealMessage(payload);
    const ch = await channelHash(conversation);
    const nonce = generateNonce();
    const instructions = await anchorInstructions({
      chainId: env.chainId,
      ciphertextHash: sealed.ciphertextHash,
      size: sealed.size,
      protocol: "N5",
      channelHash: ch,
      nonce,
    });

    const cdb = await registerCentralDb(sealed.ciphertextHash, input.userId);
    const remote = await submitChatScan({
      ciphertextHash: sealed.ciphertextHash,
      size: sealed.size,
      protocol: "N5",
      channelHash: ch,
      nonce,
      appVersion: "neuriy-chatbase-1.0",
    });

    const record = commitPublicRecord({
      ciphertextHash: sealed.ciphertextHash,
      size: sealed.size,
      protocol: "N5",
      channelHash: ch,
      nonce,
      commitment: instructions.commitment,
      userId: input.userId,
      appVersion: "neuriy-chatbase-1.0",
      traceId: input.traceId,
      centraldbHashId: cdb.hashId,
      centraldbDataId: cdb.dataId,
      remoteAnchorTxid: remote.txid,
      remoteChain: remote.mode.startsWith("remote") ? "chatscan" : "cdci-local",
    });

    appendVaultEntry({
      ref: record.ref,
      userId: input.userId,
      keyHex: sealed.key,
      envelopeHex: toHex(sealed.envelope),
      createdAt: new Date().toISOString(),
    });

    logEvent("info", "chain.turn_persisted", {
      traceId: input.traceId,
      ref: record.ref,
      content: "PRIVATE",
      centraldbMode: cdb.mode,
      chatscanMode: remote.mode,
    });

    return {
      ok: true,
      content: "PRIVATE",
      record,
      explorerPath: `/api/chain/records/${encodeURIComponent(record.ref)}`,
      centraldb: cdb,
      chatscanMode: remote.mode,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "persist_failed";
    logEvent("error", "chain.persist_failed", {
      traceId: input.traceId,
      error: message,
    });
    return { ok: false, error: message };
  }
}

export async function decryptOwnTurns(userId: string, limit = 20) {
  const entries = listVaultForUser(userId, limit);
  const out: Array<{ ref: string; plaintext: string; createdAt: string }> = [];
  for (const entry of entries) {
    const envelope = Buffer.from(entry.envelopeHex, "hex");
    const plaintext = await openMessage(new Uint8Array(envelope), entry.keyHex);
    out.push({ ref: entry.ref, plaintext, createdAt: entry.createdAt });
  }
  return out;
}
