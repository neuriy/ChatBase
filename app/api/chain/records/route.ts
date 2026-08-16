import { NextResponse } from "next/server";
import { chainStatus, listPublicRecords } from "@/lib/chain/persist";
import { withCors } from "@/lib/http/cors";

/**
 * Public ChatScan-style explorer list.
 * Returns metadata only — content is always PRIVATE.
 */
export async function GET(req: Request) {
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
  const ref = url.searchParams.get("ref");

  if (ref) {
    const { getPublicRecord } = await import("@/lib/chain/persist");
    const record = getPublicRecord(ref);
    if (!record) {
      return respond(
        NextResponse.json(
          { error: "not_found", content: "PRIVATE" },
          { status: 404 }
        )
      );
    }
    return respond(
      NextResponse.json({
        record: { ...record, content: "PRIVATE" },
        notice: "Message content is not viewable. Only hashes and CDCI anchors are public.",
      })
    );
  }

  return respond(
    NextResponse.json({
      ...chainStatus(),
      records: listPublicRecords(limit),
      notice: "Message content is not viewable. Only hashes and CDCI anchors are public.",
    })
  );
}

export async function POST(req: Request) {
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  const body = await req.json().catch(() => ({}));
  // Refuse any attempt to push plaintext / ciphertext into the public API.
  const banned = ["content", "plaintext", "ciphertext", "envelope", "key", "message"];
  for (const key of banned) {
    if (key in (body as object)) {
      return respond(
        NextResponse.json(
          {
            error: "private_content_rejected",
            code: "content_rejected",
            content: "PRIVATE",
          },
          { status: 400 }
        )
      );
    }
  }
  return respond(
    NextResponse.json(
      {
        error: "ingest_via_chat_only",
        hint: "Neuriy commits turns from POST /api/chat. Use ChatScan ingest for external apps.",
        content: "PRIVATE",
      },
      { status: 405 }
    )
  );
}
