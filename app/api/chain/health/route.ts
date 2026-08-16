import { NextResponse } from "next/server";
import { chainStatus } from "@/lib/chain/persist";
import { withCors } from "@/lib/http/cors";

export async function GET(req: Request) {
  const respond = (res: NextResponse) => withCors(req, res) as NextResponse;
  return respond(
    NextResponse.json({
      ...chainStatus(),
      sources: {
        database: "https://github.com/Centraldb/chub",
        blockchain: "https://github.com/Centraldb/CDCI",
        explorerPattern: "https://github.com/crypterchat/chatscan",
      },
    })
  );
}
