import { rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const DATA = join(process.cwd(), "data", "neuriy-chain-test");

describe("chain persist (ChatScan / CDCI pattern)", () => {
  beforeEach(() => {
    process.env.FEATURE_CHAIN_PERSIST = "1";
    process.env.NEURIY_CHAIN_ID = "neuriy-test";
    delete process.env.CHATSCAN_URL;
    delete process.env.CENTRALDB_URL;
    rmSync(join(process.cwd(), "data", "neuriy-chain"), {
      recursive: true,
      force: true,
    });
  });

  afterEach(() => {
    rmSync(join(process.cwd(), "data", "neuriy-chain"), {
      recursive: true,
      force: true,
    });
    rmSync(DATA, { recursive: true, force: true });
  });

  it("seals a turn and exposes only PRIVATE public metadata", async () => {
    const { persistChatTurn, getPublicRecord, decryptOwnTurns } = await import(
      "@/lib/chain/persist"
    );

    const result = await persistChatTurn({
      userId: "user-test-1",
      userText: "secret question about shipping",
      assistantText: "secret answer from ello5",
      traceId: "t-1",
      model: "ellofive",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.content).toBe("PRIVATE");
    expect(result.record.content).toBe("PRIVATE");
    expect(result.record.ref).toMatch(/^[a-f0-9]{64}\/\d+$/);
    expect(result.record.commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(result.record)).not.toContain("secret question");
    expect(JSON.stringify(result.record)).not.toContain("secret answer");

    const pub = getPublicRecord(result.record.ref);
    expect(pub?.content).toBe("PRIVATE");
    expect(JSON.stringify(pub)).not.toContain("secret question");

    const own = await decryptOwnTurns("user-test-1", 5);
    expect(own.length).toBeGreaterThanOrEqual(1);
    expect(own[0].plaintext).toContain("secret question");
    expect(own[0].plaintext).toContain("secret answer");
  });

  it("rejects private content fields on public records POST", async () => {
    const { POST } = await import("@/app/api/chain/records/route");
    const res = await POST(
      new Request("http://localhost/api/chain/records", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "hello plaintext" }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("content_rejected");
    expect(body.content).toBe("PRIVATE");
  });

  it("anchor commitment is stable for same inputs", async () => {
    const { anchorCommitment } = await import("@/lib/chain/commitment");
    const subject = {
      chainId: "neuriy-test",
      ciphertextHash: "ab".repeat(32),
      size: 128,
      protocol: "N5",
      channelHash: "cd".repeat(32),
      nonce: "ef".repeat(16),
    };
    const a = await anchorCommitment(subject);
    const b = await anchorCommitment(subject);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
