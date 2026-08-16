import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "Neuriy AI REST Gateway",
      version: "1.1.0",
      domain: "chat.neuriy.com",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
