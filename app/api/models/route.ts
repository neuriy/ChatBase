import { NextResponse } from "next/server";

export interface NeuriyModelInfo {
  id: string;
  name: string;
  description: string;
  category: "general" | "fast" | "reasoning" | "code";
  recommended?: boolean;
}

const MODELS: NeuriyModelInfo[] = [
  {
    id: "pro",
    name: "Neuriy 1.1 Pro",
    description: "Best balanced model for general task resolution & troubleshooting.",
    category: "general",
    recommended: true,
  },
  {
    id: "flash",
    name: "Neuriy 1.1 Flash",
    description: "Ultra-fast low-latency model for real-time interaction.",
    category: "fast",
  },
  {
    id: "reasoning",
    name: "Neuriy DeepReasoning",
    description: "Step-by-step logic solver for complex engineering problems.",
    category: "reasoning",
  },
  {
    id: "code",
    name: "Neuriy Code 1.1",
    description: "Specialized model for software architecture, code generation & debugging.",
    category: "code",
  },
];

export async function GET() {
  return NextResponse.json(
    {
      models: MODELS,
      defaultModel: "pro",
    },
    { status: 200 }
  );
}
