import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { decryptOwnTurns } from "@/lib/chain/persist";
import { withCors } from "@/lib/http/cors";

/**
 * Owner-only vault read. Public explorer never exposes this.
 * Returns decrypted turns for the authenticated user only.
 */
export async function GET(req: Request) {
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  const auth = await requireUser(req);
  if ("error" in auth) {
    return respond(
      new NextResponse(auth.error.body, {
        status: auth.error.status,
        headers: { "content-type": "application/json" },
      })
    );
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
  const turns = await decryptOwnTurns(auth.user.uid, limit);

  return respond(
    NextResponse.json({
      ok: true,
      owner: true,
      count: turns.length,
      turns: turns.map((t) => {
        let parsed: unknown = t.plaintext;
        try {
          parsed = JSON.parse(t.plaintext);
        } catch {
          /* keep string */
        }
        return { ref: t.ref, createdAt: t.createdAt, turn: parsed };
      }),
      notice:
        "Private vault for the authenticated owner. Public /api/chain/records never returns content.",
    })
  );
}
