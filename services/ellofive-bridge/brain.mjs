/**
 * ElloFive / Ello5 conversational brain for Neuriy ChatBase.
 * Multi-turn Neuriy replies; used when Ollama is not available,
 * and as the in-process engine behind the ElloFive-compatible gateway.
 * Improves automatically via services/ello5-learn knowledge bank (HF + chat).
 */

import { retrieveLearned, knowledgeStats } from "./knowledge.mjs";

function clip(s, n) {
  const t = String(s || "");
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

function lastUser(messages) {
  const users = (messages || []).filter((m) => m.role === "user");
  return users[users.length - 1]?.content || "";
}

function historyBlock(messages) {
  return (messages || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => `${m.role === "user" ? "User" : "Neuriy"}: ${clip(m.content, 400)}`)
    .join("\n");
}

function systemHints(messages) {
  const sys = (messages || []).filter((m) => m.role === "system").map((m) => m.content);
  return sys.join("\n\n").slice(0, 6000);
}

function extractMarketplaceLines(system) {
  if (!system.includes("<<<MARKETPLACE_DATA")) {
    return "";
  }
  const titles = [...system.matchAll(/"title"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const names = [...system.matchAll(/"name"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const all = [...new Set([...titles, ...names])].slice(0, 6);
  if (!all.length) {
    // Fall back to attributed lines already in the framed block
    const attributed = [
      ...system.matchAll(/\(from Marketplace:\s*([^)]+)\)/g),
    ].map((m) => m[1].trim());
    const uniq = [...new Set(attributed)].slice(0, 6);
    if (!uniq.length) return "";
    return (
      "From the Neuriy Marketplace catalog:\n" +
      uniq.map((n) => `- **${n}** (from Marketplace: ${n})`).join("\n")
    );
  }
  return (
    "From the Neuriy Marketplace catalog:\n" +
    all.map((n) => `- **${n}** (from Marketplace: ${n})`).join("\n")
  );
}

function conversationalCore(q, ctx) {
  const lower = q.toLowerCase();

  // Continuous learning: prefer matched knowledge from HF + Neuriy chat feedback
  const learned = retrieveLearned(q);
  if (learned?.response) {
    const stamp = learned.source?.startsWith("chat:")
      ? "_Learned from Neuriy chat feedback_"
      : "_Improved via Ello5 continuous learning (Hugging Face / chat)_";
    return `${learned.response}\n\n${stamp}`;
  }

  if (/^(hi|hello|hey|hoi|hallo)\b/.test(lower) || /\bwho are you\b/.test(lower)) {
    return (
      "I'm **Neuriy AI**, powered by **ElloFive (Ello5)** — Neuriy’s own AI model.\n\n" +
      "I can chat naturally, reason through problems, write code, build HTML pages, draw SVG images, " +
      "plan tasks, discuss live topics, and search the Neuriy Marketplace when you need apps or tools.\n\n" +
      "What would you like to work on?"
    );
  }

  if (/\b(what (is|are) (you|neuriy|ellofive)|how do you work)\b/.test(lower)) {
    return (
      "**Neuriy** is the product (chat UX + auth + marketplace + tools).\n" +
      "**ElloFive / Ello5** is Neuriy’s AI model that powers my replies.\n" +
      "**IDHook** handles identity; **FRC7** patterns power orchestration and infrastructure.\n\n" +
      "Together they are Neuriy AI — built around Ello5, not a third-party chat brand."
    );
  }

  if (/\b(code|typescript|javascript|python|function|bug|api)\b/.test(lower)) {
    return (
      `Here's a practical Neuriy / ElloFive take on: “${clip(q, 180)}”\n\n` +
      "```typescript\n" +
      "export async function neuriyReply(prompt: string): Promise<string> {\n" +
      "  const cleaned = prompt.trim();\n" +
      "  if (!cleaned) throw new Error('empty prompt');\n" +
      "  // ElloFive model call happens server-side in ChatBase\n" +
      "  return `Neuriy (ElloFive): ${cleaned.slice(0, 120)}`;\n" +
      "}\n" +
      "```\n\n" +
      "I can expand this into a Next.js route, tests, or a full HTML demo — just say which."
    );
  }

  if (/\b(html|page|website|landing)\b/.test(lower)) {
    return (
      `Understood — you want a page related to “${clip(q, 160)}”.\n` +
      "I've prepared structured page content for the Neuriy tool layer to materialize as downloadable HTML. " +
      "Tell me the brand tone (minimal, bold, playful) if you want a second pass."
    );
  }

  if (/\b(image|svg|draw|picture|logo)\b/.test(lower)) {
    return (
      `I'll illustrate “${clip(q, 140)}” as an SVG through Neuriy's image tool, then keep refining colors or layout with ElloFive guidance.`
    );
  }

  if (/\b(marketplace|app|plugin)\b/.test(lower)) {
    const mp = extractMarketplaceLines(ctx.system);
    return (
      (mp ? mp + "\n\n" : "") +
      `For “${clip(q, 160)}”, I can open a specific app, compare options, or turn the best match into a setup task plan.`
    );
  }

  if (/\b(live|news|today|current)\b/.test(lower)) {
    return (
      `Looking at your live/current topic (“${clip(q, 160)}”), I'll combine any fresh feed context with ElloFive reasoning. ` +
      "Ask for a short briefing, a longer analysis, or an HTML summary page."
    );
  }

  // Default Neuriy / Ello5 structured answer
  const hist = ctx.history ? `\n\n_Recent context:_\n${clip(ctx.history, 500)}` : "";
  return (
    `**Neuriy AI** (ElloFive / Ello5)\n\n` +
    `You said: “${clip(q, 320)}”\n\n` +
    `Here's a clear answer: I understand the request and can take it further — explain deeper, write code, ` +
    `produce an HTML page, draw an SVG, search the Marketplace, or turn it into a step-by-step task.\n\n` +
    `Pick a direction (or keep chatting) and I'll continue as Neuriy, powered by Ello5.` +
    hist
  );
}

/**
 * ElloFive-compatible generate: { messages, message, model } → assistant text
 */
export function ellofiveGenerate({ messages = [], message = "", model = "ellofive" } = {}) {
  const started = Date.now();
  const prompt = String(message || lastUser(messages) || "").trim();
  const system = systemHints(messages);
  const history = historyBlock(messages);
  const mp = extractMarketplaceLines(system);

  let output = conversationalCore(prompt, { system, history });
  if (mp && !/from Marketplace/i.test(output) && /\b(marketplace|app)\b/i.test(prompt + system)) {
    output = mp + "\n\n" + output;
  }

  // Light personalization by ChatBase model preference hints in system prompt
  if (/model preference:\s*reasoning/i.test(system)) {
    output =
      "**Reasoning mode**\n1. Restate the ask\n2. Constraints\n3. Answer\n\n" + output;
  } else if (/model preference:\s*code/i.test(system)) {
    output = "**Code mode**\n" + output;
  }

  return {
    mode: "Ello5",
    model: model || "ellofive",
    output,
    message: { role: "assistant", content: output },
    status: "success",
    provider: "ellofive-neuriy",
    latencyMs: Date.now() - started,
    runtime: "ElloFive",
    product: "Neuriy",
    learning: knowledgeStats(),
  };
}
