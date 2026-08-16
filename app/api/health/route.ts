import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";

export async function GET() {
  let ellofive: { ok: boolean; detail?: unknown } = { ok: false };
  try {
    const res = await fetch(`${env.ellofiveUrl}/health`, {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    ellofive = { ok: res.ok, detail: await res.json().catch(() => null) };
  } catch (e) {
    ellofive = {
      ok: false,
      detail: e instanceof Error ? e.message : "unreachable",
    };
  }

  return NextResponse.json(
    {
      status: "ok",
      service: "Neuriy ChatBase",
      version: "1.2.0",
      domain: "chat.neuriy.com",
      flags: env.flags,
      ellofive,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
