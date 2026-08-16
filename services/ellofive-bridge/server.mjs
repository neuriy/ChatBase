/**
 * ElloFive-compatible gateway for Neuriy ChatBase.
 * Speaks the same contract as ElloFive frc/server.js:
 *   GET  /health
 *   GET  /v1/models
 *   POST /v1/chat
 *   POST /run/:model
 *
 * Prefers real Ollama/ElloFive upstream when available; otherwise uses the
 * Neuriy Ello5 brain so ChatBase always has a working model.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ellofiveGenerate } from "./brain.mjs";
import { knowledgeStats } from "./knowledge.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CHAT_INBOX =
  process.env.ELLO5_CHAT_INBOX ||
  path.join(ROOT, "data/ello5-learn/inbox/chat.jsonl");

const PORT = Number(process.env.ELLOFIVE_PORT || process.env.PORT || 3999);
const UPSTREAM =
  process.env.ELLOFIVE_UPSTREAM ||
  process.env.OLLAMA_HOST ||
  process.env.ELLOFIVE_HOST ||
  "";
const DEFAULT_MODEL = process.env.ELLO5_MODEL || process.env.ELLOFIVE_MODEL || "ellofive";

async function tryUpstreamChat(body) {
  if (!UPSTREAM) return null;
  const base = UPSTREAM.replace(/\/$/, "");
  // If UPSTREAM looks like Ollama, use /api/chat; if ElloFive gateway, /v1/chat
  const isOllama = /:11434$/.test(base) || process.env.ELLOFIVE_UPSTREAM_KIND === "ollama";
  const url = isOllama ? `${base}/api/chat` : `${base}/v1/chat`;
  const payload = isOllama
    ? {
        model: body.model || DEFAULT_MODEL,
        messages: body.messages?.length
          ? body.messages
          : [{ role: "user", content: body.message || body.prompt || body.input || "" }],
        stream: false,
      }
    : body;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (isOllama) {
      const output = data?.message?.content || "";
      if (!output) return null;
      return {
        mode: "Ello5",
        model: body.model || DEFAULT_MODEL,
        output,
        message: { role: "assistant", content: output },
        status: "success",
        provider: "ollama",
        runtime: "ElloFive",
      };
    }
    if (data?.output || data?.message?.content) return data;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function listUpstreamModels() {
  if (!UPSTREAM) return [];
  const base = UPSTREAM.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trace-id",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    const models = await listUpstreamModels();
    sendJson(res, 200, {
      ok: true,
      product: "Elloten",
      model: "Ello5",
      mode: "Ello5",
      runtimeProduct: "ElloFive",
      note: "Neuriy ChatBase bridge — ElloFive is the AI model for Neuriy",
      neuriy: true,
      upstream: UPSTREAM || null,
      models: models.length ? models : [DEFAULT_MODEL, "ellofive-fast", "neuriy.chat"],
      runtime: "ellofive-bridge",
      learning: knowledgeStats(),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/learn") {
    // Accept chat feedback pairs for continuous learning inbox
    const body = await readJson(req);
    const prompt = String(body.prompt || body.user || "").trim();
    const response = String(body.response || body.assistant || "").trim();
    if (!prompt || !response) {
      sendJson(res, 400, { error: "prompt and response required" });
      return;
    }
    const row = {
      prompt: prompt.slice(0, 4000),
      response: response.slice(0, 6000),
      source: body.source || "chat:api",
      ts: new Date().toISOString(),
      meta: { liked: Boolean(body.liked), traceId: body.traceId || null },
    };
    try {
      fs.mkdirSync(path.dirname(CHAT_INBOX), { recursive: true });
      fs.appendFileSync(CHAT_INBOX, JSON.stringify(row) + "\n", "utf8");
      sendJson(res, 200, { ok: true, inbox: CHAT_INBOX, learning: knowledgeStats() });
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : "write_failed",
      });
    }
    return;
  }

  if (req.method === "GET" && (url.pathname === "/models" || url.pathname === "/v1/models")) {
    sendJson(res, 200, {
      models: [
        { id: "ellofive", name: "ElloFive / Ello5", product: "Neuriy" },
        { id: "ellofive-fast", name: "ElloFive Fast", product: "Neuriy" },
        { id: "neuriy.chat", name: "Neuriy Chat", product: "Neuriy" },
      ],
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/chat") {
    const body = await readJson(req);
    const upstream = await tryUpstreamChat(body);
    if (upstream) {
      sendJson(res, 200, upstream);
      return;
    }
    const local = ellofiveGenerate({
      messages: body.messages || [],
      message: body.message || body.prompt || body.input || "",
      model: body.model || DEFAULT_MODEL,
    });
    sendJson(res, 200, local);
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/run/")) {
    const model = decodeURIComponent(url.pathname.slice("/run/".length)) || DEFAULT_MODEL;
    const body = await readJson(req);
    const input = body.input || body.prompt || body.message || "";
    const local = ellofiveGenerate({
      messages: [{ role: "user", content: input }],
      message: input,
      model,
    });
    sendJson(res, 200, {
      mode: "Ello5",
      runtime: "ElloFive",
      source: "FRC7",
      model,
      input,
      output: local.output,
      latencyMs: local.latencyMs,
      status: "success",
    });
    return;
  }

  sendJson(res, 404, { error: "not_found", path: url.pathname });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    JSON.stringify({
      event: "ellofive_bridge_listen",
      port: PORT,
      model: DEFAULT_MODEL,
      upstream: UPSTREAM || null,
      note: "Neuriy ChatBase ← ElloFive model bridge",
    })
  );
});
