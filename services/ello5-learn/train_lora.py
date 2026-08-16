#!/usr/bin/env python3
"""Optional LoRA fine-tune for Ello5. Skips when no GPU / deps missing."""
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any

from common import load_config, read_jsonl


def gpu_available() -> bool:
    try:
        import torch

        return bool(torch.cuda.is_available())
    except Exception:
        return False


def prepare_sft_rows(cfg: dict[str, Any], limit: int = 4000) -> list[dict[str, str]]:
    paths = [
        Path(cfg["_data_dir"]) / "hf_instructions.jsonl",
        Path(cfg["_chat_inbox"]),
    ]
    rows: list[dict[str, str]] = []
    for p in paths:
        for r in read_jsonl(p):
            prompt = str(r.get("prompt") or "").strip()
            response = str(r.get("response") or "").strip()
            if len(prompt) < 3 or len(response) < 3:
                continue
            text = (
                "### Instruction:\n"
                f"{prompt}\n\n"
                "### Response:\n"
                f"{response}"
            )
            rows.append({"text": text})
            if len(rows) >= limit:
                return rows
    return rows


def train(cfg: dict[str, Any], force: bool = False) -> dict[str, Any]:
    train_cfg = cfg.get("train") or {}
    if not train_cfg.get("enabled", True) and not force:
        return {"skipped": True, "reason": "train.enabled=false"}
    if train_cfg.get("require_gpu", True) and not gpu_available() and not force:
        return {
            "skipped": True,
            "reason": "no_gpu",
            "hint": "Droplet needs a GPU for LoRA. Knowledge bank still improves Ello5 24/7.",
        }

    rows = prepare_sft_rows(cfg)
    if len(rows) < 20:
        return {"skipped": True, "reason": "not_enough_data", "rows": len(rows)}

    try:
        import torch
        from datasets import Dataset
        from peft import LoraConfig, get_peft_model
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            TrainingArguments,
            Trainer,
            DataCollatorForLanguageModeling,
        )
    except ImportError as e:
        return {"skipped": True, "reason": f"missing_deps:{e}"}

    base = train_cfg.get("base_model") or "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    out_dir = Path(cfg["_root"]) / train_cfg.get(
        "output_dir", "data/ello5-learn/adapters/ellofive-lora"
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(base)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base,
        torch_dtype=torch.float16 if gpu_available() else torch.float32,
        device_map="auto" if gpu_available() else None,
    )
    lora = LoraConfig(
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "v_proj"],
    )
    model = get_peft_model(model, lora)

    ds = Dataset.from_list(rows)

    def tok(batch: dict[str, list[str]]) -> dict[str, Any]:
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=512,
            padding="max_length",
        )

    tokenized = ds.map(tok, batched=True, remove_columns=ds.column_names)
    args = TrainingArguments(
        output_dir=str(out_dir / "checkpoints"),
        per_device_train_batch_size=int(train_cfg.get("batch_size") or 1),
        num_train_epochs=float(train_cfg.get("epochs") or 1),
        max_steps=int(train_cfg.get("max_steps") or 200),
        learning_rate=float(train_cfg.get("learning_rate") or 2e-4),
        logging_steps=20,
        save_steps=200,
        report_to=[],
        fp16=gpu_available(),
    )
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )
    trainer.train()
    model.save_pretrained(str(out_dir / "adapter"))
    tokenizer.save_pretrained(str(out_dir / "adapter"))

    meta = {
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base_model": base,
        "rows": len(rows),
        "adapter": str(out_dir / "adapter"),
        "gpu": gpu_available(),
    }
    (out_dir / "train_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=None)
    ap.add_argument("--force", action="store_true", help="Run even without GPU (slow)")
    args = ap.parse_args()
    cfg = load_config(args.config)
    result = train(cfg, force=args.force)
    print(json.dumps({"event": "ello5_train", **result}, indent=2))


if __name__ == "__main__":
    main()
