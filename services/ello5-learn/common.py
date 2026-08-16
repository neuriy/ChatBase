"""Shared paths / config for Ello5 continuous learning."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = Path(__file__).resolve().parent / "config.yaml"


def load_config(path: str | Path | None = None) -> dict[str, Any]:
    cfg_path = Path(path or os.environ.get("ELLO5_LEARN_CONFIG") or DEFAULT_CONFIG)
    with cfg_path.open("r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    data_dir = ROOT / cfg.get("data_dir", "data/ello5-learn")
    cfg["_root"] = str(ROOT)
    cfg["_data_dir"] = str(data_dir)
    cfg["_knowledge_path"] = str(ROOT / cfg.get("knowledge_path", "data/ello5-learn/knowledge.jsonl"))
    cfg["_chat_inbox"] = str(ROOT / cfg.get("chat_inbox", "data/ello5-learn/inbox/chat.jsonl"))
    cfg["_hf_cache"] = str(ROOT / cfg.get("hf_cache", "data/ello5-learn/hf-cache"))
    cfg["_runs_dir"] = str(ROOT / cfg.get("runs_dir", "data/ello5-learn/runs"))
    for key in ("_data_dir", "_hf_cache", "_runs_dir"):
        Path(cfg[key]).mkdir(parents=True, exist_ok=True)
    Path(cfg["_chat_inbox"]).parent.mkdir(parents=True, exist_ok=True)
    return cfg


def append_jsonl(path: str | Path, rows: list[dict[str, Any]]) -> int:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with p.open("a", encoding="utf-8") as f:
        for row in rows:
            import json

            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            n += 1
    return n


def read_jsonl(path: str | Path, limit: int | None = None) -> list[dict[str, Any]]:
    import json

    p = Path(path)
    if not p.exists():
        return []
    out: list[dict[str, Any]] = []
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
            if limit and len(out) >= limit:
                break
    return out
