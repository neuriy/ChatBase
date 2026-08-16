#!/usr/bin/env python3
"""Merge HF + Neuriy chat inbox into a knowledge bank Ello5 can load."""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path
from typing import Any

from common import load_config, read_jsonl


def tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]{3,}", (text or "").lower())}


def build(cfg: dict[str, Any]) -> dict[str, Any]:
    kn = cfg.get("knowledge") or {}
    max_entries = int(kn.get("max_entries") or 5000)
    min_chars = int(kn.get("min_score_chars") or 40)

    sources = [
        Path(cfg["_data_dir"]) / "hf_instructions.jsonl",
        Path(cfg["_chat_inbox"]),
        Path(cfg["_data_dir"]) / "manual.jsonl",
    ]
    rows: list[dict[str, Any]] = []
    for src in sources:
        rows.extend(read_jsonl(src))

    # Prefer newer chat feedback, then HF
    def rank(r: dict[str, Any]) -> tuple[int, str]:
        src = str(r.get("source") or "")
        pri = 0 if src.startswith("chat:") else 1
        return (pri, str(r.get("ts") or ""))

    rows.sort(key=rank)
    seen: set[str] = set()
    knowledge: list[dict[str, Any]] = []
    for r in rows:
        prompt = str(r.get("prompt") or "").strip()
        response = str(r.get("response") or "").strip()
        if len(prompt) + len(response) < min_chars:
            continue
        key = (prompt[:160] + "|" + response[:160]).lower()
        if key in seen:
            continue
        seen.add(key)
        knowledge.append(
            {
                "prompt": prompt[:2000],
                "response": response[:4000],
                "source": r.get("source") or "unknown",
                "tokens": sorted(tokenize(prompt))[:40],
                "ts": r.get("ts") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        )
        if len(knowledge) >= max_entries:
            break

    out = Path(cfg["_knowledge_path"])
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        for item in knowledge:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    # Also write a small index snapshot for the Node brain
    meta = {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "entries": len(knowledge),
        "path": str(out.relative_to(Path(cfg["_root"]))),
    }
    meta_path = Path(cfg["_data_dir"]) / "knowledge_meta.json"
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=None)
    args = ap.parse_args()
    cfg = load_config(args.config)
    meta = build(cfg)
    print(json.dumps({"event": "ello5_knowledge_built", **meta}, indent=2))


if __name__ == "__main__":
    main()
