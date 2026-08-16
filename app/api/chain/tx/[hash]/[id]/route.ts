import { NextResponse } from "next/server";
import { getPublicRecord } from "@/lib/chain/persist";
import { withCors } from "@/lib/http/cors";

type Ctx = { params: Promise<{ hash: string; id: string }> };

/** ChatScan-style address: /api/chain/tx/{HASH}/{ID} — metadata only. */
export async function GET(req: Request, ctx: Ctx) {
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  const { hash, id } = await ctx.params;
  const ref = `${hash}/${id}`;
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
      notice:
        "Message content is not viewable. CDCI commitment + Central DB hash only.",
    })
  );
}
