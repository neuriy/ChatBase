#!/usr/bin/env python3
"""Pull Hugging Face datasets into Ello5 instruction JSONL."""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Iterator

from common import append_jsonl, load_config


def _pair(prompt: str, response: str, source: str, meta: dict[str, Any] | None = None) -> dict[str, Any] | None:
    p = (prompt or "").strip()
    r = (response or "").strip()
    if len(p) < 3 or len(r) < 3:
        return None
    return {
        "prompt": p[:4000],
        "response": r[:6000],
        "source": source,
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "meta": meta or {},
    }


def iter_ultrachat(row: dict[str, Any], source: str) -> Iterator[dict[str, Any]]:
    messages = row.get("messages") or []
    # Convert consecutive user/assistant turns
    for i in range(len(messages) - 1):
        a, b = messages[i], messages[i + 1]
        if a.get("role") == "user" and b.get("role") == "assistant":
            item = _pair(a.get("content", ""), b.get("content", ""), source)
            if item:
                yield item


def iter_alpaca(row: dict[str, Any], source: str) -> Iterator[dict[str, Any]]:
    instruction = row.get("instruction") or ""
    inp = row.get("input") or ""
    prompt = instruction if not inp else f"{instruction}\n\nInput: {inp}"
    item = _pair(prompt, row.get("output") or "", source)
    if item:
        yield item


def iter_oasst(row: dict[str, Any], source: str) -> Iterator[dict[str, Any]]:
    # oasst1 tree rows — keep simple text prompts when role is assistant with parent
    text = row.get("text") or ""
    role = row.get("role") or ""
    if role == "assistant" and text:
        # Use truncated parent id as weak prompt context when available
        prompt = row.get("parent_id") or "Continue helpfully as Neuriy / Ello5."
        item = _pair(str(prompt), text, source, {"role": role})
        if item:
            yield item


FORMATTERS = {
    "ultrachat": iter_ultrachat,
    "alpaca": iter_alpaca,
    "oasst": iter_oasst,
}


def ingest(cfg: dict[str, Any], dry_run: bool = False) -> dict[str, Any]:
    hf = cfg.get("huggingface") or {}
    token = os.environ.get(hf.get("token_env") or "HF_TOKEN") or None
    cache_dir = cfg["_hf_cache"]
    out_path = Path(cfg["_data_dir"]) / "hf_instructions.jsonl"
    # rewrite each cycle so we don't grow forever from the same HF pulls
    if out_path.exists() and not dry_run:
        out_path.unlink()

    stats = {"datasets": [], "rows": 0, "path": str(out_path)}
    try:
        from datasets import load_dataset
    except ImportError as e:
        raise SystemExit(
            "Missing dependency: pip install -r services/ello5-learn/requirements.txt"
        ) from e

    for spec in hf.get("datasets") or []:
        ds_id = spec["id"]
        split = spec.get("split") or "train"
        max_rows = int(spec.get("max_rows") or 1000)
        fmt = spec.get("format") or "alpaca"
        formatter = FORMATTERS.get(fmt)
        if not formatter:
            stats["datasets"].append({"id": ds_id, "error": f"unknown format {fmt}"})
            continue
        try:
            ds = load_dataset(ds_id, split=split, cache_dir=cache_dir, token=token)
        except Exception as err:  # noqa: BLE001 — surface per-dataset failures
            stats["datasets"].append({"id": ds_id, "error": str(err)[:300]})
            continue

        batch: list[dict[str, Any]] = []
        count = 0
        for row in ds:
            for item in formatter(row, f"hf:{ds_id}"):
                batch.append(item)
                count += 1
                if len(batch) >= 100:
                    if not dry_run:
                        append_jsonl(out_path, batch)
                    batch = []
                if count >= max_rows:
                    break
            if count >= max_rows:
                break
        if batch and not dry_run:
            append_jsonl(out_path, batch)
        stats["datasets"].append({"id": ds_id, "rows": count})
        stats["rows"] += count

    return stats


def main() -> None:
    ap = argparse.ArgumentParser(description="Ingest Hugging Face datasets for Ello5")
    ap.add_argument("--config", default=None)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    cfg = load_config(args.config)
    result = ingest(cfg, dry_run=args.dry_run)
    print(json.dumps({"event": "ello5_hf_ingest", **result}, indent=2))


if __name__ == "__main__":
    main()
