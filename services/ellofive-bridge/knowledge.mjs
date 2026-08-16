/**
 * Load continuous-learning knowledge bank written by services/ello5-learn.
 * Used by the Ello5 brain so overnight HF/chat training improves replies without GPU.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const KNOWLEDGE =
  process.env.ELLO5_KNOWLEDGE_PATH ||
  path.join(ROOT, "data/ello5-learn/knowledge.jsonl");
const META = path.join(ROOT, "data/ello5-learn/knowledge_meta.json");

let cache = { loadedAt: 0, entries: [] };
const RELOAD_MS = Number(process.env.ELLO5_KNOWLEDGE_RELOAD_MS || 60_000);

function tokenize(text) {
  return new Set(String(text || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []);
}

function loadEntries() {
  const now = Date.now();
  if (cache.entries.length && now - cache.loadedAt < RELOAD_MS) {
    return cache.entries;
  }
  try {
    if (!fs.existsSync(KNOWLEDGE)) {
      cache = { loadedAt: now, entries: [] };
      return cache.entries;
    }
    const lines = fs.readFileSync(KNOWLEDGE, "utf8").split("\n");
    const entries = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line);
        if (row.prompt && row.response) entries.push(row);
      } catch {
        /* skip */
      }
    }
    cache = { loadedAt: now, entries };
    return entries;
  } catch {
    return cache.entries;
  }
}

export function knowledgeStats() {
  const entries = loadEntries();
  let meta = null;
  try {
    if (fs.existsSync(META)) meta = JSON.parse(fs.readFileSync(META, "utf8"));
  } catch {
    /* ignore */
  }
  return {
    entries: entries.length,
    path: KNOWLEDGE,
    meta,
    learning: entries.length > 0,
  };
}

/**
 * Retrieve the best matching learned response for a user prompt.
 */
export function retrieveLearned(prompt, { minScore = 2 } = {}) {
  const entries = loadEntries();
  if (!entries.length) return null;
  const q = tokenize(prompt);
  if (!q.size) return null;

  let best = null;
  let bestScore = 0;
  for (const e of entries) {
    const toks = Array.isArray(e.tokens) && e.tokens.length
      ? new Set(e.tokens)
      : tokenize(e.prompt);
    let score = 0;
    for (const t of q) if (toks.has(t)) score += 1;
    // Prefer Neuriy chat feedback over raw HF
    if (String(e.source || "").startsWith("chat:")) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (!best || bestScore < minScore) return null;
  return {
    response: best.response,
    source: best.source,
    score: bestScore,
  };
}
